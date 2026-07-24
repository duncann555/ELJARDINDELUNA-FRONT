import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Form,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  formatCurrencyAdmin,
  formatDateAdmin,
  getEstadoOperativoMeta,
  getEstadoPagoMeta,
  getOrderId,
} from "./utilidadesAdmin";

const getBuyerName = (order) =>
  [order?.cliente?.nombre, order?.cliente?.apellido]
    .filter(Boolean)
    .join(" ") || "Sin nombre";

export default function SeccionPedidosAdmin({
  orders = [],
  loading = false,
  errorMessage = "",
  onRetry,
  onOpen,
}) {
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");

    if (!term) return orders;

    return orders.filter((order) =>
      [
        order?.numero,
        order?.externalReference,
        getBuyerName(order),
        order?.cliente?.email,
        order?.cliente?.telefono,
        order?.estadoPago,
        order?.estadoOperativo,
      ].some((value) =>
        String(value || "")
          .toLocaleLowerCase("es")
          .includes(term),
      ),
    );
  }, [orders, search]);

  return (
    <section className="admin-section-card" aria-labelledby="orders-title">
      <div className="admin-section-header">
        <div>
          <p className="admin-kicker mb-1">Operación</p>
          <h2 id="orders-title" className="h4 mb-1">
            Pedidos
          </h2>
          <p className="admin-muted mb-0">
            Consultá compradores, entregas, pagos y el avance de cada pedido.
          </p>
        </div>
      </div>

      <div className="admin-toolbar">
        <Form.Group controlId="admin-orders-search" className="flex-grow-1">
          <Form.Label className="visually-hidden">Buscar pedidos</Form.Label>
          <Form.Control
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por número, referencia, cliente, email o estado"
          />
        </Form.Group>
        <span className="admin-muted small">
          {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
        </span>
      </div>

      {errorMessage && (
        <Alert variant="danger" className="admin-inline-state" role="alert">
          <div>
            <strong>No se pudieron cargar los pedidos.</strong>
            <div>{errorMessage}</div>
          </div>
          <Button
            type="button"
            variant="outline-danger"
            size="sm"
            onClick={onRetry}
          >
            Reintentar
          </Button>
        </Alert>
      )}

      {loading ? (
        <div className="admin-empty-state" role="status" aria-live="polite">
          <Spinner animation="border" size="sm" />
          <span>Cargando pedidos…</span>
        </div>
      ) : !errorMessage && filteredOrders.length === 0 ? (
        <div className="admin-empty-state">
          <i className="bi bi-receipt" aria-hidden="true"></i>
          <span>
            {search
              ? "No hay pedidos que coincidan con la búsqueda."
              : "Todavía no hay pedidos."}
          </span>
        </div>
      ) : !errorMessage ? (
        <div className="admin-table-wrap">
          <Table responsive hover className="admin-table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Pedido</th>
                <th scope="col">Fecha</th>
                <th scope="col">Cliente</th>
                <th scope="col">Total</th>
                <th scope="col">Pago</th>
                <th scope="col">Operación</th>
                <th scope="col" className="text-end">
                  Detalle
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const orderId = getOrderId(order);
                const payment = getEstadoPagoMeta(order.estadoPago);
                const operational = getEstadoOperativoMeta(
                  order.estadoOperativo,
                );

                return (
                  <tr key={orderId}>
                    <td>
                      <strong>{order.numero || `#${orderId}`}</strong>
                      {order.requiresReview && (
                        <Badge bg="warning" text="dark" className="ms-2">
                          Revisar
                        </Badge>
                      )}
                      <span className="admin-table-secondary">
                        {order.externalReference || orderId}
                      </span>
                    </td>
                    <td>{formatDateAdmin(order.createdAt)}</td>
                    <td>
                      <strong>{getBuyerName(order)}</strong>
                      <span className="admin-table-secondary">
                        {order.cliente?.email || "Sin email"}
                      </span>
                    </td>
                    <td>{formatCurrencyAdmin(order.total)}</td>
                    <td>
                      <Badge bg={payment.variant}>{payment.label}</Badge>
                    </td>
                    <td>
                      <Badge bg={operational.variant}>
                        {operational.label}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button
                        type="button"
                        variant="outline-primary"
                        size="sm"
                        onClick={() => onOpen(order)}
                      >
                        Ver pedido
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      ) : null}
    </section>
  );
}
