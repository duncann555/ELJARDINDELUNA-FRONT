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

  if (!digits) return "El codigo de area es obligatorio";
  if (digits.length < 2 || digits.length > 5) {
    return "Ingresa un codigo de area valido";
  }

  return "";
};

const validatePhoneNumber = (value) => {
  const digits = normalizeDigits(value);

  if (!digits) return "El numero de WhatsApp es obligatorio";
  if (digits.length < 6 || digits.length > 10) {
    return "Ingresa un numero de WhatsApp valido";
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
  const [touched, setTouched] = useState({
    nombre: false,
    apellido: false,
    email: false,
    codigoArea: false,
    telefono: false,
    password: false,
    passwordConfirm: false,
  });
  const [loading, setLoading] = useState(false);

  const validateField = (field, nextValues) => {
    switch (field) {
      case "nombre":
        return validateNombre(nextValues.nombre);
      case "apellido":
        return validateApellido(nextValues.apellido);
      case "email":
        return validateEmail(nextValues.email);
      case "codigoArea":
        return validateAreaCode(nextValues.codigoArea);
      case "telefono":
        return validatePhoneNumber(nextValues.telefono);
      case "password":
        return validatePassword(nextValues.password);
      case "passwordConfirm":
        return validatePasswordConfirmation(
          nextValues.passwordConfirm,
          nextValues.password,
        );
      default:
        return "";
    }
  };

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

    if (touched[field] || (field === "password" && touched.passwordConfirm)) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validateField(field, nextValues),
        ...(field === "password" || field === "passwordConfirm"
          ? {
              passwordConfirm: validateField("passwordConfirm", nextValues),
            }
          : {}),
      }));
    }
  };

  const handleFieldBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validateField(field, formValues),
      ...(field === "password"
        ? {
            passwordConfirm: validateField("passwordConfirm", formValues),
          }
        : {}),
    }));
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

    setFieldErrors(nextErrors);
    setTouched({
      nombre: true,
      apellido: true,
      email: true,
      codigoArea: true,
      telefono: true,
      password: true,
      passwordConfirm: true,
    });

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
            Crea tu cuenta para comprar con calma, guardar tu sesion y seguir tu pedido.
          </p>
        </section>

        <div className="reg-card shadow-lg overflow-hidden rounded-4 mt-4">
          <Row className="g-0">
            <Col
              lg={4}
              className="reg-info-col reg-brand-gradient d-none d-lg-flex flex-column justify-content-center p-5 text-white"
            >
              <h2 className="font-playfair fw-bold mb-4">Tu cuenta en la tienda</h2>
              <p className="opacity-75">
                Registrate una sola vez y despues compra mas rapido, guarda tu sesion y
                segui tus pedidos con comodidad.
              </p>
              <div className="mt-4 d-flex align-items-center">
                <i className="bi bi-shield-check fs-4 me-2"></i>
                <small>Tus datos se guardan de forma segura en la tienda.</small>
              </div>
              <Link to="/" className="btn reg-back-btn rounded-pill mt-auto">
                Volver al Inicio
              </Link>
            </Col>

            <Col lg={8} className="reg-content-col p-4 p-md-5 d-flex align-items-center">
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
                          placeholder="Nombre"
                          className="ml-input"
                          minLength={2}
                          maxLength={50}
                          value={formValues.nombre}
                          isInvalid={Boolean(touched.nombre && fieldErrors.nombre)}
                          onChange={(event) =>
                            handleFieldChange("nombre", event.target.value)
                          }
                          onBlur={() => handleFieldBlur("nombre")}
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
                          placeholder="Apellido"
                          className="ml-input"
                          minLength={2}
                          maxLength={50}
                          value={formValues.apellido}
                          isInvalid={Boolean(touched.apellido && fieldErrors.apellido)}
                          onChange={(event) =>
                            handleFieldChange("apellido", event.target.value)
                          }
                          onBlur={() => handleFieldBlur("apellido")}
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
                          placeholder="Email"
                          className="ml-input"
                          autoComplete="email"
                          minLength={6}
                          maxLength={120}
                          value={formValues.email}
                          isInvalid={Boolean(touched.email && fieldErrors.email)}
                          onChange={(event) =>
                            handleFieldChange("email", event.target.value)
                          }
                          onBlur={() => handleFieldBlur("email")}
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
                        <Form.Label className="reg-field-label">Codigo de area</Form.Label>
                        <Form.Control
                          type="text"
                          inputMode="numeric"
                          placeholder="Ej: 11"
                          className="ml-input"
                          minLength={2}
                          maxLength={5}
                          value={formValues.codigoArea}
                          isInvalid={Boolean(
                            touched.codigoArea && fieldErrors.codigoArea,
                          )}
                          onChange={(event) =>
                            handleFieldChange("codigoArea", event.target.value)
                          }
                          onBlur={() => handleFieldBlur("codigoArea")}
                        />
                        <Form.Control.Feedback type="invalid">
                          {fieldErrors.codigoArea}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={8}>
                      <Form.Group>
                        <Form.Label className="reg-field-label">Numero de WhatsApp</Form.Label>
                        <Form.Control
                          type="text"
                          inputMode="numeric"
                          placeholder="Ej: 23456789 (sin 0 ni 15)"
                          className="ml-input"
                          minLength={6}
                          maxLength={10}
                          value={formValues.telefono}
                          isInvalid={Boolean(
                            touched.telefono && fieldErrors.telefono,
                          )}
                          onChange={(event) =>
                            handleFieldChange("telefono", event.target.value)
                          }
                          onBlur={() => handleFieldBlur("telefono")}
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
                          placeholder="Contraseña"
                          className="ml-input"
                          autoComplete="new-password"
                          minLength={PASSWORD_MIN_LENGTH}
                          maxLength={PASSWORD_MAX_LENGTH}
                          value={formValues.password}
                          isInvalid={Boolean(
                            touched.password && fieldErrors.password,
                          )}
                          onChange={(event) =>
                            handleFieldChange("password", event.target.value)
                          }
                          onBlur={() => handleFieldBlur("password")}
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
                          placeholder="Repetir contraseña"
                          className="ml-input"
                          autoComplete="new-password"
                          minLength={PASSWORD_MIN_LENGTH}
                          maxLength={PASSWORD_MAX_LENGTH}
                          value={formValues.passwordConfirm}
                          isInvalid={Boolean(
                            touched.passwordConfirm &&
                              fieldErrors.passwordConfirm,
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
                  <p className="mb-2 small text-muted">Ya tenes cuenta?</p>
                  <Link to="/" className="text-decoration-none fw-semibold">
                    Inicia sesion desde el menu
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
