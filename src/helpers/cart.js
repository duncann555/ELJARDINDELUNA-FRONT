export const CART_STORAGE_KEY = "eljardinluna_cart_v1";
export const MAX_CART_QUANTITY = 50;

const asInteger = (value, fallback = 1) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
};

const productId = (product) =>
  String(product?.id || product?._id || product?.productoId || "").trim();

export const normalizeCartItem = (product, requestedQuantity = 1) => {
  const id = productId(product);
  const stock = Math.max(0, asInteger(product?.stock, 0));
  const active = product?.active !== false;

  if (!id || !active || stock < 1) return null;

  const images = Array.isArray(product?.images)
    ? product.images.filter((image) => typeof image === "string" && image.trim())
    : [product?.image, product?.imagenUrl].filter(
        (image) => typeof image === "string" && image.trim(),
      );

  return {
    id,
    name: String(product?.name || product?.nombre || "Producto").trim(),
    slug: String(product?.slug || "").trim(),
    price: Math.max(0, Number(product?.price ?? product?.precio) || 0),
    stock,
    image: images[0] || "",
    quantity: Math.min(
      stock,
      MAX_CART_QUANTITY,
      Math.max(1, asInteger(requestedQuantity)),
    ),
  };
};

export const sanitizeStoredCart = (value) => {
  if (!Array.isArray(value)) return [];

  const result = [];
  const seen = new Set();

  value.forEach((storedItem) => {
    const item = normalizeCartItem(
      {
        ...storedItem,
        active: true,
        stock: storedItem?.stock,
        images: [storedItem?.image],
      },
      storedItem?.quantity,
    );

    if (!item || seen.has(item.id)) return;
    seen.add(item.id);
    result.push(item);
  });

  return result;
};

const getPurchasedLineQuantities = (lines) => {
  if (!Array.isArray(lines) || lines.length === 0) return null;

  const quantities = new Map();

  for (const line of lines) {
    const id = String(line?.id || "").trim();
    const quantity = Number(line?.quantity);

    if (
      !id ||
      id.length > 160 ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_CART_QUANTITY ||
      quantities.has(id)
    ) {
      return null;
    }

    quantities.set(id, quantity);
  }

  return quantities;
};

export const removePurchasedCartQuantities = (cart, lines) => {
  const currentCart = sanitizeStoredCart(cart);
  const purchasedQuantities = getPurchasedLineQuantities(lines);

  if (!purchasedQuantities) return currentCart;

  return currentCart.flatMap((item) => {
    const purchasedQuantity = purchasedQuantities.get(item.id) || 0;
    const remainingQuantity = item.quantity - purchasedQuantity;

    return remainingQuantity > 0
      ? [{ ...item, quantity: remainingQuantity }]
      : [];
  });
};

export const consumePurchasedCartFromStorage = (storage, lines) => {
  if (
    typeof storage?.getItem !== "function" ||
    typeof storage?.setItem !== "function"
  ) {
    return null;
  }

  try {
    const serialized = storage.getItem(CART_STORAGE_KEY);
    const currentCart = sanitizeStoredCart(
      serialized ? JSON.parse(serialized) : [],
    );
    const nextCart = removePurchasedCartQuantities(currentCart, lines);

    storage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
    return nextCart;
  } catch {
    return null;
  }
};

export const addCartItem = (cart, product, quantity = 1) => {
  const nextItem = normalizeCartItem(product, quantity);
  if (!nextItem) return cart;

  const current = cart.find((item) => item.id === nextItem.id);
  if (!current) return [...cart, nextItem];

  return cart.map((item) =>
    item.id === nextItem.id
      ? {
          ...nextItem,
          quantity: Math.min(
            nextItem.stock,
            MAX_CART_QUANTITY,
            item.quantity + Math.max(1, asInteger(quantity)),
          ),
        }
      : item,
  );
};

export const incrementCartItem = (cart, id) =>
  cart.map((item) =>
    item.id === id
      ? {
          ...item,
          quantity: Math.min(
            item.stock,
            MAX_CART_QUANTITY,
            item.quantity + 1,
          ),
        }
      : item,
  );

export const decrementCartItem = (cart, id) =>
  cart.map((item) =>
    item.id === id
      ? { ...item, quantity: Math.max(1, item.quantity - 1) }
      : item,
  );

export const removeCartItem = (cart, id) =>
  cart.filter((item) => item.id !== id);

export const reconcileCart = (cart, catalog) => {
  const products = new Map(
    (Array.isArray(catalog) ? catalog : [])
      .filter((product) => product?.id)
      .map((product) => [String(product.id), product]),
  );

  return cart.flatMap((item) => {
    const product = products.get(item.id);
    const reconciled = product
      ? normalizeCartItem(product, Math.min(item.quantity, product.stock))
      : null;

    return reconciled ? [reconciled] : [];
  });
};

export const cartSubtotal = (cart) =>
  cart.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );

export const cartReducer = (state, action) => {
  switch (action.type) {
    case "add":
      return addCartItem(state, action.product, action.quantity);
    case "increment":
      return incrementCartItem(state, action.id);
    case "decrement":
      return decrementCartItem(state, action.id);
    case "remove":
      return removeCartItem(state, action.id);
    case "clear":
      return [];
    case "replace":
      return sanitizeStoredCart(action.cart);
    case "consume":
      return removePurchasedCartQuantities(state, action.lines);
    case "reconcile":
      return reconcileCart(state, action.catalog);
    default:
      return state;
  }
};
