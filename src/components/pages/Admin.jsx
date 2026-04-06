import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Container, Tab, Tabs } from "react-bootstrap";
import Swal from "sweetalert2";
import ModalPedidoAdmin from "../admin/ModalPedidoAdmin";
import ModalProductoAdmin from "../admin/ModalProductoAdmin";
import ResumenAdmin from "../admin/ResumenAdmin";
import SeccionPedidosAdmin from "../admin/SeccionPedidosAdmin";
import SeccionProductosAdmin from "../admin/SeccionProductosAdmin";
import SeccionUsuariosAdmin from "../admin/SeccionUsuariosAdmin";
import {
  PRODUCTO_VACIO,
  obtenerIdUsuario,
} from "../admin/utilidadesAdmin";
import { useAuth } from "../../context/AuthContext";
import {
  getApiErrorMessage,
  getApiValidationErrors,
  isAuthError,
} from "../../helpers/app";
import { solicitarApi } from "../../helpers/clienteApi";
import "../../styles/admin.css";

const mostrarExito = (mensaje) => Swal.fire("Exito", mensaje, "success");
const mostrarError = (mensaje) => Swal.fire("Error", mensaje, "error");

const mostrarErroresValidacion = async (errores) => {
  const mensajes = errores.map((error) => `<li>${error}</li>`).join("");

  await Swal.fire({
    title: "Error",
    html: `<ul class="text-start mb-0 ps-3">${mensajes}</ul>`,
    icon: "error",
  });
};

export default function Admin() {
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

  const manejarSesionInvalida = useCallback(
    async (datos) => {
      if (sesionInvalidaRef.current) {
        return;
      }

      sesionInvalidaRef.current = true;
      logout();

      await Swal.fire({
        title: "Sesion vencida",
        text:
          datos?.mensaje ||
          "Tu sesion ya no es valida. Ingresa nuevamente para seguir administrando productos.",
        icon: "info",
        confirmButtonText: "Entendido",
      });
    },
    [logout],
  );

  const solicitarConAuthAdmin = useCallback(
    async (ruta, opciones = {}) => {
      const resultado = await solicitarApi(ruta, {
        token,
        ...opciones,
      });

      if (isAuthError(resultado.respuesta, resultado.datos)) {
        await manejarSesionInvalida(resultado.datos);
        return { ...resultado, sesionInvalida: true };
      }

      return { ...resultado, sesionInvalida: false };
    },
    [manejarSesionInvalida, token],
  );

  const cargarProductos = useCallback(async () => {
    if (!token) return;

    try {
      const { respuesta, datos, sesionInvalida } = await solicitarConAuthAdmin(
        "/productos/admin/todos",
      );

      if (sesionInvalida) {
        return;
      }

      if (!respuesta.ok) {
        throw new Error(
          getApiErrorMessage(datos, "No se pudieron cargar los productos."),
        );
      }

      setProductos(Array.isArray(datos) ? datos : datos?.productos || []);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  }, [solicitarConAuthAdmin, token]);

  const cargarUsuarios = useCallback(async () => {
    if (!token) return;

    try {
      const { respuesta, datos, sesionInvalida } = await solicitarConAuthAdmin(
        "/usuarios",
      );

      if (sesionInvalida) {
        return;
      }

      if (!respuesta.ok) {
        throw new Error(
          getApiErrorMessage(datos, "No se pudieron cargar los usuarios."),
        );
      }

      setUsuarios(Array.isArray(datos) ? datos : datos?.usuarios || []);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  }, [solicitarConAuthAdmin, token]);

  const cargarPedidos = useCallback(async () => {
    if (!token) return;

    try {
      setCargandoPedidos(true);
      const { respuesta, datos, sesionInvalida } = await solicitarConAuthAdmin(
        "/pedidos",
      );

      if (sesionInvalida) {
        return;
      }

      if (!respuesta.ok) {
        throw new Error(
          getApiErrorMessage(datos, "No se pudieron cargar los pedidos."),
        );
      }

      setPedidos(Array.isArray(datos) ? datos : datos?.pedidos || []);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setCargandoPedidos(false);
    }
  }, [solicitarConAuthAdmin, token]);

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

  const cerrarModalProducto = () => {
    setShowProdModal(false);
  };

  const abrirModalPedido = (pedido) => {
    setPedidoSeleccionado(pedido);
    setShowPedidoModal(true);
  };

  const cerrarModalPedido = () => {
    setShowPedidoModal(false);
    setPedidoSeleccionado(null);
  };

  const guardarProducto = async (formData) => {
    try {
      const ruta =
        modoProducto === "editar"
          ? `/productos/${productoSeleccionadoId}`
          : "/productos";
      const metodo = modoProducto === "editar" ? "PUT" : "POST";

      const { respuesta, datos, sesionInvalida } = await solicitarConAuthAdmin(
        ruta,
        {
          method: metodo,
          body: formData,
        },
      );

      if (sesionInvalida) {
        return;
      }

      const erroresValidacion = getApiValidationErrors(datos);

      if (respuesta.status === 400 && erroresValidacion.length > 0) {
        await mostrarErroresValidacion(erroresValidacion);
        return;
      }

      if (!respuesta.ok) {
        throw new Error(getApiErrorMessage(datos, "No se pudo guardar el producto."));
      }

      await cargarProductos();
      cerrarModalProducto();
      await mostrarExito("Producto guardado correctamente");
    } catch (error) {
      await mostrarError(error.message);
    }
  };

  const guardarPedido = async (formulario) => {
    if (!pedidoSeleccionado) return;

    try {
      setGuardandoPedido(true);

      const { respuesta, datos, sesionInvalida } = await solicitarConAuthAdmin(
        `/pedidos/${pedidoSeleccionado._id}`,
        {
          method: "PATCH",
          json: { estadoPedido: formulario.estadoPedido },
        },
      );

      if (sesionInvalida) {
        return;
      }

      const erroresValidacion = getApiValidationErrors(datos);

      if (respuesta.status === 400 && erroresValidacion.length > 0) {
        throw new Error(erroresValidacion.join(" | "));
      }

      if (!respuesta.ok) {
        throw new Error(
          getApiErrorMessage(datos, "No se pudo actualizar el pedido."),
        );
      }

      await cargarPedidos();
      cerrarModalPedido();
      await mostrarExito("Estado del pedido actualizado");
    } catch (error) {
      await mostrarError(error.message);
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
      const { respuesta, datos, sesionInvalida } = await solicitarConAuthAdmin(
        `/productos/${id}`,
        {
          method: "DELETE",
        },
      );

      if (sesionInvalida) {
        return;
      }

      if (!respuesta.ok) {
        throw new Error(
          getApiErrorMessage(datos, "No se pudo eliminar el producto."),
        );
      }

      await cargarProductos();
      await mostrarExito("Producto eliminado correctamente");
    } catch (error) {
      await mostrarError(error.message);
    }
  };

  const cambiarEstadoUsuario = async (usuario) => {
    const usuarioId = obtenerIdUsuario(usuario);
    const nuevoEstado = usuario.estado === "Activo" ? "Suspendido" : "Activo";

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

      const { respuesta, datos, sesionInvalida } = await solicitarConAuthAdmin(
        `/usuarios/${usuarioId}`,
        {
          method: "PATCH",
          json: { estado: nuevoEstado },
        },
      );

      if (sesionInvalida) {
        return;
      }

      if (!respuesta.ok) {
        throw new Error(
          getApiErrorMessage(datos, "No se pudo actualizar el usuario."),
        );
      }

      await cargarUsuarios();
      await mostrarExito(
        `Usuario ${nuevoEstado.toLowerCase()} correctamente`,
      );
    } catch (error) {
      await mostrarError(error.message);
    } finally {
      setUsuarioProcesandoId(null);
    }
  };

  const eliminarUsuario = async (usuario) => {
    const usuarioId = obtenerIdUsuario(usuario);

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

      const { respuesta, datos, sesionInvalida } = await solicitarConAuthAdmin(
        `/usuarios/${usuarioId}`,
        {
          method: "DELETE",
        },
      );

      if (sesionInvalida) {
        return;
      }

      if (!respuesta.ok) {
        throw new Error(
          getApiErrorMessage(datos, "No se pudo eliminar el usuario."),
        );
      }

      await cargarUsuarios();
      await mostrarExito("Usuario eliminado correctamente");
    } catch (error) {
      await mostrarError(error.message);
    } finally {
      setUsuarioProcesandoId(null);
    }
  };

  const productosFiltrados = useMemo(() => {
    const termino = busquedaProd.toLowerCase();

    return productos.filter(
      (producto) =>
        (producto.nombre || "").toLowerCase().includes(termino) ||
        (producto.categoria || "").toLowerCase().includes(termino),
    );
  }, [busquedaProd, productos]);

  const usuariosFiltrados = useMemo(() => {
    const termino = busquedaUsuario.toLowerCase();

    return usuarios.filter((usuario) => {
      const nombreCompleto =
        `${usuario.nombre || ""} ${usuario.apellido || ""}`.toLowerCase();

      return (
        nombreCompleto.includes(termino) ||
        (usuario.email || "").toLowerCase().includes(termino) ||
        (usuario.telefono || "").toLowerCase().includes(termino)
      );
    });
  }, [busquedaUsuario, usuarios]);

  const usuariosActivos = useMemo(
    () => usuarios.filter((usuario) => usuario.estado === "Activo").length,
    [usuarios],
  );

  const usuariosSuspendidos = useMemo(
    () => usuarios.filter((usuario) => usuario.estado === "Suspendido").length,
    [usuarios],
  );

  const pedidosEnGestion = useMemo(
    () =>
      pedidos.filter(
        (pedido) => !["Entregado", "Cancelado"].includes(pedido.estadoPedido),
      ).length,
    [pedidos],
  );

  const productosSinStock = useMemo(
    () => productos.filter((producto) => producto.stock <= 0).length,
    [productos],
  );

  return (
    <Container fluid className="py-5 px-lg-5 bg-light min-vh-100">
      <h2 className="fw-bold mb-4 font-playfair">
        Panel de Control - EL JARDIN DE LUNA
      </h2>

      <ResumenAdmin
        productosTotales={productos.length}
        productosSinStock={productosSinStock}
        usuariosActivos={usuariosActivos}
        pedidosEnGestion={pedidosEnGestion}
      />

      <Tabs defaultActiveKey="productos" className="mb-4 admin-tabs">
        <Tab eventKey="productos" title="Inventario">
          <SeccionProductosAdmin
            busqueda={busquedaProd}
            onBuscarChange={setBusquedaProd}
            productos={productosFiltrados}
            onNuevoProducto={abrirModalProductoCrear}
            onEditarProducto={abrirModalProductoEditar}
            onEliminarProducto={eliminarProducto}
          />
        </Tab>

        <Tab eventKey="usuarios" title="Usuarios">
          <SeccionUsuariosAdmin
            usuarioActual={user}
            busqueda={busquedaUsuario}
            onBuscarChange={setBusquedaUsuario}
            usuarios={usuariosFiltrados}
            totalUsuarios={usuarios.length}
            usuariosActivos={usuariosActivos}
            usuariosSuspendidos={usuariosSuspendidos}
            usuarioProcesandoId={usuarioProcesandoId}
            onCambiarEstadoUsuario={cambiarEstadoUsuario}
            onEliminarUsuario={eliminarUsuario}
          />
        </Tab>

        <Tab eventKey="pedidos" title="Pedidos">
          <SeccionPedidosAdmin
            pedidos={pedidos}
            cargandoPedidos={cargandoPedidos}
            pedidosEnGestion={pedidosEnGestion}
            onGestionarPedido={abrirModalPedido}
          />
        </Tab>
      </Tabs>

      <ModalProductoAdmin
        show={showProdModal}
        modoProducto={modoProducto}
        productoInicial={productoForm}
        cerrarModalProducto={cerrarModalProducto}
        guardarProducto={guardarProducto}
      />

      <ModalPedidoAdmin
        show={showPedidoModal}
        pedido={pedidoSeleccionado}
        cerrarModalPedido={cerrarModalPedido}
        guardarPedido={guardarPedido}
        guardandoPedido={guardandoPedido}
      />
    </Container>
  );
}
