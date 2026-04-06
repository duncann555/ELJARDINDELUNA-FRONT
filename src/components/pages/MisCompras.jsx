import { useEffect, useState } from "react";
import {
  Accordion,
  Alert,
  Badge,
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
  obtenerSubtotalPedido,
  obtenerTextoEstadoPago,
  obtenerVarianteEstadoPago,
  obtenerVarianteEstadoPedido,
} from "../../helpers/pedidos";

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

  return partes.join(", ") || "Sin direccion registrada";
};

function TarjetaPedido({ pedido, index }) {
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
                {totalProductos} producto(s)
              </small>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-3">
            <Badge bg={obtenerVarianteEstadoPedido(pedido?.estadoPedido)}>
              {pedido?.estadoPedido || "Sin estado"}
            </Badge>
            <Badge bg={obtenerVarianteEstadoPago(pedido?.pago?.estado)}>
              Pago {obtenerTextoEstadoPago(pedido?.pago?.estado)}
            </Badge>
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

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Envio</span>
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
                  <small className="text-muted d-block mb-1">Pago</small>
                  <div className="fw-semibold">
                    {obtenerTextoEstadoPago(pedido?.pago?.estado)}
                  </div>
                </div>

                <div className="mb-2">
                  <small className="text-muted d-block mb-1">Proveedor</small>
                  <div className="fw-semibold">
                    {pedido?.envio?.proveedor || "Envio nacional"}
                  </div>
                </div>

                <div>
                  <small className="text-muted d-block mb-1">Direccion</small>
                  <div className="fw-semibold">
                    {construirResumenEnvio(pedido)}
                  </div>
                </div>
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
                        ? `${user.nombre}, aqui puedes revisar todas las compras que fuiste realizando en el tiempo.`
                        : "Aqui puedes revisar todas las compras que realizaste en el tiempo."}
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
                  <h4 className="fw-bold mb-2">Todavia no tienes compras registradas</h4>
                  <p className="text-muted mb-4">
                    Cuando completes un pedido, te va a aparecer aqui con su fecha,
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
