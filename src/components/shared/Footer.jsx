import { Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../../styles/footer.css";
import LOGO from "../../assets/ESSENZIA2.png";
import {
  CONTACTO_WHATSAPP_LABEL,
  CONTACTO_WHATSAPP_URL,
} from "../../helpers/contact";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-section mt-auto">
      <div className="footer-top-border"></div>

      <Container className="pt-5 pb-4">
        <Row className="gy-4">
          <Col xs={12} md={4} className="text-center text-md-start">
            <Link to="/">
              <img src={LOGO} alt="El Jardin de Luna" className="footer-logo mb-3" />
            </Link>

            <p className="footer-text">
              Botanica artesanal y bienestar para volver a lo simple, lo noble y lo
              natural con una experiencia de compra serena y cercana.
            </p>
          </Col>

          <Col xs={12} md={4} className="text-center text-md-start">
            <h5 className="footer-heading">Explorar</h5>
            <ul className="list-unstyled d-grid gap-2 mb-0 footer-links">
              <li><Link to="/productos">Tienda Online</Link></li>
              <li><Link to="/nosotros">Nuestra Historia</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
              <li><Link to="/register">Acceso Clientes</Link></li>
            </ul>
          </Col>

          <Col xs={12} md={4} className="text-center text-md-start">
            <h5 className="footer-heading">Contacto</h5>

            <p className="mb-3 d-flex align-items-center justify-content-center justify-content-md-start">
              <i className="bi bi-whatsapp me-2 icon-brand"></i>
              {CONTACTO_WHATSAPP_LABEL}
            </p>
            <p className="mb-3 d-flex align-items-center justify-content-center justify-content-md-start">
              <i className="bi bi-envelope-fill me-2 icon-brand"></i>
              contacto@esenzia.com
            </p>
            <p className="mb-3 d-flex align-items-center justify-content-center justify-content-md-start">
              <i className="bi bi-geo-alt-fill me-2 icon-brand"></i>
              Tucuman, Argentina
            </p>

            <div className="footer-socials d-flex gap-3 mt-3 justify-content-center justify-content-md-start flex-wrap">
              <a href="#" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
              <a href="#" aria-label="Facebook"><i className="bi bi-facebook"></i></a>
              <a href={CONTACTO_WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="WhatsApp"><i className="bi bi-whatsapp"></i></a>
            </div>
          </Col>
        </Row>
      </Container>

      <div className="footer-bottom py-3 text-center">
        <small>
          &copy; {currentYear} <strong>El Jardin de Luna</strong> · Todos los derechos reservados.
        </small>
      </div>
    </footer>
  );
};

export default Footer;
