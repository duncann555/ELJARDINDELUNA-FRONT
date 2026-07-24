import { Button, Card, Col, Container, Row } from "react-bootstrap";
import {
  CONTACTO_WHATSAPP_LABEL,
  CONTACTO_WHATSAPP_URL,
} from "../../helpers/contact";
import "../../styles/informacion.css";

const MENSAJE_CONTACTO =
  "Hola, quiero hacer una consulta a El Jardín de Luna.";

const WHATSAPP_CONTACTO_URL = `${CONTACTO_WHATSAPP_URL}?text=${encodeURIComponent(
  MENSAJE_CONTACTO,
)}`;

const TEMAS_DE_AYUDA = [
  {
    icon: "bi-bag-check",
    title: "Una compra",
    text: "Tené a mano el número de pedido y el nombre usado al comprar.",
  },
  {
    icon: "bi-box-seam",
    title: "Un producto",
    text: "Indicá el nombre del producto y qué información necesitás.",
  },
  {
    icon: "bi-truck",
    title: "Una entrega",
    text: "Compartí el número de pedido y la localidad de destino.",
  },
];

export default function Contacto() {
  return (
    <main className="info-page">
      <Container className="info-container py-5">
        <header className="info-hero text-center mx-auto">
          <span className="info-eyebrow">Atención cercana</span>
          <h1 className="info-title font-playfair">Contacto</h1>
          <p className="info-lead">
            Nuestro canal de atención disponible es WhatsApp. Escribinos con la
            información necesaria y te responderemos por esa misma conversación.
          </p>
        </header>

        <Row className="justify-content-center g-4 mt-2">
          <Col xs={12} lg={8}>
            <Card className="info-card info-contact-card h-100">
              <Card.Body className="p-4 p-md-5 text-center">
                <span className="info-icon info-icon--whatsapp" aria-hidden="true">
                  <i className="bi bi-whatsapp"></i>
                </span>
                <h2 className="h3 font-playfair fw-bold mt-3">
                  Escribinos por WhatsApp
                </h2>
                <p className="info-muted mb-1">{CONTACTO_WHATSAPP_LABEL}</p>
                <p className="info-muted mb-4">
                  No necesitás registrarte para realizar una consulta.
                </p>
                <Button
                  as="a"
                  href={WHATSAPP_CONTACTO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="success"
                  size="lg"
                  className="info-primary-action rounded-pill px-4"
                >
                  <i className="bi bi-whatsapp me-2" aria-hidden="true"></i>
                  Abrir WhatsApp
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <section className="mt-5" aria-labelledby="contacto-ayuda-title">
          <div className="text-center mb-4">
            <h2 id="contacto-ayuda-title" className="h3 font-playfair fw-bold">
              Para ayudarte mejor
            </h2>
            <p className="info-muted mb-0">
              Incluí estos datos según el motivo de tu consulta.
            </p>
          </div>

          <Row className="g-4">
            {TEMAS_DE_AYUDA.map((tema) => (
              <Col xs={12} md={4} key={tema.title}>
                <Card className="info-card h-100">
                  <Card.Body className="p-4">
                    <span className="info-icon" aria-hidden="true">
                      <i className={`bi ${tema.icon}`}></i>
                    </span>
                    <h3 className="h5 fw-bold mt-3">{tema.title}</h3>
                    <p className="info-muted mb-0">{tema.text}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
      </Container>
    </main>
  );
}
