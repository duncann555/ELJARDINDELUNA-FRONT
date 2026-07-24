import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Container, Spinner } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { useCarrito } from "../../context/CarritoContext";
import { apiRequest, getSafeErrorMessage } from "../../helpers/api";
import { formatCurrency, formatDate } from "../../helpers/format";
import {
  clearCheckoutAttemptKey,
  markLastOrderCartConsumed,
  matchesOrderReference,
  readLastOrder,
} from "../../helpers/order";
import {
  FINAL_PAYMENT_STATES,
  normalizePaymentState,
  shouldConsumePurchasedCart,
  shouldReleaseCheckoutAttempt,
} from "../../helpers/payment";
import { CONTACTO_WHATSAPP_URL } from "../../helpers/contact";

const PAYMENT_COPY = {
  approved: {
    icon: "bi-check-circle",
    className: "is-approved",
    title: "Pago confirmado",
    description: "El pago fue acreditado y tu pedido quedó confirmado.",
  },
  rejected: {
    icon: "bi-x-circle",
    className: "is-rejected",
    title: "Pago no aprobado",
    description:
      "El pago no fue aprobado. Tu carrito sigue disponible para intentarlo nuevamente.",
  },
  cancelled: {
    icon: "bi-x-circle",
    className: "is-rejected",
    title: "Pago cancelado",
    description:
      "El pago fue cancelado. Tu carrito sigue disponible para intentarlo nuevamente.",
  },
  refunded: {
    icon: "bi-arrow-counterclockwise",
    className: "is-rejected",
    title: "Pago devuelto",
    description:
      "El backend confirmó que el pago fue devuelto. Si necesitás detalles, contactanos con tu número de pedido.",
  },
  charged_back: {
    icon: "bi-shield-exclamation",
    className: "is-rejected",
    title: "Pago contracargado",
    description:
      "El backend informó una contracarga sobre este pago. Contactanos con tu número de pedido.",
  },
  pending: {
    icon: "bi-hourglass-split",
    className: "is-pending",
    title: "Pago en proceso",
    description:
      "Mercado Pago todavía no confirmó el resultado. La acreditación puede demorar.",
  },
};

const wait = (milliseconds, signal) =>
  new Promise((resolve, reject) => {
    const timeout = window.setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });

export default function PagoEstado() {
  const { consumirLineasPedido } = useCarrito();
  const [searchParams] = useSearchParams();
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState({
    status: "loading",
    order: null,
    error: "",
  });
  const [storedOrder] = useState(readLastOrder);
  const cartConsumptionHandledRef = useRef(
    Boolean(storedOrder?.cartConsumed),
  );
  const requestedOrder = String(searchParams.get("pedido") || "").trim();
  const orderMatches = matchesOrderReference(storedOrder, requestedOrder);

  useEffect(() => {
    if (!orderMatches) return undefined;

    const controller = new AbortController();

    const pollOrder = async () => {
      setState((current) => ({ ...current, status: "loading", error: "" }));

      try {
        let order = null;

        for (let attempt = 0; attempt < 5; attempt += 1) {
          const data = await apiRequest(
            `/pedidos/${encodeURIComponent(storedOrder.numero)}/estado`,
            {
              orderToken: storedOrder.orderToken,
              signal: controller.signal,
            },
          );
          order = data?.pedido || null;

          if (!order) {
            throw new Error("No recibimos el estado del pedido.");
          }

          if (
            FINAL_PAYMENT_STATES.has(
              String(order.estadoPago || "").toLowerCase(),
            )
          ) {
            break;
          }

          if (attempt < 4) await wait(2000, controller.signal);
        }

        if (!controller.signal.aborted) {
          setState({ status: "success", order, error: "" });
          const paymentState = normalizePaymentState(order.estadoPago);

          if (shouldReleaseCheckoutAttempt(paymentState)) {
            clearCheckoutAttemptKey();
          }

          if (
            shouldConsumePurchasedCart(paymentState) &&
            !cartConsumptionHandledRef.current
          ) {
            cartConsumptionHandledRef.current = true;
            consumirLineasPedido(storedOrder.items);
            markLastOrderCartConsumed(storedOrder.numero);
          }
        }
      } catch (error) {
        if (error?.name !== "AbortError" && !controller.signal.aborted) {
          setState({
            status: "error",
            order: null,
            error:
              error instanceof Error &&
              error.message === "No recibimos el estado del pedido."
                ? error.message
                : getSafeErrorMessage(error),
          });
        }
      }
    };

    void pollOrder();
    return () => controller.abort();
  }, [
    consumirLineasPedido,
    orderMatches,
    requestKey,
    storedOrder,
  ]);

  if (!orderMatches) {
    return (
      <main className="payment-page">
        <Container>
          <Card className="payment-card">
            <Card.Body>
              <i className="bi bi-shield-exclamation payment-icon"></i>
              <h1>No podemos identificar este pedido</h1>
              <p>
                Por seguridad, la referencia del enlace debe coincidir con el
                pedido iniciado en esta pestaña.
              </p>
              <div className="payment-actions">
                <Button as={Link} to="/productos" variant="success">
                  Ver productos
                </Button>
                <Button
                  as="a"
                  href={CONTACTO_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline-success"
                >
                  Consultar por WhatsApp
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </main>
    );
  }

  if (state.status === "loading") {
    return (
      <main className="payment-page" aria-live="polite">
        <Container>
          <Card className="payment-card">
            <Card.Body>
              <Spinner animation="border" variant="success" />
              <h1>Verificando tu pago</h1>
              <p>
                Consultamos el estado seguro del pedido. Esto puede demorar unos
                segundos.
              </p>
            </Card.Body>
          </Card>
        </Container>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="payment-page">
        <Container>
          <Card className="payment-card">
            <Card.Body>
              <i className="bi bi-wifi-off payment-icon"></i>
              <h1>No pudimos verificar el pago</h1>
              <Alert variant="warning">{state.error}</Alert>
              <p>
                No mostramos un resultado hasta que el servidor pueda
                confirmarlo. Tu carrito no fue modificado.
              </p>
              <Button
                variant="success"
                onClick={() => setRequestKey((value) => value + 1)}
              >
                Volver a consultar
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </main>
    );
  }

  const order = state.order;
  const paymentState = normalizePaymentState(order.estadoPago);
  const copy = PAYMENT_COPY[paymentState];

  return (
    <main className="payment-page">
      <Container>
        <Card className={`payment-card ${copy.className}`}>
          <Card.Body>
            <i className={`bi ${copy.icon} payment-icon`} aria-hidden="true"></i>
            <p className="eyebrow">Estado verificado</p>
            <h1>{copy.title}</h1>
            <p>{copy.description}</p>

            <dl className="payment-details">
              <div>
                <dt>Pedido</dt>
                <dd>{order.numero}</dd>
              </div>
              <div>
                <dt>Referencia</dt>
                <dd>
                  {order.externalReference ||
                    storedOrder.externalReference ||
                    "Sin referencia"}
                </dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{formatCurrency(order.total)}</dd>
              </div>
              <div>
                <dt>Última actualización</dt>
                <dd>{formatDate(order.updatedAt || order.createdAt)}</dd>
              </div>
            </dl>

            {paymentState === "pending" && (
              <Alert variant="info">
                Si el pago se acredita más tarde, podés volver a esta página
                desde este mismo navegador para consultar nuevamente.
              </Alert>
            )}

            <div className="payment-actions">
              {paymentState === "pending" && (
                <Button
                  variant="success"
                  onClick={() => setRequestKey((value) => value + 1)}
                >
                  Consultar estado nuevamente
                </Button>
              )}
              {paymentState !== "approved" && (
                <Button
                  as={Link}
                  to="/carrito"
                  variant={
                    paymentState === "pending" ? "outline-success" : "success"
                  }
                >
                  Volver al carrito
                </Button>
              )}
              <Button as={Link} to="/productos" variant="outline-success">
                Seguir comprando
              </Button>
              <Button
                as="a"
                href={CONTACTO_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="link"
              >
                Necesito ayuda
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </main>
  );
}
