import { Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import LOGO from "../../assets/EL_JARDIN_DE_LUNA_FOOTER.png";
import {
  CONTACTO_WHATSAPP_LABEL,
  CONTACTO_WHATSAPP_URL,
} from "../../helpers/contact";

const STORE_LINKS = [
  ["Productos", "/productos"],
  ["Nosotros", "/nosotros"],
  ["Contacto", "/contacto"],
  ["Preguntas frecuentes", "/preguntas-frecuentes"],
  ["Envíos", "/envios"],
];

const LEGAL_LINKS = [
  ["Términos y condiciones", "/terminos-y-condiciones"],
  ["Privacidad", "/privacidad"],
  ["Cambios y devoluciones", "/cambios-y-devoluciones"],
  ["BOTÓN DE ARREPENTIMIENTO", "/arrepentimiento"],
];

export default function Footer() {
  return (
    <footer className="store-footer">
      <Container>
        <Row className="g-4">
          <Col lg={5}>
            <Link to="/" aria-label="Ir al inicio">
              <img src={LOGO} alt="El Jardín de Luna" className="footer-logo" />
            </Link>
            <p className="footer-description">
              Botánica artesanal y bienestar, con una experiencia de compra
              clara, cercana y sin registro.
            </p>
            <a
              href={CONTACTO_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-contact"
            >
              <i className="bi bi-whatsapp" aria-hidden="true"></i>
              {CONTACTO_WHATSAPP_LABEL}
            </a>
          </Col>
          <Col xs={6} lg={3}>
            <h2>Tienda</h2>
            <ul>
              {STORE_LINKS.map(([label, to]) => (
                <li key={to}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
          </Col>
          <Col xs={6} lg={4}>
            <h2>Información legal</h2>
            <ul>
              {LEGAL_LINKS.map(([label, to]) => (
                <li key={to}>
                  <Link
                    to={to}
                    className={to === "/arrepentimiento" ? "withdrawal-link" : ""}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>
        </Row>
        <div className="footer-bottom">
          <small>
            © {new Date().getFullYear()} El Jardín de Luna. Todos los derechos
            reservados.
          </small>
          <Link to="/admin" className="admin-access">
            Administración
          </Link>
        </div>
      </Container>
    </footer>
  );
}
