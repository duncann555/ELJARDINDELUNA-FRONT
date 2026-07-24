import { Accordion, Alert, Button, Card, Container } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { CONTACTO_WHATSAPP_URL } from "../../helpers/contact";
import { INFORMACION_PAGES } from "../../content/siteContent";
import "../../styles/informacion.css";

const MENSAJE_CONSULTA =
  "Hola, necesito ayuda con información de la tienda El Jardín de Luna.";

const MENSAJE_ARREPENTIMIENTO = [
  "Hola, quiero solicitar el arrepentimiento de una compra online en El Jardín de Luna.",
  "",
  "Nombre y apellido:",
  "Número de pedido o referencia de pago:",
  "Fecha aproximada de compra:",
  "Producto/s:",
  "Medio de contacto alternativo (opcional):",
].join("\n");

const construirWhatsAppUrl = (mensaje) =>
  `${CONTACTO_WHATSAPP_URL}?text=${encodeURIComponent(mensaje)}`;

const normalizarTipo = (tipo) => {
  const value = String(tipo || "").trim();
  if (!value) return "";
  return value.startsWith("/") ? value : `/${value}`;
};

function EnlacesOficiales({ links = [] }) {
  if (links.length === 0) return null;

  return (
    <div className="d-flex flex-wrap gap-2 mt-3">
      {links.map((link) => (
        <Button
          key={link.href}
          as="a"
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          variant="outline-secondary"
          size="sm"
          className="rounded-pill"
        >
          {link.label}
          <i className="bi bi-box-arrow-up-right ms-2" aria-hidden="true"></i>
        </Button>
      ))}
    </div>
  );
}
function SeccionInformativa({ section }) {
  return (
    <Card className="info-card">
      <Card.Body className="p-4 p-md-5">
        <h2 className="h4 font-playfair fw-bold mb-3">{section.title}</h2>

        {section.paragraphs?.map((paragraph) => (
          <p className="info-copy" key={paragraph}>
            {paragraph}
          </p>
        ))}

        {section.bullets && (
          <ul className="info-list mb-0">
            {section.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        )}

        <EnlacesOficiales links={section.links} />
      </Card.Body>
    </Card>
  );
}

function PreguntasFrecuentes({ items }) {
  return (
    <Accordion className="info-accordion" alwaysOpen>
      {items.map((item, index) => (
        <Accordion.Item eventKey={String(index)} key={item.title}>
          <Accordion.Header>{item.title}</Accordion.Header>
          <Accordion.Body>{item.body}</Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}

function AccionArrepentimiento() {
  return (
    <Card className="info-card info-withdrawal-card">
      <Card.Body className="p-4 p-md-5 text-center">
        <span className="info-icon info-icon--withdrawal" aria-hidden="true">
          <i className="bi bi-arrow-counterclockwise"></i>
        </span>
        <h2 className="h3 font-playfair fw-bold mt-3">
          Iniciar una solicitud
        </h2>
        <p className="info-copy mx-auto">
          No necesitás una cuenta. Al tocar el botón se abrirá WhatsApp con los
          datos básicos a completar. Revisá el mensaje y presioná “Enviar” para
          que la solicitud quede presentada.
        </p>
        <Button
          as="a"
          href={construirWhatsAppUrl(MENSAJE_ARREPENTIMIENTO)}
          target="_blank"
          rel="noopener noreferrer"
          variant="danger"
          size="lg"
          className="info-withdrawal-action rounded-pill px-4"
        >
          <i className="bi bi-arrow-counterclockwise me-2" aria-hidden="true"></i>
          BOTÓN DE ARREPENTIMIENTO
        </Button>
        <p className="info-muted small mt-3 mb-0">
          Atención de El Jardín de Luna por WhatsApp. El código de identificación
          se informará por ese mismo medio dentro de las 24 horas del envío.
        </p>
      </Card.Body>
    </Card>
  );
}

export default function Informacion({ tipo = "" }) {
  const location = useLocation();
  const requestedPath = normalizarTipo(tipo) || location.pathname;
  const page = INFORMACION_PAGES[requestedPath];

  if (!page) {
    return (
      <main className="info-page">
        <Container className="info-container py-5">
          <Alert variant="warning" className="info-alert">
            La información solicitada no está disponible.
          </Alert>
        </Container>
      </main>
    );
  }

  const isWithdrawal = page.kind === "withdrawal";

  return (
    <main className={`info-page${isWithdrawal ? " info-page--withdrawal" : ""}`}>
      <Container className="info-container py-5">
        <header className="info-hero text-center mx-auto">
          <span className="info-eyebrow">{page.eyebrow}</span>
          <h1 className="info-title font-playfair">{page.title}</h1>
          <p className="info-lead">{page.intro}</p>
        </header>

        <div className="info-content mx-auto">
          {page.kind === "faq" ? (
            <PreguntasFrecuentes items={page.items} />
          ) : (
            <>
              {isWithdrawal && <AccionArrepentimiento />}
              <div className="d-grid gap-4 mt-4">
                {page.sections.map((section) => (
                  <SeccionInformativa key={section.title} section={section} />
                ))}
              </div>
            </>
          )}

          {!isWithdrawal && (
            <Card className="info-help-card mt-4">
              <Card.Body className="p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div>
                  <h2 className="h5 fw-bold mb-1">¿Necesitás ayuda?</h2>
                  <p className="info-muted mb-0">
                    Escribinos por WhatsApp y contanos tu consulta.
                  </p>
                </div>
                <Button
                  as="a"
                  href={construirWhatsAppUrl(MENSAJE_CONSULTA)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="success"
                  className="rounded-pill px-4 flex-shrink-0"
                >
                  <i className="bi bi-whatsapp me-2" aria-hidden="true"></i>
                  Abrir WhatsApp
                </Button>
              </Card.Body>
            </Card>
          )}
        </div>
      </Container>
    </main>
  );
}
