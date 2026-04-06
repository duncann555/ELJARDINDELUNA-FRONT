import { useState } from "react";
import {
  Alert,
  Button,
  FloatingLabel,
  Form,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LayoutRecuperacion from "../layouts/LayoutRecuperacion";
import { normalizeEmail, validateEmail } from "../../helpers/validation";
import "../../styles/login.css";

export default function RecuperarPassword() {
  const { solicitarRecuperacionPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedEmail = normalizeEmail(email);
    const nextFieldError = validateEmail(normalizedEmail);

    setEmail(normalizedEmail);
    setTouched(true);
    setFieldError(nextFieldError);

    if (nextFieldError) {
      return;
    }

    try {
      setLoading(true);
      const data = await solicitarRecuperacionPassword(normalizedEmail);

      setError("");
      setSuccessMessage(
        data?.mensaje ||
          "Si el email existe, te enviaremos un enlace para restablecer tu contrasena.",
      );
    } catch (requestError) {
      setSuccessMessage("");
      setError(
        requestError.message ||
          "No se pudo iniciar la recuperacion de contrasena.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutRecuperacion
      eyebrow="Acceso seguro"
      title="Recuperar contrasena"
      subtitle="Te ayudamos a volver a entrar sin salir del estilo natural y calido de la tienda."
      infoTitle="Te enviamos un enlace privado"
      infoText="Escribe el email de tu cuenta y te mandaremos un enlace para restablecer la contrasena con tranquilidad."
      infoNote="Si no ves el correo en unos minutos, revisa Spam o Promociones."
      infoIcon="bi-envelope-paper-heart"
    >
      <div className="text-center mb-4">
        <p className="recovery-form-kicker mb-2">Restablecer acceso</p>
        <h2 className="font-playfair fw-bold mb-2">Recuperar contrasena</h2>
        <p className="text-muted mb-0">
          Te enviaremos un enlace para restablecer tu clave.
        </p>
      </div>

      {error && (
        <Alert variant="danger" className="py-2 px-3 small text-center">
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="py-2 px-3 small">
          {successMessage}
        </Alert>
      )}

      <Form onSubmit={handleSubmit} noValidate>
        <FloatingLabel label="Email" className="mb-3">
          <Form.Control
            type="email"
            placeholder="Email"
            className="ml-input"
            autoComplete="email"
            minLength={6}
            maxLength={120}
            value={email}
            isInvalid={Boolean(touched && fieldError)}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");

              if (successMessage) {
                setSuccessMessage("");
              }

              if (touched) {
                setFieldError(validateEmail(event.target.value));
              }
            }}
            onBlur={(event) => {
              setTouched(true);
              setFieldError(validateEmail(event.target.value));
            }}
          />
          <Form.Control.Feedback type="invalid">
            {fieldError}
          </Form.Control.Feedback>
        </FloatingLabel>

        <Button
          type="submit"
          className="ml-btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar enlace"}
        </Button>
      </Form>

      <div className="text-center mt-4 pt-3 border-top recovery-footer-links">
        <p className="mb-2 small text-muted">Recordaste tu contrasena?</p>
        <Link to="/" className="text-decoration-none fw-semibold">
          Volver al inicio para ingresar
        </Link>
      </div>
    </LayoutRecuperacion>
  );
}
