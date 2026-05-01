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
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedEmail = normalizeEmail(email);
    const nextFieldError = validateEmail(normalizedEmail);

    setEmail(normalizedEmail);
    setSubmitted(true);
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
          "Si el email existe, te vamos a enviar un enlace para restablecer tu contraseña.",
      );
    } catch (requestError) {
      setSuccessMessage("");
      setError(
        requestError.message ||
          "No se pudo iniciar la recuperación de contraseña.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutRecuperacion
      eyebrow="Acceso seguro"
      title="Recuperar contraseña"
      subtitle="Te ayudamos a volver a entrar sin salir del estilo natural y cálido de la tienda."
      infoTitle="Te enviamos un enlace privado"
      infoText="Escribí el email de tu cuenta y te vamos a mandar un enlace para restablecer la contraseña con tranquilidad."
      infoNote="Si no ves el correo en unos minutos, revisá Spam o Promociones."
      infoIcon="bi-envelope-paper-heart"
    >
      <div className="text-center mb-4">
        <p className="recovery-form-kicker mb-2">Restablecer acceso</p>
        <h2 className="font-playfair fw-bold mb-2">Recuperar contraseña</h2>
        <p className="text-muted mb-0">
          Te vamos a enviar un enlace para restablecer tu clave.
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
            placeholder=" "
            className="ml-input"
            autoComplete="email"
            minLength={6}
            maxLength={120}
            value={email}
            isInvalid={Boolean(submitted && fieldError)}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
              setFieldError("");

              if (successMessage) {
                setSuccessMessage("");
              }
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
        <p className="mb-2 small text-muted">¿Recordaste tu contraseña?</p>
        <Link to="/" className="text-decoration-none fw-semibold">
          Volver al inicio para ingresar
        </Link>
      </div>
    </LayoutRecuperacion>
  );
}
