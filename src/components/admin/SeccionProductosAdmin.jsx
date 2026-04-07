import { Badge, Button, Col, Form, InputGroup, Row, Table } from "react-bootstrap";
import { formatCurrency } from "../../helpers/app";

export default function SeccionProductosAdmin({
  busqueda,
  onBuscarChange,
  productos,
  productoProcesandoId,
  onNuevoProducto,
  onEditarProducto,
  onCambiarEstadoProducto,
  onEliminarProducto,
}) {
  return (
    <div className="admin-section-card bg-white p-4 rounded shadow-sm">
      <Row className="mb-3 g-3">
        <Col md={4}>
          <Button className="w-100 btn-admin-primary" onClick={onNuevoProducto}>
            + Nuevo Producto
          </Button>
        </Col>

        <Col md={8}>
          <InputGroup className="admin-input-group">
            <Form.Control
              className="admin-search-control"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(event) => onBuscarChange(event.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      <div className="admin-table-wrap">
        <Table responsive hover className="align-middle admin-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Categoria</th>
              <th>Estado</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => {
              const productoVisible = producto.estado !== "Inactivo";

              return (
                <tr key={producto._id}>
                  <td>
                    <img
                      src={producto.imagenUrl}
                      alt={producto.nombre}
                      className="admin-thumb rounded"
                      style={{
                        width: "40px",
                        height: "40px",
                        objectFit: "cover",
                      }}
                    />
                  </td>
                  <td className="fw-bold">{producto.nombre}</td>
                  <td>
                    <Badge bg="info" text="dark">
                      {producto.categoria}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={productoVisible ? "success" : "secondary"}>
                      {productoVisible ? "Visible" : "Suspendido"}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={producto.stock > 0 ? "success" : "danger"}>
                      {producto.stock}
                    </Badge>
                  </td>
                  <td>{formatCurrency(producto.precio)}</td>
                  <td>
                    <Button
                      variant={
                        productoVisible ? "outline-warning" : "outline-success"
                      }
                      size="sm"
                      className="admin-action-btn me-2"
                      onClick={() => onCambiarEstadoProducto(producto)}
                      disabled={productoProcesandoId === producto._id}
                    >
                      {productoProcesandoId === producto._id
                        ? "Guardando..."
                        : productoVisible
                          ? "Suspender"
                          : "Mostrar"}
                    </Button>

                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="admin-action-btn me-2"
                      onClick={() => onEditarProducto(producto)}
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>

                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="admin-action-btn"
                      onClick={() => onEliminarProducto(producto._id)}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
