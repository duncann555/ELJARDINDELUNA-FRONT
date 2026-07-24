import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import logo from "../../assets/EL_JARDIN_DE_LUNA_FOOTER.png";
import { CONTACTO_WHATSAPP_URL } from "../../helpers/contact";

const TAGS = ["Bienestar", "Herboristería", "Cosmética Natural", "Aromas"];

const BLOQUES_ESENCIA = [
  {
    titulo: "Qué hacemos",
    texto:
      "Reunimos tinturas madres, esencias aromáticas y propuestas de cosmética natural pensadas para el bienestar cotidiano.",
  },
  {
    titulo: "Cómo elegimos",
    texto:
      "Priorizamos ingredientes, calidad, reputación y una relación honesta entre precio, utilidad y origen.",
  },
  {
    titulo: "Para quién es",
    texto:
      "Para vos, si querés sumar hábitos más conscientes, regalar bienestar o encontrar opciones naturales para tu rutina.",
  },
];

const VALORES = [
  {
    titulo: "Transparencia",
    texto: "Precios claros, información directa y sin letra chica.",
  },
  {
    titulo: "Cercanía",
    texto: "Escuchamos necesidades reales y mejoramos con feedback.",
  },
  {
    titulo: "Calidad",
    texto: "Menos relleno, más productos que realmente suman valor.",
  },
  {
    titulo: "Experiencia",
    texto: "Comprar tiene que sentirse fácil, amable y confiable.",
  },
];

function CardNosotros({ titulo, texto }) {
  return (
    <Card className="h-100 nosotros-card">
      <Card.Body>
        <h5 className="fw-bold font-playfair">{titulo}</h5>
        <p className="text-muted mb-0">{texto}</p>
      </Card.Body>
    </Card>
  );
}

export default function Nosotros() {
  return (
    <main className="nosotros-wrapper">
      <Container className="py-4">
        <section className="nosotros-hero mb-5">
          <Row className="align-items-center g-4">
            <Col xs={12} md={6}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <img
                  src={logo}
                  alt="El Jardín de Luna"
                  className="nosotros-logo"
                />

                <div>
                  <p className="nosotros-overline mb-1">Nuestra esencia</p>
                  <h1 className="fw-bold mb-1 font-playfair nosotros-title">
                    Somos <span>El Jardín de Luna</span>
                  </h1>

                  <div className="d-flex flex-wrap gap-2">
                    {TAGS.map((tag) => (
                      <span key={tag} className="nosotros-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="fs-5 nosotros-copy mb-3">
                El Jardín de Luna nace para acercar productos naturales, nobles y bien
                seleccionados a quienes buscan cuidarse con más conciencia.
                Queremos que cada compra se sienta simple, calma y cercana.
              </p>

              <div className="d-flex gap-2 flex-wrap">
                <Button as={Link} to="/productos" className="px-4">
                  Ver catálogo
                </Button>
                <Button
                  as="a"
                  href={CONTACTO_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline-secondary"
                  className="px-4"
                >
                  Escribinos por WhatsApp
                </Button>
              </div>
            </Col>

            <Col xs={12} md={6}>
              <Card className="nosotros-card-highlight">
                <Card.Body>
                  <p className="nosotros-overline mb-2">Lo que defendemos</p>
                  <h4 className="fw-bold mb-3 font-playfair">Nuestra promesa</h4>
                  <ul className="nosotros-lista mb-0">
                    <li>Productos seleccionados con criterio y trazabilidad.</li>
                    <li>Información clara sobre uso, stock y categorías.</li>
                    <li>Atención humana antes y después de cada compra.</li>
                    <li>Una experiencia suave, cálida y sin vueltas.</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </section>

        <section className="mb-5">
          <Row className="g-4">
            {BLOQUES_ESENCIA.map((bloque) => (
              <Col xs={12} md={4} key={bloque.titulo}>
                <CardNosotros titulo={bloque.titulo} texto={bloque.texto} />
              </Col>
            ))}
          </Row>
        </section>

        <section className="mb-5">
          <div className="mb-3">
            <p className="nosotros-overline mb-1">Nuestra mirada</p>
            <h3 className="fw-bold font-playfair mb-1">Nuestros valores</h3>
            <p className="text-muted mb-0">Lo que no negociamos como marca.</p>
          </div>

          <Row className="g-4">
            {VALORES.map((valor) => (
              <Col xs={12} md={6} lg={3} key={valor.titulo}>
                <CardNosotros titulo={valor.titulo} texto={valor.texto} />
              </Col>
            ))}
          </Row>
        </section>

        <section>
          <Card className="nosotros-card-cta">
            <Card.Body className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div>
                <p className="nosotros-overline mb-1">Tu próximo ritual</p>
                <h4 className="fw-bold mb-1 font-playfair">¿Listo para elegir natural?</h4>
                <p className="text-muted mb-0">
                  Explorá el catálogo y encontrá lo tuyo en pocos clics.
                </p>
              </div>

              <div className="d-flex flex-column flex-sm-row gap-2">
                <Button as={Link} to="/productos">
                  Ir a productos
                </Button>
                <Button as={Link} to="/carrito" variant="outline-secondary">
                  Ver carrito
                </Button>
              </div>
            </Card.Body>
          </Card>
        </section>
      </Container>
    </main>
  );
}
