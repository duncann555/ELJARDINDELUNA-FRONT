import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  FloatingLabel,
  Form,
} from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AuthRecoveryShell from "../shared/AuthRecoveryShell";
import {
  validatePassword,
  validatePasswordConfirmation,
} from "../../helpers/validation";
import "../../styles/login.css";

export default function ResetPassword() {
  const { restablecerPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const token = useMemo(
    () => String(searchParams.get("token") || "").trim(),
    [searchParams],
  );

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    password: "",
    passwordConfirm: "",
  });
  const [touched, setTouched] = useState({
    password: false,
    passwordConfirm: false,
  });
  const [loading, setLoading] = useState(false);

  const handleFieldChange = (field, value) => {
    if (error) {
      setError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }

    if (field === "password") {
      setPassword(value);
    } else {
      setPasswordConfirm(value);
    }

    if (touched[field] || (field === "password" && touched.passwordConfirm)) {
      const nextPassword = field === "password" ? value : password;
      const nextPasswordConfirm =
        field === "passwordConfirm" ? value : passwordConfirm;

      setFieldErrors({
        password: validatePassword(nextPassword),
        passwordConfirm: validatePasswordConfirmation(
          nextPasswordConfirm,
          nextPassword,
        ),
      });
    }
  };

  const handleFieldBlur = (field) => {
    const nextTouched = {
      ...touched,
      [field]: true,
    };

    setTouched(nextTouched);
    setFieldErrors({
      password: validatePassword(password),
      passwordConfirm: validatePasswordConfirmation(passwordConfirm, password),
    });
  };

  const validateForm = () => {
    const nextErrors = {
      password: validatePassword(password),
      passwordConfirm: validatePasswordConfirmation(passwordConfirm, password),
    };

    setTouched({
      password: true,
      passwordConfirm: true,
    });
    setFieldErrors(nextErrors);

    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("El enlace de recuperacion no es valido o esta incompleto.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const data = await restablecerPassword(token, password);

      setError("");
      setPassword("");
      setPasswordConfirm("");
      setSuccessMessage(
        data?.mensaje || "La contrasena se actualizo correctamente.",
      );
    } catch (resetError) {
      setSuccessMessage("");
      setError(
        resetError.message || "No se pudo restablecer la contrasena.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthRecoveryShell
      eyebrow="Nueva clave"
      title="Restablecer contrasena"
      subtitle="Define una nueva clave para seguir comprando con normalidad dentro del sitio."
      infoTitle="Tu enlace sigue un camino seguro"
      infoText="Cuando guardes la nueva contrasena, el enlace actual dejara de servir y podras ingresar otra vez."
      infoNote="Usa una clave de al menos 8 caracteres."
      infoIcon="bi-shield-lock"
    >
      <div className="text-center mb-4">
        <p className="recovery-form-kicker mb-2">Actualizar acceso</p>
        <h2 className="font-playfair fw-bold mb-2">Restablecer contrasena</h2>
        <p className="text-muted mb-0">
          Ingresa tu nueva contrasena para continuar.
        </p>
      </div>

      {!token && (
        <Alert variant="danger" className="small text-center">
          El enlace de recuperacion no es valido o esta incompleto.
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="py-2 px-3 small text-center">
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="py-2 px-3 small text-center">
          {successMessage}
        </Alert>
      )}

      <Form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <FloatingLabel label="Nueva contrasena">
            <Form.Control
              type={showPasswords ? "text" : "password"}
              placeholder="Nueva contrasena"
              className="ml-input"
              autoComplete="new-password"
              value={password}
              disabled={!token || Boolean(successMessage)}
              isInvalid={Boolean(touched.password && fieldErrors.password)}
              onChange={(event) =>
                handleFieldChange("password", event.target.value)
              }
              onBlur={() => handleFieldBlur("password")}
            />
            <Form.Control.Feedback type="invalid">
              {fieldErrors.password}
            </Form.Control.Feedback>
          </FloatingLabel>
        </div>

        <div className="mb-3">
          <FloatingLabel label="Repetir contrasena">
            <Form.Control
              type={showPasswords ? "text" : "password"}
              placeholder="Repetir contrasena"
              className="ml-input"
              autoComplete="new-password"
              value={passwordConfirm}
              disabled={!token || Boolean(successMessage)}
              isInvalid={Boolean(
                touched.passwordConfirm && fieldErrors.passwordConfirm,
              )}
              onChange={(event) =>
                handleFieldChange("passwordConfirm", event.target.value)
              }
              onBlur={() => handleFieldBlur("passwordConfirm")}
            />
            <Form.Control.Feedback type="invalid">
              {fieldErrors.passwordConfirm}
            </Form.Control.Feedback>
          </FloatingLabel>
        </div>

        <Form.Check
          type="checkbox"
          id="reset-show-passwords"
          label="Mostrar contrasenas"
          className="mb-3"
          checked={showPasswords}
          onChange={(event) => setShowPasswords(event.target.checked)}
          disabled={!token || Boolean(successMessage)}
        />

        <Button
          type="submit"
          className="ml-btn-primary w-100"
          disabled={loading || !token || Boolean(successMessage)}
        >
          {loading ? "Guardando..." : "Guardar nueva contrasena"}
        </Button>
      </Form>

      <div className="text-center mt-4 pt-3 border-top recovery-footer-links">
        <Link to="/" className="text-decoration-none fw-semibold">
          Volver al inicio
        </Link>
      </div>
    </AuthRecoveryShell>
  );
}
