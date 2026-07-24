import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  formatCurrencyAdmin,
  formatDateAdmin,
  getEstadoOperativoMeta,
  getEstadoPagoMeta,
  getEstadosOperativosDisponibles,
  getNotaRevisionError,
  getOrderId,
  normalizarNotaRevision,
  REVISION_NOTE_MAX_LENGTH,
  REVISION_NOTE_MIN_LENGTH,
} from "./utilidadesAdmin";

const showValue = (value, fallback = "—") =>
  value === null || value === undefined || value === "" ? fallback : value;

const getBuyerName = (pedido) =>
  [pedido?.cliente?.nombre, pedido?.cliente?.apellido]
    .filter(Boolean)
    .join(" ") || "Sin nombre";

const getPaymentProvider = (pedido) => {
  const rawProvider = String(
    pedido?.pago?.provider ||
      pedido?.pago?.proveedor ||
      pedido?.pago?.method ||
      pedido?.metodoPago ||
      "",
  )
    .trim()
    .toLowerCase();

  if (rawProvider.includes("transfer")) {
    return "Transferencia bancaria (histórico)";
  }

  if (
    rawProvider.includes("mercado") ||
    rawProvider === "mp" ||
    pedido?.pago?.preferenceId
  ) {
    return "Mercado Pago";
  }

  return rawProvider || "No informado";
};

export default function ModalPedidoAdmin({
  show,
  pedido,
  loading = false,
  saving = false,
  errorMessage = "",
  onClose,
  onSave,
  onRequestReviewResolution,
}) {
  const estadosOperativosDisponibles =
    getEstadosOperativosDisponibles(pedido);
  const estadoOperativoActual = pedido?.estadoOperativo || "";
  const [estadoOperativo, setEstadoOperativo] = useState(
    estadosOperativosDisponibles.includes(estadoOperativoActual)
      ? estadoOperativoActual
      : "",
  );
  const [reviewNote, setReviewNote] = useState("");
  const [reviewNoteValidated, setReviewNoteValidated] = useState(false);
  const payment = getEstadoPagoMeta(pedido?.estadoPago);
  const operational = getEstadoOperativoMeta(pedido?.estadoOperativo);
  const orderId = getOrderId(pedido);
  const reviewNoteError = getNotaRevisionError(reviewNote);
  const normalizedReviewNote = normalizarNotaRevision(reviewNote);
  const reviewResolutions = Array.isArray(pedido?.reviewResolutions)
    ? [...pedido.reviewResolutions].reverse()
    : [];
  const hasOperationalTransition = estadosOperativosDisponibles.some(
    (estado) => estado !== estadoOperativoActual,
  );
  const canSubmitStatus =
    estadoOperativo !== estadoOperativoActual &&
    estadosOperativosDisponibles.includes(estadoOperativo);

  const submitStatus = (event) => {
    event.preventDefault();
    if (!canSubmitStatus) return;
    onSave(estadoOperativo);
  };

  const submitReviewResolution = (event) => {
    event.preventDefault();
    setReviewNoteValidated(true);

    if (!pedido?.requiresReview || reviewNoteError) return;

    onRequestReviewResolution(normalizedReviewNote);
  };

  return (
    <Modal
      show={show}
      onHide={saving ? undefined : onClose}
      centered
      size="xl"
      backdrop={saving ? "static" : true}
      keyboard={!saving}
      dialogClassName="admin-modal admin-order-modal"
    >
      <Modal.Header closeButton={!saving}>
        <Modal.Title>
          Pedido {pedido?.numero || (orderId ? `#${orderId}` : "")}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {errorMessage && (
          <Alert variant="danger" role="alert">
            {errorMessage}
          </Alert>
        )}

        {loading ? (
          <div className="admin-empty-state" role="status" aria-live="polite">
            <Spinner animation="border" size="sm" />
            <span>Cargando el detalle del pedido…</span>
          </div>
        ) : !pedido ? (
          <div className="admin-empty-state">
            No encontramos el detalle de este pedido.
          </div>
        ) : (
          <>
            {pedido.requiresReview && (
              <section
                className="admin-review-resolution"
                aria-labelledby="review-resolution-title"
              >
                <Alert variant="warning" className="mb-3">
                  <strong>Este pedido requiere revisión excepcional.</strong>
                  <div>
                    Motivo informado por el sistema:{" "}
                    {pedido.reviewReason ||
                      "Verificá los datos antes de continuar con la operación."}
                  </div>
                </Alert>

                <h3 id="review-resolution-title">Resolver la revisión</h3>
                <p className="admin-muted">
                  Documentá qué verificaste y qué acción realizaste. La
                  resolución queda auditada y no modifica el estado de pago ni
                  el stock.
                </p>

                <Form noValidate onSubmit={submitReviewResolution}>
                  <Form.Group controlId="admin-order-review-note">
                    <Form.Label>
                      Nota de resolución <span aria-hidden="true">*</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={reviewNote}
                      onChange={(event) => setReviewNote(event.target.value)}
                      required
                      minLength={REVISION_NOTE_MIN_LENGTH}
                      maxLength={REVISION_NOTE_MAX_LENGTH}
                      isInvalid={
                        reviewNoteValidated && Boolean(reviewNoteError)
                      }
                      aria-describedby="admin-order-review-note-help"
                      disabled={saving}
                      placeholder="Ej.: Verifiqué el segundo pago y confirmé el reembolso en Mercado Pago."
                    />
                    <Form.Control.Feedback type="invalid">
                      {reviewNoteError}
                    </Form.Control.Feedback>
                    <Form.Text id="admin-order-review-note-help">
                      Obligatoria: entre {REVISION_NOTE_MIN_LENGTH} y{" "}
                      {REVISION_NOTE_MAX_LENGTH} caracteres.{" "}
                      {normalizedReviewNote.length}/
                      {REVISION_NOTE_MAX_LENGTH}
                    </Form.Text>
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="warning"
                    className="mt-3"
                    disabled={saving}
                  >
                    Revisar y confirmar resolución
                  </Button>
                </Form>
              </section>
            )}

            <div className="admin-order-summary">
              <div>
                <span>Creado</span>
                <strong>{formatDateAdmin(pedido.createdAt)}</strong>
              </div>
              <div>
                <span>Pago</span>
                <Badge bg={payment.variant}>{payment.label}</Badge>
              </div>
              <div>
                <span>Operación</span>
                <Badge bg={operational.variant}>{operational.label}</Badge>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatCurrencyAdmin(pedido.total)}</strong>
              </div>
            </div>

            <Row className="g-3 mt-1">
              <Col lg={6}>
                <section
                  className="admin-detail-card h-100"
                  aria-labelledby="buyer-title"
                >
                  <h3 id="buyer-title">Comprador</h3>
                  <dl className="admin-detail-list">
                    <div>
                      <dt>Nombre</dt>
                      <dd>{getBuyerName(pedido)}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{showValue(pedido.cliente?.email)}</dd>
                    </div>
                    <div>
                      <dt>Teléfono</dt>
                      <dd>{showValue(pedido.cliente?.telefono)}</dd>
                    </div>
                  </dl>
                </section>
              </Col>

              <Col lg={6}>
                <section
                  className="admin-detail-card h-100"
                  aria-labelledby="delivery-title"
                >
                  <h3 id="delivery-title">Entrega</h3>
                  <dl className="admin-detail-list">
                    <div>
                      <dt>Método</dt>
                      <dd>{showValue(pedido.entrega?.metodo)}</dd>
                    </div>
                    <div>
                      <dt>Dirección</dt>
                      <dd>{showValue(pedido.entrega?.direccion)}</dd>
                    </div>
                    <div>
                      <dt>Localidad</dt>
                      <dd>
                        {[
                          pedido.entrega?.localidad,
                          pedido.entrega?.provincia,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt>Código postal</dt>
                      <dd>{showValue(pedido.entrega?.codigoPostal)}</dd>
                    </div>
                    <div>
                      <dt>Aclaraciones</dt>
                      <dd>{showValue(pedido.entrega?.aclaraciones)}</dd>
                    </div>
                  </dl>
                </section>
              </Col>

              <Col xs={12}>
                <section
                  className="admin-detail-card"
                  aria-labelledby="items-title"
                >
                  <h3 id="items-title">Productos</h3>
                  {pedido.productos?.length ? (
                    <div className="admin-table-wrap">
                      <Table
                        responsive
                        className="admin-table admin-order-items align-middle mb-0"
                      >
                        <thead>
                          <tr>
                            <th scope="col">Producto</th>
                            <th scope="col">Precio</th>
                            <th scope="col">Cantidad</th>
                            <th scope="col" className="text-end">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pedido.productos.map((item, index) => (
                            <tr
                              key={`${item.productoId || item.name}-${index}`}
                            >
                              <td>{showValue(item.name, "Producto")}</td>
                              <td>{formatCurrencyAdmin(item.price)}</td>
                              <td>{showValue(item.quantity, 0)}</td>
                              <td className="text-end">
                                {formatCurrencyAdmin(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <p className="admin-muted mb-0">Sin productos informados.</p>
                  )}
                </section>
              </Col>

              <Col lg={6}>
                <section
                  className="admin-detail-card h-100"
                  aria-labelledby="payment-title"
                >
                  <h3 id="payment-title">Pago</h3>
                  <dl className="admin-detail-list">
                    <div>
                      <dt>Proveedor</dt>
                      <dd>{getPaymentProvider(pedido)}</dd>
                    </div>
                    <div>
                      <dt>Estado</dt>
                      <dd>
                        <Badge bg={payment.variant}>{payment.label}</Badge>
                      </dd>
                    </div>
                    <div>
                      <dt>Preference ID</dt>
                      <dd>{showValue(pedido.pago?.preferenceId)}</dd>
                    </div>
                    <div>
                      <dt>Payment ID</dt>
                      <dd>{showValue(pedido.pago?.paymentId)}</dd>
                    </div>
                    <div>
                      <dt>Detalle</dt>
                      <dd>{showValue(pedido.pago?.statusDetail)}</dd>
                    </div>
                    <div>
                      <dt>Referencia externa</dt>
                      <dd>{showValue(pedido.externalReference)}</dd>
                    </div>
                    <div>
                      <dt>Reserva hasta</dt>
                      <dd>{formatDateAdmin(pedido.reservationExpiresAt)}</dd>
                    </div>
                  </dl>
                </section>
              </Col>

              <Col lg={6}>
                <section
                  className="admin-detail-card h-100"
                  aria-labelledby="amounts-title"
                >
                  <h3 id="amounts-title">Importes</h3>
                  <dl className="admin-amount-list">
                    <div>
                      <dt>Subtotal</dt>
                      <dd>{formatCurrencyAdmin(pedido.subtotal)}</dd>
                    </div>
                    <div>
                      <dt>Envío</dt>
                      <dd>{formatCurrencyAdmin(pedido.costoEnvio)}</dd>
                    </div>
                    <div className="admin-amount-total">
                      <dt>Total</dt>
                      <dd>{formatCurrencyAdmin(pedido.total)}</dd>
                    </div>
                  </dl>
                  <p className="admin-muted small mb-0">
                    Última actualización: {formatDateAdmin(pedido.updatedAt)}
                  </p>
                </section>
              </Col>

              {reviewResolutions.length > 0 && (
                <Col xs={12}>
                  <section
                    className="admin-detail-card"
                    aria-labelledby="review-history-title"
                  >
                    <h3 id="review-history-title">
                      Historial de revisiones resueltas
                    </h3>
                    <ol className="admin-review-history">
                      {reviewResolutions.map((resolution, index) => (
                        <li
                          key={`${resolution.resolvedAt || "sin-fecha"}-${index}`}
                        >
                          <div className="admin-review-history-heading">
                            <strong>
                              {formatDateAdmin(resolution.resolvedAt)}
                            </strong>
                            <span>
                              Resuelta por{" "}
                              {showValue(
                                resolution.resolvedBy,
                                "administración",
                              )}
                            </span>
                          </div>
                          <p>{showValue(resolution.note, "Sin nota")}</p>
                          <small>
                            Motivo registrado:{" "}
                            {showValue(resolution.reason, "No informado")}
                          </small>
                        </li>
                      ))}
                    </ol>
                  </section>
                </Col>
              )}
            </Row>

            <Form
              id="admin-order-status-form"
              className="admin-order-status-form"
              onSubmit={submitStatus}
            >
              <Form.Group controlId="admin-order-status">
                <Form.Label>Estado operativo</Form.Label>
                <Form.Select
                  value={estadoOperativo}
                  onChange={(event) => setEstadoOperativo(event.target.value)}
                  disabled={saving || !hasOperationalTransition}
                  required
                >
                  {!estadosOperativosDisponibles.includes(
                    estadoOperativoActual,
                  ) && (
                    <option value="" disabled>
                      Estado actual:{" "}
                      {getEstadoOperativoMeta(estadoOperativoActual).label}
                    </option>
                  )}
                  {estadosOperativosDisponibles.map((status) => (
                    <option key={status} value={status}>
                      {getEstadoOperativoMeta(status).label}
                      {status === estadoOperativoActual ? " (actual)" : ""}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text>
                  {pedido.requiresReview
                    ? "Mientras la revisión esté pendiente, sólo se ofrece cancelar cuando el backend lo permite. También podés resolverla arriba."
                    : pedido.estadoPago !== "approved"
                      ? "Sin un pago aprobado, el pedido sólo puede permanecer pendiente o cancelarse cuando la transición es válida."
                      : "Sólo se muestran el estado actual y las transiciones operativas permitidas."}{" "}
                  El estado del pago es informativo y no se edita desde aquí.
                </Form.Text>
              </Form.Group>
            </Form>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          type="button"
          variant="outline-secondary"
          onClick={onClose}
          disabled={saving}
        >
          Cerrar
        </Button>
        <Button
          type="submit"
          form="admin-order-status-form"
          variant="success"
          disabled={loading || saving || !pedido || !canSubmitStatus}
        >
          {saving && <Spinner animation="border" size="sm" className="me-2" />}
          {saving ? "Guardando…" : "Actualizar estado"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
