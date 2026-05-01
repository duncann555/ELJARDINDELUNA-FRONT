import { useState } from "react";
import { Button, FloatingLabel, Form } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  normalizeEmail,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validateLoginPassword,
} from "../../helpers/validation";
import SocialAuthSection from "../shared/SocialAuthSection.jsx";
import "../../styles/login.css";

const triggerShake = (setShake) => {
  setShake(true);
  window.setTimeout(() => setShake(false), 500);
};

export default function ModalAcceso({ show, onClose }) {
  const navigate = useNavigate();
  const { loginConEmailYPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
  });
  const [shake, setShake] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  if (!show) return null;

  const limpiarFormulario = () => {
    setEmail("");
    setPassword("");
    setShowPass(false);
    setError("");
    setFieldErrors({
      email: "",
      password: "",
    });
  };

  const cerrarModal = () => {
    limpiarFormulario();
    onClose?.();
  };

  const triggerError = (message) => {
    setError(message);
    triggerShake(setShake);
  };

  const handleFieldChange = (field, value) => {
    if (error) {
      setError("");
    }

    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    if (field === "email") {
      setEmail(value);
    } else {
      setPassword(value);
    }
  };

  const validateForm = (nextEmail, nextPassword) => {
    const nextErrors = {
      email: validateEmail(nextEmail),
      password: validateLoginPassword(nextPassword),
    };

    setFieldErrors(nextErrors);

    const tieneErrores = Object.values(nextErrors).some(Boolean);

    if (tieneErrores) {
      triggerShake(setShake);
    }

    return !tieneErrores;
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    const normalizedEmail = normalizeEmail(email);
    setEmail(normalizedEmail);

    if (!validateForm(normalizedEmail, password)) {
      return;
    }

    try {
      setLoginLoading(true);

      const session = await loginConEmailYPassword(normalizedEmail, password);

      limpiarFormulario();
      onClose?.();
      navigate(session?.destination || "/");
    } catch (loginError) {
      console.error("Unified Login Error:", loginError);
      triggerError(loginError.message || "No se pudo iniciar sesión.");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="ml-overlay" onClick={cerrarModal}>
      <div
        className={`ml-modal ${shake ? "shake" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="ml-close" onClick={cerrarModal}>
          <i className="bi bi-x-lg"></i>
        </button>

        <div className="text-center mb-4">
          <div className="ml-brand-badge mb-3">Acceso</div>
          <h2 className="font-playfair fw-bold mb-0 ml-title">Bienvenido</h2>
          <p className="small mb-0 ml-subtitle">
            Ingresá con tu email y contraseña para continuar.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small text-center mb-3">
            {error}
          </div>
        )}

        <SocialAuthSection onSuccess={cerrarModal} />

        <Form onSubmit={handleLogin} noValidate>
          <div className="mb-3">
            <FloatingLabel label="Email">
              <Form.Control
                type="email"
                placeholder=" "
                className="ml-input"
                autoComplete="email"
                minLength={6}
                maxLength={120}
                value={email}
                isInvalid={Boolean(fieldErrors.email)}
                onChange={(event) =>
                  handleFieldChange("email", event.target.value)
                }
              />
              <Form.Control.Feedback type="invalid">
                {fieldErrors.email}
              </Form.Control.Feedback>
            </FloatingLabel>
          </div>

          <div className="mb-3">
            <div
              className={`position-relative ml-password-field ${
                fieldErrors.password ? "has-password-error" : ""
              }`}
            >
              <FloatingLabel label="Contraseña">
                <Form.Control
                  type={showPass ? "text" : "password"}
                  placeholder="Contraseña"
                  className="ml-input pe-5"
                  autoComplete="current-password"
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={password}
                  isInvalid={Boolean(fieldErrors.password)}
                  onChange={(event) =>
                    handleFieldChange("password", event.target.value)
                  }
                />
              </FloatingLabel>

              <button
                type="button"
                className="ml-eye-icon"
                onClick={() => setShowPass((prev) => !prev)}
                aria-label={
                  showPass ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>

            {fieldErrors.password && (
              <div className="invalid-feedback d-block">
                {fieldErrors.password}
              </div>
            )}
          </div>

          <div className="text-end mb-3">
            <Link
              to="/recuperar-password"
              className="small text-decoration-none fw-semibold ml-link"
              onClick={cerrarModal}
            >
              Olvidé mi contraseña
            </Link>
          </div>

          <Button
            type="submit"
            className="ml-btn-primary w-100"
            disabled={loginLoading}
          >
            {loginLoading ? "Ingresando..." : "Iniciar sesión"}
          </Button>

          <div className="text-center mt-3">
            <span className="small ml-subtitle">¿No tenés cuenta? </span>
            <Link
              to="/register"
              className="text-decoration-none fw-semibold ml-link"
              onClick={cerrarModal}
            >
              Registrarse
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
