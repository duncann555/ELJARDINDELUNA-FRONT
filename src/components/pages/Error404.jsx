import { Button, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../../styles/Error404.css";

export default function Error404() {
  const navigate = useNavigate();

  return (
    <section className="error-page-wrapper">
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="error-card text-center">
          <div className="error-visual mb-4">
            <h1 className="display-1 fw-bold text-success font-playfair floating-anim">
              404
            </h1>
            <div className="leaf-decoration" aria-hidden="true">*</div>
          </div>

          <h2 className="mb-3 fw-bold text-dark font-playfair">
            Ups! Parece que te perdiste
          </h2>

          <p className="text-muted mb-5 mx-auto" style={{ maxWidth: "450px" }}>
            El sendero que buscás no existe o cambió de lugar. No te preocupes,
            siempre podés volver a la naturaleza.
          </p>

          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Button
              className="btn-brand-outline rounded-pill px-4 py-2 fw-bold"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Volver atrás
            </Button>

            <Button
              className="btn-brand rounded-pill px-4 py-2 fw-bold"
              onClick={() => navigate("/", { replace: true })}
            >
              Ir al inicio
              <i className="bi bi-house-door-fill ms-2"></i>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
