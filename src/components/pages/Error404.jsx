import { Button, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function Error404() {
  const navigate = useNavigate();

  return (
    <main className="error-page-wrapper">
      <Container className="d-flex justify-content-center align-items-center">
        <div className="error-card text-center">
          <div className="error-visual mb-4">
            <h1 className="display-1 fw-bold text-success font-playfair">
              404
            </h1>
            <div className="leaf-decoration" aria-hidden="true">*</div>
          </div>

          <h2 className="mb-3 fw-bold text-dark font-playfair">
            Ups! Parece que te perdiste
          </h2>

          <p className="error-texto">
            El sendero que buscás no existe o cambió de lugar. No te preocupes,
            siempre podés volver a la naturaleza.
          </p>

          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Button
              variant="outline-success"
              className="rounded-pill px-4 py-2 fw-bold"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Volver atrás
            </Button>

            <Button
              variant="success"
              className="rounded-pill px-4 py-2 fw-bold"
              onClick={() => navigate("/", { replace: true })}
            >
              Ir al inicio
              <i className="bi bi-house-door-fill ms-2"></i>
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}
