import { useCallback, useEffect, useMemo, useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import { getSafeErrorMessage } from "../../helpers/api";
import { obtenerProductos } from "../../helpers/products";
import PageState from "../shared/PageState";
import ProductCard from "../shared/ProductCard";

export default function Productos() {
  const [state, setState] = useState({
    status: "loading",
    products: [],
    error: "",
  });
  const [category, setCategory] = useState("todas");
  const [query, setQuery] = useState("");
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
            products,
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

  const categories = useMemo(
    () =>
      [...new Set(state.products.map((product) => product.category).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, "es")),
    [state.products],
  );

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");

    return state.products.filter((product) => {
      const matchesCategory =
        category === "todas" || product.category === category;
      const haystack = `${product.name} ${product.botanicalName} ${product.category}`
        .toLocaleLowerCase("es");

      return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [category, query, state.products]);

  return (
    <main className="store-page">
      <Container>
        <header className="page-heading">
          <p className="eyebrow">Tienda online</p>
          <h1>Productos</h1>
          <p>
            Explorá el catálogo disponible. El stock se valida nuevamente al
            iniciar el pago.
          </p>
        </header>

        {state.status === "success" && (
          <>
            <div className="catalog-toolbar">
              <Form.Group controlId="catalog-search">
                <Form.Label>Buscar en el catálogo</Form.Label>
                <Form.Control
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nombre, especie o categoría"
                />
              </Form.Group>
              <Form.Group controlId="catalog-category">
                <Form.Label>Categoría</Form.Label>
                <Form.Select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="todas">Todas</option>
                  {categories.map((item) => (
                    <option value={item} key={item}>
                      {item}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>

            {visibleProducts.length ? (
              <Row className="g-4">
                {visibleProducts.map((product) => (
                  <Col xs={12} sm={6} lg={4} xl={3} key={product.id}>
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>
            ) : (
              <PageState
                status="empty"
                emptyMessage="No encontramos productos con esos filtros."
              />
            )}
          </>
        )}

        {state.status !== "success" && (
          <PageState
            status={state.status}
            error={state.error}
            emptyMessage="El catálogo no tiene productos disponibles por el momento."
            onRetry={retry}
          />
        )}
      </Container>
    </main>
  );
}
