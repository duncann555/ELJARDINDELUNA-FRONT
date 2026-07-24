import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LayoutPrincipal from "./components/layouts/LayoutPrincipal";
import Carrito from "./components/pages/Carrito";
import Checkout from "./components/pages/Checkout";
import Contacto from "./components/pages/Contacto";
import DetalleProducto from "./components/pages/DetalleProducto";
import Error404 from "./components/pages/Error404";
import Informacion from "./components/pages/Informacion";
import Inicio from "./components/pages/Inicio";
import Nosotros from "./components/pages/Nosotros";
import PagoEstado from "./components/pages/PagoEstado";
import Productos from "./components/pages/Productos";
import ProtectorAdmin from "./components/routes/ProtectorAdmin";
import PageState from "./components/shared/PageState";
import { AuthProvider } from "./context/AuthContext";
import { CarritoProvider } from "./context/CarritoContext";
import "./styles/store.css";

const Admin = lazy(() => import("./components/pages/Admin"));

export default function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <Routes>
          <Route element={<LayoutPrincipal />}>
            <Route index element={<Inicio />} />
            <Route path="productos" element={<Productos />} />
            <Route path="producto/:identifier" element={<DetalleProducto />} />
            <Route path="carrito" element={<Carrito />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="pago/success" element={<PagoEstado />} />
            <Route path="pago/failure" element={<PagoEstado />} />
            <Route path="pago/pending" element={<PagoEstado />} />
            <Route path="nosotros" element={<Nosotros />} />
            <Route path="contacto" element={<Contacto />} />
            <Route
              path="preguntas-frecuentes"
              element={<Informacion tipo="/preguntas-frecuentes" />}
            />
            <Route
              path="terminos-y-condiciones"
              element={<Informacion tipo="/terminos-y-condiciones" />}
            />
            <Route
              path="privacidad"
              element={<Informacion tipo="/privacidad" />}
            />
            <Route
              path="cambios-y-devoluciones"
              element={<Informacion tipo="/cambios-y-devoluciones" />}
            />
            <Route path="envios" element={<Informacion tipo="/envios" />} />
            <Route
              path="arrepentimiento"
              element={<Informacion tipo="/arrepentimiento" />}
            />
            <Route
              path="admin"
              element={
                <ProtectorAdmin>
                  <Suspense
                    fallback={
                      <PageState status="loading" />
                    }
                  >
                    <Admin />
                  </Suspense>
                </ProtectorAdmin>
              }
            />
            <Route path="404" element={<Error404 />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </CarritoProvider>
    </AuthProvider>
  );
}
