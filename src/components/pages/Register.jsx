import { useState } from "react";
import {
  Alert,
  Button,
  Col,
  Container,
  FloatingLabel,
  Form,
  Row,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  normalizeEmail,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateApellido,
  validateEmail,
  validateNombre,
  validatePassword,
  validatePasswordConfirmation,
  validateTelefono,
} from "../../helpers/validation";
import SocialAuthSection from "../shared/SocialAuthSection.jsx";
import "../../styles/login.css";
import "../../styles/register.css";

const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

const validateAreaCode = (value) => {
  const digits = normalizeDigits(value);

  if (!digits) return "El código de área es obligatorio";
  if (digits.length < 2 || digits.length > 5) {
    return "Ingresá un código de área válido";
  }

  return "";
};

const validatePhoneNumber = (value) => {
  const digits = normalizeDigits(value);

  if (!digits) return "El número de WhatsApp es obligatorio";
  if (digits.length < 6 || digits.length > 10) {
    return "Ingresá un número de WhatsApp válido";
  }

  return "";
};

export default function Register() {
  const navigate = useNavigate();
  const { registrarUsuario } = useAuth();

  const [formValues, setFormValues] = useState({
    nombre: "",
    apellido: "",
    email: "",
    codigoArea: "",
    telefono: "",
    password: "",
    passwordConfirm: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    nombre: "",
    apellido: "",
    email: "",
    codigoArea: "",
    telefono: "",
    password: "",
    passwordConfirm: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFieldChange = (field, value) => {
    if (error) {
      setError("");
    }

    const sanitizedValue =
      field === "codigoArea" || field === "telefono" ? normalizeDigits(value) : value;
    const nextValues = {
      ...formValues,
      [field]: sanitizedValue,
    };

    setFormValues(nextValues);

    if (fieldErrors[field] || (field === "password" && fieldErrors.passwordConfirm)) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: "",
        ...(field === "password" || field === "passwordConfirm"
          ? {
              passwordConfirm: "",
            }
          : {}),
      }));
    }
  };

  const validateForm = (nextValues) => {
    const nextErrors = {
      nombre: validateNombre(nextValues.nombre),
      apellido: validateApellido(nextValues.apellido),
      email: validateEmail(nextValues.email),
      codigoArea: validateAreaCode(nextValues.codigoArea),
      telefono: validatePhoneNumber(nextValues.telefono),
      password: validatePassword(nextValues.password),
      passwordConfirm: validatePasswordConfirmation(
        nextValues.passwordConfirm,
        nextValues.password,
      ),
    };

    const telefonoCompleto = `${nextValues.codigoArea}${nextValues.telefono}`;
    const telefonoError = validateTelefono(telefonoCompleto);

    if (telefonoError) {
      nextErrors.codigoArea = nextErrors.codigoArea || telefonoError;
      nextErrors.telefono = nextErrors.telefono || telefonoError;
    }

    setSubmitted(true);
    setFieldErrors(nextErrors);

    return !Object.values(nextErrors).some(Boolean);
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    const normalizedValues = {
      ...formValues,
      nombre: formValues.nombre.trim(),
      apellido: formValues.apellido.trim(),
      email: normalizeEmail(formValues.email),
      codigoArea: normalizeDigits(formValues.codigoArea),
      telefono: normalizeDigits(formValues.telefono),
    };

    setFormValues(normalizedValues);

    if (!validateForm(normalizedValues)) {
      return;
    }

    try {
      setLoading(true);
      const telefonoCompleto = `${normalizedValues.codigoArea}${normalizedValues.telefono}`;

      const session = await registrarUsuario({
        nombre: normalizedValues.nombre,
        apellido: normalizedValues.apellido,
        email: normalizedValues.email,
        telefono: telefonoCompleto,
        password: normalizedValues.password,
      });

      navigate(session?.destination || "/");
    } catch (registerError) {
      setError(registerError.message || "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-page-wrapper">
      <Container className="py-4 py-lg-5">
        <section className="reg-hero text-center mx-auto">
          <p className="reg-overline mb-2">Crear cuenta</p>
          <h1 className="reg-title font-playfair mb-3">Registrarse</h1>
          <p className="reg-subtitle mb-0">
            Creá tu cuenta para comprar con calma, guardar tu sesión y seguir tu pedido.
          </p>
        </section>

        <div className="reg-card shadow-lg overflow-hidden rounded-4 mt-4">
          <Row className="g-0">
            <Col lg={12} className="reg-content-col p-4 p-md-5 d-flex align-items-center">
              <div className="w-100 reg-form-shell">
                {error && (
                  <Alert variant="danger" className="py-2 px-3 small text-center">
                    {error}
                  </Alert>
                )}

                <SocialAuthSection />

                <Form onSubmit={handleRegister} noValidate>
                  <Row className="g-3">
                    <Col md={6}>
                      <FloatingLabel label="Nombre">
                        <Form.Control
                          type="text"
                          placeholder=" "
                          className="ml-input"
                          minLength={2}
                          maxLength={50}
                          value={formValues.nombre}
                          isInvalid={Boolean(submitted && fieldErrors.nombre)}
                          onChange={(event) =>
                            handleFieldChange("nombre", event.target.value)
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors.nombre}
                        </Form.Control.Feedback>
                      </FloatingLabel>
                    </Col>

                    <Col md={6}>
                      <FloatingLabel label="Apellido">
                        <Form.Control
                          type="text"
                          placeholder=" "
                          className="ml-input"
                          minLength={2}
                          maxLength={50}
                          value={formValues.apellido}
                          isInvalid={Boolean(submitted && fieldErrors.apellido)}
                          onChange={(event) =>
                            handleFieldChange("apellido", event.target.value)
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors.apellido}
                        </Form.Control.Feedback>
                      </FloatingLabel>
                    </Col>

                    <Col xs={12}>
                      <FloatingLabel label="Email">
                        <Form.Control
                          type="email"
                          placeholder=" "
                          className="ml-input"
                          autoComplete="email"
                          minLength={6}
                          maxLength={120}
                          value={formValues.email}
                          isInvalid={Boolean(submitted && fieldErrors.email)}
                          onChange={(event) =>
                            handleFieldChange("email", event.target.value)
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors.email}
                        </Form.Control.Feedback>
                      </FloatingLabel>
                    </Col>

                    <Col xs={12}>
                      <div className="reg-section-title">WhatsApp de contacto</div>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="reg-field-label">Código de área</Form.Label>
                        <Form.Control
                          type="text"
                          inputMode="numeric"
                          placeholder="Ej: 11"
                          className="ml-input"
                          minLength={2}
                          maxLength={5}
                          value={formValues.codigoArea}
                          isInvalid={Boolean(
                            submitted && fieldErrors.codigoArea,
                          )}
                          onChange={(event) =>
                            handleFieldChange("codigoArea", event.target.value)
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors.codigoArea}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={8}>
                      <Form.Group>
                        <Form.Label className="reg-field-label">Número de WhatsApp</Form.Label>
                        <Form.Control
                          type="text"
                          inputMode="numeric"
                          placeholder="Ej: 23456789 (sin 0 ni 15)"
                          className="ml-input"
                          minLength={6}
                          maxLength={10}
                          value={formValues.telefono}
                          isInvalid={Boolean(
                            submitted && fieldErrors.telefono,
                          )}
                          onChange={(event) =>
                            handleFieldChange("telefono", event.target.value)
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors.telefono}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <FloatingLabel label="Contraseña">
                        <Form.Control
                          type={showPasswords ? "text" : "password"}
                          placeholder=" "
                          className="ml-input"
                          autoComplete="new-password"
                          minLength={PASSWORD_MIN_LENGTH}
                          maxLength={PASSWORD_MAX_LENGTH}
                          value={formValues.password}
                          isInvalid={Boolean(
                            submitted && fieldErrors.password,
                          )}
                          onChange={(event) =>
                            handleFieldChange("password", event.target.value)
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors.password}
                        </Form.Control.Feedback>
                      </FloatingLabel>
                    </Col>

                    <Col md={6}>
                      <FloatingLabel label="Repetir contraseña">
                        <Form.Control
                          type={showPasswords ? "text" : "password"}
                          placeholder=" "
                          className="ml-input"
                          autoComplete="new-password"
                          minLength={PASSWORD_MIN_LENGTH}
                          maxLength={PASSWORD_MAX_LENGTH}
                          value={formValues.passwordConfirm}
                          isInvalid={Boolean(
                            submitted && fieldErrors.passwordConfirm,
                          )}
                          onChange={(event) =>
                            handleFieldChange("passwordConfirm", event.target.value)
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors.passwordConfirm}
                        </Form.Control.Feedback>
                      </FloatingLabel>
                    </Col>

                    <Col xs={12}>
                      <Form.Check
                        type="checkbox"
                        id="register-show-passwords"
                        label="Mostrar contraseñas"
                        className="reg-password-check"
                        checked={showPasswords}
                        onChange={(event) => setShowPasswords(event.target.checked)}
                      />
                    </Col>
                  </Row>

                  <Button
                    type="submit"
                    className="ml-btn-primary reg-submit-btn w-100 mt-4"
                    disabled={loading}
                  >
                    {loading ? "Registrando..." : "Registrarme"}
                  </Button>
                </Form>

                <div className="text-center mt-4 pt-3 border-top">
                  <p className="mb-2 small text-muted">¿Ya tenés cuenta?</p>
                  <Link to="/" className="text-decoration-none fw-semibold">
                    Iniciá sesión desde el menú
                  </Link>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  );
}
