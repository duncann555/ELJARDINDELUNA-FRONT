import { Alert, Button, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import FALLBACK_IMAGE from "../../assets/EL_JARDIN_DE_LUNA_FOOTER.png";
import { useCarrito } from "../../context/CarritoContext";
import { MAX_CART_QUANTITY } from "../../helpers/cart";
import { calcularTotalesCheckout } from "../../helpers/checkout";
import { formatCurrency } from "../../helpers/format";
import { useCheckoutConfiguration } from "../../hooks/useCheckoutConfiguration";

export default function Carrito() {
  const {
    carrito,
    incrementar,
    decrementar,
    eliminarDelCarrito,
    vaciarCarrito,
    subtotal,
  } = useCarrito();
  const {
    status: configurationStatus,
    configuration,
    error: configurationError,
    retry,
  } = useCheckoutConfiguration({ enabled: carrito.length > 0 });
  const totals = calcularTotalesCheckout(
    subtotal,
    "domicilio",
    configuration,
  );

  if (!carrito.length) {
    return (
      <main className="store-page">
        <Container>
          <div className="empty-cart">
            <i className="bi bi-bag" aria-hidden="true"></i>
            <h1>Tu carrito está vacío</h1>
            <p>Explorá el catálogo y sumá los productos que quieras.</p>
            <Button as={Link} to="/productos" variant="success" size="lg">
              Ver productos
            </Button>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="store-page">
      <Container>
        <header className="page-heading compact">
          <p className="eyebrow">Tu selección</p>
          <h1>Carrito</h1>
          <p>El stock y los precios se confirman antes de iniciar el pago.</p>
        </header>

        <Row className="g-4 align-items-start">
          <Col lg={8}>
            <div className="cart-list">
              {carrito.map((item) => (
                <article className="cart-item" key={item.id}>
                  <img
                    src={item.image || FALLBACK_IMAGE}
                    alt=""
                    className="cart-item-image"
                  />
                  <div className="cart-item-content">
                    <div>
                      <h2>{item.name}</h2>
                      <p>{formatCurrency(item.price)} por unidad</p>
                    </div>
                    <div className="quantity-control">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => decrementar(item.id)}
                        disabled={item.quantity <= 1}
                        aria-label={`Restar una unidad de ${item.name}`}
                      >
                        −
                      </Button>
                      <output aria-label={`Cantidad de ${item.name}`}>
                        {item.quantity}
                      </output>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => incrementar(item.id)}
                        disabled={
                          item.quantity >=
                          Math.min(item.stock, MAX_CART_QUANTITY)
                        }
                        aria-label={`Sumar una unidad de ${item.name}`}
                      >
                        +
                      </Button>
                    </div>
                    <strong>{formatCurrency(item.price * item.quantity)}</strong>
                    <Button
                      variant="link"
                      className="cart-remove"
                      onClick={() => eliminarDelCarrito(item.id)}
                      aria-label={`Quitar ${item.name} del carrito`}
                    >
                      Quitar
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            <Button
              variant="link"
              className="cart-clear"
              onClick={vaciarCarrito}
            >
              Vaciar carrito
            </Button>
          </Col>

          <Col lg={4}>
            <aside className="order-summary">
              <h2>Resumen</h2>
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>{formatCurrency(totals.subtotal)}</strong>
              </div>
              {configurationStatus === "success" ? (
                <>
                  <div className="summary-row">
                    <span>Envío a domicilio</span>
                    <strong>{formatCurrency(totals.costoEnvio)}</strong>
                  </div>
                  <div className="summary-row summary-total">
                    <span>Total con envío</span>
                    <strong>{formatCurrency(totals.total)}</strong>
                  </div>
                  {configuration.retiroDisponible && (
                    <p className="summary-note">
                      Si elegís retiro coordinado en el checkout, el envío es
                      {` ${formatCurrency(0)}`}.
                    </p>
                  )}
                </>
              ) : configurationStatus === "loading" ? (
                <p className="summary-note">Calculando la entrega…</p>
              ) : (
                <Alert variant="warning">
                  {configurationError}
                  <Button variant="link" onClick={retry}>
                    Reintentar
                  </Button>
                </Alert>
              )}
              <Button
                as={Link}
                to="/checkout"
                variant="success"
                size="lg"
                className="w-100"
                aria-disabled={configurationStatus !== "success"}
                tabIndex={configurationStatus === "success" ? undefined : -1}
                onClick={(event) => {
                  if (configurationStatus !== "success") event.preventDefault();
                }}
              >
                Continuar al checkout
              </Button>
              <Link to="/productos" className="text-link justify-content-center">
                Seguir comprando
              </Link>
            </aside>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
