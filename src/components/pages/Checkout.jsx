import { useRef, useState } from "react";
import { Alert, Button, Col, Container, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { Link, Navigate } from "react-router-dom";
import { useCarrito } from "../../context/CarritoContext";
import { apiRequest, getSafeErrorMessage } from "../../helpers/api";
import { cartSubtotal } from "../../helpers/cart";
import {
  calcularTotalesCheckout,
  TERMINAL_CHECKOUT_ERROR_CODES,
  totalesCoinciden,
} from "../../helpers/checkout";
import {
  normalizeCheckoutPayload,
  validateCheckout,
} from "../../helpers/checkoutValidation";
import { formatCurrency } from "../../helpers/format";
import {
  clearCheckoutAttemptKey,
  getCheckoutAttemptKey,
  saveLastOrder,
} from "../../helpers/order";
import { redirectToPaymentProvider } from "../../helpers/payment";
import { useCheckoutConfiguration } from "../../hooks/useCheckoutConfiguration";

const cartFingerprint = (cart) =>
  JSON.stringify(
    cart.map(({ id, quantity, price, stock }) => ({
      id,
      quantity,
      price,
      stock,
    })),
  );

const getSafeCheckoutUrl = (value) => {
  try {
    const url = new URL(value);
    const isMercadoPago =
      url.hostname === "mercadopago.com.ar" ||
      url.hostname.endsWith(".mercadopago.com.ar");

    return url.protocol === "https:" && isMercadoPago ? url.href : "";
  } catch {
    return "";
  }
};

const fieldErrorProps = (error, errorId) => ({
  "aria-invalid": Boolean(error),
  "aria-describedby": error ? errorId : undefined,
});

function FieldError({ error, id }) {
  return error ? (
    <div id={id} className="invalid-feedback d-block" role="alert">
      {error.message}
    </div>
  ) : null;
}

export default function Checkout() {
  const { carrito, subtotal, reconciliar } = useCarrito();
  const [submitError, setSubmitError] = useState("");
  const [createdCheckout, setCreatedCheckout] = useState(null);
  const submittingRef = useRef(false);
  const {
    status: configurationStatus,
    configuration,
    error: configurationError,
    retry: retryConfiguration,
  } = useCheckoutConfiguration({ enabled: carrito.length > 0 });
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      metodo: "domicilio",
      provincia: "",
      localidad: "",
      codigoPostal: "",
      direccion: "",
      aclaraciones: "",
    },
  });
  const deliveryMethod = watch("metodo");
  const displayedTotals = calcularTotalesCheckout(
    subtotal,
    deliveryMethod,
    configuration,
  );

  if (!carrito.length) return <Navigate to="/carrito" replace />;

  const submit = async (values) => {
    if (submittingRef.current) return;
    setSubmitError("");
    clearErrors();

    if (configurationStatus !== "success") {
      setSubmitError(
        "Esperá a que podamos calcular las opciones de entrega antes de continuar.",
      );
      return;
    }

    if (values.metodo === "retiro" && !configuration.retiroDisponible) {
      setError(
        "metodo",
        {
          type: "validate",
          message: "El retiro no está disponible en este momento.",
        },
        { shouldFocus: true },
      );
      return;
    }

    const validationErrors = validateCheckout(values);
    if (Object.keys(validationErrors).length) {
      Object.entries(validationErrors).forEach(([field, message], index) => {
        setError(
          field,
          { type: "validate", message },
          { shouldFocus: index === 0 },
        );
      });
      return;
    }

    submittingRef.current = true;

    try {
      const reconciled = await reconciliar();
      if (cartFingerprint(reconciled) !== cartFingerprint(carrito)) {
        setSubmitError(
          "Actualizamos el carrito porque cambió el stock o el precio. Revisalo antes de continuar.",
        );
        return;
      }

      const submittedTotals = calcularTotalesCheckout(
        cartSubtotal(reconciled),
        values.metodo,
        configuration,
      );
      const data = await apiRequest("/checkout/mercadopago", {
        method: "POST",
        idempotencyKey: getCheckoutAttemptKey(),
        json: normalizeCheckoutPayload(values, reconciled),
      });
      const order = data?.pedido;
      const checkoutUrl = getSafeCheckoutUrl(data?.pago?.checkoutUrl);

      if (!checkoutUrl) {
        throw new Error("La API no devolvió un enlace seguro de Mercado Pago.");
      }

      if (
        !order?.numero ||
        !data?.orderToken ||
        !saveLastOrder({
          numero: order.numero,
          orderToken: data.orderToken,
          externalReference: order.externalReference,
          items: reconciled.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        })
      ) {
        throw new Error("No pudimos guardar la referencia segura del pedido.");
      }

      setCreatedCheckout({
        checkoutUrl,
        order,
        totalsChanged: !totalesCoinciden(submittedTotals, order),
      });
    } catch (error) {
      if (TERMINAL_CHECKOUT_ERROR_CODES.has(error?.code)) {
        clearCheckoutAttemptKey();
      }
      setSubmitError(
        error instanceof Error &&
          (error.message.startsWith("La API") ||
            error.message.startsWith("No pudimos guardar"))
          ? error.message
          : getSafeErrorMessage(error),
      );
    } finally {
      submittingRef.current = false;
    }
  };

  if (createdCheckout) {
    const order = createdCheckout.order;

    return (
      <main className="payment-page">
        <Container>
          <div className="checkout-confirmation">
            <p className="eyebrow">Pedido preparado</p>
            <h1>Revisá el total antes de pagar</h1>
            <p>
              Tu pedido <strong>{order.numero}</strong> está listo para continuar
              en Mercado Pago.
            </p>
            {createdCheckout.totalsChanged && (
              <Alert variant="warning">
                El total cambió al validar stock o entrega. No te redirigimos
                automáticamente para que puedas revisarlo.
              </Alert>
            )}
            <dl className="confirmation-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatCurrency(order.subtotal)}</dd>
              </div>
              <div>
                <dt>Entrega</dt>
                <dd>{formatCurrency(order.costoEnvio)}</dd>
              </div>
              <div>
                <dt>Total definitivo</dt>
                <dd>{formatCurrency(order.total)}</dd>
              </div>
            </dl>
            <Button
              variant="success"
              size="lg"
              onClick={() =>
                redirectToPaymentProvider(createdCheckout.checkoutUrl)
              }
            >
              Pagar {formatCurrency(order.total)} en Mercado Pago
            </Button>
            <p className="summary-note mt-3 mb-0">
              Tu carrito se conserva hasta que el backend confirme el pago.
            </p>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="store-page">
      <Container>
        <header className="page-heading compact">
          <p className="eyebrow">Compra como invitado</p>
          <h1>Checkout</h1>
          <p>No necesitás registrarte. Usamos estos datos para gestionar tu pedido.</p>
        </header>

        <Form noValidate onSubmit={handleSubmit(submit)}>
          <Row className="g-4 align-items-start">
            <Col lg={8}>
              <section className="checkout-panel" aria-labelledby="contact-title">
                <h2 id="contact-title">Datos de contacto</h2>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group controlId="checkout-name">
                      <Form.Label>Nombre</Form.Label>
                      <Form.Control
                        autoComplete="given-name"
                        maxLength={50}
                        isInvalid={Boolean(errors.nombre)}
                        required
                        {...fieldErrorProps(
                          errors.nombre,
                          "checkout-name-error",
                        )}
                        {...register("nombre")}
                      />
                      <FieldError
                        error={errors.nombre}
                        id="checkout-name-error"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="checkout-lastname">
                      <Form.Label>Apellido</Form.Label>
                      <Form.Control
                        autoComplete="family-name"
                        maxLength={50}
                        isInvalid={Boolean(errors.apellido)}
                        required
                        {...fieldErrorProps(
                          errors.apellido,
                          "checkout-lastname-error",
                        )}
                        {...register("apellido")}
                      />
                      <FieldError
                        error={errors.apellido}
                        id="checkout-lastname-error"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="checkout-phone">
                      <Form.Label>Teléfono</Form.Label>
                      <Form.Control
                        type="tel"
                        autoComplete="tel"
                        isInvalid={Boolean(errors.telefono)}
                        required
                        {...fieldErrorProps(
                          errors.telefono,
                          "checkout-phone-error",
                        )}
                        {...register("telefono")}
                      />
                      <FieldError
                        error={errors.telefono}
                        id="checkout-phone-error"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="checkout-email">
                      <Form.Label>Correo electrónico</Form.Label>
                      <Form.Control
                        type="email"
                        autoComplete="email"
                        isInvalid={Boolean(errors.email)}
                        required
                        {...fieldErrorProps(
                          errors.email,
                          "checkout-email-error",
                        )}
                        {...register("email")}
                      />
                      <FieldError
                        error={errors.email}
                        id="checkout-email-error"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </section>

              <section className="checkout-panel" aria-labelledby="delivery-title">
                <h2 id="delivery-title">Entrega</h2>
                <div className="delivery-options">
                  <Form.Check
                    type="radio"
                    id="delivery-home"
                    value="domicilio"
                    label="Envío a domicilio"
                    required
                    {...fieldErrorProps(
                      errors.metodo,
                      "checkout-method-error",
                    )}
                    {...register("metodo")}
                  />
                  {configuration?.retiroDisponible && (
                    <Form.Check
                      type="radio"
                      id="delivery-pickup"
                      value="retiro"
                      label="Retiro coordinado"
                      required
                      {...fieldErrorProps(
                        errors.metodo,
                        "checkout-method-error",
                      )}
                      {...register("metodo")}
                    />
                  )}
                </div>
                <FieldError
                  error={errors.metodo}
                  id="checkout-method-error"
                />

                {deliveryMethod === "domicilio" && (
                  <Row className="g-3 mt-1">
                    <Col md={6}>
                      <Form.Group controlId="checkout-province">
                        <Form.Label>Provincia</Form.Label>
                        <Form.Control
                          autoComplete="address-level1"
                          isInvalid={Boolean(errors.provincia)}
                          required
                          {...fieldErrorProps(
                            errors.provincia,
                            "checkout-province-error",
                          )}
                          {...register("provincia")}
                        />
                        <FieldError
                          error={errors.provincia}
                          id="checkout-province-error"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="checkout-city">
                        <Form.Label>Localidad</Form.Label>
                        <Form.Control
                          autoComplete="address-level2"
                          isInvalid={Boolean(errors.localidad)}
                          required
                          {...fieldErrorProps(
                            errors.localidad,
                            "checkout-city-error",
                          )}
                          {...register("localidad")}
                        />
                        <FieldError
                          error={errors.localidad}
                          id="checkout-city-error"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId="checkout-postal-code">
                        <Form.Label>Código postal</Form.Label>
                        <Form.Control
                          autoComplete="postal-code"
                          isInvalid={Boolean(errors.codigoPostal)}
                          required
                          {...fieldErrorProps(
                            errors.codigoPostal,
                            "checkout-postal-code-error",
                          )}
                          {...register("codigoPostal")}
                        />
                        <FieldError
                          error={errors.codigoPostal}
                          id="checkout-postal-code-error"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Form.Group controlId="checkout-address">
                        <Form.Label>Dirección</Form.Label>
                        <Form.Control
                          autoComplete="street-address"
                          isInvalid={Boolean(errors.direccion)}
                          required
                          {...fieldErrorProps(
                            errors.direccion,
                            "checkout-address-error",
                          )}
                          {...register("direccion")}
                        />
                        <FieldError
                          error={errors.direccion}
                          id="checkout-address-error"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                <Form.Group controlId="checkout-notes" className="mt-3">
                  <Form.Label>Aclaraciones (opcional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    maxLength={300}
                    isInvalid={Boolean(errors.aclaraciones)}
                    {...fieldErrorProps(
                      errors.aclaraciones,
                      "checkout-notes-error",
                    )}
                    {...register("aclaraciones")}
                  />
                  <FieldError
                    error={errors.aclaraciones}
                    id="checkout-notes-error"
                  />
                </Form.Group>
              </section>
            </Col>

            <Col lg={4}>
              <aside className="order-summary">
                <h2>Tu pedido</h2>
                <ul className="checkout-items">
                  {carrito.map((item) => (
                    <li key={item.id}>
                      <span>
                        {item.quantity} × {item.name}
                      </span>
                      <strong>
                        {formatCurrency(item.price * item.quantity)}
                      </strong>
                    </li>
                  ))}
                </ul>
                <div className="summary-row">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(displayedTotals.subtotal)}</strong>
                </div>
                {configurationStatus === "success" ? (
                  <>
                    <div className="summary-row">
                      <span>
                        {deliveryMethod === "retiro"
                          ? "Retiro coordinado"
                          : "Envío a domicilio"}
                      </span>
                      <strong>
                        {formatCurrency(displayedTotals.costoEnvio)}
                      </strong>
                    </div>
                    <div className="summary-row summary-total">
                      <span>Total</span>
                      <strong>{formatCurrency(displayedTotals.total)}</strong>
                    </div>
                  </>
                ) : configurationStatus === "loading" ? (
                  <p className="summary-note">Calculando la entrega…</p>
                ) : (
                  <Alert variant="warning">
                    {configurationError}
                    <Button variant="link" onClick={retryConfiguration}>
                      Reintentar
                    </Button>
                  </Alert>
                )}
                <p className="summary-note">
                  El backend vuelve a confirmar estos importes al crear el
                  pedido.
                </p>
                {submitError && (
                  <Alert variant="danger" role="alert">
                    {submitError}
                  </Alert>
                )}
                <Button
                  type="submit"
                  variant="success"
                  size="lg"
                  className="w-100"
                  disabled={isSubmitting || configurationStatus !== "success"}
                >
                  {isSubmitting ? "Creando pedido…" : "Continuar a Mercado Pago"}
                </Button>
                <p className="checkout-legal">
                  Al continuar aceptás los{" "}
                  <Link to="/terminos-y-condiciones">términos y condiciones</Link>{" "}
                  y la <Link to="/privacidad">política de privacidad</Link>.
                </p>
              </aside>
            </Col>
          </Row>
        </Form>
      </Container>
    </main>
  );
}
