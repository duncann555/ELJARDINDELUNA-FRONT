export const LAST_ORDER_STORAGE_KEY = "eljardinluna_last_order_v1";
export const CHECKOUT_ATTEMPT_STORAGE_KEY =
  "eljardinluna_checkout_attempt_v1";

let inMemoryCheckoutAttemptKey = "";
const MAX_ORDER_ITEM_SNAPSHOT_LINES = 50;
const MAX_ORDER_ITEM_QUANTITY = 50;

const safeStorage = (storage, operation, ...args) => {
  try {
    return storage?.[operation](...args);
  } catch {
    return null;
  }
};

const createUuid = () => {
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const value = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));

  return [
    value.slice(0, 4).join(""),
    value.slice(4, 6).join(""),
    value.slice(6, 8).join(""),
    value.slice(8, 10).join(""),
    value.slice(10).join(""),
  ].join("-");
};

export const sanitizeOrderItemSnapshot = (items) => {
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > MAX_ORDER_ITEM_SNAPSHOT_LINES
  ) {
    return [];
  }

  const result = [];
  const seen = new Set();

  for (const item of items) {
    const id = String(item?.id || "").trim();
    const quantity = Number(item?.quantity);

    if (
      !id ||
      id.length > 160 ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_ORDER_ITEM_QUANTITY ||
      seen.has(id)
    ) {
      return [];
    }

    seen.add(id);
    result.push({ id, quantity });
  }

  return result;
};

const normalizeStoredOrder = (value, { requireItems = false } = {}) => {
  const items = sanitizeOrderItemSnapshot(value?.items);

  if (
    !value?.numero ||
    !value?.orderToken ||
    (requireItems && items.length === 0)
  ) {
    return null;
  }

  return {
    numero: String(value.numero),
    orderToken: String(value.orderToken),
    externalReference: String(value.externalReference || ""),
    items,
    cartConsumed: value.cartConsumed === true,
  };
};

export const getCheckoutAttemptKey = () => {
  const current =
    safeStorage(
      sessionStorage,
      "getItem",
      CHECKOUT_ATTEMPT_STORAGE_KEY,
    ) || inMemoryCheckoutAttemptKey;

  if (current) return current;

  const next = createUuid();
  inMemoryCheckoutAttemptKey = next;
  safeStorage(
    sessionStorage,
    "setItem",
    CHECKOUT_ATTEMPT_STORAGE_KEY,
    next,
  );
  return next;
};

export const clearCheckoutAttemptKey = () => {
  inMemoryCheckoutAttemptKey = "";
  safeStorage(
    sessionStorage,
    "removeItem",
    CHECKOUT_ATTEMPT_STORAGE_KEY,
  );
};

export const saveLastOrder = ({
  numero,
  orderToken,
  externalReference,
  items,
}) => {
  const safeOrder = normalizeStoredOrder(
    {
      numero,
      orderToken,
      externalReference,
      items,
      cartConsumed: false,
    },
    { requireItems: true },
  );

  if (!safeOrder) return false;

  const serialized = JSON.stringify(safeOrder);

  safeStorage(sessionStorage, "setItem", LAST_ORDER_STORAGE_KEY, serialized);
  const sessionCopy = safeStorage(
    sessionStorage,
    "getItem",
    LAST_ORDER_STORAGE_KEY,
  );

  if (sessionCopy === serialized) {
    safeStorage(localStorage, "removeItem", LAST_ORDER_STORAGE_KEY);
    return true;
  }

  safeStorage(localStorage, "setItem", LAST_ORDER_STORAGE_KEY, serialized);
  return (
    safeStorage(localStorage, "getItem", LAST_ORDER_STORAGE_KEY) === serialized
  );
};

export const readLastOrder = () => {
  try {
    const serialized =
      safeStorage(sessionStorage, "getItem", LAST_ORDER_STORAGE_KEY) ||
      safeStorage(localStorage, "getItem", LAST_ORDER_STORAGE_KEY);
    const parsed = JSON.parse(serialized || "null");

    return normalizeStoredOrder(parsed);
  } catch {
    return null;
  }
};

export const markLastOrderCartConsumed = (orderNumber) => {
  const requestedOrder = String(orderNumber || "").trim();
  if (!requestedOrder) return false;

  for (const storage of [sessionStorage, localStorage]) {
    try {
      const serialized = safeStorage(
        storage,
        "getItem",
        LAST_ORDER_STORAGE_KEY,
      );
      const currentOrder = normalizeStoredOrder(
        JSON.parse(serialized || "null"),
      );

      if (currentOrder?.numero !== requestedOrder) continue;

      const nextSerialized = JSON.stringify({
        ...currentOrder,
        cartConsumed: true,
      });
      safeStorage(
        storage,
        "setItem",
        LAST_ORDER_STORAGE_KEY,
        nextSerialized,
      );

      if (
        safeStorage(storage, "getItem", LAST_ORDER_STORAGE_KEY) ===
        nextSerialized
      ) {
        return true;
      }
    } catch {
      // Probamos el siguiente storage si este está bloqueado o corrupto.
    }
  }

  return false;
};

export const matchesOrderReference = (order, requestedReference) => {
  const requested = String(requestedReference || "").trim();
  if (!order || !requested) return false;

  return [order.numero, order.externalReference]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .includes(requested);
};
