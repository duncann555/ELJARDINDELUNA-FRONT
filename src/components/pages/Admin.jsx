import { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  FloatingLabel,
  Form,
  InputGroup,
  Modal,
  Row,
  Tab,
  Table,
  Tabs,
} from "react-bootstrap";
import { useForm, useWatch } from "react-hook-form";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import {
  API_URL,
  buildAuthHeaders,
  formatCurrency,
  formatDate,
  getApiErrorMessage,
  getApiValidationErrors,
  isAuthError,
  safeJson,
} from "../../helpers/app";
import {
  asValidationRule,
  normalizeText,
  validateProductImageFile,
  validateProductoCategoria,
  validateProductoDescripcion,
  validateProductoNombre,
  validateProductoPrecio,
  validateProductoStock,
} from "../../helpers/validation";
import "../../styles/admin.css";

const PRODUCTO_VACIO = {
  nombre: "",
  categoria: "",
  stock: 0,
  descripcion: "",
  precio: 0,
  imagenUrl: "",
  estado: "Activo",
  oferta: false,
  destacado: false,
};

const CATEGORIAS = [
  "Tinturas Madres",
  "Esencias Aromaticas",
  "Hierbas Naturales",
  "Aceites",
];

const PEDIDO_ESTADOS = [
  "En espera de pago",
  "Preparando envío",
  "Despachado",
  "Entregado",
  "Cancelado",
];

const PEDIDO_ESTADOS_SIN_PAGO_APROBADO = [
  "En espera de pago",
  "Cancelado",
];

const getPedidoSubtotal = (pedido) =>
  Number(pedido?.subtotal ?? pedido?.total ?? 0);

const getPedidoEnvioCosto = (pedido) =>
  Number(pedido?.envio?.costo || 0);

const getPedidoStatusVariant = (status) => {
  switch (status) {
    case "Entregado":
      return "success";
    case "Despachado":
      return "primary";
    case "Preparando env\u00edo":
      return "info";
    case "Preparando envío":
      return "info";
    case "Cancelado":
      return "danger";
    default:
      return "warning";
  }
};

const getPagoStatusVariant = (status) => {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "warning";
  }
};

const getEstadosPedidoDisponibles = (pedido) => {
  const estadosBase =
    pedido?.pago?.estado === "approved"
      ? PEDIDO_ESTADOS
      : PEDIDO_ESTADOS_SIN_PAGO_APROBADO;

  return Array.from(
    new Set([...(pedido?.estadoPedido ? [pedido.estadoPedido] : []), ...estadosBase]),
  );
};

const getUsuarioId = (usuario) => usuario?._id || usuario?.uid;

const getUsuarioStatusVariant = (status) => {
  switch (status) {
    case "Activo":
      return "success";
    case "Suspendido":
      return "warning";
    default:
      return "secondary";
  }
};

function AdminStatus({
  productosTotales,
  productosSinStock,
  usuariosActivos,
  pedidosEnGestion,
}) {
  return (
    <Row className="mb-4 g-4">
      <Col md={6} lg={3}>
        <Card className="status-card shadow-sm h-100">
          <Card.Body className="d-flex align-items-center gap-3">
            <div className="status-icon-wrapper bg-primary bg-opacity-10 text-primary p-3 rounded">
              <i className="bi bi-box-seam fs-4"></i>
            </div>
            <div>
              <p className="text-muted mb-0 small fw-bold text-uppercase">
                Productos Totales
              </p>
              <h3 className="fw-bold mb-0 text-dark">{productosTotales}</h3>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6} lg={3}>
        <Card className="status-card shadow-sm h-100">
          <Card.Body className="d-flex align-items-center gap-3">
            <div className="status-icon-wrapper bg-danger bg-opacity-10 text-danger p-3 rounded">
              <i className="bi bi-exclamation-triangle-fill fs-4"></i>
            </div>
            <div>
              <p className="text-muted mb-0 small fw-bold text-uppercase">
                Sin Stock
              </p>
              <h3 className="fw-bold mb-0 text-dark">{productosSinStock}</h3>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6} lg={3}>
        <Card className="status-card shadow-sm h-100">
          <Card.Body className="d-flex align-items-center gap-3">
            <div className="status-icon-wrapper bg-success bg-opacity-10 text-success p-3 rounded">
              <i className="bi bi-people-fill fs-4"></i>
            </div>
            <div>
              <p className="text-muted mb-0 small fw-bold text-uppercase">
                Usuarios Activos
              </p>
              <h3 className="fw-bold mb-0 text-dark">{usuariosActivos}</h3>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6} lg={3}>
        <Card className="status-card shadow-sm h-100">
          <Card.Body className="d-flex align-items-center gap-3">
            <div className="status-icon-wrapper bg-warning bg-opacity-10 text-warning p-3 rounded">
              <i className="bi bi-receipt-cutoff fs-4"></i>
            </div>
            <div>
              <p className="text-muted mb-0 small fw-bold text-uppercase">
                Pedidos en Gestion
              </p>
              <h3 className="fw-bold mb-0 text-dark">{pedidosEnGestion}</h3>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

function ProductoModal({
  show,
  modoProducto,
  productoInicial,
  cerrarModalProducto,
  guardarProducto,
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const [preview, setPreview] = useState(null);
  const imagenFile = useWatch({ control, name: "imagen" });

  useEffect(() => {
    let objectUrl;

    if (imagenFile && imagenFile.length > 0) {
      objectUrl = URL.createObjectURL(imagenFile[0]);
      // Este preview depende del archivo actual y se sincroniza al abrir/cambiar imagen.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(objectUrl);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imagenFile]);

  useEffect(() => {
    if (!show) return;

    if (productoInicial && modoProducto === "editar") {
      reset(productoInicial);
      // El modal edita contra el producto seleccionado y necesita reflejar su imagen actual.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(productoInicial.imagenUrl || null);
      return;
    }

    reset(PRODUCTO_VACIO);
    setPreview(null);
  }, [productoInicial, modoProducto, show, reset]);

  const onSubmit = (data) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (key === "imagen") {
        if (value && value.length > 0) {
          formData.append("imagen", value[0]);
        }
        return;
      }

      formData.append(key, typeof value === "string" ? normalizeText(value) : value);
    });

    guardarProducto(formData);
  };

  return (
    <Modal
      show={show}
      onHide={cerrarModalProducto}
      centered
      size="lg"
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {modoProducto === "crear" ? "Nuevo Producto" : "Editar Producto"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form id="formProducto" onSubmit={handleSubmit(onSubmit)}>
          <FloatingLabel label="Nombre del Producto" className="mb-3">
            <Form.Control
              type="text"
              {...register("nombre", {
                validate: asValidationRule(validateProductoNombre),
              })}
              isInvalid={!!errors.nombre}
            />
            <Form.Control.Feedback type="invalid">
              {errors.nombre?.message}
            </Form.Control.Feedback>
          </FloatingLabel>

          <Row className="mb-3">
            <Col md={6}>
              <FloatingLabel label="Categoria">
                <Form.Select
                  {...register("categoria", {
                    validate: asValidationRule((value) =>
                      validateProductoCategoria(value, CATEGORIAS),
                    ),
                  })}
                  className="form-select"
                  isInvalid={!!errors.categoria}
                >
                  <option value="">Seleccione una categoria</option>
                  {CATEGORIAS.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.categoria?.message}
                </Form.Control.Feedback>
              </FloatingLabel>
            </Col>

            <Col md={6}>
              <FloatingLabel label="Precio ($)">
                <Form.Control
                  type="number"
                  step="0.01"
                  {...register("precio", {
                    validate: asValidationRule(validateProductoPrecio),
                  })}
                  isInvalid={!!errors.precio}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.precio?.message}
                </Form.Control.Feedback>
              </FloatingLabel>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <FloatingLabel label="Stock Disponible">
                <Form.Control
                  type="number"
                  {...register("stock", {
                    validate: asValidationRule(validateProductoStock),
                  })}
                  isInvalid={!!errors.stock}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.stock?.message}
                </Form.Control.Feedback>
              </FloatingLabel>
            </Col>

            <Col md={6}>
              <FloatingLabel label="Estado del Producto">
                <Form.Select {...register("estado")}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </Form.Select>
              </FloatingLabel>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Esta en oferta"
              {...register("oferta")}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Imagen</Form.Label>
            <Form.Control
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              isInvalid={!!errors.imagen}
              {...register("imagen", {
                validate: (value) => validateProductImageFile(value?.[0]) || true,
              })}
            />
            <Form.Control.Feedback type="invalid">
              {errors.imagen?.message}
            </Form.Control.Feedback>
          </Form.Group>

          {preview && (
            <div className="text-center mb-3">
              <img
                src={preview}
                alt="Preview del producto"
                className="img-fluid rounded shadow-sm"
                style={{ maxHeight: "150px" }}
              />
            </div>
          )}

          <FloatingLabel label="Descripcion">
            <Form.Control
              as="textarea"
              style={{ height: "100px" }}
              {...register("descripcion", {
                validate: asValidationRule(validateProductoDescripcion),
              })}
              isInvalid={!!errors.descripcion}
            />
            <Form.Control.Feedback type="invalid">
              {errors.descripcion?.message}
            </Form.Control.Feedback>
          </FloatingLabel>

          <Form.Group className="my-3 p-3 bg-light rounded border">
            <Form.Check
              type="switch"
              label="Mostrar en la seccion de destacados"
              id="destacado-switch"
              {...register("destacado")}
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={cerrarModalProducto}>
          Cancelar
        </Button>
        <Button variant="success" type="submit" form="formProducto">
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function PedidoModal({
  show,
  pedido,
  cerrarModalPedido,
  guardarPedido,
  guardandoPedido,
}) {
  const [formulario, setFormulario] = useState({
    estadoPedido: "En espera de pago",
  });

  const resetFormulario = (pedidoActual) => {
    setFormulario({
      estadoPedido: pedidoActual.estadoPedido || "En espera de pago",
    });
  };

  useEffect(() => {
    if (!show || !pedido) return;

    // Este reset mantiene el modal alineado con el pedido seleccionado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetFormulario(pedido);
  }, [show, pedido]);

  if (!pedido) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    guardarPedido(formulario);
  };

  const cliente =
    typeof pedido.usuario === "object" && pedido.usuario !== null
      ? `${pedido.usuario.nombre || ""} ${pedido.usuario.apellido || ""}`.trim()
      : "Sin cliente";
  const estadosDisponibles = getEstadosPedidoDisponibles(pedido);
  const pagoAprobado = pedido.pago?.estado === "approved";

  return (
    <Modal show={show} onHide={cerrarModalPedido} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Gestion del pedido</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Row className="g-3 mb-4">
          <Col md={6}>
            <div className="p-3 rounded border bg-light h-100">
              <small className="text-muted d-block mb-1">Cliente</small>
              <div className="fw-bold">{cliente || "Sin nombre"}</div>
              <div className="text-muted small">{pedido.usuario?.email || "-"}</div>
            </div>
          </Col>

          <Col md={6}>
            <div className="p-3 rounded border bg-light h-100">
              <small className="text-muted d-block mb-1">Pedido</small>
              <div className="fw-bold">#{String(pedido._id).slice(-6).toUpperCase()}</div>
              <div className="text-muted small">{formatDate(pedido.createdAt)}</div>
            </div>
          </Col>

          <Col md={6}>
            <div className="p-3 rounded border bg-light h-100">
              <small className="text-muted d-block mb-1">Pago</small>
              <Badge bg={getPagoStatusVariant(pedido.pago?.estado)}>
                {pedido.pago?.estado || "pending"}
              </Badge>
              <div className="text-muted small mt-2">
                Preference ID: {pedido.pago?.preferenceId || "-"}
              </div>
            </div>
          </Col>

          <Col md={6}>
            <div className="p-3 rounded border bg-light h-100">
              <small className="text-muted d-block mb-1">Envio</small>
              <div className="fw-bold">{pedido.envio?.proveedor || "Envio nacional"}</div>
              <div className="text-muted small mt-2">
                Direccion: {pedido.envio?.domicilio || "-"}
              </div>
              <div className="text-muted small">
                {pedido.envio?.ciudad || "-"}, {pedido.envio?.provincia || "-"}
              </div>
              <div className="text-muted small">
                Costo: {formatCurrency(getPedidoEnvioCosto(pedido))}
              </div>
            </div>
          </Col>
        </Row>

        <div className="mb-4">
          <h6 className="fw-bold mb-3">Productos del pedido</h6>
          <div className="border rounded overflow-hidden">
            <Table responsive className="mb-0">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedido.productos?.map((producto, index) => (
                  <tr key={`${producto.producto}-${index}`}>
                    <td>{producto.nombre}</td>
                    <td>{producto.cantidad}</td>
                    <td>{formatCurrency(producto.precio)}</td>
                    <td>{formatCurrency(producto.precio * producto.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>

        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              <FloatingLabel label="Estado del pedido">
                <Form.Select
                  name="estadoPedido"
                  value={formulario.estadoPedido}
                  onChange={handleChange}
                >
                  {estadosDisponibles.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </Form.Select>
              </FloatingLabel>
              {!pagoAprobado && (
                <div className="small text-muted mt-2">
                  Mientras el pago siga pendiente, solo puedes dejarlo en espera o cancelarlo.
                </div>
              )}
            </Col>
          </Row>

          <div className="d-flex justify-content-between align-items-center mt-4">
            <div>
              <div className="fw-bold">
                Subtotal: {formatCurrency(getPedidoSubtotal(pedido))}
              </div>
              <div className="small text-muted">
                Envio: {formatCurrency(getPedidoEnvioCosto(pedido))}
              </div>
              <div className="fw-bold">
                Total: {formatCurrency(pedido.total)}
              </div>
            </div>
            <Button type="submit" variant="success" disabled={guardandoPedido}>
              {guardandoPedido ? "Guardando..." : "Guardar estado"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

function Admin() {
  const { user, token, logout } = useAuth();
  const esAdmin = user?.rol === "Administrador";
  const sesionInvalidaRef = useRef(false);

  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [pedidos, setPedidos] = useState([]);

  const [showProdModal, setShowProdModal] = useState(false);
  const [modoProducto, setModoProducto] = useState("crear");
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState(null);
  const [productoForm, setProductoForm] = useState(PRODUCTO_VACIO);

  const [showPedidoModal, setShowPedidoModal] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);

  const [busquedaProd, setBusquedaProd] = useState("");
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [usuarioProcesandoId, setUsuarioProcesandoId] = useState(null);

  const manejarSesionInvalida = useCallback(async (data) => {
    if (sesionInvalidaRef.current) {
      return;
    }

    sesionInvalidaRef.current = true;
    logout();

    await Swal.fire({
      title: "Sesion vencida",
      text:
        data?.mensaje ||
        "Tu sesion ya no es valida. Ingresa nuevamente para seguir administrando productos.",
      icon: "info",
      confirmButtonText: "Entendido",
    });
  }, [logout]);

  const cargarProductos = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/productos/admin/todos`, {
        headers: buildAuthHeaders(token),
      });
      const data = await safeJson(response);

      if (isAuthError(response, data)) {
        await manejarSesionInvalida(data);
        return;
      }

      if (!response.ok) {
        throw new Error(data?.mensaje || "No se pudieron cargar los productos");
      }

      setProductos(Array.isArray(data) ? data : data?.productos || []);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  }, [manejarSesionInvalida, token]);

  const cargarUsuarios = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/usuarios`, {
        headers: buildAuthHeaders(token),
      });
      const data = await safeJson(response);

      if (isAuthError(response, data)) {
        await manejarSesionInvalida(data);
        return;
      }

      if (!response.ok) {
        throw new Error(data?.mensaje || "No se pudieron cargar los usuarios");
      }

      setUsuarios(Array.isArray(data) ? data : data?.usuarios || []);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  }, [manejarSesionInvalida, token]);

  const cargarPedidos = useCallback(async () => {
    if (!token) return;

    try {
      setCargandoPedidos(true);
      const response = await fetch(`${API_URL}/pedidos`, {
        headers: buildAuthHeaders(token),
      });
      const data = await safeJson(response);

      if (isAuthError(response, data)) {
        await manejarSesionInvalida(data);
        return;
      }

      if (!response.ok) {
        throw new Error(data?.mensaje || "No se pudieron cargar los pedidos");
      }

      setPedidos(Array.isArray(data) ? data : data?.pedidos || []);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setCargandoPedidos(false);
    }
  }, [manejarSesionInvalida, token]);

  useEffect(() => {
    if (!token || !esAdmin) return;

    void cargarProductos();
    void cargarUsuarios();
    void cargarPedidos();
  }, [cargarPedidos, cargarProductos, cargarUsuarios, esAdmin, token]);

  const abrirModalProductoCrear = () => {
    setModoProducto("crear");
    setProductoSeleccionadoId(null);
    setProductoForm(PRODUCTO_VACIO);
    setShowProdModal(true);
  };

  const abrirModalProductoEditar = (producto) => {
    setModoProducto("editar");
    setProductoSeleccionadoId(producto._id);
    setProductoForm(producto);
    setShowProdModal(true);
  };

  const abrirModalPedido = (pedido) => {
    setPedidoSeleccionado(pedido);
    setShowPedidoModal(true);
  };

  const guardarProducto = async (formData) => {
    try {
      let url = `${API_URL}/productos`;
      let method = "POST";

      if (modoProducto === "editar") {
        url = `${API_URL}/productos/${productoSeleccionadoId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: buildAuthHeaders(token),
        body: formData,
      });

      const data = await safeJson(response);

      if (isAuthError(response, data)) {
        await manejarSesionInvalida(data);
        return;
      }

      const erroresValidacion = getApiValidationErrors(data);

      if (response.status === 400 && erroresValidacion.length > 0) {
        const messages = erroresValidacion
          .map((error) => `<li>${error}</li>`)
          .join("");
        await Swal.fire({
          title: "Error",
          html: `<ul>${messages}</ul>`,
          icon: "error",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "No se pudo guardar el producto"));
      }

      await cargarProductos();
      setShowProdModal(false);
      Swal.fire("Exito", "Producto guardado correctamente", "success");
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  const guardarPedido = async (formulario) => {
    if (!pedidoSeleccionado) return;

      try {
        setGuardandoPedido(true);
      const payload = { estadoPedido: formulario.estadoPedido };

      const response = await fetch(`${API_URL}/pedidos/${pedidoSeleccionado._id}`, {
        method: "PATCH",
        headers: buildAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      });

      const data = await safeJson(response);

      if (isAuthError(response, data)) {
        await manejarSesionInvalida(data);
        return;
      }

      const erroresValidacion = getApiValidationErrors(data);

      if (response.status === 400 && erroresValidacion.length > 0) {
        throw new Error(erroresValidacion.join(" | "));
      }

      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "No se pudo actualizar el pedido"));
      }

      await cargarPedidos();
      setShowPedidoModal(false);
      setPedidoSeleccionado(null);
      Swal.fire("Exito", "Estado del pedido actualizado", "success");
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setGuardandoPedido(false);
    }
  };

  const eliminarProducto = async (id) => {
    const result = await Swal.fire({
      title: "Borrar producto?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Si, borrar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${API_URL}/productos/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });

      const data = await safeJson(response);

      if (isAuthError(response, data)) {
        await manejarSesionInvalida(data);
        return;
      }

      if (!response.ok) {
        throw new Error(data?.mensaje || "No se pudo eliminar el producto");
      }

      await cargarProductos();
      Swal.fire("Eliminado", "Producto eliminado correctamente", "success");
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  const cambiarEstadoUsuario = async (usuario) => {
    const usuarioId = getUsuarioId(usuario);
    const nuevoEstado =
      usuario.estado === "Activo" ? "Suspendido" : "Activo";

    const result = await Swal.fire({
      title:
        nuevoEstado === "Suspendido"
          ? "Suspender usuario?"
          : "Reactivar usuario?",
      text: `${usuario.nombre} ${usuario.apellido} pasara a estado ${nuevoEstado}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText:
        nuevoEstado === "Suspendido" ? "Si, suspender" : "Si, reactivar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed || !usuarioId) return;

    try {
      setUsuarioProcesandoId(usuarioId);

      const response = await fetch(`${API_URL}/usuarios/${usuarioId}`, {
        method: "PATCH",
        headers: buildAuthHeaders(token, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      const data = await safeJson(response);

      if (isAuthError(response, data)) {
        await manejarSesionInvalida(data);
        return;
      }

      if (!response.ok) {
        throw new Error(data?.mensaje || "No se pudo actualizar el usuario");
      }

      await cargarUsuarios();
      Swal.fire("Exito", `Usuario ${nuevoEstado.toLowerCase()} correctamente`, "success");
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setUsuarioProcesandoId(null);
    }
  };

  const eliminarUsuario = async (usuario) => {
    const usuarioId = getUsuarioId(usuario);

    const result = await Swal.fire({
      title: "Eliminar usuario?",
      text: `Se eliminara la cuenta de ${usuario.nombre} ${usuario.apellido}. Esta accion no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Si, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed || !usuarioId) return;

    try {
      setUsuarioProcesandoId(usuarioId);

      const response = await fetch(`${API_URL}/usuarios/${usuarioId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token),
      });

      const data = await safeJson(response);

      if (isAuthError(response, data)) {
        await manejarSesionInvalida(data);
        return;
      }

      if (!response.ok) {
        throw new Error(data?.mensaje || "No se pudo eliminar el usuario");
      }

      await cargarUsuarios();
      Swal.fire("Eliminado", "Usuario eliminado correctamente", "success");
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setUsuarioProcesandoId(null);
    }
  };

  const productosFiltrados = productos.filter(
    (producto) =>
      (producto.nombre || "").toLowerCase().includes(busquedaProd.toLowerCase()) ||
      (producto.categoria || "")
        .toLowerCase()
        .includes(busquedaProd.toLowerCase()),
  );

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const termino = busquedaUsuario.toLowerCase();
    const nombreCompleto = `${usuario.nombre || ""} ${usuario.apellido || ""}`.toLowerCase();

    return (
      nombreCompleto.includes(termino) ||
      (usuario.email || "").toLowerCase().includes(termino) ||
      (usuario.telefono || "").toLowerCase().includes(termino)
    );
  });

  const usuariosActivos = usuarios.filter(
    (usuario) => usuario.estado === "Activo",
  ).length;

  const usuariosSuspendidos = usuarios.filter(
    (usuario) => usuario.estado === "Suspendido",
  ).length;

  const pedidosEnGestion = pedidos.filter(
    (pedido) => !["Entregado", "Cancelado"].includes(pedido.estadoPedido),
  ).length;

  return (
    <Container fluid className="py-5 px-lg-5 bg-light min-vh-100">
      <h2 className="fw-bold mb-4 font-playfair">Panel de Control - EL JARDIN DE LUNA</h2>

      <AdminStatus
        productosTotales={productos.length}
        productosSinStock={productos.filter((producto) => producto.stock <= 0).length}
        usuariosActivos={usuariosActivos}
        pedidosEnGestion={pedidosEnGestion}
      />

      <Tabs defaultActiveKey="productos" className="mb-4 admin-tabs">
        <Tab eventKey="productos" title="Inventario">
          <div className="bg-white p-4 rounded shadow-sm">
            <Row className="mb-3 g-3">
              <Col md={4}>
                <Button className="w-100 btn-admin-primary" onClick={abrirModalProductoCrear}>
                  + Nuevo Producto
                </Button>
              </Col>

              <Col md={8}>
                <InputGroup>
                  <Form.Control
                    placeholder="Buscar producto..."
                    value={busquedaProd}
                    onChange={(event) => setBusquedaProd(event.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>

            <Table responsive hover className="align-middle">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Categoria</th>
                  <th>Stock</th>
                  <th>Precio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((producto) => (
                  <tr key={producto._id}>
                    <td>
                      <img
                        src={producto.imagenUrl}
                        alt={producto.nombre}
                        style={{
                          width: "40px",
                          height: "40px",
                          objectFit: "cover",
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="fw-bold">{producto.nombre}</td>
                    <td>
                      <Badge bg="info" text="dark">
                        {producto.categoria}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={producto.stock > 0 ? "success" : "danger"}>
                        {producto.stock}
                      </Badge>
                    </td>
                    <td>{formatCurrency(producto.precio)}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => abrirModalProductoEditar(producto)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>

                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => eliminarProducto(producto._id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="usuarios" title="Usuarios">
          <div className="bg-white p-4 rounded shadow-sm">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
              <div>
                <h5 className="fw-bold mb-1">Gestion de clientes</h5>
                <p className="text-muted mb-0">
                  Busca usuarios y administra su acceso desde el panel.
                </p>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <Badge bg="primary">{usuarios.length} registrados</Badge>
                <Badge bg="success">{usuariosActivos} activos</Badge>
                <Badge bg="warning" text="dark">
                  {usuariosSuspendidos} suspendidos
                </Badge>
              </div>
            </div>

            <Row className="mb-3 g-3">
              <Col md={8} lg={6}>
                <InputGroup>
                  <Form.Control
                    placeholder="Buscar por nombre, email o WhatsApp..."
                    value={busquedaUsuario}
                    onChange={(event) => setBusquedaUsuario(event.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>

            <Table responsive hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>Nombre y Apellido</th>
                  <th>Email</th>
                  <th>WhatsApp</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map((usuario) => {
                    const usuarioId = getUsuarioId(usuario);
                    const esUsuarioActual = usuarioId === getUsuarioId(user);
                    const esCuentaProtegida =
                      usuario.rol === "Administrador" || esUsuarioActual;
                    const estaProcesando = usuarioProcesandoId === usuarioId;
                    const puedeAbrirWhatsapp = Boolean(usuario.telefono);

                    return (
                    <tr key={usuarioId}>
                      <td>
                        <div className="fw-bold">
                          {usuario.nombre} {usuario.apellido}
                        </div>
                        <small className="text-muted">
                          ID: {usuarioId}
                        </small>
                      </td>
                      <td>{usuario.email}</td>
                      <td>
                        {puedeAbrirWhatsapp ? (
                          <a
                            href={`https://wa.me/${usuario.telefono}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-decoration-none text-success fw-semibold"
                          >
                            <i className="bi bi-whatsapp me-1"></i>
                            {usuario.telefono}
                          </a>
                        ) : (
                          <span className="text-muted">Sin telefono</span>
                        )}
                      </td>
                      <td>
                        <Badge
                          bg={usuario.rol === "Administrador" ? "danger" : "secondary"}
                        >
                          {usuario.rol}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={getUsuarioStatusVariant(usuario.estado)}>
                          {usuario.estado}
                        </Badge>
                        {esUsuarioActual && (
                          <div className="small text-muted mt-1">Tu cuenta</div>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant={
                              usuario.estado === "Activo"
                                ? "outline-warning"
                                : "outline-success"
                            }
                            size="sm"
                            disabled={esCuentaProtegida || estaProcesando}
                            onClick={() => cambiarEstadoUsuario(usuario)}
                            title={
                              esCuentaProtegida
                                ? "No puedes cambiar el estado de esta cuenta"
                                : ""
                            }
                          >
                            {estaProcesando ? (
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                                aria-hidden="true"
                              ></span>
                            ) : usuario.estado === "Activo" ? (
                              <>
                                <i className="bi bi-person-slash me-1"></i>
                                Suspender
                              </>
                            ) : (
                              <>
                                <i className="bi bi-person-check me-1"></i>
                                Activar
                              </>
                            )}
                          </Button>

                          <Button
                            variant="outline-danger"
                            size="sm"
                            disabled={esCuentaProtegida || estaProcesando}
                            onClick={() => eliminarUsuario(usuario)}
                            title={
                              esCuentaProtegida
                                ? "No puedes eliminar esta cuenta"
                                : ""
                            }
                          >
                            <i className="bi bi-trash me-1"></i>
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )})
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      No se encontraron usuarios para esa busqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="pedidos" title="Pedidos">
          <div className="bg-white p-4 rounded shadow-sm">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
              <div>
                <h5 className="fw-bold mb-1">Gestion de pedidos</h5>
                <p className="text-muted mb-0">
                  Revisa estados, pagos y resumenes de compra.
                </p>
              </div>

              <Badge bg="warning" text="dark" className="fs-6">
                {pedidosEnGestion} en gestion
              </Badge>
            </div>

            {cargandoPedidos ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status"></div>
                <p className="text-muted mt-3 mb-0">Cargando pedidos...</p>
              </div>
            ) : pedidos.length > 0 ? (
              <Table responsive hover className="align-middle">
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
                  {pedidos.map((pedido) => (
                    <tr key={pedido._id}>
                      <td>
                        <div className="fw-bold">
                          #{String(pedido._id).slice(-6).toUpperCase()}
                        </div>
                        <small className="text-muted">
                          {pedido.productos?.length || 0} producto(s)
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
                          Subtotal {formatCurrency(getPedidoSubtotal(pedido))} + envio{" "}
                          {formatCurrency(getPedidoEnvioCosto(pedido))}
                        </small>
                      </td>

                      <td>
                        <Badge bg={getPagoStatusVariant(pedido.pago?.estado)}>
                          {pedido.pago?.estado || "pending"}
                        </Badge>
                      </td>

                      <td>
                        <Badge bg={getPedidoStatusVariant(pedido.estadoPedido)}>
                          {pedido.estadoPedido}
                        </Badge>
                      </td>

                      <td>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => abrirModalPedido(pedido)}
                        >
                          Gestionar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-receipt display-1 d-block mb-3 opacity-25"></i>
                <h5 className="fw-bold">Todavia no hay pedidos</h5>
                <p className="mb-0">
                  Cuando entren compras, vas a poder seguirlas desde esta pestana.
                </p>
              </div>
            )}
          </div>
        </Tab>
      </Tabs>

      <ProductoModal
        show={showProdModal}
        modoProducto={modoProducto}
        productoInicial={productoForm}
        cerrarModalProducto={() => setShowProdModal(false)}
        guardarProducto={guardarProducto}
      />

      <PedidoModal
        show={showPedidoModal}
        pedido={pedidoSeleccionado}
        cerrarModalPedido={() => {
          setShowPedidoModal(false);
          setPedidoSeleccionado(null);
        }}
        guardarPedido={guardarPedido}
        guardandoPedido={guardandoPedido}
      />
    </Container>
  );
}

export default Admin;
