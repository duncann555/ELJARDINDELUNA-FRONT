import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import logo from "../../assets/EL_JARDIN_DE_LUNA.png";
import "../../styles/nosotros.css";

const TAGS = ["Bienestar", "Herboristeria", "Cosmetica Natural", "Aromas"];

export default function Nosotros() {
  return (
    <div className="nosotros-wrapper">
      <Container className="py-4">
        <section className="nosotros-hero mb-5">
          <Row className="align-items-center g-4">
            <Col xs={12} md={6}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <img
                  src={logo}
                  alt="El Jardin de Luna"
                  className="nosotros-logo"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />

                <div>
                  <p className="nosotros-overline mb-1">Nuestra esencia</p>
                  <h1 className="fw-bold mb-1 font-playfair nosotros-title">
                    Somos <span className="texto-resaltado">El Jardin de Luna</span>
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
                El Jardin de Luna nace para acercar productos naturales, nobles y bien
                seleccionados a quienes buscan cuidarse con mas conciencia.
                Queremos que cada compra se sienta simple, calma y cercana.
              </p>

              <div className="d-flex gap-2 flex-wrap">
                <Button as={Link} to="/productos" className="px-4">
                  Ver catalogo
                </Button>
                <Button as={Link} to="/contacto" variant="outline-secondary" className="px-4">
                  Contactanos
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
                    <li>Informacion clara sobre uso, stock y categorias.</li>
                    <li>Atencion humana antes y despues de cada compra.</li>
                    <li>Una experiencia suave, calida y sin vueltas.</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </section>

        <section className="mb-5">
          <Row className="g-4">
            <Col xs={12} md={4}>
              <Card className="h-100 nosotros-card">
                <Card.Body>
                  <h5 className="fw-bold font-playfair">Que hacemos</h5>
                  <p className="text-muted mb-0">
                    Reunimos tinturas madres, esencias aromaticas y propuestas
                    de cosmetica natural pensadas para el bienestar cotidiano.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} md={4}>
              <Card className="h-100 nosotros-card">
                <Card.Body>
                  <h5 className="fw-bold font-playfair">Como elegimos</h5>
                  <p className="text-muted mb-0">
                    Priorizamos ingredientes, calidad, reputacion y una
                    relacion honesta entre precio, utilidad y origen.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} md={4}>
              <Card className="h-100 nosotros-card">
                <Card.Body>
                  <h5 className="fw-bold font-playfair">Para quien es</h5>
                  <p className="text-muted mb-0">
                    Para quienes quieren sumar habitos mas conscientes, regalar
                    bienestar o encontrar opciones naturales para su rutina.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </section>

        <section className="mb-5">
          <div className="mb-3">
            <p className="nosotros-overline mb-1">Nuestra mirada</p>
            <h3 className="fw-bold font-playfair mb-1">Nuestros valores</h3>
            <p className="text-muted mb-0">Lo que no negociamos como marca.</p>
          </div>

          <Row className="g-4">
            <Col xs={12} md={6} lg={3}>
              <Card className="h-100 nosotros-card">
                <Card.Body>
                  <h6 className="fw-bold font-playfair">Transparencia</h6>
                  <p className="text-muted mb-0">
                    Precios claros, informacion directa y sin letra chica.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} md={6} lg={3}>
              <Card className="h-100 nosotros-card">
                <Card.Body>
                  <h6 className="fw-bold font-playfair">Cercania</h6>
                  <p className="text-muted mb-0">
                    Escuchamos necesidades reales y mejoramos con feedback.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} md={6} lg={3}>
              <Card className="h-100 nosotros-card">
                <Card.Body>
                  <h6 className="fw-bold font-playfair">Calidad</h6>
                  <p className="text-muted mb-0">
                    Menos relleno, mas productos que realmente suman valor.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} md={6} lg={3}>
              <Card className="h-100 nosotros-card">
                <Card.Body>
                  <h6 className="fw-bold font-playfair">Experiencia</h6>
                  <p className="text-muted mb-0">
                    Comprar tiene que sentirse facil, amable y confiable.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </section>

        <section className="nosotros-cta">
          <Card className="nosotros-card-cta">
            <Card.Body className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div>
                <p className="nosotros-overline mb-1">Tu proximo ritual</p>
                <h4 className="fw-bold mb-1 font-playfair">Listo para elegir natural?</h4>
                <p className="text-muted mb-0">
                  Explora el catalogo y encontra lo tuyo en pocos clicks.
                </p>
              </div>

              <div className="d-flex flex-column flex-sm-row gap-2 nosotros-cta-actions">
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
    </div>
  );
}
