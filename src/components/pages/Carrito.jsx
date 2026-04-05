import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import { useCarrito } from "../../context/CarritoContext";
import {
  API_URL,
  buildAuthHeaders,
  formatCurrency,
  getApiErrorMessage,
  isAuthError,
  safeJson,
} from "../../helpers/app";
import { mostrarLoginRequeridoCarrito } from "../../helpers/carrito";
import {
  CHECKOUT_ENVIO_STORAGE_KEY,
  CHECKOUT_PEDIDO_STORAGE_KEY,
  guardarStorageJson,
  leerStorageJson,
  obtenerCheckoutUrl,
  obtenerProductoId,
} from "../../helpers/checkout";
import {
  validateCiudad,
  validateCodigoPostal,
  validateDomicilio,
  validateProvincia,
  validateTelefono,
} from "../../helpers/validation";
import "../../styles/carrito.css";

const ENVIO_INICIAL = {
  provincia: "",
  ciudad: "",
  domicilio: "",
  celular: "",
  entreCalles: "",
  referencia: "",
  codigoPostal: "",
};
const ENVIO_FIJO = 15000;
const ENVIO_GRATIS_DESDE = 60000;
const normalizePhone = (value) => String(value || "").replace(/\D/g, "");

const validateDomicilioCompleto = (value) => {
  const validation = validateDomicilio(value);
  return validation.replaceAll("domicilio", "domicilio completo");
};

const validateCelularEntrega = (value) => {
  const validation = validateTelefono(normalizePhone(value));
  return validation.replaceAll("telefono", "celular");
};

const validateTextoOpcional = (value, label, maxLength) => {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) return "";
  if (normalizedValue.length > maxLength) {
    return `${label} no debe superar los ${maxLength} caracteres`;
  }

  return "";
};

function CarritoItem({
  item,
  onIncrementar,
  onDecrementar,
  onEliminar,
}) {
  return (
    <div className="carrito-item-row">
      <div className="carrito-item-img-wrapper">
        <img
          src={item.imagenUrl || "https://placehold.co/150x150?text=Sin+Imagen"}
          alt={item.nombre}
          className="carrito-item-img rounded"
        />
      </div>

      <div className="carrito-item-info">
        <small className="text-muted text-uppercase fw-bold d-block mb-1">
          {item.categoria}
        </small>
        <p className="carrito-item-name mb-0">{item.nombre}</p>

        <div className="d-flex align-items-center mt-3">
          <div className="carrito-qty-group">
            <button
              type="button"
              className="btn-qty-mini"
              aria-label={`Quitar una unidad de ${item.nombre}`}
              onClick={() => onDecrementar(obtenerProductoId(item))}
            >
              -
            </button>
            <span className="px-2 fw-bold">{item.cantidad}</span>
            <button
              type="button"
              className="btn-qty-mini"
              aria-label={`Agregar una unidad de ${item.nombre}`}
              onClick={() => onIncrementar(item)}
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="btn-trash"
            aria-label={`Eliminar ${item.nombre} del carrito`}
            onClick={() => onEliminar(obtenerProductoId(item))}
          >
            <i className="bi bi-trash3"></i>
          </button>
        </div>
      </div>

      <div className="carrito-item-price text-end">
        {formatCurrency(item.precio * item.cantidad)}
      </div>
    </div>
  );
}

const Carrito = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const {
    carrito,
    agregarAlCarrito,
    restarDelCarrito,
    eliminarDelCarrito,
    vaciarCarrito,
    cantidadTotal,
    normalizarCarritoConCatalogo,
  } = useCarrito();

  const [envio, setEnvio] = useState(() =>
    ({
      ...ENVIO_INICIAL,
      ...leerStorageJson(CHECKOUT_ENVIO_STORAGE_KEY, {}),
    }),
  );
  const [erroresEnvio, setErroresEnvio] = useState({});
  const [touchedEnvio, setTouchedEnvio] = useState({});
  const [procesandoPago, setProcesandoPago] = useState(false);

  useEffect(() => {
    guardarStorageJson(CHECKOUT_ENVIO_STORAGE_KEY, envio);
  }, [envio]);

  const subtotal = useMemo(
    () => carrito.reduce((acumulado, item) => acumulado + item.cantidad * item.precio, 0),
    [carrito],
  );

  const envioCompleto = useMemo(
    () =>
      [
        envio.provincia,
        envio.ciudad,
        envio.domicilio,
        envio.celular,
        envio.codigoPostal,
      ].every((valor) => typeof valor === "string" && valor.trim().length > 0),
    [envio],
  );
  const envioValido = useMemo(
    () =>
      ![
        validarCampoEnvio("provincia", envio.provincia),
        validarCampoEnvio("ciudad", envio.ciudad),
        validarCampoEnvio("domicilio", envio.domicilio),
        validarCampoEnvio("celular", envio.celular),
        validarCampoEnvio("entreCalles", envio.entreCalles),
        validarCampoEnvio("referencia", envio.referencia),
        validarCampoEnvio("codigoPostal", envio.codigoPostal),
      ].some(Boolean),
    [envio],
  );
  const envioEsGratis = carrito.length > 0 && subtotal >= ENVIO_GRATIS_DESDE;
  const costoEnvio = carrito.length > 0 ? (envioEsGratis ? 0 : ENVIO_FIJO) : 0;
  const totalFinal = subtotal + costoEnvio;
  const faltanteEnvioGratis = Math.max(ENVIO_GRATIS_DESDE - subtotal, 0);

  function validarCampoEnvio(name, value) {
    switch (name) {
      case "provincia":
        return validateProvincia(value);
      case "ciudad":
        return validateCiudad(value);
      case "domicilio":
        return validateDomicilioCompleto(value);
      case "celular":
        return validateCelularEntrega(value);
      case "entreCalles":
        return validateTextoOpcional(value, "Entre calles", 120);
      case "referencia":
        return validateTextoOpcional(value, "La referencia", 180);
      case "codigoPostal":
        return validateCodigoPostal(value);
      default:
        return "";
    }
  }

  const validarEnvio = () => {
    const nuevosErrores = {
      provincia: validarCampoEnvio("provincia", envio.provincia),
      ciudad: validarCampoEnvio("ciudad", envio.ciudad),
      domicilio: validarCampoEnvio("domicilio", envio.domicilio),
      celular: validarCampoEnvio("celular", envio.celular),
      entreCalles: validarCampoEnvio("entreCalles", envio.entreCalles),
      referencia: validarCampoEnvio("referencia", envio.referencia),
      codigoPostal: validarCampoEnvio("codigoPostal", envio.codigoPostal),
    };

    setErroresEnvio(nuevosErrores);
    setTouchedEnvio({
      provincia: true,
      ciudad: true,
      domicilio: true,
      celular: true,
      entreCalles: true,
      referencia: true,
      codigoPostal: true,
    });

    return !Object.values(nuevosErrores).some(Boolean);
  };

  const handleEnvioChange = (event) => {
    const { name, value } = event.target;
    const nextEnvio = {
      ...envio,
      [name]: value,
    };

    setEnvio((prevEnvio) => ({
      ...prevEnvio,
      [name]: value,
    }));

    if (touchedEnvio[name]) {
      setErroresEnvio((prevErrores) => ({
        ...prevErrores,
        [name]: validarCampoEnvio(name, nextEnvio[name]),
      }));
    }
  };

  const handleEnvioBlur = (event) => {
    const { name, value } = event.target;

    setTouchedEnvio((prev) => ({
      ...prev,
      [name]: true,
    }));
    setErroresEnvio((prev) => ({
      ...prev,
      [name]: validarCampoEnvio(name, value),
    }));
  };

  const handlePagar = async () => {
    if (carrito.length === 0) return;

    if (!token || !user) {
      await Swal.fire({
        title: "Inicia sesion para continuar",
        text: "Necesitamos una cuenta activa para crear tu pedido y enviarte a Mercado Pago.",
        icon: "info",
        confirmButtonText: "Entendido",
      });
      return;
    }

    if (!validarEnvio()) {
      await Swal.fire({
        title: "Faltan datos de envio",
        text: "Completa provincia, ciudad, domicilio completo, celular y codigo postal antes de pagar.",
        icon: "warning",
        confirmButtonText: "Revisar",
      });
      return;
    }

    try {
      setProcesandoPago(true);
      const carritoCheckout = await normalizarCarritoConCatalogo(carrito);

      if (carritoCheckout.length === 0) {
        throw new Error(
          "Los productos de tu carrito ya no estan disponibles. Agregalos nuevamente desde el catalogo.",
        );
      }

      Swal.fire({
        title: "Preparando tu checkout",
        text: "Estamos creando el pedido y conectando Mercado Pago.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const pedidoPayload = {
        productos: carritoCheckout.map((item) => ({
          producto: obtenerProductoId(item),
          cantidad: item.cantidad,
        })),
        envio: {
          provincia: envio.provincia.trim(),
          ciudad: envio.ciudad.trim(),
          domicilio: envio.domicilio.trim(),
          celular: normalizePhone(envio.celular),
          entreCalles: envio.entreCalles.trim(),
          referencia: envio.referencia.trim(),
          codigoPostal: envio.codigoPostal.trim(),
        },
      };

      const pedidoResponse = await fetch(`${API_URL}/pedidos`, {
        method: "POST",
        headers: buildAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(pedidoPayload),
      });

      const pedidoData = await safeJson(pedidoResponse);

      if (isAuthError(pedidoResponse, pedidoData)) {
        logout();
        throw new Error("Tu sesion vencio. Vuelve a ingresar antes de continuar.");
      }

      if (!pedidoResponse.ok) {
        throw new Error(getApiErrorMessage(pedidoData, "No se pudo crear el pedido."));
      }

      const pedidoId = pedidoData?.pedidoId;

      if (!pedidoId) {
        throw new Error("No recibimos un ID de pedido valido.");
      }

      const checkoutResponse = await fetch(`${API_URL}/pagos/checkout`, {
        method: "POST",
        headers: buildAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ pedidoId }),
      });

      const checkoutData = await safeJson(checkoutResponse);

      if (isAuthError(checkoutResponse, checkoutData)) {
        logout();
        throw new Error("Tu sesion vencio. Ingresa nuevamente y reintenta el pago.");
      }

      if (!checkoutResponse.ok) {
        throw new Error(
          getApiErrorMessage(
            checkoutData,
            "No se pudo iniciar el checkout de Mercado Pago.",
          ),
        );
      }

      const checkoutUrl = obtenerCheckoutUrl(checkoutData);

      if (!checkoutUrl) {
        throw new Error("Mercado Pago no devolvio una URL de checkout valida.");
      }

      guardarStorageJson(CHECKOUT_PEDIDO_STORAGE_KEY, {
        pedidoId,
        preferenceId: checkoutData?.id || null,
        createdAt: new Date().toISOString(),
        subtotal: Number(pedidoData?.subtotal || subtotal),
        total: Number(pedidoData?.total || totalFinal),
        cantidadTotal: carritoCheckout.reduce(
          (acumulado, item) => acumulado + Number(item.cantidad || 0),
          0,
        ),
        envio: pedidoData?.envio || {
          ...pedidoPayload.envio,
          proveedor: "Envio nacional",
          costo: costoEnvio,
          esGratis: envioEsGratis,
        },
        productos: carritoCheckout.map((item) => ({
          id: obtenerProductoId(item),
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio: item.precio,
        })),
      });

      Swal.close();
      window.location.assign(checkoutUrl);
    } catch (error) {
      console.error("Error Mercado Pago:", error);
      Swal.close();
      await Swal.fire({
        title: "No pudimos iniciar el pago",
        text: error.message || "Hubo un problema al conectar con Mercado Pago.",
        icon: "error",
        confirmButtonText: "Cerrar",
      });
    } finally {
      setProcesandoPago(false);
    }
  };

  const handleIncrementarItem = (item) => {
    const agregado = agregarAlCarrito(item);

    if (!agregado) {
      void mostrarLoginRequeridoCarrito();
    }
  };

  return (
    <section className="py-5 bg-light min-vh-100 carrito-page">
      <Container className="carrito-container">
        <div className="mb-4">
          <Button
            variant="link"
            onClick={() => navigate(-1)}
            className="btn-back text-decoration-none"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Seguir comprando
          </Button>

          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mt-3">
            <div>
              <h1 className="fw-bold display-5 mb-2">Tu seleccion</h1>
              <p className="text-muted mb-0">
                Completa tu direccion de entrega y te llevamos a Mercado Pago para finalizar.
              </p>
            </div>

          </div>
        </div>

        <Alert
          variant={envioEsGratis ? "success" : "secondary"}
          className="rounded-4 border-0 shadow-sm"
        >
          {envioEsGratis ? (
            <>
              <strong>Ya tienes envio gratis.</strong>
              {" "}
              Superaste los
              {" "}
              {formatCurrency(ENVIO_GRATIS_DESDE)}
              {" "}
              en tu compra.
            </>
          ) : (
            <>
              <strong>Envios a todo el pais.</strong>
              {" "}
              El envio cuesta
              {" "}
              {formatCurrency(ENVIO_FIJO)}
              {" "}
              o es gratis desde
              {" "}
              {formatCurrency(ENVIO_GRATIS_DESDE)}
              .
              {carrito.length > 0 && (
                <>
                  {" "}
                  Te faltan
                  {" "}
                  <strong>{formatCurrency(faltanteEnvioGratis)}</strong>
                  {" "}
                  para bonificarlo.
                </>
              )}
            </>
          )}
        </Alert>

        <Row className="g-4">
          <Col lg={8}>
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-0">
                <div className="checkout-card-header p-4 pb-3">
                  <div className="checkout-step-badge">1</div>
                  <div>
                    <h5 className="fw-bold mb-1">Carrito</h5>
                    <p className="text-muted mb-0">
                      Revisa los productos que vas a llevar antes de continuar.
                    </p>
                  </div>
                </div>

                {carrito.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-cart-x display-1 text-muted opacity-25"></i>
                    <h4 className="mt-3 text-muted">Tu carrito esta vacio</h4>
                    <Button
                      variant="success"
                      className="mt-3 rounded-pill"
                      onClick={() => navigate("/productos")}
                    >
                      Ir a la tienda
                    </Button>
                  </div>
                ) : (
                  <>
                    {carrito.map((item) => (
                      <CarritoItem
                        key={obtenerProductoId(item)}
                        item={item}
                        onIncrementar={handleIncrementarItem}
                        onDecrementar={restarDelCarrito}
                        onEliminar={eliminarDelCarrito}
                      />
                    ))}

                    <div className="p-3 text-end">
                      <Button
                        variant="link"
                        className="btn-empty text-decoration-none"
                        onClick={vaciarCarrito}
                      >
                        <i className="bi bi-x-circle"></i>
                        Vaciar todo el carrito
                      </Button>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm rounded-4 mt-4">
              <Card.Body className="p-4">
                <div className="checkout-card-header mb-4">
                  <div className="checkout-step-badge">2</div>
                  <div>
                    <h5 className="fw-bold mb-1">Direccion de entrega</h5>
                    <p className="text-muted mb-0">
                      Usaremos estos datos para registrar tu pedido y coordinar
                      el envio a todo el pais con tarifa fija o gratis segun el total.
                    </p>
                  </div>
                </div>

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

                  <Badge bg={token ? "success" : "secondary"} pill className="px-3 py-2">
                    {token ? "Sesion activa" : "Necesitas login"}
                  </Badge>
                </div>

                {!token && (
                  <Alert variant="warning" className="rounded-4">
                    Inicia sesion desde el menu para habilitar el checkout con
                    Mercado Pago.
                  </Alert>
                )}

                <Alert variant={envioEsGratis ? "success" : "secondary"} className="rounded-4">
                  {envioEsGratis ? (
                    <>
                      Envio nacional bonificado por superar
                      {" "}
                      <strong>{formatCurrency(ENVIO_GRATIS_DESDE)}</strong>
                    </>
                  ) : (
                    <>
                      Envio fijo nacional:
                      {" "}
                      <strong>{formatCurrency(ENVIO_FIJO)}</strong>
                    </>
                  )}
                </Alert>

                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Provincia</Form.Label>
                      <Form.Control
                        type="text"
                        name="provincia"
                        maxLength={80}
                        value={envio.provincia}
                        onChange={handleEnvioChange}
                        onBlur={handleEnvioBlur}
                        placeholder="Buenos Aires"
                        isInvalid={Boolean(erroresEnvio.provincia)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {erroresEnvio.provincia}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Ciudad</Form.Label>
                      <Form.Control
                        type="text"
                        name="ciudad"
                        maxLength={80}
                        value={envio.ciudad}
                        onChange={handleEnvioChange}
                        onBlur={handleEnvioBlur}
                        placeholder="La Plata"
                        isInvalid={Boolean(erroresEnvio.ciudad)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {erroresEnvio.ciudad}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>Domicilio Completo</Form.Label>
                      <Form.Control
                        type="text"
                        name="domicilio"
                        maxLength={150}
                        value={envio.domicilio}
                        onChange={handleEnvioChange}
                        onBlur={handleEnvioBlur}
                        placeholder="Calle, altura, piso y dpto"
                        isInvalid={Boolean(erroresEnvio.domicilio)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {erroresEnvio.domicilio}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Codigo postal</Form.Label>
                      <Form.Control
                        type="text"
                        name="codigoPostal"
                        maxLength={10}
                        value={envio.codigoPostal}
                        onChange={handleEnvioChange}
                        onBlur={handleEnvioBlur}
                        placeholder="1900"
                        isInvalid={Boolean(erroresEnvio.codigoPostal)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {erroresEnvio.codigoPostal}
                      </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Celular</Form.Label>
                      <Form.Control
                        type="text"
                        name="celular"
                        maxLength={18}
                        value={envio.celular}
                        onChange={handleEnvioChange}
                        onBlur={handleEnvioBlur}
                        placeholder="Ej: 11 23456789"
                        isInvalid={Boolean(erroresEnvio.celular)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {erroresEnvio.celular}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Entre Calles</Form.Label>
                      <Form.Control
                        type="text"
                        name="entreCalles"
                        maxLength={120}
                        value={envio.entreCalles}
                        onChange={handleEnvioChange}
                        onBlur={handleEnvioBlur}
                        placeholder="Ej: Santa Fe y Pueyrredon"
                        isInvalid={Boolean(erroresEnvio.entreCalles)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {erroresEnvio.entreCalles}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label>Referencia Opcional</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="referencia"
                        maxLength={180}
                        value={envio.referencia}
                        onChange={handleEnvioChange}
                        onBlur={handleEnvioBlur}
                        placeholder="Ej: porton negro, departamento 2B, casa al fondo"
                        isInvalid={Boolean(erroresEnvio.referencia)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {erroresEnvio.referencia}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <div className="checkout-sidebar">
              <Card className="border-0 shadow-sm rounded-4 checkout-summary-card">
                <Card.Body className="p-4">
                  <div className="checkout-card-header mb-4">
                    <div className="checkout-step-badge">3</div>
                    <div>
                      <h5 className="fw-bold mb-1">Resumen de compra</h5>
                      <p className="text-muted mb-0">
                        Este es el total final con el envio actualizado segun tu compra.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Subtotal ({cantidadTotal} items)</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Envio</span>
                    <span>{envioEsGratis ? "Gratis" : formatCurrency(costoEnvio)}</span>
                  </div>

                  <hr />

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <span className="fs-5 fw-bold">Total</span>
                    <span className="fs-3 fw-bold text-success">
                      {formatCurrency(totalFinal)}
                    </span>
                  </div>
                </Card.Body>
              </Card>

              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">
                  <div className="checkout-card-header mb-4">
                    <div className="checkout-step-badge">4</div>
                    <div>
                      <h5 className="fw-bold mb-1">Forma de pago</h5>
                      <p className="text-muted mb-0">
                        Finaliza la compra con Mercado Pago de forma segura.
                      </p>
                    </div>
                  </div>

                  <div className="checkout-payment-method mb-4">
                    <div className="checkout-payment-icon">
                      <i className="bi bi-credit-card-2-front"></i>
                    </div>
                    <div>
                      <div className="fw-semibold text-dark">Mercado Pago</div>
                      <div className="small text-muted">
                        Paga con tarjeta, dinero en cuenta o medios habilitados por Mercado Pago.
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="success"
                    className="w-100 py-3 rounded-pill fw-bold shadow-sm"
                    size="lg"
                    onClick={handlePagar}
                    disabled={
                      carrito.length === 0 ||
                      !token ||
                      !envioCompleto ||
                      !envioValido ||
                      procesandoPago
                    }
                  >
                    {procesandoPago ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Conectando con Mercado Pago...
                      </>
                    ) : (
                      "Pagar con Mercado Pago"
                    )}
                  </Button>

                  <p className="text-muted small text-center mt-3 mb-0 checkout-payment-note">
                    El pago se procesa en Checkout Pro de Mercado Pago y el pedido
                    queda registrado con
                    {" "}
                    {envioEsGratis
                      ? "envio gratis."
                      : `envio nacional de ${formatCurrency(ENVIO_FIJO)}.`}
                  </p>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Carrito;
