import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Form,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  formatCurrencyAdmin,
  getImageUrl,
  getProductId,
} from "./utilidadesAdmin";

const getStockVariant = (stock) => {
  const value = Number(stock);
  if (value <= 0) return "danger";
  if (value <= 5) return "warning";
  return "success";
};

export default function SeccionProductosAdmin({
  products = [],
  loading = false,
  errorMessage = "",
  processingId = "",
  onRetry,
  onCreate,
  onEdit,
  onToggleActive,
}) {
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");

    if (!term) return products;

    return products.filter((product) =>
      [
        product?.name,
        product?.slug,
        product?.botanicalName,
        product?.category,
      ].some((value) =>
        String(value || "")
          .toLocaleLowerCase("es")
          .includes(term),
      ),
    );
  }, [products, search]);

  return (
    <section className="admin-section-card" aria-labelledby="products-title">
      <div className="admin-section-header">
        <div>
          <p className="admin-kicker mb-1">Catálogo</p>
          <h2 id="products-title" className="h4 mb-1">
            Productos
          </h2>
          <p className="admin-muted mb-0">
            Administrá la información, el stock y la visibilidad de la tienda.
          </p>
        </div>
        <Button
          type="button"
          variant="success"
          className="admin-primary-button"
          onClick={onCreate}
        >
          <i className="bi bi-plus-lg me-2" aria-hidden="true"></i>
          Nuevo producto
        </Button>
      </div>

      <div className="admin-toolbar">
        <Form.Group controlId="admin-products-search" className="flex-grow-1">
          <Form.Label className="visually-hidden">Buscar productos</Form.Label>
          <Form.Control
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, slug, categoría o nombre botánico"
          />
        </Form.Group>
        <span className="admin-muted small">
          {products.length} {products.length === 1 ? "producto" : "productos"}
        </span>
      </div>

      {errorMessage && (
        <Alert variant="danger" className="admin-inline-state" role="alert">
          <div>
            <strong>No se pudo cargar el catálogo.</strong>
            <div>{errorMessage}</div>
          </div>
          <Button
            type="button"
            variant="outline-danger"
            size="sm"
            onClick={onRetry}
          >
            Reintentar
          </Button>
        </Alert>
      )}

      {loading ? (
        <div className="admin-empty-state" role="status" aria-live="polite">
          <Spinner animation="border" size="sm" />
          <span>Cargando productos…</span>
        </div>
      ) : !errorMessage && filteredProducts.length === 0 ? (
        <div className="admin-empty-state">
          <i className="bi bi-flower1" aria-hidden="true"></i>
          <span>
            {search
              ? "No hay productos que coincidan con la búsqueda."
              : "Todavía no hay productos cargados."}
          </span>
        </div>
      ) : !errorMessage ? (
        <div className="admin-table-wrap">
          <Table responsive hover className="admin-table align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">Categoría</th>
                <th scope="col">Presentación</th>
                <th scope="col">Precio</th>
                <th scope="col">Stock</th>
                <th scope="col">Visibilidad</th>
                <th scope="col" className="text-end">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const productId = getProductId(product);
                const imageUrl = getImageUrl(product.images?.[0]);
                const isProcessing = processingId === productId;

                return (
                  <tr key={productId}>
                    <td>
                      <div className="admin-product-cell">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt=""
                            className="admin-product-thumb"
                          />
                        ) : (
                          <span
                            className="admin-product-thumb admin-product-thumb--empty"
                            aria-hidden="true"
                          >
                            <i className="bi bi-image"></i>
                          </span>
                        )}
                        <div>
                          <strong>{product.name}</strong>
                          <span>{product.botanicalName || product.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td>{product.category || "—"}</td>
                    <td>{product.presentation || "—"}</td>
                    <td>{formatCurrencyAdmin(product.price)}</td>
                    <td>
                      <Badge bg={getStockVariant(product.stock)}>
                        {Number(product.stock) || 0}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={product.active ? "success" : "secondary"}>
                        {product.active ? "Visible" : "Oculto"}
                      </Badge>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <Button
                          type="button"
                          variant="outline-primary"
                          size="sm"
                          onClick={() => onEdit(product)}
                          disabled={isProcessing}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant={
                            product.active
                              ? "outline-secondary"
                              : "outline-success"
                          }
                          size="sm"
                          onClick={() => onToggleActive(product)}
                          disabled={isProcessing}
                        >
                          {isProcessing && (
                            <Spinner
                              animation="border"
                              size="sm"
                              className="me-2"
                            />
                          )}
                          {product.active ? "Ocultar" : "Publicar"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      ) : null}
    </section>
  );
}
