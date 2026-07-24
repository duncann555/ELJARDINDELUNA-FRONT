import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Col, Container, Row } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import FALLBACK_IMAGE from "../../assets/EL_JARDIN_DE_LUNA_FOOTER.png";
import { useCarrito } from "../../context/CarritoContext";
import { getSafeErrorMessage } from "../../helpers/api";
import { MAX_CART_QUANTITY } from "../../helpers/cart";
import { formatCurrency } from "../../helpers/format";
import { obtenerProducto } from "../../helpers/products";
import PageState from "../shared/PageState";

const DetailRow = ({ label, value }) =>
  value ? (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  ) : null;

export default function DetalleProducto() {
  const { identifier } = useParams();
  const { agregarAlCarrito } = useCarrito();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState({
    status: "loading",
    product: null,
    error: "",
    identifier: "",
  });
  const retry = useCallback(() => {
    setState((current) => ({ ...current, status: "loading", error: "" }));
    setRequestKey((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    obtenerProducto(identifier, { signal: controller.signal })
      .then((product) => {
        if (!controller.signal.aborted) {
          setQuantity(1);
          setFeedback("");
          setState(
            product
              ? { status: "success", product, error: "", identifier }
              : {
                  status: "empty",
                  product: null,
                  error: "",
                  identifier,
                },
          );
        }
      })
      .catch((error) => {
        if (error?.name !== "AbortError" && !controller.signal.aborted) {
          setState({
            status: "error",
            product: null,
            error: getSafeErrorMessage(error),
            identifier,
          });
        }
      });

    return () => controller.abort();
  }, [identifier, requestKey]);
  const currentState =
    state.identifier === identifier
      ? state
      : { status: "loading", product: null, error: "" };

  const addToCart = () => {
    if (agregarAlCarrito(state.product, quantity)) {
      setFeedback(
        `${quantity} ${quantity === 1 ? "unidad agregada" : "unidades agregadas"} al carrito.`,
      );
    }
  };

  if (currentState.status !== "success") {
    return (
      <main className="store-page">
        <Container>
          <PageState
            status={currentState.status}
            error={currentState.error}
            emptyMessage="El producto no existe o ya no está disponible."
            onRetry={retry}
          />
          {currentState.status === "empty" && (
            <div className="text-center">
              <Button as={Link} to="/productos" variant="success">
                Volver al catálogo
              </Button>
            </div>
          )}
        </Container>
      </main>
    );
  }

  const product = currentState.product;
  const available = product.stock > 0;
  const maximumQuantity = Math.min(product.stock, MAX_CART_QUANTITY);

  return (
    <main className="store-page">
      <Container>
        <Link to="/productos" className="back-link">
          <i className="bi bi-arrow-left" aria-hidden="true"></i>
          Volver a productos
        </Link>
        <Row className="g-5 align-items-start product-detail">
          <Col lg={6}>
            <div className="product-detail-image-wrap">
              <img
                src={product.images[0] || FALLBACK_IMAGE}
                alt={product.name}
                className="product-detail-image"
              />
            </div>
          </Col>
          <Col lg={6}>
            <p className="eyebrow">{product.category || "Botánica"}</p>
            <h1>{product.name}</h1>
            {product.botanicalName && (
              <p className="product-detail-botanical">{product.botanicalName}</p>
            )}
            <p className="product-detail-price">
              {formatCurrency(product.price)}
            </p>
            <p className="product-detail-description">
              {product.description || "Consultanos para conocer más sobre este producto."}
            </p>

            <dl className="detail-list">
              <DetailRow label="Presentación" value={product.presentation} />
              <DetailRow label="Ingredientes" value={product.ingredients} />
              <DetailRow label="Advertencias" value={product.warnings} />
            </dl>

            <p className={`stock-label ${available ? "" : "is-empty"}`}>
              {available
                ? `${product.stock} unidades disponibles`
                : "Producto sin stock"}
            </p>

            {available && (
              <div className="detail-purchase">
                <label htmlFor="product-quantity">Cantidad</label>
                <div className="quantity-control">
                  <Button
                    variant="outline-secondary"
                    onClick={() =>
                      setQuantity((current) => Math.max(1, current - 1))
                    }
                    disabled={quantity <= 1}
                    aria-label="Restar una unidad"
                  >
                    −
                  </Button>
                  <output id="product-quantity" aria-live="polite">
                    {quantity}
                  </output>
                  <Button
                    variant="outline-secondary"
                    onClick={() =>
                      setQuantity((current) =>
                        Math.min(maximumQuantity, current + 1),
                      )
                    }
                    disabled={quantity >= maximumQuantity}
                    aria-label="Sumar una unidad"
                  >
                    +
                  </Button>
                </div>
                <Button variant="success" size="lg" onClick={addToCart}>
                  Agregar al carrito
                </Button>
              </div>
            )}

            {feedback && (
              <Alert variant="success" className="mt-3" aria-live="polite">
                {feedback} <Link to="/carrito">Ver carrito</Link>
              </Alert>
            )}
          </Col>
        </Row>
      </Container>
    </main>
  );
}
