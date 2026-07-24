import assert from "node:assert/strict";
import test from "node:test";
import {
  getProductIdentifier,
  normalizarProducto,
} from "../src/helpers/products.js";

test("la navegación usa siempre el id persistido aunque exista un slug", () => {
  const product = normalizarProducto({
    _id: "mongo-id-123",
    nombre: "Lavanda",
    slug: "lavanda",
    precio: 1200,
    stock: 4,
    estado: "Activo",
  });

  assert.equal(getProductIdentifier(product), "mongo-id-123");
  assert.notEqual(getProductIdentifier(product), product.slug);
});
