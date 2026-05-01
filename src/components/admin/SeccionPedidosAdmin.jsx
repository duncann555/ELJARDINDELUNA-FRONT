import { Badge, Button, Table } from "react-bootstrap";
import { formatCurrency, formatDate } from "../../helpers/app";
import {
  obtenerCostoEnvioPedido,
  obtenerDescuentoPedido,
  obtenerEstadoPagoPedido,
  obtenerSubtotalPedido,
  obtenerTextoEstadoPago,
  obtenerTextoEstadoPedido,
  obtenerTextoMetodoPagoPedido,
  obtenerTextoTipoEnvioPedido,
  obtenerVarianteEstadoPago,
  obtenerVarianteEstadoPedido,
} from "./utilidadesAdmin";

export default function SeccionPedidosAdmin({
  pedidos,
  cargandoPedidos,
  pedidosEnGestion,
  onGestionarPedido,
}) {
  return (
    <div className="admin-section-card bg-white p-4 rounded shadow-sm">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-1">Gestión de pedidos</h5>
          <p className="text-muted mb-0">
            Revisá estados, pagos y resúmenes de compra.
          </p>
        </div>

        <Badge bg="warning" text="dark" className="fs-6">
          {pedidosEnGestion} en gestión
        </Badge>
      </div>

      {cargandoPedidos ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="text-muted mt-3 mb-0">Cargando pedidos...</p>
        </div>
      ) : pedidos.length > 0 ? (
        <div className="admin-table-wrap">
          <Table responsive hover className="align-middle admin-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Pago</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => {
                const estadoPago = obtenerEstadoPagoPedido(pedido);

                return (
                <tr key={pedido._id}>
                  <td>
                    <div className="fw-bold">
                      #{String(pedido._id).slice(-6).toUpperCase()}
                    </div>
                    <small className="text-muted">
                      {pedido.productos?.length || 0} productos
                    </small>
                  </td>

                  <td>
                    <div className="fw-bold">
                      {pedido.usuario?.nombre} {pedido.usuario?.apellido}
                    </div>
                    <small className="text-muted">{pedido.usuario?.email || "-"}</small>
                  </td>

                  <td>{formatDate(pedido.createdAt)}</td>
                  <td>
                    <div className="fw-semibold">{formatCurrency(pedido.total)}</div>
                    <small className="text-muted">
                      {obtenerTextoMetodoPagoPedido(pedido)} | Subtotal{" "}
                      {formatCurrency(obtenerSubtotalPedido(pedido))}
                      {obtenerDescuentoPedido(pedido) > 0 && (
                        <>
                          {" "}
                          - descuento transferencia 7% {formatCurrency(obtenerDescuentoPedido(pedido))}
                        </>
                      )}{" "}
                      + {obtenerTextoTipoEnvioPedido(pedido)}{" "}
                      {formatCurrency(obtenerCostoEnvioPedido(pedido))}
                    </small>
                  </td>

                  <td>
                    <Badge bg={obtenerVarianteEstadoPago(estadoPago)}>
                      {obtenerTextoEstadoPago(estadoPago)}
                    </Badge>
                  </td>

                  <td>
                    <Badge bg={obtenerVarianteEstadoPedido(pedido.estadoPedido)}>
                      {obtenerTextoEstadoPedido(pedido.estadoPedido)}
                    </Badge>
                  </td>

                  <td>
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="admin-action-btn"
                      onClick={() => onGestionarPedido(pedido)}
                    >
                      Gestionar
                    </Button>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-receipt display-1 d-block mb-3 opacity-25"></i>
          <h5 className="fw-bold">Todavía no hay pedidos</h5>
          <p className="mb-0">
            Cuando entren compras, vas a poder seguirlas desde esta pestaña.
          </p>
        </div>
      )}
    </div>
  );
}
