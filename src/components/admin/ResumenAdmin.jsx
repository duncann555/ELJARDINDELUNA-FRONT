import { Card, Col, Row } from "react-bootstrap";

const TARJETAS_RESUMEN = [
  {
    clave: "productosTotales",
    titulo: "Productos Totales",
    icono: "bi-box-seam",
    claseColor: "bg-primary bg-opacity-10 text-primary",
  },
  {
    clave: "productosSinStock",
    titulo: "Sin Stock",
    icono: "bi-exclamation-triangle-fill",
    claseColor: "bg-danger bg-opacity-10 text-danger",
  },
  {
    clave: "usuariosActivos",
    titulo: "Usuarios Activos",
    icono: "bi-people-fill",
    claseColor: "bg-success bg-opacity-10 text-success",
  },
  {
    clave: "pedidosEnGestion",
    titulo: "Pedidos en Gestion",
    icono: "bi-receipt-cutoff",
    claseColor: "bg-warning bg-opacity-10 text-warning",
  },
];

export default function ResumenAdmin(metricas) {
  return (
    <Row className="mb-4 g-4">
      {TARJETAS_RESUMEN.map((tarjeta) => (
        <Col key={tarjeta.clave} md={6} lg={3}>
          <Card className="status-card shadow-sm h-100">
            <Card.Body className="d-flex align-items-center gap-3">
              <div className={`status-icon-wrapper p-3 rounded ${tarjeta.claseColor}`}>
                <i className={`bi ${tarjeta.icono} fs-4`}></i>
              </div>
              <div>
                <p className="text-muted mb-0 small fw-bold text-uppercase">
                  {tarjeta.titulo}
                </p>
                <h3 className="fw-bold mb-0 text-dark">
                  {metricas[tarjeta.clave] ?? 0}
                </h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
