import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Col, Container, Row } from "react-bootstrap";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCarrito } from "../../context/CarritoContext";
import {
  API_URL,
  buildAuthHeaders,
  formatCurrency,
  formatDate,
  isAuthError,
  safeJson,
} from "../../helpers/app";
import {
  CHECKOUT_PEDIDO_STORAGE_KEY,
  guardarStorageJson,
  leerStorageJson,
} from "../../helpers/checkout";

const ESTADOS = {
  "/pago-exitoso": {
    icon: "bi-check2-circle",
    iconClass: "text-success",
    badge: "Pago aprobado",
    badgeClass: "success",
    title: "Pago confirmado",
    description:
      "Tu pedido fue enviado a Mercado Pago correctamente y ya registramos la compra en EL JARDIN DE LUNA.",
  },
  "/pago-pendiente": {
    icon: "bi-hourglass-split",
    iconClass: "text-warning",
    badge: "Pago pendiente",
    badgeClass: "warning",
    title: "Estamos esperando la acreditacion",
    description:
      "Tu pedido fue creado y el pago quedo pendiente. Te recomendamos guardar este resumen para seguirlo desde admin.",
  },
};

function PagoEstado() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { token, logout } = useAuth();
  const { vaciarCarrito } = useCarrito();
  const sincronizadoRef = useRef(false);
  const [estadoSincronizacion, setEstadoSincronizacion] = useState("idle");

  const estadoActual = ESTADOS[location.pathname] || ESTADOS["/pago-pendiente"];

  const pedidoGuardado = useMemo(
    () => leerStorageJson(CHECKOUT_PEDIDO_STORAGE_KEY, null),
    [],
  );

  const paymentId =
    searchParams.get("payment_id") || searchParams.get("collection_id") || "";
  const paymentStatus =
    searchParams.get("status") ||
    searchParams.get("collection_status") ||
    (location.pathname === "/pago-exitoso" ? "approved" : "pending");
  const preferenceId =
    searchParams.get("preference_id") || pedidoGuardado?.preferenceId || "";

  useEffect(() => {
    if (!pedidoGuardado?.pedidoId) return;

    guardarStorageJson(CHECKOUT_PEDIDO_STORAGE_KEY, {
      ...pedidoGuardado,
      preferenceId: preferenceId || pedidoGuardado.preferenceId || null,
      paymentId: paymentId || pedidoGuardado.paymentId || null,
      estadoPago: paymentStatus || pedidoGuardado.estadoPago || "pending",
      esRecuperableCheckout: paymentStatus !== "approved",
    });
  }, [paymentId, paymentStatus, pedidoGuardado, preferenceId]);

  useEffect(() => {
    vaciarCarrito();
  }, [vaciarCarrito]);

  useEffect(() => {
    if (!token || !preferenceId || !paymentId || sincronizadoRef.current) return;

    sincronizadoRef.current = true;
    let desmontado = false;

    const sincronizarPago = async () => {
      try {
        setEstadoSincronizacion("loading");

        const response = await fetch(`${API_URL}/pagos/resultado`, {
          method: "PATCH",
          headers: buildAuthHeaders(token, {
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            preferenceId,
            paymentId: paymentId || undefined,
            status: paymentStatus,
          }),
        });

        const data = await safeJson(response);

        if (isAuthError(response, data)) {
          logout();
          throw new Error(data?.mensaje || "La sesion ya no es valida.");
        }

        if (!response.ok) {
          throw new Error(data?.mensaje || "No se pudo sincronizar el pago.");
        }

        if (!desmontado) {
          setEstadoSincronizacion("success");
        }
      } catch (error) {
        console.error("Error al sincronizar el resultado del pago:", error);

        if (!desmontado) {
          setEstadoSincronizacion("error");
        }
      }
    };

    void sincronizarPago();

    return () => {
      desmontado = true;
    };
  }, [logout, paymentId, paymentStatus, preferenceId, token]);

  return (
    <section className="py-5 bg-light min-vh-100 d-flex align-items-center">
      <Container>
        <Row className="justify-content-center">
          <Col lg={8} xl={7}>
            <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className={`display-2 mb-3 ${estadoActual.iconClass}`}>
                    <i className={`bi ${estadoActual.icon}`}></i>
                  </div>

                  <span className={`badge text-bg-${estadoActual.badgeClass} px-3 py-2 mb-3`}>
                    {estadoActual.badge}
                  </span>

                  <h1 className="fw-bold mb-3">{estadoActual.title}</h1>
                  <p className="text-muted mb-0">{estadoActual.description}</p>
                </div>

                {estadoSincronizacion === "loading" && (
                  <Alert variant="info" className="rounded-4">
                    Estamos sincronizando el resultado del pago con tu panel de pedidos.
                  </Alert>
                )}

                {estadoSincronizacion === "success" && (
                  <Alert variant="success" className="rounded-4">
                    El estado del pedido ya quedo actualizado en el sistema.
                  </Alert>
                )}

                {estadoSincronizacion === "error" && (
                  <Alert variant="warning" className="rounded-4">
                    No pudimos confirmar el estado automaticamente. Si hace falta, puedes
                    revisarlo luego desde admin.
                  </Alert>
                )}

                <div className="rounded-4 border p-4 bg-white">
                  <Row className="g-3">
                    <Col md={6}>
                      <small className="text-muted d-block mb-1">Pedido</small>
                      <div className="fw-bold">
                        {pedidoGuardado?.pedidoId
                          ? `#${String(pedidoGuardado.pedidoId).slice(-6).toUpperCase()}`
                          : "Pendiente de identificacion"}
                      </div>
                    </Col>

                    <Col md={6}>
                      <small className="text-muted d-block mb-1">Fecha</small>
                      <div className="fw-bold">
                        {formatDate(pedidoGuardado?.createdAt, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </Col>

                    <Col md={6}>
                      <small className="text-muted d-block mb-1">Estado MP</small>
                      <div className="fw-bold text-capitalize">{paymentStatus}</div>
                    </Col>

                    <Col md={6}>
                      <small className="text-muted d-block mb-1">Payment ID</small>
                      <div className="fw-bold">{paymentId || "-"}</div>
                    </Col>

                    <Col md={6}>
                      <small className="text-muted d-block mb-1">Items</small>
                      <div className="fw-bold">
                        {pedidoGuardado?.cantidadTotal ?? 0} producto(s)
                      </div>
                    </Col>

                    <Col md={6}>
                      <small className="text-muted d-block mb-1">Total</small>
                      <div className="fw-bold">
                        {formatCurrency(pedidoGuardado?.total || 0)}
                      </div>
                    </Col>

                    <Col xs={12}>
                      <small className="text-muted d-block mb-1">Envio</small>
                      <div className="fw-semibold">
                        {pedidoGuardado?.envio
                          ? `${pedidoGuardado.envio.domicilio}, ${pedidoGuardado.envio.ciudad}, ${pedidoGuardado.envio.provincia} (${pedidoGuardado.envio.codigoPostal})`
                          : "No encontramos una direccion guardada para este pedido."}
                      </div>
                    </Col>
                  </Row>
                </div>

                <div className="d-flex flex-column flex-md-row gap-3 justify-content-center mt-4">
                  <Button as={Link} to="/productos" variant="success" className="rounded-pill px-4">
                    Seguir comprando
                  </Button>
                  <Button as={Link} to="/" variant="outline-dark" className="rounded-pill px-4">
                    Volver al inicio
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

export default PagoEstado;
