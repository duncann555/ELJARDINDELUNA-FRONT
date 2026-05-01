import { useState } from "react";
import { Badge, Button, Col, FloatingLabel, Form, Modal, Row, Table } from "react-bootstrap";
import { formatCurrency, formatDate } from "../../helpers/app";
import {
  obtenerCostoEnvioPedido,
  obtenerDescuentoPedido,
  obtenerEstadoPagoPedido,
  obtenerEstadoPedidoSugerido,
  obtenerEstadosPagoDisponibles,
  obtenerEstadosPedidoDisponibles,
  obtenerMetodoPagoPedido,
  obtenerTextoEstadoPago,
  obtenerTextoEstadoPedido,
  obtenerTextoMetodoPagoPedido,
  obtenerTextoTipoEnvioPedido,
  obtenerSubtotalPedido,
  obtenerVarianteEstadoPago,
} from "./utilidadesAdmin";

export default function ModalPedidoAdmin({
  show,
  pedido,
  cerrarModalPedido,
  guardarPedido,
  guardandoPedido,
  eliminarPedido,
  eliminandoPedido,
}) {
  const [formulario, setFormulario] = useState(() => {
    const estadoPago = obtenerEstadoPagoPedido(pedido);

    return {
      estadoPago,
      estadoPedido: obtenerEstadoPedidoSugerido({
        estadoPago,
        estadoPedido: pedido?.estadoPedido,
      }),
    };
  });

  if (!pedido) return null;

  const cliente =
    typeof pedido.usuario === "object" && pedido.usuario !== null
      ? `${pedido.usuario.nombre || ""} ${pedido.usuario.apellido || ""}`.trim()
      : "Sin cliente";
  const estadosPagoDisponibles = obtenerEstadosPagoDisponibles(pedido);
  const estadoPagoActual = obtenerEstadoPagoPedido(pedido);
  const estadoPagoVisible = formulario.estadoPago || estadoPagoActual;
  const estadosDisponibles = obtenerEstadosPedidoDisponibles({
    estadoActual: formulario.estadoPedido,
    estadoPago: formulario.estadoPago,
  });
  const pagoAprobado = formulario.estadoPago === "approved";
  const esTransferencia = obtenerMetodoPagoPedido(pedido) === "transferencia";
  const comprobanteUrl = String(pedido.comprobanteTransferencia?.url || "").trim();
  const tipoEnvio = pedido.envio?.tipo || pedido.datosEnvio?.tipo || "";

  const handleSubmit = (event) => {
    event.preventDefault();
    guardarPedido({
      ...formulario,
      estadoPedido: obtenerEstadoPedidoSugerido(formulario),
    });
  };

  const handleCambiarEstadoPago = (event) => {
    const estadoPago = event.target.value;

    setFormulario((prev) => ({
      ...prev,
      estadoPago,
      estadoPedido: obtenerEstadoPedidoSugerido({
        estadoPago,
        estadoPedido: prev.estadoPedido,
      }),
    }));
  };

  return (
    <Modal
      show={show}
      onHide={cerrarModalPedido}
      size="lg"
      centered
      dialogClassName="admin-modal-dialog"
    >
      <Modal.Header closeButton>
        <Modal.Title>Gestion del pedido</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Row className="g-3 mb-4">
          <Col md={6}>
            <div className="admin-modal-card p-3 rounded border bg-light h-100">
              <small className="text-muted d-block mb-1">Cliente</small>
              <div className="fw-bold">{cliente || "Sin nombre"}</div>
              <div className="text-muted small">{pedido.usuario?.email || "-"}</div>
            </div>
          </Col>

          <Col md={6}>
            <div className="admin-modal-card p-3 rounded border bg-light h-100">
              <small className="text-muted d-block mb-1">Pedido</small>
              <div className="fw-bold">#{String(pedido._id).slice(-6).toUpperCase()}</div>
              <div className="text-muted small">{formatDate(pedido.createdAt)}</div>
            </div>
          </Col>

          <Col md={6}>
            <div className="admin-modal-card p-3 rounded border bg-light h-100">
              <small className="text-muted d-block mb-1">Pago</small>
              <Badge bg={obtenerVarianteEstadoPago(estadoPagoVisible)}>
                {obtenerTextoEstadoPago(estadoPagoVisible)}
              </Badge>
              <div className="fw-bold mt-2">
                {obtenerTextoMetodoPagoPedido(pedido)}
              </div>
              {!esTransferencia && pedido.pago?.preferenceId && (
                <div className="text-muted small mt-2">
                  Preference ID: {pedido.pago.preferenceId}
                </div>
              )}
              {esTransferencia && (
                comprobanteUrl ? (
                  <Button
                    as="a"
                    href={comprobanteUrl}
                    target="_blank"
                    rel="noreferrer"
                    variant="outline-success"
                    size="sm"
                    className="mt-3"
                  >
                    Ver comprobante
                  </Button>
                ) : (
                  <div className="text-muted small mt-3">
                    Sin comprobante cargado
                  </div>
                )
              )}
            </div>
          </Col>

          <Col md={6}>
            <div className="admin-modal-card p-3 rounded border bg-light h-100">
              <small className="text-muted d-block mb-1">Envio</small>
              <div className="fw-bold">{obtenerTextoTipoEnvioPedido(pedido)}</div>
              {tipoEnvio === "andreani_sucursal" ? (
                <div className="text-muted small mt-2">
                  Sucursal: {pedido.envio?.sucursalAndreani || pedido.datosEnvio?.sucursalAndreani || "-"}
                </div>
              ) : (
                <div className="text-muted small mt-2">
                  Direccion: {pedido.envio?.domicilio || pedido.datosEnvio?.domicilio || "-"}
                </div>
              )}
              <div className="text-muted small">
                {pedido.envio?.ciudad || pedido.datosEnvio?.ciudad || "-"}
                {pedido.envio?.provincia || pedido.datosEnvio?.provincia
                  ? `, ${pedido.envio?.provincia || pedido.datosEnvio?.provincia}`
                  : ""}
              </div>
              <div className="text-muted small">
                Celular: {pedido.envio?.celular || pedido.datosEnvio?.celular || "-"}
              </div>
              {(pedido.envio?.entreCalles || pedido.datosEnvio?.entreCalles) && (
                <div className="text-muted small">
                  Entre calles: {pedido.envio?.entreCalles || pedido.datosEnvio?.entreCalles}
                </div>
              )}
              {(pedido.envio?.referencia || pedido.datosEnvio?.referencia) && (
                <div className="text-muted small">
                  Referencia: {pedido.envio?.referencia || pedido.datosEnvio?.referencia}
                </div>
              )}
              {(pedido.envio?.horarioConveniente || pedido.datosEnvio?.horarioConveniente) && (
                <div className="text-muted small">
                  Horario: {pedido.envio?.horarioConveniente || pedido.datosEnvio?.horarioConveniente}
                </div>
              )}
              <div className="text-muted small">
                CP: {pedido.envio?.codigoPostal || pedido.datosEnvio?.codigoPostal || "-"}
              </div>
              <div className="text-muted small">
                Costo: {formatCurrency(obtenerCostoEnvioPedido(pedido))}
              </div>
            </div>
          </Col>
        </Row>

        <div className="mb-4">
          <h6 className="fw-bold mb-3">Productos del pedido</h6>
          <div className="admin-modal-table-wrap border rounded overflow-hidden">
            <Table responsive className="mb-0 admin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedido.productos?.map((producto, index) => (
                  <tr key={`${producto.producto}-${index}`}>
                    <td>{producto.nombre}</td>
                    <td>{producto.cantidad}</td>
                    <td>{formatCurrency(producto.precio)}</td>
                    <td>{formatCurrency(producto.precio * producto.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>

        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <FloatingLabel label="Estado del pedido">
                <Form.Select
                  name="estadoPedido"
                  value={formulario.estadoPedido}
                  onChange={(event) =>
                    setFormulario((prev) => ({
                      ...prev,
                      estadoPedido: event.target.value,
                    }))
                  }
                >
                  {estadosDisponibles.map((estado) => (
                    <option key={estado} value={estado}>
                      {obtenerTextoEstadoPedido(estado)}
                    </option>
                  ))}
                </Form.Select>
              </FloatingLabel>
              {!pagoAprobado && (
                <div className="small text-muted mt-2">
                  Con pago pendiente o rechazado, el pedido solo puede quedar en espera de pago o cancelado.
                </div>
              )}
            </Col>

            {esTransferencia && (
              <Col md={6}>
                <FloatingLabel label="Estado del pago">
                  <Form.Select
                    name="estadoPago"
                    value={formulario.estadoPago}
                    onChange={handleCambiarEstadoPago}
                  >
                    {estadosPagoDisponibles.map((estado) => (
                      <option key={estado} value={estado}>
                        {obtenerTextoEstadoPago(estado)}
                      </option>
                    ))}
                  </Form.Select>
                </FloatingLabel>
                <div className="small text-muted mt-2">
                  Puedes aprobar o rechazar manualmente pagos por transferencia.
                </div>
              </Col>
            )}
          </Row>

          <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mt-4">
            <div>
              <div className="fw-bold">
                Subtotal: {formatCurrency(obtenerSubtotalPedido(pedido))}
              </div>
              {obtenerDescuentoPedido(pedido) > 0 && (
                <div className="small text-success">
                  Descuento transferencia 7%: -{formatCurrency(obtenerDescuentoPedido(pedido))}
                </div>
              )}
              <div className="small text-muted">
                Envio: {formatCurrency(obtenerCostoEnvioPedido(pedido))}
              </div>
              <div className="fw-bold">
                Total: {formatCurrency(pedido.total)}
              </div>
            </div>
            <div className="d-flex gap-2">
              <Button
                type="button"
                variant="outline-danger"
                className="admin-action-btn"
                onClick={eliminarPedido}
                disabled={guardandoPedido || eliminandoPedido}
              >
                {eliminandoPedido ? "Eliminando..." : "Eliminar pedido"}
              </Button>
              <Button
                type="submit"
                variant="success"
                className="admin-action-btn"
                disabled={guardandoPedido || eliminandoPedido}
              >
                {guardandoPedido ? "Guardando..." : "Guardar estado"}
              </Button>
            </div>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
