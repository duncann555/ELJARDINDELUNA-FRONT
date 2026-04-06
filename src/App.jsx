import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Admin from "./components/pages/Admin";
import Carrito from "./components/pages/Carrito";
import DetalleProducto from "./components/pages/DetalleProducto";
import Error404 from "./components/pages/Error404";
import Inicio from "./components/pages/Inicio";
import MisCompras from "./components/pages/MisCompras";
import Nosotros from "./components/pages/Nosotros";
import PagoEstado from "./components/pages/PagoEstado";
import Productos from "./components/pages/Productos";
import Register from "./components/pages/Register";
import RecuperarPassword from "./components/pages/RecuperarPassword";
import RestablecerPassword from "./components/pages/RestablecerPassword";
import LayoutPrincipal from "./components/layouts/LayoutPrincipal";
import ProtectorAdmin from "./components/routes/ProtectorAdmin";
import ProtectorSesion from "./components/routes/ProtectorSesion";
import { AuthProvider } from "./context/AuthContext";
import { CarritoProvider } from "./context/CarritoContext";
import "./styles/App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CarritoProvider>
          <div className="min-vh-100">
            <Routes>
              <Route element={<LayoutPrincipal />}>
                <Route path="/" element={<Inicio />} />
                <Route path="/productos" element={<Productos />} />
                <Route path="/producto/:id" element={<DetalleProducto />} />
                <Route path="/nosotros" element={<Nosotros />} />
                <Route path="/contacto" element={<Navigate to="/" replace />} />
                <Route
                  path="/carrito"
                  element={
                    <ProtectorSesion
                      titulo="Primero inicia sesion"
                      mensaje="Necesitas iniciar sesion para ver tu carrito y continuar con la compra."
                    >
                      <Carrito />
                    </ProtectorSesion>
                  }
                />
                <Route
                  path="/mis-compras"
                  element={
                    <ProtectorSesion
                      titulo="Tu historial es privado"
                      mensaje="Necesitas iniciar sesion para revisar las compras que realizaste."
                    >
                      <MisCompras />
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
          </div>
        </CarritoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
