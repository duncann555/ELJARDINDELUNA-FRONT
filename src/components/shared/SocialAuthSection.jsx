import { useEffect, useState } from "react";
import { Alert, Button, FloatingLabel, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { validateTelefono } from "../../helpers/validation";
import { autenticarConProveedorFirebase } from "../../lib/firebase";

const SOCIAL_OPTIONS = [
  {
    key: "google",
    label: "Continuar con Google",
    icon: "bi-google",
  },
  {
    key: "facebook",
    label: "Continuar con Facebook",
    icon: "bi-facebook",
  },
];

const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

export default function SocialAuthSection({ onSuccess, onPhoneStepChange }) {
  const navigate = useNavigate();
  const { loginConFirebaseSocial } = useAuth();
  const [error, setError] = useState("");
  const [pendingAuth, setPendingAuth] = useState(null);
  const [telefono, setTelefono] = useState("");
  const [telefonoError, setTelefonoError] = useState("");
  const [loadingProvider, setLoadingProvider] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    onPhoneStepChange?.(Boolean(pendingAuth));
  }, [onPhoneStepChange, pendingAuth]);

  const completarAccesoSocial = async ({
    provider,
    idToken,
    telefonoValue = "",
  }) => {
    const result = await loginConFirebaseSocial({
      provider,
      idToken,
      telefono: telefonoValue,
    });

    if (result?.requiresPhone) {
      setPendingAuth({
        provider,
        idToken,
        profile: result.profile || {},
      });
      return;
    }

    setPendingAuth(null);
    setTelefono("");
    setTelefonoError("");
    setError("");

    if (onSuccess) {
      await onSuccess(result);
    }

    navigate(result?.destination || "/");
  };

  const handleProviderLogin = async (providerKey) => {
    setError("");
    setTelefonoError("");
    setLoadingProvider(providerKey);

    try {
      const authData = await autenticarConProveedorFirebase(providerKey);
      await completarAccesoSocial({
        provider: providerKey,
        idToken: authData.idToken,
      });
    } catch (socialError) {
      setError(
        socialError.message ||
          "No se pudo completar el acceso con la cuenta social.",
      );
    } finally {
      setLoadingProvider("");
    }
  };

  const handlePhoneSubmit = async (event) => {
    event.preventDefault();

    if (!pendingAuth) {
      return;
    }

    const normalizedPhone = normalizeDigits(telefono);
    const validationMessage = validateTelefono(normalizedPhone);

    if (validationMessage) {
      setTelefonoError(validationMessage);
      return;
    }

    setTelefonoError("");
    setError("");
    setSavingPhone(true);

    try {
      await completarAccesoSocial({
        provider: pendingAuth.provider,
        idToken: pendingAuth.idToken,
        telefonoValue: normalizedPhone,
      });
    } catch (socialError) {
      setError(
        socialError.message ||
          "No se pudo guardar tu numero de WhatsApp.",
      );
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <div className="social-auth-shell mt-4">
      <div className="social-auth-divider">
        <span>o continua con</span>
      </div>

      {error && (
        <Alert variant="danger" className="py-2 px-3 small text-center mb-3">
          {error}
        </Alert>
      )}

      <div className="d-grid gap-2">
        {SOCIAL_OPTIONS.map((option) => (
          <Button
            key={option.key}
            type="button"
            variant="light"
            className="social-auth-btn"
            onClick={() => handleProviderLogin(option.key)}
            disabled={Boolean(loadingProvider || savingPhone)}
          >
            {loadingProvider === option.key ? (
              "Conectando..."
            ) : (
              <>
                <i className={`bi ${option.icon}`}></i>
                <span>{option.label}</span>
              </>
            )}
          </Button>
        ))}
      </div>

      {pendingAuth && (
        <Form className="mt-3" onSubmit={handlePhoneSubmit} noValidate>
          <Alert variant="info" className="py-2 px-3 small">
            {`Tu cuenta de ${
              pendingAuth.provider === "google" ? "Google" : "Facebook"
            } ya fue validada. Solo falta tu numero de WhatsApp para terminar.`}
          </Alert>

          <FloatingLabel label="Numero de WhatsApp">
            <Form.Control
              type="text"
              inputMode="numeric"
              placeholder="Numero de WhatsApp"
              className="ml-input"
              minLength={8}
              maxLength={15}
              value={telefono}
              isInvalid={Boolean(telefonoError)}
              onChange={(event) => {
                setTelefono(normalizeDigits(event.target.value));
                if (telefonoError) {
                  setTelefonoError("");
                }
              }}
            />
            <Form.Control.Feedback type="invalid">
              {telefonoError}
            </Form.Control.Feedback>
          </FloatingLabel>

          <Button
            type="submit"
            className="ml-btn-primary w-100 mt-3"
            disabled={savingPhone || Boolean(loadingProvider)}
          >
            {savingPhone ? "Guardando..." : "Guardar WhatsApp y continuar"}
          </Button>
        </Form>
      )}
    </div>
  );
}
