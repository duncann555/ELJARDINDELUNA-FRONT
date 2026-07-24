import assert from "node:assert/strict";
import test from "node:test";
import {
  getEstadosOperativosDisponibles,
  getNotaRevisionError,
  normalizarNotaRevision,
  puedeActualizarEstadoOperativo,
  REVISION_NOTE_MAX_LENGTH,
} from "../src/components/admin/utilidadesAdmin.js";
import { resolverRevisionPedidoAdmin } from "../src/helpers/adminApi.js";

test("valida la nota de revisión con el mismo contrato del backend", () => {
  assert.equal(normalizarNotaRevision("  Verificado.  "), "Verificado.");
  assert.match(getNotaRevisionError("  "), /obligatoria/);
  assert.match(getNotaRevisionError("OK"), /al menos 3 caracteres/);
  assert.equal(getNotaRevisionError("OK."), "");
  assert.match(
    getNotaRevisionError("x".repeat(REVISION_NOTE_MAX_LENGTH + 1)),
    /no puede superar los 500 caracteres/,
  );
});

test("ofrece sólo transiciones operativas que el backend acepta", () => {
  assert.deepEqual(
    getEstadosOperativosDisponibles({
      estadoOperativo: "pendiente",
      estadoPago: "approved",
      requiresReview: false,
    }),
    ["pendiente", "pagado", "cancelado"],
  );
  assert.deepEqual(
    getEstadosOperativosDisponibles({
      estadoOperativo: "pagado",
      estadoPago: "approved",
      requiresReview: false,
    }),
    ["pagado", "preparando", "cancelado"],
  );
  assert.deepEqual(
    getEstadosOperativosDisponibles({
      estadoOperativo: "preparando",
      estadoPago: "approved",
      requiresReview: false,
    }),
    ["preparando", "enviado", "cancelado"],
  );
  assert.deepEqual(
    getEstadosOperativosDisponibles({
      estadoOperativo: "enviado",
      estadoPago: "approved",
      requiresReview: false,
    }),
    ["enviado", "entregado"],
  );
});

test("filtra avances por pago y por revisión antes de provocar un 409", () => {
  const unpaidOrder = {
    estadoOperativo: "pendiente",
    estadoPago: "pending",
    requiresReview: false,
  };
  const reviewOrder = {
    estadoOperativo: "pagado",
    estadoPago: "approved",
    requiresReview: true,
  };
  const shippedReviewOrder = {
    estadoOperativo: "enviado",
    estadoPago: "approved",
    requiresReview: true,
  };

  assert.deepEqual(getEstadosOperativosDisponibles(unpaidOrder), [
    "pendiente",
    "cancelado",
  ]);
  assert.equal(
    puedeActualizarEstadoOperativo(unpaidOrder, "pagado"),
    false,
  );
  assert.deepEqual(getEstadosOperativosDisponibles(reviewOrder), [
    "cancelado",
  ]);
  assert.deepEqual(
    getEstadosOperativosDisponibles(shippedReviewOrder),
    [],
  );
});

test("resuelve una revisión con PATCH, confirmación y nota recortada", async () => {
  const originalFetch = globalThis.fetch;
  const pedido = {
    id: "pedido-123",
    requiresReview: false,
    reviewResolutions: [
      {
        reason: "double_payment_review:payment-b",
        note: "Segundo pago reembolsado.",
        resolvedBy: "admin@example.com",
        resolvedAt: "2026-07-24T12:00:00.000Z",
      },
    ],
  };
  let capturedRequest;

  globalThis.fetch = async (url, options) => {
    capturedRequest = { url, options };
    return {
      ok: true,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({ data: { pedido } }),
    };
  };

  try {
    const result = await resolverRevisionPedidoAdmin(
      "admin-token",
      "pedido-123",
      "  Segundo pago reembolsado.  ",
    );

    assert.equal(result, pedido);
    assert.match(capturedRequest.url, /\/admin\/pedidos\/pedido-123\/revision$/);
    assert.equal(capturedRequest.options.method, "PATCH");
    assert.equal(
      capturedRequest.options.headers.Authorization,
      "Bearer admin-token",
    );
    assert.deepEqual(JSON.parse(capturedRequest.options.body), {
      resolved: true,
      note: "Segundo pago reembolsado.",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
