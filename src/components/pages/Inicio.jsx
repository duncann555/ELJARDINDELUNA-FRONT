import { useCallback, useEffect, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { getSafeErrorMessage } from "../../helpers/api";
import { obtenerProductos } from "../../helpers/products";
import PageState from "../shared/PageState";
import ProductCard from "../shared/ProductCard";

export default function Inicio() {
  const [state, setState] = useState({
    status: "loading",
    products: [],
    error: "",
  });
  const [requestKey, setRequestKey] = useState(0);

  const retry = useCallback(() => {
    setState((current) => ({ ...current, status: "loading", error: "" }));
    setRequestKey((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    obtenerProductos({ signal: controller.signal })
      .then((products) => {
        if (!controller.signal.aborted) {
          setState({
            status: products.length ? "success" : "empty",
            products: products.slice(0, 4),
            error: "",
          });
        }
      })
      .catch((error) => {
        if (error?.name !== "AbortError" && !controller.signal.aborted) {
          setState({
            status: "error",
            products: [],
            error: getSafeErrorMessage(error),
          });
        }
      });

    return () => controller.abort();
  }, [requestKey]);

  return (
    <main>
      <section className="home-hero">
        <Container>
          <div className="home-hero-content">
            <p className="eyebrow">Botánica artesanal · Tucumán</p>
            <h1>Bienestar natural para tus rituales cotidianos</h1>
            <p>
              Una selección consciente de productos botánicos, con información
              clara y una compra simple, sin registro.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <Button as={Link} to="/productos" variant="success" size="lg">
                Explorar productos
              </Button>
              <Button as={Link} to="/nosotros" variant="outline-dark" size="lg">
                Conocé el jardín
              </Button>
            </div>
            <Link to="/arrepentimiento" className="home-withdrawal-link">
              <i
                className="bi bi-arrow-counterclockwise"
                aria-hidden="true"
              ></i>
              BOTÓN DE ARREPENTIMIENTO
            </Link>
          </div>
        </Container>
      </section>

      <section className="store-section" aria-labelledby="destacados-title">
        <Container>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Elegidos del jardín</p>
              <h2 id="destacados-title">Productos destacados</h2>
            </div>
            <Link to="/productos" className="text-link">
              Ver catálogo completo
              <i className="bi bi-arrow-right ms-2" aria-hidden="true"></i>
            </Link>
          </div>

          {state.status === "success" ? (
            <Row className="g-4">
              {state.products.map((product) => (
                <Col xs={12} sm={6} lg={3} key={product.id}>
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          ) : (
            <PageState
              status={state.status}
              error={state.error}
              emptyMessage="Pronto vas a encontrar nuevos productos en el jardín."
              onRetry={retry}
            />
          )}
        </Container>
      </section>

      <section className="home-values">
        <Container>
          <Row className="g-4">
            {[
              ["bi-flower1", "Selección cuidada", "Productos elegidos con criterio y transparencia."],
              ["bi-shield-check", "Pago protegido", "Tu pago se completa en Mercado Pago."],
              ["bi-chat-heart", "Atención humana", "Estamos cerca por WhatsApp cuando nos necesites."],
            ].map(([icon, title, text]) => (
              <Col md={4} key={title}>
                <article className="value-card">
                  <i className={`bi ${icon}`} aria-hidden="true"></i>
                  <h2>{title}</h2>
                  <p>{text}</p>
                </article>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </main>
  );
}
