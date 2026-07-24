/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  CART_STORAGE_KEY,
  cartReducer,
  cartSubtotal,
  consumePurchasedCartFromStorage,
  normalizeCartItem,
  reconcileCart,
  sanitizeStoredCart,
} from "../helpers/cart";
import { obtenerProductos } from "../helpers/products";

const CarritoContext = createContext(null);

const leerCarrito = () => {
  try {
    const value = localStorage.getItem(CART_STORAGE_KEY);
    return sanitizeStoredCart(value ? JSON.parse(value) : []);
  } catch {
    return [];
  }
};

export function CarritoProvider({ children }) {
  const [carrito, dispatch] = useReducer(cartReducer, undefined, leerCarrito);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(carrito));
    } catch {
      // El carrito se mantiene en memoria si el navegador bloquea el storage.
    }
  }, [carrito]);

  useEffect(() => {
    const syncCartFromStorage = (event) => {
      if (event.key !== CART_STORAGE_KEY || event.storageArea !== localStorage) {
        return;
      }

      try {
        dispatch({
          type: "replace",
          cart: event.newValue ? JSON.parse(event.newValue) : [],
        });
      } catch {
        // Ignoramos escrituras corruptas de otra pestaña.
      }
    };

    window.addEventListener("storage", syncCartFromStorage);
    return () => window.removeEventListener("storage", syncCartFromStorage);
  }, []);

  const agregarAlCarrito = useCallback((producto, cantidad = 1) => {
    if (!normalizeCartItem(producto, cantidad)) return false;
    dispatch({ type: "add", product: producto, quantity: cantidad });
    return true;
  }, []);

  const incrementar = useCallback(
    (id) => dispatch({ type: "increment", id }),
    [],
  );
  const decrementar = useCallback(
    (id) => dispatch({ type: "decrement", id }),
    [],
  );
  const eliminarDelCarrito = useCallback(
    (id) => dispatch({ type: "remove", id }),
    [],
  );
  const vaciarCarrito = useCallback(() => dispatch({ type: "clear" }), []);

  const consumirLineasPedido = useCallback((lines) => {
    const latestCart = consumePurchasedCartFromStorage(localStorage, lines);

    dispatch(
      latestCart === null
        ? { type: "consume", lines }
        : { type: "replace", cart: latestCart },
    );
  }, []);

  const reconciliar = useCallback(async ({ signal } = {}) => {
    const catalogo = await obtenerProductos({ signal });
    const nextCart = reconcileCart(carrito, catalogo);
    dispatch({ type: "replace", cart: nextCart });
    return nextCart;
  }, [carrito]);

  const value = useMemo(
    () => ({
      carrito,
      agregarAlCarrito,
      incrementar,
      decrementar,
      eliminarDelCarrito,
      vaciarCarrito,
      consumirLineasPedido,
      reconciliar,
      cantidadTotal: carrito.reduce(
        (total, item) => total + item.quantity,
        0,
      ),
      subtotal: cartSubtotal(carrito),
    }),
    [
      agregarAlCarrito,
      carrito,
      consumirLineasPedido,
      decrementar,
      eliminarDelCarrito,
      incrementar,
      reconciliar,
      vaciarCarrito,
    ],
  );

  return (
    <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>
  );
}

export const useCarrito = () => {
  const context = useContext(CarritoContext);

  if (!context) {
    throw new Error("useCarrito debe usarse dentro de CarritoProvider.");
  }

  return context;
};
