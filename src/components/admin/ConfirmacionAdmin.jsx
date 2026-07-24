import { Button, Modal, Spinner } from "react-bootstrap";

export default function ConfirmacionAdmin({
  show,
  title,
  message,
  confirmLabel = "Confirmar",
  confirmVariant = "success",
  pending = false,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal
      show={show}
      onHide={pending ? undefined : onCancel}
      centered
      backdrop={pending ? "static" : true}
      keyboard={!pending}
      dialogClassName="admin-modal"
    >
      <Modal.Header closeButton={!pending}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          type="button"
          variant="outline-secondary"
          onClick={onCancel}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={pending}
        >
          {pending && <Spinner animation="border" size="sm" className="me-2" />}
          {pending ? "Guardando…" : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
