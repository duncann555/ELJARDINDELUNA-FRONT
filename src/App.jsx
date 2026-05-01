import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LayoutPrincipal from "./components/layouts/LayoutPrincipal";
import ProtectorAdmin from "./components/routes/ProtectorAdmin";
import ProtectorSesion from "./components/routes/ProtectorSesion";
import { AuthProvider } from "./context/AuthContext";
import { CarritoProvider } from "./context/CarritoContext";
import "./styles/App.css";

const Admin = lazy(() => import("./components/pages/Admin"));
const Carrito = lazy(() => import("./components/pages/Carrito"));
const DetalleProducto = lazy(() => import("./components/pages/DetalleProducto"));
const Error404 = lazy(() => import("./components/pages/Error404"));
const Inicio = lazy(() => import("./components/pages/Inicio"));
const MisCompras = lazy(() => import("./components/pages/MisCompras"));
const Nosotros = lazy(() => import("./components/pages/Nosotros"));
const PagoEstado = lazy(() => import("./components/pages/PagoEstado"));
const Productos = lazy(() => import("./components/pages/Productos"));
const Register = lazy(() => import("./components/pages/Register"));
const RecuperarPassword = lazy(() => import("./components/pages/RecuperarPassword"));
const RestablecerPassword = lazy(() => import("./components/pages/RestablecerPassword"));
const TransferenciaConfirmada = lazy(() =>
  import("./components/pages/TransferenciaConfirmada"),
);

const PageLoader = () => (
  <div className="min-vh-100 d-flex align-items-center justify-content-center">
    <div className="spinner-border text-success" role="status">
      <span className="visually-hidden">Cargando...</span>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CarritoProvider>
          <div className="min-vh-100">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<LayoutPrincipal />}>
                  <Route path="/" element={<Inicio />} />
                  <Route path="/productos" element={<Productos />} />
                  <Route path="/producto/:id" element={<DetalleProducto />} />
                  <Route path="/nosotros" element={<Nosotros />} />
                  <Route
                    path="/carrito"
                    element={
                      <ProtectorSesion
                        titulo="Entra a tu cuenta"
                        mensaje="Asi podemos guardar tu carrito y acompanarte mejor en tu compra"
                      >
                        <Carrito />
                      </ProtectorSesion>
                    }
                  />
                  <Route
                    path="/mis-compras"
                    element={
                      <ProtectorSesion
                        titulo="Tus compras estan protegidas"
                        mensaje="Inicia sesion para consultar tu historial de compras."
                      >
                        <MisCompras />
                      </ProtectorSesion>
                    }
                  />
                  <Route
                    path="/transferencia-confirmada"
                    element={
                      <ProtectorSesion
                        titulo="Primero inicia sesion"
                        mensaje="Necesitas iniciar sesion para ver la confirmacion de tu pedido."
                      >
                        <TransferenciaConfirmada />
                      </ProtectorSesion>
                    }
                  />
                  <Route path="/pago-exitoso" element={<PagoEstado />} />
                  <Route path="/pago-pendiente" element={<PagoEstado />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/recuperar-password"
                    element={<RecuperarPassword />}
                  />
                  <Route
                    path="/restablecer-password"
                    element={<RestablecerPassword />}
                  />
                  <Route path="/login" element={<Navigate to="/" replace />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectorAdmin>
                        <Admin />
                      </ProtectorAdmin>
                    }
                  />
                </Route>

                <Route path="/404" element={<Error404 />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Suspense>
          </div>
        </CarritoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
