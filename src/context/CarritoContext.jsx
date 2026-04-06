/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  getApiErrorMessage,
} from "../helpers/app";
import { solicitarApi } from "../helpers/clienteApi";
import { useAuth } from "./AuthContext";

const CarritoContext = createContext();
const STORAGE_KEY_PREFIX = "eljardinluna_carrito";

const obtenerProductoId = (producto) => producto?._id ?? producto?.id ?? producto?.productoId;
const obtenerStorageKeyUsuario = (userId) => `${STORAGE_KEY_PREFIX}:${userId}`;
const normalizarTextoCatalogo = (value) => String(value || "").trim().toLowerCase();

const normalizarItemCarrito = (item) => {
  const productoId = obtenerProductoId(item);

  if (!productoId) return null;

  return {
    _id: productoId,
    productoId,
    nombre: typeof item?.nombre === "string" ? item.nombre : "",
    precio: Number(item?.precio || 0),
    cantidad: Math.max(1, Number(item?.cantidad || 1)),
    imagenUrl: typeof item?.imagenUrl === "string" ? item.imagenUrl : "",
  };
};

const normalizarCarrito = (carrito) =>
  Array.isArray(carrito)
    ? carrito.map(normalizarItemCarrito).filter(Boolean)
    : [];

const compactarCarrito = (carrito) => {
  const acumulado = new Map();

  normalizarCarrito(carrito).forEach((item) => {
    const productoId = String(obtenerProductoId(item));
    const previo = acumulado.get(productoId);

    if (previo) {
      acumulado.set(productoId, {
        ...previo,
        cantidad: previo.cantidad + item.cantidad,
      });
      return;
    }

    acumulado.set(productoId, item);
  });

  return Array.from(acumulado.values());
};

const reconciliarCarritoConCatalogo = (carrito, catalogo) => {
  const productos = Array.isArray(catalogo) ? catalogo : [];

  if (productos.length === 0) {
    return compactarCarrito(carrito);
  }

  const productosPorId = new Map(
    productos
      .filter((producto) => producto?._id)
      .map((producto) => [String(producto._id), producto]),
  );

  const productosPorNombre = new Map(
    productos
      .filter((producto) => producto?.nombre)
      .map((producto) => [normalizarTextoCatalogo(producto.nombre), producto]),
  );

  const carritoReconciliado = normalizarCarrito(carrito).flatMap((item) => {
    const productoIdActual = String(obtenerProductoId(item) || "");
    const productoPorId = productosPorId.get(productoIdActual);
    const productoPorNombre = productosPorNombre.get(
      normalizarTextoCatalogo(item.nombre),
    );
    const productoCatalogo = productoPorId || productoPorNombre;

    if (!productoCatalogo) {
      return [];
    }

    return [
      {
        _id: String(productoCatalogo._id),
        productoId: String(productoCatalogo._id),
        nombre:
          typeof productoCatalogo.nombre === "string" && productoCatalogo.nombre.trim()
            ? productoCatalogo.nombre
            : item.nombre,
        precio: Number(productoCatalogo.precio || item.precio || 0),
        cantidad: Math.max(1, Number(item.cantidad || 1)),
        imagenUrl:
          typeof productoCatalogo.imagenUrl === "string" && productoCatalogo.imagenUrl.trim()
            ? productoCatalogo.imagenUrl
            : item.imagenUrl,
      },
    ];
  });

  return compactarCarrito(carritoReconciliado);
};

const serializarCarritoParaApi = (carrito) =>
  normalizarCarrito(carrito).map((item) => ({
    productoId: item.productoId,
    nombre: item.nombre,
    precio: item.precio,
    cantidad: item.cantidad,
    imagenUrl: item.imagenUrl,
  }));

const obtenerFirmaCarrito = (carrito) =>
  JSON.stringify(serializarCarritoParaApi(carrito));

const leerCarritoPersistido = (userId) => {
  if (!userId) return [];

  try {
    const datosGuardados = localStorage.getItem(obtenerStorageKeyUsuario(userId));
    return normalizarCarrito(datosGuardados ? JSON.parse(datosGuardados) : []);
  } catch (error) {
    console.error("No se pudo recuperar el carrito guardado:", error);
    return [];
  }
};

const guardarCarritoPersistido = (userId, carrito) => {
  if (!userId) return;

  localStorage.setItem(
    obtenerStorageKeyUsuario(userId),
    JSON.stringify(normalizarCarrito(carrito)),
  );
};

const limpiarPersistenciaCarrito = (userId) => {
  if (!userId) return;

  localStorage.removeItem(obtenerStorageKeyUsuario(userId));
};

const obtenerCarritoBaseUsuario = (user) => {
  const remoteCart = normalizarCarrito(user?.carrito);

  if (remoteCart.length > 0) {
    return remoteCart;
  }

  return leerCarritoPersistido(user?.uid);
};

const obtenerCatalogoProductos = async ({ signal } = {}) => {
  const { respuesta, datos } = await solicitarApi("/productos", { signal });

  if (!respuesta.ok) {
    throw new Error(
      getApiErrorMessage(datos, "No se pudo recuperar el catalogo."),
    );
  }

  return Array.isArray(datos) ? datos : [];
};

export const CarritoProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [carrito, setCarrito] = useState(() =>
    isAuthenticated && user?.uid ? obtenerCarritoBaseUsuario(user) : [],
  );
  const previousUserIdRef = useRef(user?.uid || null);
  const hidratacionCompletaRef = useRef(!isAuthenticated || !user?.uid);
  const ultimaFirmaRemotaRef = useRef(
    isAuthenticated && user?.uid ? obtenerFirmaCarrito(user?.carrito || []) : "",
  );

  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    const currentUserId = user?.uid || null;

    if (!isAuthenticated || !currentUserId || !token) {
      if (previousUserId) {
        // Cuando la sesion termina, ocultamos el carrito en la UI pero lo mantenemos
        // persistido en la cuenta para restaurarlo al volver a ingresar.
        setCarrito([]);
      }

      hidratacionCompletaRef.current = true;
      ultimaFirmaRemotaRef.current = "";
      previousUserIdRef.current = currentUserId;
      return undefined;
    }

    const carritoBase = obtenerCarritoBaseUsuario(user);
    setCarrito(carritoBase);
    hidratacionCompletaRef.current = false;
    previousUserIdRef.current = currentUserId;

    const controller = new AbortController();

    const hidratarCarrito = async () => {
      try {
        const { respuesta, datos } = await solicitarApi(
          `/usuarios/${currentUserId}`,
          {
          token,
          signal: controller.signal,
          },
        );

        if (!respuesta.ok) {
          throw new Error(
            getApiErrorMessage(
              datos,
              "No se pudo recuperar el carrito de la cuenta.",
            ),
          );
        }

        const carritoRemoto = normalizarCarrito(datos?.carrito);
        const carritoLocal = leerCarritoPersistido(currentUserId);
        const carritoBaseFinal = carritoRemoto.length > 0 ? carritoRemoto : carritoLocal;
        const catalogo = await obtenerCatalogoProductos({ signal: controller.signal });
        const carritoFinal = reconciliarCarritoConCatalogo(carritoBaseFinal, catalogo);

        ultimaFirmaRemotaRef.current = obtenerFirmaCarrito(carritoFinal);

        if (!controller.signal.aborted) {
          setCarrito(carritoFinal);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("No se pudo hidratar el carrito remoto:", error);
          ultimaFirmaRemotaRef.current = obtenerFirmaCarrito(carritoBase);
        }
      } finally {
        if (!controller.signal.aborted) {
          hidratacionCompletaRef.current = true;
        }
      }
    };

    void hidratarCarrito();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, token, user]);

  useEffect(() => {
    const userId = user?.uid;

    if (!isAuthenticated || !userId || !token) {
      return;
    }

    if (carrito.length === 0) {
      limpiarPersistenciaCarrito(userId);
    } else {
      guardarCarritoPersistido(userId, carrito);
    }

    if (!hidratacionCompletaRef.current) {
      return;
    }

    const firmaActual = obtenerFirmaCarrito(carrito);
    if (firmaActual === ultimaFirmaRemotaRef.current) {
      return;
    }

    const sincronizarCarrito = async () => {
      try {
        const { respuesta, datos } = await solicitarApi(
          `/usuarios/carrito/${userId}`,
          {
          method: "PUT",
          token,
          json: {
            carrito: serializarCarritoParaApi(carrito),
          },
          },
        );

        if (!respuesta.ok) {
          throw new Error(
            getApiErrorMessage(datos, "No se pudo sincronizar el carrito."),
          );
        }

        const carritoNormalizado = normalizarCarrito(datos?.carrito || carrito);
        ultimaFirmaRemotaRef.current = obtenerFirmaCarrito(carritoNormalizado);

        if (obtenerFirmaCarrito(carritoNormalizado) !== firmaActual) {
          setCarrito(carritoNormalizado);
        }
      } catch (error) {
        console.error("No se pudo guardar el carrito remoto:", error);
      }
    };

    void sincronizarCarrito();
  }, [carrito, isAuthenticated, token, user?.uid]);

  const normalizarCarritoConCatalogo = async (baseCarrito = carrito) => {
    const catalogo = await obtenerCatalogoProductos();
    const carritoReconciliado = reconciliarCarritoConCatalogo(baseCarrito, catalogo);

    if (obtenerFirmaCarrito(carritoReconciliado) !== obtenerFirmaCarrito(baseCarrito)) {
      setCarrito(carritoReconciliado);
    }

    return carritoReconciliado;
  };

  const agregarAlCarrito = (producto) => {
    if (!isAuthenticated) {
      return false;
    }

    const productoId = obtenerProductoId(producto);
    if (!productoId) return false;

    setCarrito((prevCarrito) => {
      const itemExistente = prevCarrito.find(
        (item) => obtenerProductoId(item) === productoId,
      );

      if (itemExistente) {
        return prevCarrito.map((item) =>
          obtenerProductoId(item) === productoId
            ? { ...item, cantidad: item.cantidad + 1 }
            : item,
        );
      }

      return [
        ...prevCarrito,
        normalizarItemCarrito({ ...producto, cantidad: 1 }),
      ].filter(Boolean);
    });

    return true;
  };

  const restarDelCarrito = (id) => {
    setCarrito((prevCarrito) =>
      prevCarrito.flatMap((item) => {
        if (obtenerProductoId(item) !== id) return item;
        if (item.cantidad <= 1) return [];
        return { ...item, cantidad: item.cantidad - 1 };
      }),
    );
  };

  const eliminarDelCarrito = (id) => {
    setCarrito((prevCarrito) =>
      prevCarrito.filter((item) => obtenerProductoId(item) !== id),
    );
  };

  const vaciarCarrito = () => {
    setCarrito([]);
  };

  const cantidadTotal = carrito.reduce(
    (acumulado, item) => acumulado + item.cantidad,
    0,
  );

  return (
    <CarritoContext.Provider
      value={{
        carrito,
        agregarAlCarrito,
        restarDelCarrito,
        eliminarDelCarrito,
        vaciarCarrito,
        cantidadTotal,
        puedeAgregarProductos: isAuthenticated,
        normalizarCarritoConCatalogo,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
};

export const useCarrito = () => useContext(CarritoContext);
