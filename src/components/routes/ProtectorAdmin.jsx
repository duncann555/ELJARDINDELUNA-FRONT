import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Container,
  Form,
  Spinner,
} from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { getSafeErrorMessage } from "../../helpers/api";
import "../../styles/admin.css";

function CargandoAdmin() {
  return (
    <main className="admin-auth-page">
      <div className="admin-auth-loading" role="status" aria-live="polite">
        <Spinner animation="border" size="sm" />
        <span>Validando acceso administrativo…</span>
      </div>
    </main>
  );
}

function LoginAdmin({ login }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (error) {
      setErrorMessage(
        getSafeErrorMessage(
          error,
          "No pudimos iniciar la sesión administrativa.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-auth-page">
      <Container className="admin-auth-container">
        <Card className="admin-auth-card">
          <Card.Body className="p-4 p-md-5">
            <div className="admin-auth-heading">
              <span className="admin-auth-icon" aria-hidden="true">
                <i className="bi bi-shield-lock"></i>
              </span>
              <div>
                <p className="admin-kicker mb-1">Acceso reservado</p>
                <h1 className="admin-auth-title font-playfair mb-2">
                  Administración
                </h1>
                <p className="admin-muted mb-0">
                  Ingresá con las credenciales administrativas de El Jardín de
                  Luna.
                </p>
              </div>
            </div>

            {errorMessage && (
              <Alert variant="danger" className="mt-4" role="alert">
                {errorMessage}
              </Alert>
            )}

            <Form onSubmit={handleSubmit} className="mt-4">
              <Form.Group className="mb-3" controlId="admin-email">
                <Form.Label>Correo electrónico</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  maxLength={120}
                  required
                  disabled={submitting}
                />
              </Form.Group>

              <Form.Group className="mb-4" controlId="admin-password">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  minLength={8}
                  maxLength={128}
                  required
                  disabled={submitting}
                />
              </Form.Group>

              <Button
                type="submit"
                variant="success"
                className="w-100 admin-primary-button"
                disabled={submitting || !email.trim() || !password}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Ingresando…
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </main>
  );
}

export default function ProtectorAdmin({ children }) {
  const { login, isAuthenticated, loading } = useAuth();

  if (loading) return <CargandoAdmin />;
  if (!isAuthenticated) return <LoginAdmin login={login} />;

  return children;
}
