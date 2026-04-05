import { useEffect, useState } from "react";
import { Badge, Breadcrumb, Button, Col, Container, Row } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/detalle.css";
import { useCarrito } from "../../context/CarritoContext";
import { API_URL, formatCurrency } from "../../helpers/app";
import { mostrarLoginRequeridoCarrito } from "../../helpers/carrito";

const IMG_PLACEHOLDER = (text) =>
  `https://placehold.co/600x600/png?text=${encodeURIComponent(text || "Sin Imagen")}`;

const DetalleProducto = () => {
  const { id } = useParams();
  const { agregarAlCarrito } = useCarrito();

  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    const cargarProducto = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/productos`);
        if (!response.ok) {
          throw new Error("No se pudo cargar el producto");
        }

        const productos = await response.json();
        const encontrado = productos.find(
          (item) => String(item._id ?? item.id) === String(id),
        );

        if (!encontrado) {
          throw new Error("No encontramos el producto solicitado");
        }

        if (activo) {
          setProducto(encontrado);
          setCantidad(1);
        }
      } catch (err) {
        if (activo) {
          setProducto(null);
          setError(err.message || "No se pudo cargar el detalle");
        }
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

    void cargarProducto();

    return () => {
      activo = false;
    };
  }, [id]);

  if (loading) {
    return <div className="text-center py-5">Cargando producto...</div>;
  }

  if (error || !producto) {
    return (
      <div className="text-center py-5">
        <p className="mb-3">{error || "No se pudo cargar el producto."}</p>
        <Button as={Link} to="/productos" variant="success">
          Volver a productos
        </Button>
      </div>
    );
  }

  const stockDisponible = Number(producto.stock) || 0;

  const handleRestar = () => {
    if (cantidad > 1) setCantidad(cantidad - 1);
  };

  const handleSumar = () => {
    if (cantidad < stockDisponible) setCantidad(cantidad + 1);
  };

  const handleAgregarAlCarrito = () => {
    const agregado = agregarAlCarrito(producto);

    if (!agregado) {
      void mostrarLoginRequeridoCarrito();
      return;
    }

    for (let i = 1; i < cantidad; i += 1) {
      agregarAlCarrito(producto);
    }

    Swal.fire({
      position: "top-end",
      icon: "success",
      title: `Agregaste ${cantidad} ${producto.nombre}`,
      showConfirmButton: false,
      timer: 1500,
      toast: true,
      background: "#f0fdf4",
      color: "#166534",
    });
  };

  return (
    <div className="page-wrapper py-4 py-md-5">
      <Container>
        <Breadcrumb className="custom-breadcrumb mb-4 d-none d-md-block">
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
            Inicio
          </Breadcrumb.Item>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/productos" }}>
            Productos
          </Breadcrumb.Item>
          <Breadcrumb.Item active>{producto.nombre}</Breadcrumb.Item>
        </Breadcrumb>

        <div className="d-md-none mb-3">
          <Link to="/productos" className="text-decoration-none text-muted fw-bold">
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </Link>
        </div>

        <Row className="g-4 g-lg-5 align-items-start">
          <Col xs={12} lg={6} className="mb-3 mb-lg-0">
            <div className="detalle-img-container shadow-sm position-relative">
              <img
                src={
                  producto.imagenUrl ||
                  producto.imagen ||
                  IMG_PLACEHOLDER(producto.nombre)
                }
                alt={producto.nombre}
                className="img-fluid object-fit-contain"
                onError={(event) => {
                  event.target.onerror = null;
                  event.target.src = IMG_PLACEHOLDER(producto.nombre);
                }}
              />
            </div>
          </Col>

          <Col xs={12} lg={6}>
            <div className="detalle-info h-100 d-flex flex-column justify-content-center">
              <div>
                <Badge bg="success" className="mb-3 text-uppercase ls-1 px-3 py-2 rounded-pill">
                  {producto.categoria}
                </Badge>

                <h1 className="fw-bold display-5 text-dark font-playfair mb-2">
                  {producto.nombre}
                </h1>

                <div className="precio-container mb-4">
                  <span className="precio-main">{formatCurrency(producto.precio)}</span>
                </div>

                <p className="detalle-desc mb-4 fs-6">{producto.descripcion}</p>
              </div>

              <div className="compra-actions p-3 p-md-0 rounded-3 bg-light bg-md-transparent border border-md-0 mb-4 mb-md-5">
                <div className="d-flex flex-column flex-sm-row gap-3">
                  <div className="cantidad-selector d-flex align-items-center justify-content-between w-100 w-sm-auto">
                    <button onClick={handleRestar} className="btn-qty" disabled={cantidad <= 1}>
                      -
                    </button>
                    <span className="fw-bold">{cantidad}</span>
                    <button
                      onClick={handleSumar}
                      className="btn-qty"
                      disabled={cantidad >= stockDisponible}
                    >
                      +
                    </button>
                  </div>

                  <Button
                    className="btn-add-cart w-100 rounded-3 fw-bold py-2 py-md-3"
                    onClick={handleAgregarAlCarrito}
                    disabled={stockDisponible <= 0}
                  >
                    <i className="bi bi-bag-plus-fill me-2"></i>
                    Agregar al carrito
                  </Button>
                </div>
                <div className="text-center mt-2 d-md-none">
                  <small className="text-muted">Stock disponible: {stockDisponible}</small>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DetalleProducto;
