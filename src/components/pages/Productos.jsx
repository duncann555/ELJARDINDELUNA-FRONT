import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  ListGroup,
  Offcanvas,
  Row,
} from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/productos.css";

import { useCarrito } from "../../context/CarritoContext";
import { formatCurrency } from "../../helpers/app";
import { solicitarJsonApi } from "../../helpers/clienteApi";
import { mostrarLoginRequeridoCarrito } from "../../helpers/carrito";

const IMG_PLACEHOLDER = (text) =>
  `https://placehold.co/800x800/png?text=${encodeURIComponent(text || "Sin Imagen")}`;

function SidebarContent({ categorias, categoriaActiva, setCategoriaActiva, onSelect }) {
  const handleSelect = (nombre) => {
    setCategoriaActiva(nombre);
    if (onSelect) onSelect();
  };

  return (
    <ListGroup variant="flush" className="bg-transparent">
      <ListGroup.Item
        action
        active={categoriaActiva === "todas"}
        onClick={() => handleSelect("todas")}
        className="border-0 rounded-3 mb-1 d-flex align-items-center gap-2 py-2 cursor-pointer"
      >
        <i className="bi bi-grid-fill"></i>
        Ver todo
      </ListGroup.Item>

      {categorias.map((categoria, index) => (
        <ListGroup.Item
          key={index}
          action
          active={categoriaActiva === categoria}
          onClick={() => handleSelect(categoria)}
          className="border-0 rounded-3 mb-1 d-flex align-items-center gap-2 py-2 cursor-pointer"
        >
          <i className="bi bi-tag-fill"></i>
          {categoria}
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}

function BannerCategoria({ texto }) {
  return (
    <div className="mb-4 pb-2 border-bottom border-light-subtle fade-in">
      <h2 className="display-6 fw-bold text-dark font-playfair">{texto}</h2>
      <div className="productos-banner-line"></div>
    </div>
  );
}

function CardProducto({ producto }) {
  const navigate = useNavigate();
  const { agregarAlCarrito } = useCarrito();
  const { _id, nombre, precio, imagenUrl, categoria } = producto;
  const stockDisponible = Number(producto?.stock || 0);
  const sinStock = stockDisponible <= 0;

  const handleAgregar = (event) => {
    event.stopPropagation();

    if (sinStock) {
      return;
    }

    const agregado = agregarAlCarrito(producto);

    if (!agregado) {
      void mostrarLoginRequeridoCarrito();
      return;
    }

    const toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      background: "#f6f0e4",
      color: "#24364a",
    });

    toast.fire({ icon: "success", title: "Agregado al carrito" });
  };

  return (
    <Card
      className={`h-100 border-0 shadow-sm hover-scale overflow-hidden cursor-pointer productos-card ${
        sinStock ? "productos-card--sin-stock" : ""
      }`}
      onClick={() => navigate(`/producto/${_id}`)}
    >
      <div
        className="position-relative d-flex align-items-center justify-content-center productos-card-media"
        style={{ width: "100%", aspectRatio: "1/1" }}
      >
        <img
          src={imagenUrl || IMG_PLACEHOLDER(nombre)}
          alt={nombre}
          loading="lazy"
          className="card-img-top productos-card-image"
          style={{
            maxHeight: "85%",
            maxWidth: "85%",
            objectFit: "contain",
            width: "auto",
            height: "auto",
          }}
          onError={(event) => {
            event.target.onerror = null;
            event.target.src = IMG_PLACEHOLDER(nombre);
          }}
        />

        <Badge className="position-absolute bottom-0 start-0 productos-categoria-badge">
          {categoria}
        </Badge>

        {sinStock && (
          <Badge className="position-absolute top-0 end-0 m-3 productos-stock-badge">
            Sin stock
          </Badge>
        )}
      </div>

      <Card.Body className="d-flex flex-column text-center p-3 productos-card-body">
        <Card.Title
          className="fs-6 fw-semibold mb-1 text-truncate productos-card-title"
          title={nombre}
        >
          {nombre}
        </Card.Title>

        <Card.Text className="small mb-3 productos-card-note">
          Presentacion 50 ml
        </Card.Text>

        <div className="fs-4 fw-bold mb-3 productos-card-price">
          {formatCurrency(precio)}
        </div>

        <Card.Text className="small mb-3 productos-stock-note">
          {sinStock
            ? "Sin stock disponible"
            : `Quedan ${stockDisponible} unidad${stockDisponible === 1 ? "" : "es"}`}
        </Card.Text>

        <Button
          variant="success"
          className="mt-auto w-100 fw-medium productos-card-btn"
          onClick={handleAgregar}
          disabled={sinStock}
        >
          {sinStock ? "Sin stock" : "Agregar al carrito"}
        </Button>
      </Card.Body>
    </Card>
  );
}

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [searchParams] = useSearchParams();

  const terminoBusqueda = String(searchParams.get("nombre") || "").trim();

  const handleCloseOffcanvas = () => setShowOffcanvas(false);
  const handleShowOffcanvas = () => setShowOffcanvas(true);

  useEffect(() => {
    setCategoriaActiva("todas");
  }, [terminoBusqueda]);

  useEffect(() => {
    let activo = true;
    const controller = new AbortController();

    const obtenerProductos = async () => {
      setLoading(true);

      try {
        const endpoint = terminoBusqueda
          ? `/productos/buscar?nombre=${encodeURIComponent(terminoBusqueda)}`
          : "/productos";
        const datos = await solicitarJsonApi(endpoint, {
          signal: controller.signal,
          mensajeError: "No se pudieron cargar los productos.",
        });

        if (activo) {
          setProductos(Array.isArray(datos) ? datos : []);
        }
      } catch (error) {
        if (!activo || error.name === "AbortError") {
          return;
        }

        console.error("Error cargando productos:", error);
        setProductos([]);
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

    void obtenerProductos();

    return () => {
      activo = false;
      controller.abort();
    };
  }, [terminoBusqueda]);

  const categorias = useMemo(() => {
    const nombres = productos.map((producto) => producto.categoria);
    return [...new Set(nombres)].sort();
  }, [productos]);

  const productosFiltrados =
    categoriaActiva === "todas"
      ? productos
      : productos.filter((producto) => producto.categoria === categoriaActiva);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-5 productos-page">
      <Container>
        <div className="d-md-none mb-4">
          <div className="text-center mb-3 productos-mobile-header">
            <h2 className="fw-bold text-success">Nuestros Productos</h2>
            <p className="text-muted">
              {terminoBusqueda
                ? `Resultados para "${terminoBusqueda}"`
                : "Explora nuestro catalogo natural"}
            </p>
          </div>

          <Button
            variant="outline-success"
            className="w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm"
            onClick={handleShowOffcanvas}
          >
            <i className="bi bi-funnel-fill"></i>
            Filtrar Productos
          </Button>
        </div>

        <Row>
          <Col md={3} lg={2} className="d-none d-md-block mb-4">
            <div className="sticky-top z-1 productos-sidebar-panel" style={{ top: "100px" }}>
              <h6 className="mb-3 fw-bold text-uppercase text-muted small px-2">
                Filtrar por
              </h6>
              <SidebarContent
                categorias={categorias}
                categoriaActiva={categoriaActiva}
                setCategoriaActiva={setCategoriaActiva}
              />
            </div>
          </Col>

          <Col xs={12} md={9} lg={10}>
            {terminoBusqueda && (
              <div className="mb-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                <p className="mb-0 text-muted">
                  Buscando por: <strong>{terminoBusqueda}</strong>
                </p>
                <small className="text-muted">
                  {productos.length} resultado(s) encontrado(s)
                </small>
              </div>
            )}

            <div className="mb-4 d-none d-md-block">
              <BannerCategoria
                texto={
                  categoriaActiva === "todas"
                    ? terminoBusqueda
                      ? `Resultados de busqueda`
                      : "Catalogo Completo"
                    : categoriaActiva
                }
              />
            </div>

            {productosFiltrados.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <h4>
                  {terminoBusqueda
                    ? "No se encontraron productos para tu busqueda."
                    : "No se encontraron productos en esta categoria."}
                </h4>
              </div>
            ) : (
              <Row className="g-3 g-md-4">
                {productosFiltrados.map((producto) => (
                  <Col xs={12} sm={6} md={4} lg={3} key={producto._id}>
                    <CardProducto producto={producto} />
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>

        <Offcanvas
          show={showOffcanvas}
          onHide={handleCloseOffcanvas}
          placement="start"
          className="productos-filtros-offcanvas"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title className="fw-bold text-success">
              Filtrar por
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <SidebarContent
              categorias={categorias}
              categoriaActiva={categoriaActiva}
              setCategoriaActiva={setCategoriaActiva}
              onSelect={handleCloseOffcanvas}
            />
          </Offcanvas.Body>
        </Offcanvas>
      </Container>
    </div>
  );
}
