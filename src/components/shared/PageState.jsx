import { Button, Spinner } from "react-bootstrap";

export default function PageState({
  status,
  error = "",
  emptyMessage = "No hay contenido disponible.",
  onRetry,
}) {
  if (status === "loading") {
    return (
      <div className="page-state" role="status" aria-live="polite">
        <Spinner animation="border" variant="success" />
        <p>Cargando…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="page-state" role="alert">
        <i className="bi bi-exclamation-circle" aria-hidden="true"></i>
        <p>{error}</p>
        {onRetry && (
          <Button variant="outline-success" onClick={onRetry}>
            Volver a intentar
          </Button>
        )}
      </div>
    );
  }

  if (status === "empty") {
    return (
      <div className="page-state">
        <i className="bi bi-flower1" aria-hidden="true"></i>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return null;
}
