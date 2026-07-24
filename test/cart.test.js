import assert from "node:assert/strict";
import test from "node:test";
import {
  addCartItem,
  CART_STORAGE_KEY,
  cartSubtotal,
  consumePurchasedCartFromStorage,
  decrementCartItem,
  incrementCartItem,
  MAX_CART_QUANTITY,
  reconcileCart,
  removePurchasedCartQuantities,
  sanitizeStoredCart,
} from "../src/helpers/cart.js";

const product = {
  id: "p-1",
  name: "Lavanda",
  slug: "lavanda",
  price: 1250,
  stock: 3,
  images: ["https://example.com/lavanda.jpg"],
  active: true,
};

test("agrega productos y limita la cantidad al stock entero", () => {
  const added = addCartItem([], product, 2);
  const incremented = incrementCartItem(added, product.id);
  const capped = incrementCartItem(incremented, product.id);

  assert.equal(capped.length, 1);
  assert.equal(capped[0].quantity, 3);
  assert.equal(capped[0].stock, 3);
});

test("decrementar nunca produce cantidades menores a uno", () => {
  const cart = addCartItem([], product);
  assert.equal(decrementCartItem(cart, product.id)[0].quantity, 1);
});

test("sanitiza datos persistidos inválidos y duplicados", () => {
  const cart = sanitizeStoredCart([
    { ...product, quantity: 2, image: product.images[0] },
    { ...product, quantity: 1, image: product.images[0] },
    { id: "sin-stock", name: "Sin stock", stock: 0, quantity: 1 },
    { name: "Sin id", stock: 2, quantity: 1 },
  ]);

  assert.deepEqual(cart.map((item) => item.id), ["p-1"]);
  assert.equal(cart[0].quantity, 2);
});

test("reconcilia contra catálogo, quita inactivos y reduce cantidades", () => {
  const original = [
    ...addCartItem([], product, 3),
    {
      id: "removed",
      name: "Retirado",
      slug: "",
      price: 10,
      stock: 2,
      image: "",
      quantity: 1,
    },
  ];
  const catalog = [
    { ...product, price: 1500, stock: 1 },
    {
      id: "removed",
      name: "Retirado",
      price: 10,
      stock: 2,
      active: false,
      images: [],
    },
  ];
  const reconciled = reconcileCart(original, catalog);

  assert.equal(reconciled.length, 1);
  assert.equal(reconciled[0].quantity, 1);
  assert.equal(reconciled[0].price, 1500);
});

test("calcula el subtotal a partir de precio y cantidad", () => {
  const cart = addCartItem([], product, 2);
  assert.equal(cartSubtotal(cart), 2500);
});

test("nunca permite más de 50 unidades aunque exista más stock", () => {
  const abundantProduct = { ...product, stock: 200 };
  const cart = addCartItem([], abundantProduct, 150);

  assert.equal(cart[0].quantity, MAX_CART_QUANTITY);
  assert.equal(incrementCartItem(cart, abundantProduct.id)[0].quantity, 50);
});

test("al aprobar resta sólo cantidades compradas y conserva líneas nuevas", () => {
  const secondProduct = {
    ...product,
    id: "p-2",
    name: "Caléndula",
    stock: 5,
  };
  const cart = addCartItem(
    addCartItem([], product, 3),
    secondProduct,
    2,
  );
  const remaining = removePurchasedCartQuantities(cart, [
    { id: product.id, quantity: 2 },
  ]);

  assert.deepEqual(
    remaining.map(({ id, quantity }) => ({ id, quantity })),
    [
      { id: "p-1", quantity: 1 },
      { id: "p-2", quantity: 2 },
    ],
  );
});

test("una sesión legacy sin snapshot no modifica el carrito", () => {
  const cart = addCartItem([], product, 2);

  assert.deepEqual(removePurchasedCartQuantities(cart, []), cart);
});

test("consume desde la versión más reciente de localStorage entre pestañas", () => {
  const storageValues = new Map();
  const storage = {
    getItem: (key) => storageValues.get(key) ?? null,
    setItem: (key, value) => storageValues.set(key, String(value)),
  };
  const secondProduct = {
    ...product,
    id: "p-cross-tab",
    name: "Producto agregado en otra pestaña",
    stock: 4,
  };
  const latestPersistedCart = addCartItem(
    addCartItem([], product, 3),
    secondProduct,
    1,
  );
  storage.setItem(CART_STORAGE_KEY, JSON.stringify(latestPersistedCart));

  const remaining = consumePurchasedCartFromStorage(storage, [
    { id: product.id, quantity: 2 },
  ]);

  assert.deepEqual(
    remaining.map(({ id, quantity }) => ({ id, quantity })),
    [
      { id: "p-1", quantity: 1 },
      { id: "p-cross-tab", quantity: 1 },
    ],
  );
  assert.deepEqual(JSON.parse(storage.getItem(CART_STORAGE_KEY)), remaining);
});
