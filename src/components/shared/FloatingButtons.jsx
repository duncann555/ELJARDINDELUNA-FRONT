import { Link, useLocation } from "react-router-dom";
import { useCarrito } from "../../context/CarritoContext";
import { CONTACTO_WHATSAPP_URL } from "../../helpers/contact";
import "../../styles/floating.css";

const FloatingButtons = () => {
  const location = useLocation();
  const { cantidadTotal } = useCarrito();
  const enCarrito = location.pathname === "/carrito";

  return (
    <div className="floating-container" aria-label="Accesos rapidos">
      <Link
        to="/carrito"
        aria-label={
          cantidadTotal > 0
            ? `Ir al carrito. Tienes ${cantidadTotal} producto${cantidadTotal === 1 ? "" : "s"}`
            : "Ir al carrito"
        }
        className={`btn-float cart${enCarrito ? " is-active" : ""}`}
        title="Ir al carrito"
      >
        <i className="bi bi-cart3" aria-hidden="true"></i>
        {cantidadTotal > 0 && (
          <span className="float-badge" aria-label={`${cantidadTotal} productos en el carrito`}>
            {cantidadTotal > 99 ? "99+" : cantidadTotal}
          </span>
        )}
      </Link>

      <a
        href={CONTACTO_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir WhatsApp para consultar"
        className="btn-float whatsapp"
        title="Consultanos por WhatsApp"
      >
        <i className="bi bi-whatsapp" aria-hidden="true"></i>
      </a>
    </div>
  );
};

export default FloatingButtons;
