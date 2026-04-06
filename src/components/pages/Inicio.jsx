import { useEffect, useMemo, useState } from "react";
import { Card, Carousel, Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/inicio.css";

import { useCarrito } from "../../context/CarritoContext";
import { useTheme } from "../../context/ThemeContext";
import { formatCurrency } from "../../helpers/app";
import { solicitarJsonApi } from "../../helpers/clienteApi";
import { mostrarLoginRequeridoCarrito } from "../../helpers/carrito";

import carousel1 from "../../assets/carousel1.png";
import carousel2 from "../../assets/carousel2.png";
import carousel3 from "../../assets/carousel3.png";
import oferta1 from "../../assets/oferta1.png";
import oferta2 from "../../assets/oferta2.jpg";
import oferta3 from "../../assets/oferta3.jpg";

const IMG_PLACEHOLDER = (text) =>
  `https://placehold.co/800x800/png?text=${encodeURIComponent(text || "Sin Imagen")}`;

const BannerCategoria = ({ texto }) => <div className="categoria-banner">{texto}</div>;

const CardProducto = ({ producto }) => {
  const navigate = useNavigate();
  const { agregarAlCarrito } = useCarrito();
  const { isDarkMode } = useTheme();
  const { _id, nombre, precio, imagenUrl, categoria, oferta } = producto;

  const handleAgregar = (event) => {
    event.stopPropagation();
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
      background: isDarkMode ? "#111b28" : "#f6f0e4",
      color: isDarkMode ? "#edf2f7" : "#24364a",
    });

    toast.fire({ icon: "success", title: "Agregado al carrito" });
  };

  return (
    <Card
      className="h-100 border-0 shadow-sm rounded-4 producto-card cursor-pointer"
      onClick={() => navigate(`/producto/${_id}`)}
    >
      <div className="producto-img-wrapper position-relative">
        {oferta && (
          <span className="badge producto-oferta-badge position-absolute top-0 start-0 m-3 px-3 py-2 z-1 shadow-sm">
            OFERTA
          </span>
        )}

        <Card.Img
          src={imagenUrl || IMG_PLACEHOLDER(nombre)}
          alt={nombre}
          className="producto-img rounded-top-4"
          loading="lazy"
          onError={(event) => {
            event.target.onerror = null;
            event.target.src = IMG_PLACEHOLDER(nombre);
          }}
        />

        <span className="badge producto-categoria-badge position-absolute bottom-0 start-0 m-2 z-1">
          {categoria}
        </span>
      </div>

      <Card.Body className="d-flex flex-column p-4 producto-card-body">
        <Card.Title className="fs-6 fw-bold producto-title text-truncate mb-1">
          {nombre}
        </Card.Title>

        <Card.Text className="fw-bold fs-5 producto-price mb-3">
          {formatCurrency(precio)}
        </Card.Text>

        <div className="mt-auto d-flex flex-column flex-sm-row gap-2 inicio-card-actions">
          <button
            type="button"
            className="inicio-card-action inicio-card-action--view"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/producto/${_id}`);
            }}
          >
            Ver
          </button>

          <button
            type="button"
            className="inicio-card-action inicio-card-action--add"
            onClick={handleAgregar}
          >
            <i className="bi bi-cart-plus"></i>
            <span>Agregar</span>
          </button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default function Inicio() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerProductos();
  }, []);

  const obtenerProductos = async () => {
    try {
      const datos = await solicitarJsonApi("/productos", {
        mensajeError: "No se pudieron cargar los productos destacados.",
      });
      setProductos(Array.isArray(datos) ? datos : []);
    } catch (error) {
      console.error("Error cargando productos:", error);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const categorias = useMemo(() => {
    const nombresCategorias = productos.map((producto) => producto.categoria);
    const unicas = [...new Set(nombresCategorias)];
    return unicas.map((nombre, index) => ({ id: index, nombre }));
  }, [productos]);

  const ofertas = productos.filter((producto) => producto.oferta === true);

  const destacadosPorCategoria = useMemo(() => {
    const map = {};
    categorias.forEach((categoria) => {
      const lista = productos.filter(
        (producto) =>
          producto.categoria === categoria.nombre && producto.destacado === true,
      );

      if (lista.length > 0) {
        map[categoria.nombre] = lista;
      }
    });
    return map;
  }, [categorias, productos]);

  const chunkArray = (array, size) => {
    const result = [];
    for (let index = 0; index < array.length; index += size) {
      result.push(array.slice(index, index + size));
    }
    return result;
  };

  if (loading) {
    return (
      <div className="text-center py-5 mt-5">
        <div className="spinner-border text-success" role="status"></div>
        <p className="mt-2 text-muted">Preparando el jardin...</p>
      </div>
    );
  }

  return (
    <div className="inicio-wrapper" style={{ overflowX: "hidden", position: "relative" }}>
      <Container fluid className="hero-carousel-shell py-3 px-0 px-md-3">
        <Carousel fade controls className="mx-auto hero-carousel" style={{ maxWidth: 1400 }}>
          {[carousel1, carousel2, carousel3].map((imagen, index) => (
            <Carousel.Item key={index}>
              <div className="ratio ratio-16x9">
                <img
                  src={imagen}
                  alt={`Banner ${index + 1}`}
                  className="w-100 rounded-0 rounded-md-4 object-fit-cover"
                />
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </Container>

      <Container className="py-4 text-center inicio-intro">
        <p className="inicio-overline mb-2">Botanica artesanal & bienestar</p>
        <h1 className="inicio-title font-playfair mb-2">Bienvenidos a El Jardin de Luna</h1>
        <p className="inicio-subtitle mb-0">
          Un espacio calido para descubrir rituales botanicos, tinturas y bienestar cotidiano.
        </p>
      </Container>

      <Container>
        {categorias.length === 0 && !loading && (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-basket display-1 d-block mb-3 opacity-25"></i>
            <p>No se encontraron productos disponibles por el momento.</p>
          </div>
        )}

        {categorias.map((categoria) => {
          const listaProductos = destacadosPorCategoria[categoria.nombre];
          if (!listaProductos) return null;

          const grupos = chunkArray(listaProductos, 3);

          return (
            <section key={categoria.id} className="mb-5 text-center">
              <BannerCategoria texto={`Destacados en ${categoria.nombre}`} />

              <Carousel
                interval={null}
                indicators={grupos.length > 1}
                controls={grupos.length > 1}
                className="mt-4 carousel-dark px-md-5 destacados-carousel"
              >
                {grupos.map((grupo, index) => (
                  <Carousel.Item key={index}>
                    <Row className="justify-content-center g-4 px-3">
                      {grupo.map((producto) => (
                        <Col xs={12} md={4} key={producto._id}>
                          <CardProducto producto={producto} />
                        </Col>
                      ))}
                    </Row>
                  </Carousel.Item>
                ))}
              </Carousel>
            </section>
          );
        })}
      </Container>

      <section className="beneficios-wrapper">
        <Container>
          <Row className="gy-4 py-4">
            <Col xs={12} md={4} className="beneficio-item d-flex align-items-center justify-content-center gap-3">
              <i className="bi bi-credit-card-2-back beneficio-icon"></i>
              <div className="text-start">
                <h6 className="fw-bold m-0">Hasta 3 cuotas sin interes</h6>
              </div>
            </Col>

            <Col xs={12} md={4} className="beneficio-item d-flex align-items-center justify-content-center gap-3">
              <i className="bi bi-truck beneficio-icon"></i>
              <div className="text-start">
                <h6 className="fw-bold m-0">Envios a todo el pais</h6>
                <small className="text-muted">Seguimiento online</small>
              </div>
            </Col>

            <Col xs={12} md={4} className="beneficio-item d-flex align-items-center justify-content-center gap-3">
              <i className="bi bi-flower2 beneficio-icon"></i>
              <div className="text-start">
                <h6 className="fw-bold m-0">100% Natural</h6>
                <small className="text-muted">Sin aditivos quimicos</small>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <Container className="d-flex justify-content-center py-4">
        <img
          src={oferta2}
          alt="Oferta destacada"
          className="img-fluid rounded-4 shadow-sm w-100 inicio-highlight-offer"
          style={{ maxWidth: "500px" }}
        />
      </Container>

      <Container className="py-5 pb-5">
        <div className="d-flex justify-content-center mb-4">
          <BannerCategoria texto="Ofertas Imperdibles" />
        </div>

        <div className="mb-5 px-md-5">
          <Carousel interval={3000} className="main-carousel-ofertas mx-auto shadow-lg rounded-4 overflow-hidden">
            {[oferta1, oferta3].map((imagen, index) => (
              <Carousel.Item key={index}>
                <div className="ratio ratio-21x9" style={{ maxHeight: "350px" }}>
                  <img
                    className="w-100 h-100 object-fit-cover"
                    src={imagen}
                    alt={`Oferta ${index + 1}`}
                  />
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        </div>

        <Row className="g-4">
          {ofertas.length > 0 ? (
            ofertas.map((producto) => (
              <Col xs={12} sm={6} md={4} lg={3} key={producto._id}>
                <CardProducto producto={producto} />
              </Col>
            ))
          ) : (
            <div className="text-center text-muted w-100 py-4 bg-light rounded-3">
              <small>No hay ofertas activas en este momento.</small>
            </div>
          )}
        </Row>
      </Container>
    </div>
  );
}
