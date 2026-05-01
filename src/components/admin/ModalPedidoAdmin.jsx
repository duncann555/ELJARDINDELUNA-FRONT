import { useEffect, useState } from "react";
import { Badge, Button, Col, FloatingLabel, Form, Modal, Row, Table } from "react-bootstrap";
import { formatCurrency, formatDate } from "../../helpers/app";
import {
  obtenerCostoEnvioPedido,
  obtenerDescuentoPedido,
  obtenerEstadosPagoDisponibles,
  obtenerEstadosPedidoDisponibles,
  obtenerTextoMetodoPagoPedido,
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
  const [formulario, setFormulario] = useState({
    estadoPedido: "En espera de pago",
    estadoPago: "pending",
  });

  useEffect(() => {
    if (!show || !pedido) return;

    setFormulario({
      estadoPedido: pedido.estadoPedido || "En espera de pago",
      estadoPago: pedido.estadoPago || pedido.pago?.estado || "pending",
    });
  }, [show, pedido]);

  if (!pedido) return null;

  const cliente =
    typeof pedido.usuario === "object" && pedido.usuario !== null
      ? `${pedido.usuario.nombre || ""} ${pedido.usuario.apellido || ""}`.trim()
      : "Sin cliente";
  const estadosDisponibles = obtenerEstadosPedidoDisponibles(pedido);
  const estadosPagoDisponibles = obtenerEstadosPagoDisponibles(pedido);
  const pagoAprobado = pedido.pago?.estado === "approved";
  const esTransferencia = pedido.metodoPago === "transferencia";

  const handleSubmit = (event) => {
    event.preventDefault();
    guardarPedido(formulario);
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
              <Badge bg={obtenerVarianteEstadoPago(pedido.pago?.estado)}>
                {pedido.pago?.estado || "pending"}
              </Badge>
              <div className="fw-bold mt-2">
                {obtenerTextoMetodoPagoPedido(pedido)}
              </div>
              <div className="text-muted small mt-2">
                Preference ID: {pedido.pago?.preferenceId || "-"}
              </div>
              {pedido.comprobanteTransferencia?.url && (
                <Button
                  as="a"
                  href={pedido.comprobanteTransferencia.url}
                  target="_blank"
                  rel="noreferrer"
                  variant="outline-success"
                  size="sm"
                  className="mt-3"
                >
                  Ver comprobante
                </Button>
              )}
            </div>
          </Col>

          <Col md={6}>
            <div className="admin-modal-card p-3 rounded border bg-light h-100">
              <small className="text-muted d-block mb-1">Envio</small>
              <div className="fw-bold">{pedido.envio?.proveedor || "Envio nacional"}</div>
              <div className="text-muted small mt-2">
                Direccion: {pedido.envio?.domicilio || "-"}
              </div>
              <div className="text-muted small">
                {pedido.envio?.ciudad || "-"}, {pedido.envio?.provincia || "-"}
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
                      {estado}
                    </option>
                  ))}
                </Form.Select>
              </FloatingLabel>
              {!pagoAprobado && (
                <div className="small text-muted mt-2">
                  Mientras el pago siga pendiente, solo puedes dejarlo en espera o cancelarlo.
                </div>
              )}
            </Col>

            {esTransferencia && (
              <Col md={6}>
                <FloatingLabel label="Estado del pago">
                  <Form.Select
                    name="estadoPago"
                    value={formulario.estadoPago}
                    onChange={(event) =>
                      setFormulario((prev) => ({
                        ...prev,
                        estadoPago: event.target.value,
                      }))
                    }
                  >
                    {estadosPagoDisponibles.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
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
                  Descuento: -{formatCurrency(obtenerDescuentoPedido(pedido))}
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
