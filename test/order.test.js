import assert from "node:assert/strict";
import test from "node:test";
import {
  CHECKOUT_ATTEMPT_STORAGE_KEY,
  clearCheckoutAttemptKey,
  getCheckoutAttemptKey,
  LAST_ORDER_STORAGE_KEY,
  markLastOrderCartConsumed,
  matchesOrderReference,
  readLastOrder,
  saveLastOrder,
} from "../src/helpers/order.js";
import {
  FINAL_PAYMENT_STATES,
  normalizePaymentState,
  redirectToPaymentProvider,
  shouldConsumePurchasedCart,
  shouldReleaseCheckoutAttempt,
} from "../src/helpers/payment.js";
import { clearLegacyBrowserStorage } from "../src/helpers/storageMigration.js";

class StorageMock {
  constructor({ blocked = false } = {}) {
    this.blocked = blocked;
    this.values = new Map();
  }

  get length() {
    return this.values.size;
  }

  key(index) {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key) {
    if (this.blocked) throw new Error("Storage bloqueado");
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    if (this.blocked) throw new Error("Storage bloqueado");
    this.values.set(key, String(value));
  }

  removeItem(key) {
    if (this.blocked) throw new Error("Storage bloqueado");
    this.values.delete(key);
  }
}

const resetStorage = () => {
  globalThis.sessionStorage = new StorageMock();
  globalThis.localStorage = new StorageMock();
  clearCheckoutAttemptKey();
};

test.beforeEach(resetStorage);

test("mantiene la misma Idempotency-Key hasta limpiar el intento", () => {
  const first = getCheckoutAttemptKey();
  const repeated = getCheckoutAttemptKey();

  assert.equal(repeated, first);
  assert.equal(
    sessionStorage.getItem(CHECKOUT_ATTEMPT_STORAGE_KEY),
    first,
  );

  clearCheckoutAttemptKey();
  const next = getCheckoutAttemptKey();
  assert.notEqual(next, first);
});

test("mantiene la Idempotency-Key en memoria si sessionStorage está bloqueado", () => {
  globalThis.sessionStorage = new StorageMock({ blocked: true });

  const first = getCheckoutAttemptKey();
  const repeated = getCheckoutAttemptKey();

  assert.equal(repeated, first);

  clearCheckoutAttemptKey();
  const next = getCheckoutAttemptKey();
  assert.notEqual(next, first);
});

test("conserva la Idempotency-Key al salir hacia el proveedor de pago", () => {
  const attemptKey = getCheckoutAttemptKey();
  let destination = "";

  redirectToPaymentProvider(
    "https://www.mercadopago.com.ar/checkout",
    (url) => {
      destination = url;
    },
  );

  assert.equal(destination, "https://www.mercadopago.com.ar/checkout");
  assert.equal(getCheckoutAttemptKey(), attemptKey);
});

test("guarda la referencia mínima del pedido primero en sessionStorage", () => {
  const order = {
    numero: "PED-100",
    orderToken: "token-seguro",
    externalReference: "EJL-PED-100",
    items: [
      { id: "producto-1", quantity: 2 },
      { id: "producto-2", quantity: 1 },
    ],
    cartConsumed: false,
  };

  assert.equal(saveLastOrder(order), true);
  const serialized = sessionStorage.getItem(LAST_ORDER_STORAGE_KEY);
  assert.ok(serialized);
  assert.equal(serialized.includes("email"), false);
  assert.equal(serialized.includes("name"), false);
  assert.equal(localStorage.getItem(LAST_ORDER_STORAGE_KEY), null);
  assert.deepEqual(readLastOrder(), order);
});

test("usa localStorage como fallback verificable si sessionStorage falla", () => {
  globalThis.sessionStorage = new StorageMock({ blocked: true });
  const order = {
    numero: "PED-101",
    orderToken: "token-fallback",
    externalReference: "EJL-PED-101",
    items: [{ id: "producto-1", quantity: 1 }],
    cartConsumed: false,
  };

  assert.equal(saveLastOrder(order), true);
  assert.ok(localStorage.getItem(LAST_ORDER_STORAGE_KEY));
  assert.deepEqual(readLastOrder(), order);
});

test("una referencia legacy sin snapshot no habilita borrados a ciegas", () => {
  sessionStorage.setItem(
    LAST_ORDER_STORAGE_KEY,
    JSON.stringify({
      numero: "PED-LEGACY",
      orderToken: "token-legacy",
      externalReference: "EJL-PED-LEGACY",
    }),
  );

  assert.deepEqual(readLastOrder(), {
    numero: "PED-LEGACY",
    orderToken: "token-legacy",
    externalReference: "EJL-PED-LEGACY",
    items: [],
    cartConsumed: false,
  });
});

test("marca el snapshot como consumido para no descontarlo dos veces", () => {
  const order = {
    numero: "PED-103",
    orderToken: "token-consumo",
    externalReference: "EJL-PED-103",
    items: [{ id: "producto-1", quantity: 2 }],
  };

  assert.equal(saveLastOrder(order), true);
  assert.equal(markLastOrderCartConsumed(order.numero), true);
  assert.equal(readLastOrder().cartConsumed, true);
  assert.equal(markLastOrderCartConsumed("PED-OTRO"), false);
});

test("normaliza únicamente estados de pago confirmados por el backend", () => {
  assert.equal(normalizePaymentState("approved"), "approved");
  assert.equal(normalizePaymentState("in_process"), "pending");
  assert.equal(normalizePaymentState("refunded"), "refunded");
  assert.equal(normalizePaymentState("charged_back"), "charged_back");
  assert.equal(FINAL_PAYMENT_STATES.has("refunded"), true);
  assert.equal(FINAL_PAYMENT_STATES.has("charged_back"), true);
  assert.equal(FINAL_PAYMENT_STATES.has("in_process"), false);
});

test("libera el intento sólo ante un estado de pago terminal verificado", () => {
  [
    "approved",
    "rejected",
    "cancelled",
    "cancelado",
    "refunded",
    "charged_back",
  ].forEach((state) => assert.equal(shouldReleaseCheckoutAttempt(state), true));

  ["pending", "in_process", "authorized", ""].forEach((state) =>
    assert.equal(shouldReleaseCheckoutAttempt(state), false),
  );
});

test("sólo un pago aprobado consume las líneas compradas del carrito", () => {
  assert.equal(shouldConsumePurchasedCart("approved"), true);
  ["pending", "in_process", "rejected", "cancelled", "refunded"].forEach(
    (state) => assert.equal(shouldConsumePurchasedCart(state), false),
  );
});

test("el regreso de pago debe coincidir con el pedido de esta pestaña", () => {
  const order = {
    numero: "PED-102",
    orderToken: "token-return",
    externalReference: "EJL-PED-102",
  };

  assert.equal(matchesOrderReference(order, "PED-102"), true);
  assert.equal(matchesOrderReference(order, "EJL-PED-102"), true);
  assert.equal(matchesOrderReference(order, "PED-OTRA"), false);
  assert.equal(matchesOrderReference(order, ""), false);
});

test("elimina persistencia legacy con PII sin tocar el carrito anónimo nuevo", () => {
  localStorage.setItem("eljardinluna_auth_user", '{"email":"legacy@example.com"}');
  localStorage.setItem("eljardinluna_carrito:legacy-user", "[]");
  localStorage.setItem("eljardinluna_cart_v1", "[]");
  sessionStorage.setItem("eljardinluna_logout_en_curso", "1");

  clearLegacyBrowserStorage();

  assert.equal(localStorage.getItem("eljardinluna_auth_user"), null);
  assert.equal(localStorage.getItem("eljardinluna_carrito:legacy-user"), null);
  assert.equal(sessionStorage.getItem("eljardinluna_logout_en_curso"), null);
  assert.equal(localStorage.getItem("eljardinluna_cart_v1"), "[]");
});
