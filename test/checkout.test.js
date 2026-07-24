import assert from "node:assert/strict";
import test from "node:test";
import {
  calcularTotalesCheckout,
  normalizeCheckoutConfiguration,
  TERMINAL_CHECKOUT_ERROR_CODES,
  totalesCoinciden,
} from "../src/helpers/checkout.js";
import {
  normalizeCheckoutPayload,
  validateCheckout,
  validateName,
} from "../src/helpers/checkoutValidation.js";

const validValues = {
  nombre: "Luna",
  apellido: "Jardín",
  telefono: "+54 9 381 555-0101",
  email: "LUNA@EXAMPLE.COM ",
  metodo: "domicilio",
  provincia: "Tucumán",
  localidad: "San Miguel de Tucumán",
  codigoPostal: "T4000",
  direccion: "Laprida 123",
  aclaraciones: "Timbre azul",
};

test("valida todos los datos requeridos para domicilio", () => {
  assert.deepEqual(validateCheckout(validValues), {});
  const errors = validateCheckout({ ...validValues, direccion: "" });
  assert.equal(errors.direccion, "La dirección es obligatoria.");
});

test("retiro no exige domicilio y mantiene límites del backend", () => {
  const values = {
    ...validValues,
    metodo: "retiro",
    provincia: "",
    localidad: "",
    codigoPostal: "",
    direccion: "",
  };

  assert.deepEqual(validateCheckout(values), {});
  assert.match(validateName("x".repeat(51)), /entre 2 y 50/);
});

test("normaliza el payload exacto del checkout invitado", () => {
  const payload = normalizeCheckoutPayload(validValues, [
    { id: "p-1", quantity: 2 },
  ]);

  assert.deepEqual(payload, {
    cliente: {
      nombre: "Luna",
      apellido: "Jardín",
      telefono: "5493815550101",
      email: "luna@example.com",
    },
    entrega: {
      metodo: "domicilio",
      provincia: "Tucumán",
      localidad: "San Miguel de Tucumán",
      codigoPostal: "T4000",
      direccion: "Laprida 123",
      aclaraciones: "Timbre azul",
    },
    productos: [{ productoId: "p-1", cantidad: 2 }],
  });
});

test("calcula envío y total según domicilio o retiro", () => {
  const configuration = normalizeCheckoutConfiguration({
    entrega: { costoDomicilio: 3500.456, retiroDisponible: true },
  });

  assert.deepEqual(calcularTotalesCheckout(10000, "domicilio", configuration), {
    subtotal: 10000,
    costoEnvio: 3500.46,
    total: 13500.46,
  });
  assert.deepEqual(calcularTotalesCheckout(10000, "retiro", configuration), {
    subtotal: 10000,
    costoEnvio: 0,
    total: 10000,
  });
});

test("rechaza configuraciones sin un costo de domicilio finito", () => {
  [
    {},
    { entrega: {} },
    { entrega: { costoDomicilio: null } },
    { entrega: { costoDomicilio: Number.NaN } },
    { entrega: { costoDomicilio: Number.POSITIVE_INFINITY } },
    { entrega: { costoDomicilio: -1 } },
  ].forEach((configuration) => {
    assert.throws(
      () => normalizeCheckoutConfiguration(configuration),
      /costo de envío a domicilio válido/,
    );
  });
});

test("detecta cambios entre el resumen visible y el total del backend", () => {
  const displayed = { subtotal: 1000, costoEnvio: 200, total: 1200 };

  assert.equal(totalesCoinciden(displayed, { ...displayed }), true);
  assert.equal(totalesCoinciden(displayed, { ...displayed, total: 1250 }), false);
});

test("clasifica errores terminales que requieren un intento idempotente nuevo", () => {
  [
    "MERCADO_PAGO_UNAVAILABLE",
    "MERCADO_PAGO_NOT_CONFIGURED",
    "MERCADO_PAGO_INVALID_RESPONSE",
    "CHECKOUT_EXPIRED",
    "CHECKOUT_STATE_CHANGED",
    "IDEMPOTENCY_KEY_REUSED",
  ].forEach((code) => assert.equal(TERMINAL_CHECKOUT_ERROR_CODES.has(code), true));

  assert.equal(TERMINAL_CHECKOUT_ERROR_CODES.has("NETWORK_ERROR"), false);
  assert.equal(TERMINAL_CHECKOUT_ERROR_CODES.has("REQUEST_TIMEOUT"), false);
  assert.equal(TERMINAL_CHECKOUT_ERROR_CODES.has("CHECKOUT_IN_PROGRESS"), false);
});
