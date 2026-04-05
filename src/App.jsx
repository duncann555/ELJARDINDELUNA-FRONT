import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Admin from "./components/pages/Admin";
import Carrito from "./components/pages/Carrito";
import Contacto from "./components/pages/Contacto";
import DetalleProducto from "./components/pages/DetalleProducto";
import Error404 from "./components/pages/Error404";
import ForgotPassword from "./components/pages/ForgotPassword";
import Inicio from "./components/pages/Inicio";
import MainLayout from "./components/pages/MinLayout";
import Nosotros from "./components/pages/Nosotros";
import PagoEstado from "./components/pages/PagoEstado";
import Productos from "./components/pages/Productos";
import Register from "./components/pages/Register";
import ResetPassword from "./components/pages/ResetPassword";
import ProtectorAdmin from "./components/routes/ProtectorAdmin";
import ProtectorCarrito from "./components/routes/ProtectorCarrito";
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
              <Route element={<MainLayout />}>
                <Route path="/" element={<Inicio />} />
                <Route path="/productos" element={<Productos />} />
                <Route path="/producto/:id" element={<DetalleProducto />} />
                <Route path="/nosotros" element={<Nosotros />} />
                <Route path="/contacto" element={<Contacto />} />
                <Route
                  path="/carrito"
                  element={
                    <ProtectorCarrito>
                      <Carrito />
                    </ProtectorCarrito>
                  }
                />
                <Route path="/pago-exitoso" element={<PagoEstado />} />
                <Route path="/pago-pendiente" element={<PagoEstado />} />
                <Route path="/register" element={<Register />} />
                <Route path="/recuperar-password" element={<ForgotPassword />} />
                <Route path="/restablecer-password" element={<ResetPassword />} />
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
