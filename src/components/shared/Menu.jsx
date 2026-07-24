import { useState } from "react";
import { Badge, Container, Nav, Navbar } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";
import LOGO from "../../assets/EL_JARDIN_DE_LUNA_FOOTER.png";
import { useCarrito } from "../../context/CarritoContext";

const LINKS_MENU = [
  { label: "Productos", to: "/productos" },
  { label: "Nosotros", to: "/nosotros" },
  { label: "Contacto", to: "/contacto" },
];

export default function Menu() {
  const { cantidadTotal } = useCarrito();
  const [expanded, setExpanded] = useState(false);
  const close = () => setExpanded(false);

  return (
    <Navbar
      expand="md"
      sticky="top"
      expanded={expanded}
      className="store-navbar"
      aria-label="Navegación principal"
    >
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={close}>
          <img src={LOGO} alt="El Jardín de Luna" className="navbar-logo" />
        </Navbar.Brand>
        <div className="navbar-mobile-actions">
          <Link
            to="/carrito"
            className="cart-nav-link"
            onClick={close}
            aria-label={`Carrito, ${cantidadTotal} productos`}
          >
            <i className="bi bi-bag" aria-hidden="true"></i>
            {cantidadTotal > 0 && <Badge pill>{cantidadTotal}</Badge>}
          </Link>
          <Navbar.Toggle
            aria-controls="main-navigation"
            aria-label="Abrir menú"
            onClick={() => setExpanded((current) => !current)}
          />
        </div>
        <Navbar.Collapse id="main-navigation">
          <Nav className="ms-auto align-items-md-center">
            {LINKS_MENU.map((link) => (
              <Nav.Link
                as={NavLink}
                to={link.to}
                key={link.to}
                onClick={close}
              >
                {link.label}
              </Nav.Link>
            ))}
            <Nav.Link
              as={NavLink}
              to="/carrito"
              className="cart-nav-link cart-nav-desktop"
              onClick={close}
            >
              <i className="bi bi-bag" aria-hidden="true"></i>
              Carrito
              {cantidadTotal > 0 && <Badge pill>{cantidadTotal}</Badge>}
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
