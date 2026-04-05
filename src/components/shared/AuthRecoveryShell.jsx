import { Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../../styles/authRecovery.css";

export default function AuthRecoveryShell({
  eyebrow,
  title,
  subtitle,
  infoTitle,
  infoText,
  infoNote,
  infoIcon,
  children,
}) {
  return (
    <div className="recovery-page-wrapper">
      <Container className="py-4 py-lg-5">
        <section className="recovery-hero text-center mx-auto">
          <p className="recovery-overline mb-2">{eyebrow}</p>
          <h1 className="recovery-title font-playfair mb-3">{title}</h1>
          <p className="recovery-subtitle mb-0">{subtitle}</p>
        </section>

        <Row className="g-4 g-xl-5 align-items-stretch mt-1">
          <Col lg={4}>
            <aside className="recovery-info-card h-100">
              <div className="recovery-info-icon">
                <i className={`bi ${infoIcon}`}></i>
              </div>
              <p className="recovery-info-kicker mb-2">Ayuda segura</p>
              <h2 className="font-playfair mb-3">{infoTitle}</h2>
              <p className="recovery-info-copy mb-3">{infoText}</p>
              <div className="recovery-info-note">{infoNote}</div>
              <Link to="/" className="btn btn-outline-light recovery-back-btn mt-4">
                Volver al inicio
              </Link>
            </aside>
          </Col>

          <Col lg={8}>
            <section className="recovery-content-card h-100">
              <div className="recovery-form-shell">{children}</div>
            </section>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
