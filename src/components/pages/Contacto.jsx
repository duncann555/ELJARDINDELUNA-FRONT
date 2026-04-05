import { Container, Row, Col, Form, Button, FloatingLabel } from "react-bootstrap";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import {
  asValidationRule,
  normalizeEmail,
  normalizeText,
  validateEmail,
  validateMensajeContacto,
  validateNombre,
  validateTelefono,
} from "../../helpers/validation";
import {
  CONTACTO_BRAND_NAME,
  CONTACTO_EMAIL,
  CONTACTO_WHATSAPP_LABEL,
  CONTACTO_WHATSAPP_NUMBER,
  CONTACTO_WHATSAPP_URL,
} from "../../helpers/contact";
import "../../styles/contacto.css";

const CONTACTO_MAPA_URL =
  "https://www.google.com/maps/search/?api=1&query=Tucuman%2C%20Argentina";

const construirMensajeContacto = ({ nombre, email, telefono, mensaje }) =>
  [
    `Hola ${CONTACTO_BRAND_NAME}, les escribo desde la web.`,
    `Nombre: ${nombre}`,
    `Email: ${email}`,
    telefono ? `Telefono: ${telefono}` : null,
    "",
    "Consulta:",
    mensaje,
  ]
    .filter(Boolean)
    .join("\n");

export default function Contacto() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onTouched" });

  const onSubmit = async (data) => {
    const payload = {
      nombre: normalizeText(data.nombre),
      email: normalizeEmail(data.email),
      telefono: normalizeText(data.telefono),
      mensaje: normalizeText(data.mensaje),
    };
    const mensaje = construirMensajeContacto(payload);
    const whatsappUrl = `${CONTACTO_WHATSAPP_URL}?text=${encodeURIComponent(mensaje)}`;
    const emailUrl = `mailto:${CONTACTO_EMAIL}?subject=${encodeURIComponent(
      `Consulta web de ${payload.nombre}`,
    )}&body=${encodeURIComponent(mensaje)}`;

    const resultado = await Swal.fire({
      icon: "question",
      title: "Elegi como queres enviar tu consulta",
      text: "Podemos abrir WhatsApp o tu correo con el mensaje ya preparado.",
      confirmButtonColor: "#62735d",
      confirmButtonText: "WhatsApp",
      showDenyButton: true,
      denyButtonText: "Email",
      denyButtonColor: "#1d3046",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
    });

    if (resultado.isConfirmed) {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } else if (resultado.isDenied) {
      window.open(emailUrl, "_self");
    } else {
      return;
    }

    await Swal.fire({
      icon: "success",
      title: "Canal abierto",
      text: "Preparamos tu consulta para que la envies por el medio que elegiste.",
      confirmButtonColor: "#62735d",
      confirmButtonText: "Listo",
    });

    reset();
  };

  return (
    <div className="page-wrapper bg-light min-vh-100 py-5 contacto-page">
      <Container className="contacto-container">
        <div className="text-center mb-5 fade-in-up">
          <h1 className="fw-bold display-5 mb-3 text-dark font-playfair">
            Hablemos
          </h1>
          <p className="text-muted mx-auto" style={{ maxWidth: "600px" }}>
            Estamos aca para ayudarte con tu bienestar. Si tenes dudas sobre
            envios, productos o tratamientos, escribinos.
          </p>
        </div>

        <Row className="g-0 shadow-lg rounded-4 overflow-hidden fade-in-up delay-1 contacto-shell">
          <Col xs={12} lg={7} className="bg-white p-4 p-md-5 contacto-form-panel">
            <h4 className="fw-bold mb-4 text-success">Envianos tu consulta</h4>

            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Row className="g-3">
                <Col xs={12} md={6}>
                  <FloatingLabel controlId="nombre" label="Nombre completo">
                    <Form.Control
                      type="text"
                      placeholder="Nombre"
                      minLength={3}
                      maxLength={50}
                      className={`form-control-clean ${errors.nombre ? "is-invalid" : ""}`}
                      {...register("nombre", {
                        validate: asValidationRule((value) => validateNombre(value)),
                      })}
                    />
                  </FloatingLabel>
                  {errors.nombre && (
                    <small className="text-danger ms-2">
                      {errors.nombre.message}
                    </small>
                  )}
                </Col>

                <Col xs={12} md={6}>
                  <FloatingLabel controlId="email" label="Email">
                    <Form.Control
                      type="email"
                      placeholder="name@example.com"
                      minLength={6}
                      maxLength={120}
                      className={`form-control-clean ${errors.email ? "is-invalid" : ""}`}
                      {...register("email", {
                        validate: asValidationRule(validateEmail),
                      })}
                    />
                  </FloatingLabel>
                  {errors.email && (
                    <small className="text-danger ms-2">
                      {errors.email.message}
                    </small>
                  )}
                </Col>

                <Col xs={12}>
                  <FloatingLabel controlId="telefono" label="Telefono (Opcional)">
                    <Form.Control
                      type="tel"
                      placeholder="Telefono"
                      inputMode="numeric"
                      minLength={8}
                      maxLength={15}
                      className={`form-control-clean ${errors.telefono ? "is-invalid" : ""}`}
                      {...register("telefono", {
                        validate: asValidationRule((value) =>
                          validateTelefono(value, { required: false }),
                        ),
                      })}
                    />
                  </FloatingLabel>
                  {errors.telefono && (
                    <small className="text-danger ms-2">
                      {errors.telefono.message}
                    </small>
                  )}
                </Col>

                <Col xs={12}>
                  <FloatingLabel controlId="mensaje" label="En que te ayudamos?">
                    <Form.Control
                      as="textarea"
                      placeholder="Deja tu mensaje aqui"
                      style={{ height: "150px" }}
                      minLength={10}
                      maxLength={1000}
                      className={`form-control-clean ${errors.mensaje ? "is-invalid" : ""}`}
                      {...register("mensaje", {
                        validate: asValidationRule(validateMensajeContacto),
                      })}
                    />
                  </FloatingLabel>
                  {errors.mensaje && (
                    <small className="text-danger ms-2">
                      {errors.mensaje.message}
                    </small>
                  )}
                </Col>

                <Col xs={12} className="mt-4">
                  <Button
                    type="submit"
                    variant="success"
                    size="lg"
                    className="w-100 rounded-pill fw-bold shadow-sm btn-hover-effect"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span>
                        <i className="bi bi-arrow-repeat spin me-2"></i>
                        Preparando...
                      </span>
                    ) : (
                      "Enviar consulta"
                    )}
                  </Button>
                  <p className="small text-muted text-center mt-3 mb-0">
                    Al enviar, te dejamos elegir entre WhatsApp o email con el
                    mensaje ya armado.
                  </p>
                </Col>
              </Row>
            </Form>
          </Col>

          <Col
            xs={12}
            lg={5}
            className="bg-brand-gradient text-white p-4 p-md-5 d-flex flex-column justify-content-center position-relative overflow-hidden contacto-info-panel"
          >
            <div className="circle-deco"></div>

            <div className="position-relative z-1">
              <h3 className="fw-bold mb-4 font-playfair">
                Informacion de contacto
              </h3>
              <p className="opacity-75 mb-5">
                Tambien podes encontrarnos en nuestros canales directos y
                escribirnos sin completar el formulario.
              </p>

              <div className="d-flex flex-column gap-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="icon-box">
                    <i className="bi bi-envelope-fill"></i>
                  </div>
                  <div>
                    <span className="d-block text-uppercase small opacity-75 fw-bold">
                      Email
                    </span>
                    <a
                      href={`mailto:${CONTACTO_EMAIL}`}
                      className="contact-link fs-5 fw-medium"
                    >
                      {CONTACTO_EMAIL}
                    </a>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="icon-box">
                    <i className="bi bi-whatsapp"></i>
                  </div>
                  <div>
                    <span className="d-block text-uppercase small opacity-75 fw-bold">
                      WhatsApp
                    </span>
                    <a
                      href={CONTACTO_WHATSAPP_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="contact-link fs-5 fw-medium"
                    >
                      {CONTACTO_WHATSAPP_LABEL}
                    </a>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div className="icon-box">
                    <i className="bi bi-clock-fill"></i>
                  </div>
                  <div>
                    <span className="d-block text-uppercase small opacity-75 fw-bold">
                      Horarios
                    </span>
                    <span className="fs-5 fw-medium">Lun a Vie | 9 a 18 hs</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-top border-white border-opacity-25">
                <span className="d-block text-uppercase small opacity-75 fw-bold mb-3">
                  Canales directos
                </span>
                <div className="d-flex gap-3">
                  <a
                    href={`mailto:${CONTACTO_EMAIL}`}
                    className="social-link"
                    aria-label="Email"
                  >
                    <i className="bi bi-envelope-fill"></i>
                  </a>
                  <a
                    href={CONTACTO_WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="social-link"
                    aria-label="WhatsApp"
                  >
                    <i className="bi bi-whatsapp"></i>
                  </a>
                  <a
                    href={CONTACTO_MAPA_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="social-link"
                    aria-label="Ubicacion"
                  >
                    <i className="bi bi-geo-alt-fill"></i>
                  </a>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
