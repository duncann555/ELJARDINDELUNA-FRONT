import { Alert, Button, Card, Col, Container, Row } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { formatCurrency } from "../../helpers/app";
import { CHECKOUT_PEDIDO_STORAGE_KEY, leerStorageJson } from "../../helpers/checkout";
import {
  DATOS_TRANSFERENCIA,
  construirUrlWhatsAppTransferencia,
  obtenerNumeroPedidoVisible,
} from "../../helpers/transferencia";

export default function TransferenciaConfirmada() {
  const location = useLocation();
  const pedido =
    location.state?.pedido || leerStorageJson(CHECKOUT_PEDIDO_STORAGE_KEY, null);

  if (!pedido?.pedidoId) {
    return (
      <section className="py-5 bg-light min-vh-100">
        <Container>
          <Row className="justify-content-center">
            <Col lg={7}>
              <Alert variant="warning" className="rounded-4">
                No encontramos un pedido por transferencia reciente.
              </Alert>
              <Button as={Link} to="/mis-compras" variant="success" className="rounded-pill">
                Ver mis compras
              </Button>
            </Col>
          </Row>
        </Container>
      </section>
    );
  }

  const totalTransferencia = Number(pedido.total || 0);
  const whatsappUrl = construirUrlWhatsAppTransferencia({
    pedidoId: pedido.pedidoId,
    total: totalTransferencia,
  });

  return (
    <section className="py-5 bg-light min-vh-100">
      <Container>
        <Row className="justify-content-center">
          <Col lg={7} xl={6}>
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="display-5 text-success mb-3">
                    <i className="bi bi-check-circle"></i>
                  </div>
                  <h1 className="font-playfair fw-bold mb-2">
                    Pedido registrado correctamente
                  </h1>
                  <p className="text-muted mb-0">
                    Estado del pago: pendiente de confirmación
                  </p>
                </div>

                <div className="d-grid gap-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Número de pedido</span>
                    <span className="fw-bold">
                      {obtenerNumeroPedidoVisible(pedido.pedidoId)}
                    </span>
                  </div>

                  <div className="text-center bg-light rounded-4 p-4">
                    <div className="text-muted small mb-1">Transferí exactamente</div>
                    <div className="display-6 fw-bold text-success">
                      {formatCurrency(totalTransferencia)}
                    </div>
                  </div>

                  <div>
                    <small className="text-muted d-block">Alias</small>
                    <div className="fw-semibold">{DATOS_TRANSFERENCIA.alias}</div>
                  </div>
                  <div>
                    <small className="text-muted d-block">Titular</small>
                    <div className="fw-semibold">{DATOS_TRANSFERENCIA.titular}</div>
                  </div>
                  <div>
                    <small className="text-muted d-block">Banco/Billetera</small>
                    <div className="fw-semibold">{DATOS_TRANSFERENCIA.banco}</div>
                  </div>
                  {DATOS_TRANSFERENCIA.cuit && (
                    <div>
                      <small className="text-muted d-block">CUIT/CUIL</small>
                      <div className="fw-semibold">{DATOS_TRANSFERENCIA.cuit}</div>
                    </div>
                  )}
                </div>

                <p className="text-muted mt-4 mb-4">
                  Después de transferir, enviá el comprobante por WhatsApp para confirmar tu compra.
                </p>

                <div className="d-grid gap-2">
                  <Button
                    as="a"
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    variant="success"
                    size="lg"
                    className="rounded-pill fw-bold"
                  >
                    Enviar comprobante por WhatsApp
                  </Button>
                  <Button
                    as={Link}
                    to="/mis-compras"
                    variant="outline-success"
                    className="rounded-pill"
                  >
                    Ver mis compras
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
