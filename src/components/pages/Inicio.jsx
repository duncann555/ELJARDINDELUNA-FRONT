import { useEffect, useMemo, useState } from "react";
import { Card, Carousel, Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/inicio.css";

import { useCarrito } from "../../context/CarritoContext";
import { useTheme } from "../../context/ThemeContext";
import {
  formatCurrency,
  obtenerCategoriaVisible,
  optimizarImagenCloudinary,
} from "../../helpers/app";
import { mostrarLoginRequeridoCarrito } from "../../helpers/carrito";
import { obtenerProductosPublicos } from "../../helpers/productosApi";
import EstadoBadge from "../shared/EstadoBadge";

const IMG_PLACEHOLDER = (text) =>
  `https://placehold.co/800x800/png?text=${encodeURIComponent(text || "Sin Imagen")}`;

const CAROUSEL_IMAGES = [
  {
    src:
      import.meta.env.VITE_CAROUSEL_1_URL ||
      "https://res.cloudinary.com/dd9wzjf1q/image/upload/v1777613550/el_jardin_de_luna/carousel/carousel1.png",
    alt: "Banner principal El Jardín de Luna 1",
  },
  {
    src:
      import.meta.env.VITE_CAROUSEL_2_URL ||
      "https://res.cloudinary.com/dd9wzjf1q/image/upload/v1777613551/el_jardin_de_luna/carousel/carousel2.png",
    alt: "Banner principal El Jardín de Luna 2",
  },
  {
    src:
      import.meta.env.VITE_CAROUSEL_3_URL ||
      "https://res.cloudinary.com/dd9wzjf1q/image/upload/v1777613552/el_jardin_de_luna/carousel/carousel3.png",
    alt: "Banner principal El Jardín de Luna 3",
  },
  {
    src:
      import.meta.env.VITE_CAROUSEL_4_URL ||
      "https://res.cloudinary.com/dd9wzjf1q/image/upload/v1777613553/el_jardin_de_luna/carousel/carousel4.png",
    alt: "Banner principal El Jardín de Luna 4",
  },
].map((image) => ({
  ...image,
  src: optimizarImagenCloudinary(image.src, "f_auto,q_auto,w_1600"),
}));

const BannerCategoria = ({ texto }) => <div className="categoria-banner">{texto}</div>;

const CardProducto = ({ producto }) => {
  const navigate = useNavigate();
  const { agregarAlCarrito } = useCarrito();
  const { isDarkMode } = useTheme();
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
      background: isDarkMode ? "#111b28" : "#f6f0e4",
      color: isDarkMode ? "#edf2f7" : "#24364a",
    });

    toast.fire({ icon: "success", title: "Agregado al carrito" });
  };

    return (
      <Card
      className={`h-100 border-0 shadow-sm rounded-4 producto-card cursor-pointer ${
        sinStock ? "producto-card--sin-stock" : ""
      }`}
        onClick={() => navigate(`/producto/${_id}`)}
      >
        <div className="producto-img-wrapper position-relative">
          {sinStock && (
            <EstadoBadge
              tipo="stock"
              valor="sin_stock"
              className="producto-stock-badge position-absolute top-0 end-0 m-3 z-1 shadow-sm"
            />
          )}

        <Card.Img
          src={optimizarImagenCloudinary(imagenUrl) || IMG_PLACEHOLDER(nombre)}
          alt={nombre}
          className="producto-img rounded-top-4"
          loading="lazy"
          onError={(event) => {
            event.target.onerror = null;
            event.target.src = IMG_PLACEHOLDER(nombre);
          }}
        />

        <EstadoBadge
          tipo="categoria"
          valor={obtenerCategoriaVisible(categoria)}
          className="producto-categoria-badge position-absolute bottom-0 start-0 m-2 z-1"
        />
      </div>

      <Card.Body className="d-flex flex-column p-4 producto-card-body">
        <Card.Title className="fs-6 fw-bold producto-title text-truncate mb-1">
          {nombre}
        </Card.Title>

        <Card.Text className="fw-bold fs-5 producto-price mb-1">
          {formatCurrency(precio)}
        </Card.Text>

        <Card.Text className="small mb-3 producto-stock-note">
          {sinStock
            ? "Sin stock disponible"
            : `Quedan ${stockDisponible} unidad${stockDisponible === 1 ? "" : "es"}`}
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
            className={`inicio-card-action inicio-card-action--add ${
              sinStock ? "inicio-card-action--disabled" : ""
            }`}
            onClick={handleAgregar}
            disabled={sinStock}
          >
            {sinStock ? (
              <span>Sin stock</span>
            ) : (
              <>
                <i className="bi bi-cart-plus"></i>
                <span>Agregar</span>
              </>
            )}
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
      const datos = await obtenerProductosPublicos();
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
        <p className="mt-2 text-muted">Preparando el jardín...</p>
      </div>
    );
  }

  return (
    <div className="inicio-wrapper" style={{ overflowX: "hidden", position: "relative" }}>
      <Container fluid className="hero-carousel-shell py-3 px-0 px-md-3">
        <Carousel fade controls className="mx-auto hero-carousel" style={{ maxWidth: 1400 }}>
          {CAROUSEL_IMAGES.map((imagen, index) => (
            <Carousel.Item key={index}>
              <div className="ratio ratio-16x9">
                <img
                  src={imagen.src}
                  alt={imagen.alt}
                  className="w-100 rounded-0 rounded-md-4 object-fit-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "low"}
                />
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </Container>

      <Container className="py-4 text-center inicio-intro">
        <p className="inicio-overline mb-2">Botánica artesanal & bienestar</p>
        <h1 className="inicio-title font-playfair mb-2">Bienvenidos a El Jardín de Luna</h1>
        <p className="inicio-subtitle mb-0">
          Un espacio cálido para descubrir rituales botánicos, tinturas y bienestar cotidiano.
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
              <BannerCategoria texto={`Destacados en ${obtenerCategoriaVisible(categoria.nombre)}`} />

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
                <h6 className="fw-bold m-0">Hasta 3 cuotas sin interés</h6>
              </div>
            </Col>

            <Col xs={12} md={4} className="beneficio-item d-flex align-items-center justify-content-center gap-3">
              <i className="bi bi-truck beneficio-icon"></i>
              <div className="text-start">
                <h6 className="fw-bold m-0">Envíos a todo el país</h6>
                <small className="text-muted">Andreani</small>
              </div>
            </Col>

            <Col xs={12} md={4} className="beneficio-item d-flex align-items-center justify-content-center gap-3">
              <i className="bi bi-flower2 beneficio-icon"></i>
              <div className="text-start">
                <h6 className="fw-bold m-0">100% Natural</h6>
                <small className="text-muted">Material de primera calidad</small>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}
