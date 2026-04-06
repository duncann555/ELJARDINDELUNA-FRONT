import { Badge, Button, Col, Form, InputGroup, Row, Table } from "react-bootstrap";
import { formatCurrency } from "../../helpers/app";

export default function SeccionProductosAdmin({
  busqueda,
  onBuscarChange,
  productos,
  onNuevoProducto,
  onEditarProducto,
  onEliminarProducto,
}) {
  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <Row className="mb-3 g-3">
        <Col md={4}>
          <Button className="w-100 btn-admin-primary" onClick={onNuevoProducto}>
            + Nuevo Producto
          </Button>
        </Col>

        <Col md={8}>
          <InputGroup>
            <Form.Control
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(event) => onBuscarChange(event.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      <Table responsive hover className="align-middle">
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Categoria</th>
            <th>Stock</th>
            <th>Precio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => (
            <tr key={producto._id}>
              <td>
                <img
                  src={producto.imagenUrl}
                  alt={producto.nombre}
                  className="rounded"
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
                <Badge bg={producto.stock > 0 ? "success" : "danger"}>
                  {producto.stock}
                </Badge>
              </td>
              <td>{formatCurrency(producto.precio)}</td>
              <td>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="me-2"
                  onClick={() => onEditarProducto(producto)}
                >
                  <i className="bi bi-pencil"></i>
                </Button>

                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => onEliminarProducto(producto._id)}
                >
                  <i className="bi bi-trash"></i>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
