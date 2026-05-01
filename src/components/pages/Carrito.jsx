import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  formatCurrency,
  getApiErrorMessage,
  isAuthError,
  obtenerCategoriaVisible,
} from "../../helpers/app";
import { solicitarApi } from "../../helpers/clienteApi";
import { mostrarLoginRequeridoCarrito } from "../../helpers/carrito";
import {
  CHECKOUT_ENVIO_STORAGE_KEY,
  CHECKOUT_PEDIDO_STORAGE_KEY,
  eliminarStorageItem,
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
  tipo: "andreani_domicilio",
  provincia: "",
  ciudad: "",
  domicilio: "",
  celular: "",
  entreCalles: "",
  referencia: "",
  codigoPostal: "",
  sucursalAndreani: "",
  horarioConveniente: "",
};
const TIPO_ENVIO_ANDREANI_DOMICILIO = "andreani_domicilio";
const TIPO_ENVIO_ANDREANI_SUCURSAL = "andreani_sucursal";
const TIPO_ENVIO_CADETE_LOCAL = "cadete_local";
const COSTO_ENVIO_ANDREANI = Number(import.meta.env.VITE_COSTO_ENVIO_ANDREANI || 9500);
const OPCIONES_ENVIO = [
  {
    tipo: TIPO_ENVIO_ANDREANI_DOMICILIO,
    titulo: "Andreani a domicilio",
    descripcion: "Recibí tu pedido en tu dirección.",
  },
  {
    tipo: TIPO_ENVIO_ANDREANI_SUCURSAL,
    titulo: "Andreani a sucursal",
    descripcion: "Retirá tu pedido en una sucursal Andreani.",
  },
  {
    tipo: TIPO_ENVIO_CADETE_LOCAL,
    titulo: "Acordar con el vendedor",
    descripcion: "Coordinaremos la entrega por WhatsApp.",
  },
];
const METODO_PAGO_MERCADO_PAGO = "mercado_pago";
const METODO_PAGO_TRANSFERENCIA = "transferencia";
const DESCUENTO_TRANSFERENCIA = 0.07;
const normalizePhone = (value) => String(value || "").replace(/\D/g, "");
const normalizeCheckoutText = (value) => String(value || "").trim();
const obtenerCostoEnvio = (tipo) =>
  tipo === TIPO_ENVIO_CADETE_LOCAL ? 0 : COSTO_ENVIO_ANDREANI;
const obtenerTituloEnvio = (tipo) =>
  OPCIONES_ENVIO.find((opcion) => opcion.tipo === tipo)?.titulo ||
  "Andreani a domicilio";
const calcularDescuentoTransferencia = (subtotal, metodoPago) =>
  metodoPago === METODO_PAGO_TRANSFERENCIA
    ? Number((subtotal * DESCUENTO_TRANSFERENCIA).toFixed(2))
    : 0;

const construirEnvioPayload = (envio) => {
  const tipo = envio.tipo || TIPO_ENVIO_ANDREANI_DOMICILIO;
  const referencia = normalizeCheckoutText(envio.referencia);

  if (tipo === TIPO_ENVIO_CADETE_LOCAL) {
    return {
      tipo,
      celular: normalizePhone(envio.celular),
      ...(referencia ? { referencia } : {}),
    };
  }

  return {
    tipo,
    provincia: normalizeCheckoutText(envio.provincia),
    ciudad: normalizeCheckoutText(envio.ciudad),
    domicilio: normalizeCheckoutText(envio.domicilio),
    celular: normalizePhone(envio.celular),
    entreCalles: normalizeCheckoutText(envio.entreCalles),
    referencia,
    codigoPostal: normalizeCheckoutText(envio.codigoPostal),
    sucursalAndreani: normalizeCheckoutText(envio.sucursalAndreani),
    horarioConveniente: normalizeCheckoutText(envio.horarioConveniente),
  };
};

const construirProductosResumen = (carritoCheckout) =>
  carritoCheckout
    .map((item) => ({
      id: String(obtenerProductoId(item) || ""),
      nombre: String(item.nombre || ""),
      cantidad: Number(item.cantidad || 0),
      precio: Number(item.precio || 0),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

const construirCheckoutHash = ({
  userId,
  productos,
  envio,
  metodoPago,
  guardarDatosEnvio,
}) =>
  JSON.stringify({
    userId: String(userId || ""),
    productos: productos.map(({ id, cantidad }) => ({ id, cantidad })),
    envio,
    metodoPago: String(metodoPago || ""),
    guardarDatosEnvio: Boolean(guardarDatosEnvio),
  });

const puedeReutilizarPedidoGuardado = ({ pedidoGuardado, userId, checkoutHash }) =>
  Boolean(
    pedidoGuardado?.pedidoId &&
      pedidoGuardado?.checkoutHash &&
      pedidoGuardado.checkoutHash === checkoutHash &&
      String(pedidoGuardado.userId || "") === String(userId || "") &&
      pedidoGuardado.esRecuperableCheckout !== false,
  );

const pedidoGuardadoDebeRecrearse = ({ status, message }) =>
  status === 404 ||
  status === 403 ||
  /fue cancelado|pedido no encontrado|no tienes permisos/i.test(
    String(message || ""),
  );

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
          {obtenerCategoriaVisible(item.categoria)}
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
      ...(user?.datosEnvioPreferidos || {}),
      ...leerStorageJson(CHECKOUT_ENVIO_STORAGE_KEY, {}),
    }),
  );
  const [erroresEnvio, setErroresEnvio] = useState({});
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState(
    METODO_PAGO_MERCADO_PAGO,
  );
  const [guardarDatosEnvio, setGuardarDatosEnvio] = useState(false);

  useEffect(() => {
    guardarStorageJson(CHECKOUT_ENVIO_STORAGE_KEY, envio);
  }, [envio]);

  const subtotal = useMemo(
    () => carrito.reduce((acumulado, item) => acumulado + item.cantidad * item.precio, 0),
    [carrito],
  );

  const camposEnvioRequeridos = useMemo(() => {
    switch (envio.tipo) {
      case TIPO_ENVIO_ANDREANI_SUCURSAL:
        return ["provincia", "ciudad", "codigoPostal", "sucursalAndreani", "celular"];
      case TIPO_ENVIO_CADETE_LOCAL:
        return ["celular"];
      default:
        return ["provincia", "ciudad", "codigoPostal", "domicilio", "celular"];
    }
  }, [envio.tipo]);
  const envioCompleto = useMemo(
    () =>
      camposEnvioRequeridos.every((campo) =>
        typeof envio[campo] === "string" && envio[campo].trim().length > 0,
      ),
    [camposEnvioRequeridos, envio],
  );
  const envioValido = ![
    validarCampoEnvio("tipo", envio.tipo),
    validarCampoEnvio("provincia", envio.provincia),
    validarCampoEnvio("ciudad", envio.ciudad),
    validarCampoEnvio("domicilio", envio.domicilio),
    validarCampoEnvio("celular", envio.celular),
    validarCampoEnvio("entreCalles", envio.entreCalles),
    validarCampoEnvio("referencia", envio.referencia),
    validarCampoEnvio("codigoPostal", envio.codigoPostal),
    validarCampoEnvio("sucursalAndreani", envio.sucursalAndreani),
    validarCampoEnvio("horarioConveniente", envio.horarioConveniente),
  ].some(Boolean);
  const descuentoTransferencia = useMemo(
    () => calcularDescuentoTransferencia(subtotal, metodoPagoSeleccionado),
    [metodoPagoSeleccionado, subtotal],
  );
  const costoEnvio = carrito.length > 0 ? obtenerCostoEnvio(envio.tipo) : 0;
  const totalFinal = subtotal - descuentoTransferencia + costoEnvio;
  const guardarDatosDomicilio = envio.tipo !== TIPO_ENVIO_CADETE_LOCAL && guardarDatosEnvio;
  const envioListo = envioCompleto && envioValido;

  function validarCampoEnvio(name, value) {
    switch (name) {
      case "tipo":
        return [TIPO_ENVIO_ANDREANI_DOMICILIO, TIPO_ENVIO_ANDREANI_SUCURSAL, TIPO_ENVIO_CADETE_LOCAL].includes(value)
          ? ""
          : "El tipo de envío no es válido";
      case "provincia":
        if (envio.tipo === TIPO_ENVIO_CADETE_LOCAL) return "";
        return validateProvincia(value);
      case "ciudad":
        if (envio.tipo === TIPO_ENVIO_CADETE_LOCAL) return "";
        return validateCiudad(value);
      case "domicilio":
        if (envio.tipo === TIPO_ENVIO_CADETE_LOCAL) return "";
        if (envio.tipo === TIPO_ENVIO_ANDREANI_SUCURSAL) return "";
        return validateDomicilioCompleto(value);
      case "celular":
        if (envio.tipo === TIPO_ENVIO_CADETE_LOCAL && !normalizePhone(value)) {
          return "El celular / WhatsApp es obligatorio para coordinar la entrega.";
        }
        return validateCelularEntrega(value);
      case "entreCalles":
        if (envio.tipo === TIPO_ENVIO_CADETE_LOCAL) return "";
        return validateTextoOpcional(value, "Entre calles", 120);
      case "referencia":
        return validateTextoOpcional(value, "La referencia", 180);
      case "codigoPostal":
        if (envio.tipo === TIPO_ENVIO_CADETE_LOCAL) return "";
        return validateCodigoPostal(value);
      case "sucursalAndreani":
        if (envio.tipo !== TIPO_ENVIO_ANDREANI_SUCURSAL) return "";
        return normalizeCheckoutText(value).length >= 3
          ? ""
          : "La sucursal Andreani es obligatoria";
      case "horarioConveniente":
        return validateTextoOpcional(value, "El horario conveniente", 120);
      default:
        return "";
    }
  }

  const validarEnvio = () => {
    const nuevosErrores = {
      tipo: validarCampoEnvio("tipo", envio.tipo),
      provincia: validarCampoEnvio("provincia", envio.provincia),
      ciudad: validarCampoEnvio("ciudad", envio.ciudad),
      domicilio: validarCampoEnvio("domicilio", envio.domicilio),
      celular: validarCampoEnvio("celular", envio.celular),
      entreCalles: validarCampoEnvio("entreCalles", envio.entreCalles),
      referencia: validarCampoEnvio("referencia", envio.referencia),
      codigoPostal: validarCampoEnvio("codigoPostal", envio.codigoPostal),
      sucursalAndreani: validarCampoEnvio("sucursalAndreani", envio.sucursalAndreani),
      horarioConveniente: validarCampoEnvio("horarioConveniente", envio.horarioConveniente),
    };

    setErroresEnvio(nuevosErrores);

    return !Object.values(nuevosErrores).some(Boolean);
  };

  const handleEnvioChange = (event) => {
    const { name, value } = event.target;
    setEnvio((prevEnvio) => ({
      ...prevEnvio,
      [name]: value,
    }));

    if (erroresEnvio[name]) {
      setErroresEnvio((prevErrores) => ({
        ...prevErrores,
        [name]: "",
      }));
    }
  };

  const handleTipoEnvioChange = (tipo) => {
    setEnvio((prevEnvio) => ({
      ...prevEnvio,
      tipo,
    }));
    setErroresEnvio({});
  };

  const solicitarDatosCheckout = async (metodoPago, mensajeProceso) => {
    if (carrito.length === 0) return null;

    if (!token || !user) {
      await Swal.fire({
        title: "Iniciá sesión para continuar",
        text: "Necesitamos una cuenta activa para registrar tu pedido y continuar con el pago.",
        icon: "info",
        confirmButtonText: "Entendido",
      });
      return null;
    }

    if (!validarEnvio()) {
      await Swal.fire({
        title: "Faltan datos de envío",
        text: "Completá los datos requeridos para la forma de envío elegida antes de continuar.",
        icon: "warning",
        confirmButtonText: "Revisar",
      });
      return null;
    }

    const carritoCheckout = await normalizarCarritoConCatalogo(carrito);

    if (carritoCheckout.length === 0) {
      throw new Error(
        "Los productos de tu carrito ya no están disponibles. Agregalos nuevamente desde el catálogo.",
      );
    }

    Swal.fire({
      title: "Preparando tu pedido",
      text: mensajeProceso,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const productosResumen = construirProductosResumen(carritoCheckout);
    const envioPayload = construirEnvioPayload(envio);
    const checkoutHash = construirCheckoutHash({
      userId: user.uid,
      productos: productosResumen,
      envio: envioPayload,
      metodoPago,
      guardarDatosEnvio: guardarDatosDomicilio,
    });

    return {
      productosResumen,
      envioPayload,
      checkoutHash,
      pedidoGuardado: leerStorageJson(CHECKOUT_PEDIDO_STORAGE_KEY, null),
    };
  };

  const construirResumenPedidoGuardado = ({
    pedidoId,
    pedidoData,
    preferenceId = null,
    baseResumen = {},
    checkoutHash,
    productosResumen,
    envioPayload,
    metodoPago,
  }) => ({
    ...baseResumen,
    pedidoId,
    userId: String(user.uid || ""),
    checkoutHash,
    esRecuperableCheckout: true,
    preferenceId,
    createdAt: baseResumen.createdAt || new Date().toISOString(),
    subtotal: Number(pedidoData?.subtotal ?? baseResumen.subtotal ?? subtotal),
    descuento: Number(
      pedidoData?.descuento ??
        baseResumen.descuento ??
        calcularDescuentoTransferencia(subtotal, metodoPago),
    ),
    total: Number(pedidoData?.total ?? baseResumen.total ?? totalFinal),
    metodoPago: pedidoData?.metodoPago || baseResumen.metodoPago || metodoPago,
    estadoPago: pedidoData?.estadoPago || baseResumen.estadoPago || "pending",
    cantidadTotal:
      baseResumen.cantidadTotal ||
      productosResumen.reduce(
        (acumulado, item) => acumulado + Number(item.cantidad || 0),
        0,
      ),
    comprobanteTransferencia:
      pedidoData?.comprobanteTransferencia ||
      baseResumen.comprobanteTransferencia ||
      null,
    envio: pedidoData?.envio || baseResumen.envio || {
      ...envioPayload,
      proveedor: obtenerTituloEnvio(envioPayload.tipo),
      tipo: envioPayload.tipo,
      operador:
        envioPayload.tipo === TIPO_ENVIO_CADETE_LOCAL ? "cadete" : "andreani",
      costo: costoEnvio,
      esGratis: false,
    },
    productos: baseResumen.productos || productosResumen,
  });

  const crearNuevoPedido = async ({
    productosResumen,
    envioPayload,
    checkoutHash,
    metodoPago,
  }) => {
    const { respuesta: pedidoResponse, datos: pedidoData } = await solicitarApi(
      "/pedidos",
      {
        method: "POST",
        token,
        json: {
          productos: productosResumen.map((item) => ({
            producto: item.id,
            cantidad: item.cantidad,
          })),
          envio: envioPayload,
          metodoPago,
          guardarDatosEnvio: guardarDatosDomicilio,
        },
      },
    );

    if (isAuthError(pedidoResponse, pedidoData)) {
      logout();
      throw new Error("Tu sesión venció. Volvé a ingresar antes de continuar.");
    }

    if (!pedidoResponse.ok) {
      throw new Error(getApiErrorMessage(pedidoData, "No se pudo crear el pedido."));
    }

    const pedidoId = pedidoData?.pedidoId;

    if (!pedidoId) {
      throw new Error("No recibimos un ID de pedido válido.");
    }

    const resumenPedido = construirResumenPedidoGuardado({
      pedidoId,
      pedidoData,
      checkoutHash,
      productosResumen,
      envioPayload,
      metodoPago,
    });

    guardarStorageJson(CHECKOUT_PEDIDO_STORAGE_KEY, resumenPedido);

    return resumenPedido;
  };

  const obtenerPedidoPreparado = async ({
    productosResumen,
    envioPayload,
    checkoutHash,
    pedidoGuardado,
    metodoPago,
  }) => {
    const reutilizarPedido =
      puedeReutilizarPedidoGuardado({
        pedidoGuardado,
        userId: user.uid,
        checkoutHash,
      }) &&
      pedidoGuardado;

    if (!reutilizarPedido) {
      return {
        resumenPedido: await crearNuevoPedido({
          productosResumen,
          envioPayload,
          checkoutHash,
          metodoPago,
        }),
        reutilizarPedido: false,
      };
    }

    return {
      resumenPedido: construirResumenPedidoGuardado({
        pedidoId: pedidoGuardado.pedidoId,
        pedidoData: pedidoGuardado,
        preferenceId: pedidoGuardado.preferenceId || null,
        baseResumen: pedidoGuardado,
        checkoutHash,
        productosResumen,
        envioPayload,
        metodoPago,
      }),
      reutilizarPedido: true,
    };
  };

  const iniciarCheckoutPedido = async (pedidoId) => {
    const {
      respuesta: checkoutResponse,
      datos: checkoutData,
    } = await solicitarApi("/pagos/checkout", {
      method: "POST",
      token,
      json: { pedidoId },
    });

    if (isAuthError(checkoutResponse, checkoutData)) {
      logout();
      throw new Error("Tu sesión venció. Ingresá nuevamente y reintentá el pago.");
    }

    if (!checkoutResponse.ok) {
      const message = getApiErrorMessage(
        checkoutData,
        "No se pudo iniciar el checkout de Mercado Pago.",
      );
      const checkoutError = new Error(message);
      checkoutError.status = checkoutResponse.status;
      checkoutError.reintentarConPedidoNuevo = pedidoGuardadoDebeRecrearse({
        status: checkoutResponse.status,
        message,
      });
      throw checkoutError;
    }

    const checkoutUrl = obtenerCheckoutUrl(checkoutData);

    if (!checkoutUrl) {
      throw new Error("Mercado Pago no devolvió una URL de checkout válida.");
    }

    return { checkoutData, checkoutUrl };
  };

  const handlePagarMercadoPago = async () => {
    try {
      setProcesandoPago(true);

      const datosCheckout = await solicitarDatosCheckout(
        METODO_PAGO_MERCADO_PAGO,
        "Estamos creando el pedido y conectando Mercado Pago.",
      );

      if (!datosCheckout) {
        return;
      }

      const { resumenPedido: resumenInicial, reutilizarPedido } =
        await obtenerPedidoPreparado({
          ...datosCheckout,
          metodoPago: METODO_PAGO_MERCADO_PAGO,
        });

      let resumenPedido = resumenInicial;
      let checkoutResultado;

      try {
        checkoutResultado = await iniciarCheckoutPedido(resumenPedido.pedidoId);
      } catch (checkoutError) {
        if (reutilizarPedido && checkoutError?.reintentarConPedidoNuevo) {
          eliminarStorageItem(CHECKOUT_PEDIDO_STORAGE_KEY);
          resumenPedido = await crearNuevoPedido({
            productosResumen: datosCheckout.productosResumen,
            envioPayload: datosCheckout.envioPayload,
            checkoutHash: datosCheckout.checkoutHash,
            metodoPago: METODO_PAGO_MERCADO_PAGO,
          });
          checkoutResultado = await iniciarCheckoutPedido(resumenPedido.pedidoId);
        } else {
          throw checkoutError;
        }
      }

      guardarStorageJson(CHECKOUT_PEDIDO_STORAGE_KEY, {
        ...resumenPedido,
        preferenceId:
          checkoutResultado.checkoutData?.id ||
          resumenPedido.preferenceId ||
          null,
        esRecuperableCheckout: true,
        estadoPago: "pending",
        metodoPago: METODO_PAGO_MERCADO_PAGO,
      });

      Swal.close();
      window.location.assign(checkoutResultado.checkoutUrl);
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

  const handleConfirmarTransferencia = async () => {
    try {
      setProcesandoPago(true);

      const datosCheckout = await solicitarDatosCheckout(
        METODO_PAGO_TRANSFERENCIA,
        "Estamos registrando tu pedido por transferencia.",
      );

      if (!datosCheckout) {
        return;
      }

      const { resumenPedido } = await obtenerPedidoPreparado({
        ...datosCheckout,
        metodoPago: METODO_PAGO_TRANSFERENCIA,
      });

      const resumenFinal = {
        ...resumenPedido,
        metodoPago: METODO_PAGO_TRANSFERENCIA,
        estadoPago: "pending",
      };

      guardarStorageJson(CHECKOUT_PEDIDO_STORAGE_KEY, resumenFinal);
      vaciarCarrito();
      Swal.close();

      navigate("/transferencia-confirmada", {
        state: {
          pedido: resumenFinal,
        },
      });
    } catch (error) {
      console.error("Error al confirmar transferencia:", error);
      Swal.close();
      await Swal.fire({
        title: "No pudimos registrar tu pedido",
        text: error.message || "Hubo un problema al registrar el pedido por transferencia.",
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
              <h1 className="fw-bold display-5 mb-2">Tu selección</h1>
              <p className="text-muted mb-0">
                Completá tu dirección de entrega, elegí tu forma de pago y finalizá tu pedido.
              </p>
            </div>

          </div>
        </div>

        <Alert variant="secondary" className="rounded-4 border-0 shadow-sm">
          Elegí cómo querés recibir tu pedido. Podés usar Andreani o coordinar por WhatsApp.
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
                      Revisá los productos que vas a llevar antes de continuar.
                    </p>
                  </div>
                </div>

                {carrito.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-cart-x display-1 text-muted opacity-25"></i>
                    <h4 className="mt-3 text-muted">Tu carrito está vacío</h4>
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
                    <h5 className="fw-bold mb-1">Forma de envío</h5>
                    <p className="text-muted mb-0">
                      Ya tenemos tu nombre y email por tu cuenta de Google.
                      Completá los datos necesarios para enviar tu pedido.
                    </p>
                  </div>
                </div>

                {!token && (
                  <Alert variant="warning" className="rounded-4">
                    Iniciá sesión desde el menú para habilitar el checkout y registrar tu pedido.
                  </Alert>
                )}

                {user && (
                  <Alert variant="success" className="rounded-4">
                    <strong>{`${user.nombre || ""} ${user.apellido || ""}`.trim() || "Cliente"}</strong>
                    {user.email ? ` - ${user.email}` : ""}
                  </Alert>
                )}

                <div className="d-grid gap-3 mb-4">
                  {OPCIONES_ENVIO.map((opcion) => (
                    <Card
                      key={opcion.tipo}
                      className={`border rounded-4 ${
                        envio.tipo === opcion.tipo
                          ? "border-success shadow-sm"
                          : "border-light-subtle"
                      }`}
                    >
                      <Card.Body className="py-3">
                        <Form.Check
                          type="radio"
                          id={`tipo-envio-${opcion.tipo}`}
                          name="tipo"
                          checked={envio.tipo === opcion.tipo}
                          onChange={() => handleTipoEnvioChange(opcion.tipo)}
                          label={
                            <span className="fw-semibold text-dark">
                              {opcion.titulo}
                              {opcion.tipo !== TIPO_ENVIO_CADETE_LOCAL
                                ? ` - ${formatCurrency(obtenerCostoEnvio(opcion.tipo))}`
                                : ""}
                            </span>
                          }
                        />
                        <div className="small text-muted ms-4 mt-1">
                          {opcion.descripcion}
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                  {erroresEnvio.tipo && (
                    <div className="text-danger small">{erroresEnvio.tipo}</div>
                  )}
                </div>

                {envio.tipo === TIPO_ENVIO_CADETE_LOCAL && (
                  <Alert variant="info" className="rounded-4">
                    Coordinaremos la entrega y el costo por WhatsApp.
                  </Alert>
                )}

                <Row className="g-3">
                  {envio.tipo !== TIPO_ENVIO_CADETE_LOCAL && (
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Provincia</Form.Label>
                        <Form.Control
                          type="text"
                          name="provincia"
                          minLength={2}
                          maxLength={80}
                          value={envio.provincia}
                          onChange={handleEnvioChange}
                          placeholder="Buenos Aires"
                          isInvalid={Boolean(erroresEnvio.provincia)}
                        />
                        <Form.Control.Feedback type="invalid">
                          {erroresEnvio.provincia}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  )}

                  {envio.tipo !== TIPO_ENVIO_CADETE_LOCAL && (
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Ciudad/localidad</Form.Label>
                        <Form.Control
                          type="text"
                          name="ciudad"
                          minLength={2}
                          maxLength={80}
                          value={envio.ciudad}
                          onChange={handleEnvioChange}
                          placeholder="Yerba Buena"
                          isInvalid={Boolean(erroresEnvio.ciudad)}
                        />
                        <Form.Control.Feedback type="invalid">
                          {erroresEnvio.ciudad}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  )}

                  {envio.tipo !== TIPO_ENVIO_CADETE_LOCAL && (
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Código postal</Form.Label>
                        <Form.Control
                          type="text"
                          name="codigoPostal"
                          minLength={3}
                          maxLength={10}
                          value={envio.codigoPostal}
                          onChange={handleEnvioChange}
                          placeholder="4000"
                          isInvalid={Boolean(erroresEnvio.codigoPostal)}
                        />
                        <Form.Control.Feedback type="invalid">
                          {erroresEnvio.codigoPostal}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  )}

                  {envio.tipo === TIPO_ENVIO_ANDREANI_SUCURSAL && (
                    <Col md={8}>
                      <Form.Group>
                        <Form.Label>Sucursal Andreani</Form.Label>
                        <Form.Control
                          type="text"
                          name="sucursalAndreani"
                          minLength={3}
                          maxLength={160}
                          value={envio.sucursalAndreani}
                          onChange={handleEnvioChange}
                          placeholder="Sucursal preferida"
                          isInvalid={Boolean(erroresEnvio.sucursalAndreani)}
                        />
                        <Form.Control.Feedback type="invalid">
                          {erroresEnvio.sucursalAndreani}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  )}

                  {envio.tipo === TIPO_ENVIO_ANDREANI_DOMICILIO && (
                    <Col md={8}>
                      <Form.Group>
                        <Form.Label>Domicilio completo</Form.Label>
                        <Form.Control
                          type="text"
                          name="domicilio"
                          minLength={5}
                          maxLength={160}
                          value={envio.domicilio}
                          onChange={handleEnvioChange}
                          placeholder="Calle, altura, piso y dpto"
                          isInvalid={Boolean(erroresEnvio.domicilio)}
                        />
                        <Form.Control.Feedback type="invalid">
                          {erroresEnvio.domicilio}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  )}

                  <Col md={envio.tipo === TIPO_ENVIO_CADETE_LOCAL ? 12 : 4}>
                    <Form.Group>
                      <Form.Label>
                        {envio.tipo === TIPO_ENVIO_CADETE_LOCAL
                          ? "Celular / WhatsApp"
                          : "Celular"}
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="celular"
                        minLength={8}
                        maxLength={18}
                        value={envio.celular}
                        onChange={handleEnvioChange}
                        placeholder="Ej: 381 1234567"
                        isInvalid={Boolean(erroresEnvio.celular)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {erroresEnvio.celular}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {envio.tipo === TIPO_ENVIO_ANDREANI_DOMICILIO && (
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Entre calles (opcional)</Form.Label>
                        <Form.Control
                          type="text"
                          name="entreCalles"
                          maxLength={120}
                          value={envio.entreCalles}
                          onChange={handleEnvioChange}
                          placeholder="Ej: Francia y Rojas Paz"
                          isInvalid={Boolean(erroresEnvio.entreCalles)}
                        />
                        <Form.Control.Feedback type="invalid">
                          {erroresEnvio.entreCalles}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  )}

                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label>
                        {envio.tipo === TIPO_ENVIO_CADETE_LOCAL
                          ? "Comentario opcional"
                          : "Referencia opcional"}
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="referencia"
                        maxLength={180}
                        value={envio.referencia}
                        onChange={handleEnvioChange}
                        placeholder={
                          envio.tipo === TIPO_ENVIO_CADETE_LOCAL
                            ? "Ej: prefiero coordinar por la tarde"
                            : "Ej: portón negro, departamento 2B, casa al fondo"
                        }
                        isInvalid={Boolean(erroresEnvio.referencia)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {erroresEnvio.referencia}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  {envio.tipo !== TIPO_ENVIO_CADETE_LOCAL && (
                    <Col xs={12}>
                      <Form.Check
                        type="checkbox"
                        id="guardar-datos-envio"
                        checked={guardarDatosEnvio}
                        onChange={(event) => setGuardarDatosEnvio(event.target.checked)}
                        label="Guardar estos datos para futuras compras"
                      />
                    </Col>
                  )}
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
                        Acá ves productos, envío, descuento si elegís transferencia y total final.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Subtotal ({cantidadTotal} productos)</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  {descuentoTransferencia > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Descuento transferencia 7%</span>
                      <span>-{formatCurrency(descuentoTransferencia)}</span>
                    </div>
                  )}

                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">
                      Envío: {obtenerTituloEnvio(envio.tipo)}
                    </span>
                    <span>
                      {envio.tipo === TIPO_ENVIO_CADETE_LOCAL
                        ? "A coordinar por WhatsApp"
                        : formatCurrency(costoEnvio)}
                    </span>
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
                        Elegí si querés pagar online con Mercado Pago o confirmar por transferencia.
                      </p>
                    </div>
                  </div>

                  <div className="d-grid gap-3 mb-4">
                    <Card
                      className={`border rounded-4 ${
                        metodoPagoSeleccionado === METODO_PAGO_MERCADO_PAGO
                          ? "border-success shadow-sm"
                          : "border-light-subtle"
                      }`}
                    >
                      <Card.Body className="py-3">
                        <Form.Check
                          type="radio"
                          id="metodo-pago-mercado-pago"
                          name="metodoPago"
                          checked={metodoPagoSeleccionado === METODO_PAGO_MERCADO_PAGO}
                          onChange={() => setMetodoPagoSeleccionado(METODO_PAGO_MERCADO_PAGO)}
                          label={
                            <span className="fw-semibold text-dark">Mercado Pago</span>
                          }
                        />
                        <div className="small text-muted ms-4 mt-1">
                          Pagá con tarjeta, débito, dinero en cuenta o medios habilitados.
                        </div>
                      </Card.Body>
                    </Card>

                    <Card
                      className={`border rounded-4 ${
                        metodoPagoSeleccionado === METODO_PAGO_TRANSFERENCIA
                          ? "border-success shadow-sm"
                          : "border-light-subtle"
                      }`}
                    >
                      <Card.Body className="py-3">
                        <Form.Check
                          type="radio"
                          id="metodo-pago-transferencia"
                          name="metodoPago"
                          checked={metodoPagoSeleccionado === METODO_PAGO_TRANSFERENCIA}
                          onChange={() => setMetodoPagoSeleccionado(METODO_PAGO_TRANSFERENCIA)}
                          label={
                            <span className="fw-semibold text-dark">
                              Transferencia bancaria - 7% OFF
                            </span>
                          }
                        />
                        <div className="small text-muted ms-4 mt-1">
                          Al confirmar el pedido, te mostraremos los datos para transferir.
                        </div>
                      </Card.Body>
                    </Card>
                  </div>

                  {metodoPagoSeleccionado === METODO_PAGO_TRANSFERENCIA && (
                    <Card className="border-0 bg-light rounded-4 mb-4">
                      <Card.Body className="p-4">
                        <div className="fw-bold mb-3">
                          Transferencia bancaria - 7% OFF
                        </div>

                        <div className="small text-muted mb-3">
                          El descuento se aplica solo sobre los productos. El envío no tiene descuento.
                        </div>

                        <div className="d-grid gap-2">
                          <Alert variant="info" className="rounded-4 mb-2">
                            Al confirmar el pedido, te mostraremos los datos para transferir.
                          </Alert>
                          <div className="border-top pt-3 mt-1">
                            <div className="d-flex justify-content-between mb-2">
                              <small className="text-muted">Subtotal productos</small>
                              <small className="fw-semibold">{formatCurrency(subtotal)}</small>
                            </div>
                            <div className="d-flex justify-content-between mb-2 text-success">
                              <small>Descuento transferencia 7%</small>
                              <small className="fw-semibold">
                                -{formatCurrency(descuentoTransferencia)}
                              </small>
                            </div>
                            <div className="d-flex justify-content-between">
                              <small className="text-muted">
                                Envío: {obtenerTituloEnvio(envio.tipo)}
                              </small>
                              <small className="fw-semibold">
                                {envio.tipo === TIPO_ENVIO_CADETE_LOCAL
                                  ? "A coordinar por WhatsApp"
                                  : formatCurrency(costoEnvio)}
                              </small>
                            </div>
                          </div>
                          <div className="pt-2">
                            <small className="text-muted d-block">Total a transferir</small>
                            <div className="fs-4 fw-bold text-success">
                              {formatCurrency(totalFinal)}
                            </div>
                          </div>
                        </div>

                        <p className="small text-muted mt-4 mb-0">
                          Después de transferir, enviá el comprobante por WhatsApp para confirmar tu compra.
                        </p>
                      </Card.Body>
                    </Card>
                  )}

                  <Button
                    variant="success"
                    className="w-100 py-3 rounded-pill fw-bold shadow-sm"
                    size="lg"
                    onClick={
                      metodoPagoSeleccionado === METODO_PAGO_TRANSFERENCIA
                        ? handleConfirmarTransferencia
                        : handlePagarMercadoPago
                    }
                    disabled={
                      carrito.length === 0 ||
                      !token ||
                      !envioListo ||
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
                        {metodoPagoSeleccionado === METODO_PAGO_TRANSFERENCIA
                          ? "Registrando pedido por transferencia..."
                          : "Conectando con Mercado Pago..."}
                      </>
                    ) : metodoPagoSeleccionado === METODO_PAGO_TRANSFERENCIA ? (
                      "Confirmar pedido por transferencia"
                    ) : (
                      "Pagar con Mercado Pago"
                    )}
                  </Button>

                  <p className="text-muted small text-center mt-3 mb-0 checkout-payment-note">
                    {metodoPagoSeleccionado === METODO_PAGO_TRANSFERENCIA
                      ? "El pedido quedará registrado como pendiente hasta que confirmemos el pago."
                      : "El pago se procesa de forma segura con Mercado Pago."}
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
