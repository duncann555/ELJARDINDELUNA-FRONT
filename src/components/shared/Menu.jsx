import { useState } from "react";
import {
  Badge,
  Button,
  Col,
  Container,
  Dropdown,
  Form,
  Nav,
  Navbar,
  Row,
} from "react-bootstrap";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "../../styles/menu.css";
import LOGO from "../../assets/ESSENZIA.png";
import { useAuth } from "../../context/AuthContext";
import { useCarrito } from "../../context/CarritoContext";
import { useTheme } from "../../context/ThemeContext";
import Login from "../pages/Login.jsx";

const NAV_LINKS = [
  { to: "/", text: "Inicio" },
  { to: "/productos", text: "Productos" },
  { to: "/nosotros", text: "Nosotros" },
  { to: "/contacto", text: "Consultanos" },
];

const ROL_ADMIN = "Administrador";
const MOBILE_CART_BADGE_STYLE = { fontSize: "0.6rem" };

function CartShortcut({ cantidadTotal, className = "", onClick, compact = false }) {
  return (
    <Link
      to="/carrito"
      className={`nav-icon-link fs-4 position-relative ${className}`.trim()}
      onClick={onClick}
    >
      <i className="bi bi-cart3"></i>
      {cantidadTotal > 0 && (
        <Badge
          bg="success"
          pill
          className={`position-absolute top-0 start-100 translate-middle${
            compact ? "" : " border border-light"
          }`}
          style={compact ? MOBILE_CART_BADGE_STYLE : undefined}
        >
          {cantidadTotal}
        </Badge>
      )}
    </Link>
  );
}

function ThemeToggleSwitch({ mobile = false }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const nextLabel = isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  const currentLabel = isDarkMode ? "Modo oscuro" : "Modo claro";

  return (
    <button
      type="button"
      className={`theme-switch-shell${mobile ? " mobile" : ""}${isDarkMode ? " is-dark" : " is-light"}`}
      onClick={toggleTheme}
      aria-label={nextLabel}
      aria-pressed={isDarkMode}
      title={currentLabel}
    >
      <span className="theme-switch-track" aria-hidden="true">
        <span className="theme-switch-label theme-switch-label-day">Día</span>
        <span className="theme-switch-label theme-switch-label-night">Noche</span>

        <span className="theme-switch-thumb">
          <i className={`bi ${isDarkMode ? "bi-moon-fill" : "bi-sun-fill"}`}></i>
        </span>
      </span>

      <span className="visually-hidden">
        {nextLabel}
      </span>
    </button>
  );
}

function Menu() {
  const { user, logout } = useAuth();
  const { cantidadTotal } = useCarrito();
  const [showLogin, setShowLogin] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setExpanded(false);
    navigate("/");
  };

  const esAdmin = user?.rol === ROL_ADMIN;

  return (
    <>
      <Navbar
        expand="lg"
        variant="dark"
        sticky="top"
        expanded={expanded}
        className="navbar-modern py-2"
      >
        <Container>
          <div className="d-flex d-lg-none w-100 justify-content-between align-items-center">
            <Navbar.Brand as={Link} to="/" onClick={() => setExpanded(false)}>
              <img src={LOGO} alt="El Jardin de Luna" height="52" />
            </Navbar.Brand>

            <div className="d-flex gap-3 align-items-center">
              <CartShortcut cantidadTotal={cantidadTotal} compact />

              <Navbar.Toggle
                className="border-0 p-0"
                onClick={() => setExpanded(expanded ? false : "expanded")}
              />
            </div>
          </div>

          <Row className="d-none d-lg-flex w-100 align-items-center m-0 flex-nowrap navbar-desktop-row">
            <Col lg="auto" className="navbar-brand-col p-0">
              <Navbar.Brand as={Link} to="/">
                <img src={LOGO} alt="El Jardin de Luna" height="72" />
              </Navbar.Brand>
            </Col>

            <Col className="navbar-search-col px-3">
              <SearchBar />
            </Col>

            <Col
              lg="auto"
              className="navbar-actions-col d-flex justify-content-end align-items-center gap-3 p-0"
            >
              {user ? (
                <Dropdown>
                  <Dropdown.Toggle
                    variant="transparent"
                    className="btn-login-modern border-0 d-flex align-items-center gap-2 text-white"
                  >
                    <i className="bi bi-person-circle fs-5"></i>
                    <span className="text-truncate" style={{ maxWidth: "150px" }}>
                      {esAdmin ? "Administrador" : `Hola, ${user.nombre}`}
                    </span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu align="end" className="shadow border-0 rounded-3 mt-2">
                    <Dropdown.Header>Mi Cuenta</Dropdown.Header>

                    {esAdmin && (
                      <Dropdown.Item as={Link} to="/admin">
                        <i className="bi bi-speedometer2 me-2"></i>
                        Panel Admin
                      </Dropdown.Item>
                    )}

                    <Dropdown.Item onClick={handleLogout} className="text-danger">
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Cerrar sesion
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <Button
                  className="btn-login-modern d-flex align-items-center gap-2"
                  onClick={() => setShowLogin(true)}
                >
                  <i className="bi bi-person-fill"></i>
                  <span>Ingresar</span>
                </Button>
              )}

              <CartShortcut cantidadTotal={cantidadTotal} />
              <ThemeToggleSwitch />
            </Col>
          </Row>

          <Navbar.Collapse>
            <div className="d-lg-none pt-3 pb-2">
              <SearchBar />

              <Nav className="flex-column gap-2 mb-3 mt-3">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className="nav-link-mobile"
                    onClick={() => setExpanded(false)}
                  >
                    {link.text}
                  </NavLink>
                ))}

                {esAdmin && (
                  <NavLink
                    to="/admin"
                    className="nav-link-mobile text-warning"
                    onClick={() => setExpanded(false)}
                  >
                    <i className="bi bi-speedometer2 me-2"></i>
                    Panel de administracion
                  </NavLink>
                )}
              </Nav>

              <ThemeToggleSwitch mobile />

              {user ? (
                <Button
                  variant="outline-light"
                  className="w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right"></i>
                  Cerrar sesion ({user.nombre})
                </Button>
              ) : (
                <Button
                  className="btn-login-modern w-100 py-2"
                  onClick={() => {
                    setShowLogin(true);
                    setExpanded(false);
                  }}
                >
                  <i className="bi bi-person-fill me-2"></i>
                  Ingresar
                </Button>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div className="lower-navbar d-none d-lg-block shadow-sm">
        <Container>
          <Nav className="justify-content-center gap-5">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className="nav-link-custom">
                {link.text}
              </NavLink>
            ))}
          </Nav>
        </Container>
      </div>

      <Login show={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}

function SearchBar() {
  return (
    <Form
      className="search-wrapper w-100"
      onSubmit={(event) => event.preventDefault()}
    >
      <i className="bi bi-search search-icon"></i>
      <input
        type="text"
        className="search-input w-100"
        placeholder="Buscar productos..."
      />
    </Form>
  );
}

export default Menu;
