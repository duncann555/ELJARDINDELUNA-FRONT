import { Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import FALLBACK_IMAGE from "../../assets/EL_JARDIN_DE_LUNA_FOOTER.png";
import { useCarrito } from "../../context/CarritoContext";
import { formatCurrency } from "../../helpers/format";
import { getProductIdentifier } from "../../helpers/products";

export default function ProductCard({ product }) {
  const { agregarAlCarrito } = useCarrito();
  const identifier = getProductIdentifier(product);
  const available = product.active && product.stock > 0;

  return (
    <Card className="product-card h-100">
      <Link
        to={`/producto/${encodeURIComponent(identifier)}`}
        className="product-card-image-link"
        aria-label={`Ver ${product.name}`}
      >
        <Card.Img
          variant="top"
          src={product.images[0] || FALLBACK_IMAGE}
          alt={product.name}
          className="product-card-image"
        />
      </Link>
      <Card.Body className="d-flex flex-column">
        <p className="product-card-category">{product.category || "Botánica"}</p>
        <Card.Title as="h2" className="product-card-title">
          <Link to={`/producto/${encodeURIComponent(identifier)}`}>
            {product.name}
          </Link>
        </Card.Title>
        {product.botanicalName && (
          <p className="product-card-botanical">{product.botanicalName}</p>
        )}
        <p className="product-card-price">{formatCurrency(product.price)}</p>
        <p className={`product-card-stock ${available ? "" : "is-empty"}`}>
          {available ? `${product.stock} disponibles` : "Sin stock"}
        </p>
        <Button
          variant="success"
          className="mt-auto"
          disabled={!available}
          onClick={() => agregarAlCarrito(product)}
        >
          <i className="bi bi-bag-plus me-2" aria-hidden="true"></i>
          {available ? "Agregar" : "No disponible"}
        </Button>
      </Card.Body>
    </Card>
  );
}
