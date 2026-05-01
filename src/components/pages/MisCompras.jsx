import { useEffect, useState } from "react";
import {
  Accordion,
  Alert,
  Button,
  Card,
  Col,
  Container,
  ListGroup,
  Row,
  Spinner,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  formatCurrency,
  formatDate,
  getApiErrorMessage,
  isAuthError,
} from "../../helpers/app";
import { solicitarApi } from "../../helpers/clienteApi";
import {
  obtenerCostoEnvioPedido,
  obtenerDescuentoPedido,
  obtenerSubtotalPedido,
  obtenerMetodoPagoPedido,
  obtenerTextoMetodoPagoPedido,
  obtenerTextoEstadoPago,
} from "../../helpers/pedidos";
import {
  DATOS_TRANSFERENCIA,
  construirUrlWhatsAppTransferencia,
} from "../../helpers/transferencia";
import EstadoBadge from "../shared/EstadoBadge";

const obtenerIdentificadorPedido = (pedido) =>
  pedido?._id ? `#${String(pedido._id).slice(-6).toUpperCase()}` : "-";

const construirResumenEnvio = (pedido) => {
  const partes = [
    pedido?.envio?.domicilio,
    pedido?.envio?.ciudad,
    pedido?.envio?.provincia,
  ].filter(Boolean);

  const codigoPostal = String(pedido?.envio?.codigoPostal || "").trim();

  if (codigoPostal) {
    partes.push(`CP ${codigoPostal}`);
  }

  return partes.join(", ") || "Sin dirección registrada";
};

function TarjetaPedido({ pedido, index }) {
  const estadoPago = pedido?.estadoPago || pedido?.pago?.estado;
  const esTransferenciaPendiente =
    obtenerMetodoPagoPedido(pedido) === "transferencia" && estadoPago !== "approved";
  const totalProductos = Array.isArray(pedido?.productos)
    ? pedido.productos.reduce(
        (acumulado, producto) => acumulado + Number(producto?.cantidad || 0),
        0,
      )
    : 0;

  return (
    <Accordion.Item
      eventKey={String(index)}
      className="border-0 rounded-4 overflow-hidden shadow-sm"
    >
      <Accordion.Header>
        <div className="w-100 pe-3">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
            <div>
              <div className="fw-bold">{obtenerIdentificadorPedido(pedido)}</div>
              <small className="text-muted">
                {formatDate(pedido?.createdAt, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </small>
            </div>

            <div className="text-md-end">
              <div className="fw-bold">{formatCurrency(pedido?.total || 0)}</div>
              <small className="text-muted">
                {totalProductos} productos
              </small>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-3">
            <EstadoBadge tipo="pedido" valor={pedido?.estadoPedido} />
            <EstadoBadge tipo="pago" valor={estadoPago} />
            {esTransferenciaPendiente && (
              <EstadoBadge
                tipo="general"
                valor="destacado"
                label="Comprobante pendiente"
              />
            )}
          </div>
        </div>
      </Accordion.Header>

      <Accordion.Body className="bg-white">
        <Row className="g-4">
          <Col lg={7}>
            <h6 className="fw-bold mb-3">Productos</h6>
            <ListGroup variant="flush">
              {pedido?.productos?.map((producto, productoIndex) => (
                <ListGroup.Item
                  key={`${pedido?._id}-${producto?.producto || productoIndex}`}
                  className="px-0 py-3 bg-transparent"
                >
                  <div className="d-flex justify-content-between gap-3">
                    <div>
                      <div className="fw-semibold">{producto?.nombre || "Producto"}</div>
                      <small className="text-muted">
                        Cantidad: {Number(producto?.cantidad || 0)}
                      </small>
                    </div>
                    <div className="fw-semibold text-nowrap">
                      {formatCurrency(
                        Number(producto?.precio || 0) * Number(producto?.cantidad || 0),
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>

          <Col lg={5}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body>
                <h6 className="fw-bold mb-3">Resumen</h6>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal</span>
                  <span className="fw-semibold">
                    {formatCurrency(obtenerSubtotalPedido(pedido))}
                  </span>
                </div>

                {obtenerDescuentoPedido(pedido) > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span>Descuento transferencia 7%</span>
                    <span className="fw-semibold">
                      -{formatCurrency(obtenerDescuentoPedido(pedido))}
                    </span>
                  </div>
                )}

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Envío</span>
                  <span className="fw-semibold">
                    {formatCurrency(obtenerCostoEnvioPedido(pedido))}
                  </span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="fw-bold">Total</span>
                  <span className="fw-bold">
                    {formatCurrency(pedido?.total || 0)}
                  </span>
                </div>

                <hr />

                <div className="mb-2">
                  <small className="text-muted d-block mb-1">Método</small>
                  <div className="fw-semibold">
                    {obtenerTextoMetodoPagoPedido(pedido)}
                  </div>
                </div>

                <div className="mb-2">
                  <small className="text-muted d-block mb-1">Pago</small>
                  <div className="fw-semibold">
                    {obtenerTextoEstadoPago(estadoPago)}
                  </div>
                </div>

                <div className="mb-2">
                  <small className="text-muted d-block mb-1">Proveedor</small>
                  <div className="fw-semibold">
                    {pedido?.envio?.proveedor || "Envío nacional"}
                  </div>
                </div>

                <div>
                  <small className="text-muted d-block mb-1">Dirección</small>
                  <div className="fw-semibold">
                    {construirResumenEnvio(pedido)}
                  </div>
                </div>

                {pedido?.comprobanteTransferencia?.url && (
                  <div className="mt-3">
                    <Button
                      as="a"
                      href={pedido.comprobanteTransferencia.url}
                      target="_blank"
                      rel="noreferrer"
                      variant="outline-success"
                      size="sm"
                      className="rounded-pill"
                    >
                      Ver comprobante
                    </Button>
                  </div>
                )}

                {esTransferenciaPendiente && (
                  <div className="mt-3 border-top pt-3">
                    <small className="text-muted d-block mb-1">Alias</small>
                    <div className="fw-semibold mb-2">{DATOS_TRANSFERENCIA.alias}</div>
                    <small className="text-muted d-block mb-1">Total a transferir</small>
                    <div className="fw-bold text-success mb-3">
                      {formatCurrency(pedido?.total || 0)}
                    </div>
                    <Button
                      as="a"
                      href={construirUrlWhatsAppTransferencia({
                        pedidoId: pedido?._id,
                        total: pedido?.total || 0,
                      })}
                      target="_blank"
                      rel="noreferrer"
                      variant="success"
                      size="sm"
                      className="rounded-pill"
                    >
                      Enviar comprobante por WhatsApp
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Accordion.Body>
    </Accordion.Item>
  );
}

export default function MisCompras() {
  const navigate = useNavigate();
  const { token, logout, user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    const cargarPedidos = async () => {
      try {
        setCargando(true);
        setError("");

        const { respuesta, datos } = await solicitarApi("/pedidos", {
          method: "GET",
          token,
        });

        if (isAuthError(respuesta, datos)) {
          await logout();
          navigate("/", { replace: true });
          return;
        }

        if (!respuesta.ok) {
          throw new Error(
            getApiErrorMessage(datos, "No se pudieron cargar tus compras."),
          );
        }

        if (activo) {
          setPedidos(Array.isArray(datos) ? datos : []);
        }
      } catch (pedidoError) {
        if (!activo) {
          return;
        }

        setError(
          pedidoError.message || "No se pudieron cargar tus compras.",
        );
        setPedidos([]);
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    void cargarPedidos();

    return () => {
      activo = false;
    };
  }, [logout, navigate, token]);

  return (
    <section className="py-5 bg-light min-vh-100">
      <Container>
        <Row className="justify-content-center">
          <Col xl={10}>
            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Body className="p-4 p-md-5">
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                  <div>
                    <div className="text-uppercase text-muted small fw-bold mb-2">
                      Mi cuenta
                    </div>
                    <h1 className="font-playfair fw-bold mb-2">Mis compras</h1>
                    <p className="text-muted mb-0">
                      {user?.nombre
                        ? `${user.nombre}, acá podés revisar todas las compras que fuiste realizando en el tiempo.`
                        : "Acá podés revisar todas las compras que realizaste en el tiempo."}
                    </p>
                  </div>

                  <Button
                    as={Link}
                    to="/productos"
                    variant="outline-success"
                    className="rounded-pill px-4"
                  >
                    Seguir comprando
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {cargando ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <Spinner animation="border" className="text-success" />
              </div>
            ) : error ? (
              <Alert variant="danger" className="rounded-4">
                {error}
              </Alert>
            ) : pedidos.length === 0 ? (
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4 p-md-5 text-center">
                  <div className="display-5 text-muted mb-3">
                    <i className="bi bi-bag"></i>
                  </div>
                  <h4 className="fw-bold mb-2">Todavía no tenés compras registradas</h4>
                  <p className="text-muted mb-4">
                    Cuando completes un pedido, te va a aparecer acá con la fecha,
                    estado y detalle.
                  </p>
                  <Button
                    as={Link}
                    to="/productos"
                    variant="success"
                    className="rounded-pill px-4"
                  >
                    Explorar productos
                  </Button>
                </Card.Body>
              </Card>
            ) : (
              <Accordion alwaysOpen className="d-grid gap-3">
                {pedidos.map((pedido, index) => (
                  <TarjetaPedido key={pedido._id || index} pedido={pedido} index={index} />
                ))}
              </Accordion>
            )}
          </Col>
        </Row>
      </Container>
    </section>
  );
}
