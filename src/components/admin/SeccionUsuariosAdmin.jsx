import { Badge, Button, Col, Form, InputGroup, Row, Table } from "react-bootstrap";
import {
  obtenerIdUsuario,
  obtenerVarianteEstadoUsuario,
} from "./utilidadesAdmin";

export default function SeccionUsuariosAdmin({
  usuarioActual,
  busqueda,
  onBuscarChange,
  usuarios,
  totalUsuarios,
  usuariosActivos,
  usuariosSuspendidos,
  usuarioProcesandoId,
  onCambiarEstadoUsuario,
  onEliminarUsuario,
}) {
  return (
    <div className="admin-section-card bg-white p-4 rounded shadow-sm">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-1">Gestion de clientes</h5>
          <p className="text-muted mb-0">
            Busca usuarios y administra su acceso desde el panel.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Badge bg="primary">{totalUsuarios} registrados</Badge>
          <Badge bg="success">{usuariosActivos} activos</Badge>
          <Badge bg="warning" text="dark">
            {usuariosSuspendidos} suspendidos
          </Badge>
        </div>
      </div>

      <Row className="mb-3 g-3">
        <Col md={8} lg={6}>
          <InputGroup className="admin-input-group">
            <Form.Control
              className="admin-search-control"
              placeholder="Buscar por nombre, email o WhatsApp..."
              value={busqueda}
              onChange={(event) => onBuscarChange(event.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      <div className="admin-table-wrap">
        <Table responsive hover className="align-middle admin-table">
          <thead className="table-light">
            <tr>
              <th>Nombre y Apellido</th>
              <th>Email</th>
              <th>WhatsApp</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length > 0 ? (
              usuarios.map((usuario) => {
                const usuarioId = obtenerIdUsuario(usuario);
                const esUsuarioActual = usuarioId === obtenerIdUsuario(usuarioActual);
                const esCuentaProtegida =
                  usuario.rol === "Administrador" || esUsuarioActual;
                const estaProcesando = usuarioProcesandoId === usuarioId;
                const puedeAbrirWhatsapp = Boolean(usuario.telefono);

                return (
                  <tr key={usuarioId}>
                    <td>
                      <div className="fw-bold">
                        {usuario.nombre} {usuario.apellido}
                      </div>
                      <small className="text-muted">ID: {usuarioId}</small>
                    </td>
                    <td>{usuario.email}</td>
                    <td>
                      {puedeAbrirWhatsapp ? (
                        <a
                          href={`https://wa.me/${usuario.telefono}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-decoration-none text-success fw-semibold"
                        >
                          <i className="bi bi-whatsapp me-1"></i>
                          {usuario.telefono}
                        </a>
                      ) : (
                        <span className="text-muted">Sin telefono</span>
                      )}
                    </td>
                    <td>
                      <Badge
                        bg={usuario.rol === "Administrador" ? "danger" : "secondary"}
                      >
                        {usuario.rol}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={obtenerVarianteEstadoUsuario(usuario.estado)}>
                        {usuario.estado}
                      </Badge>
                      {esUsuarioActual && (
                        <div className="small text-muted mt-1">Tu cuenta</div>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant={
                            usuario.estado === "Activo"
                              ? "outline-warning"
                              : "outline-success"
                          }
                          size="sm"
                          className="admin-action-btn"
                          disabled={esCuentaProtegida || estaProcesando}
                          onClick={() => onCambiarEstadoUsuario(usuario)}
                          title={
                            esCuentaProtegida
                              ? "No puedes cambiar el estado de esta cuenta"
                              : ""
                          }
                        >
                          {estaProcesando ? (
                            <span
                              className="spinner-border spinner-border-sm"
                              role="status"
                              aria-hidden="true"
                            ></span>
                          ) : usuario.estado === "Activo" ? (
                            <>
                              <i className="bi bi-person-slash me-1"></i>
                              Suspender
                            </>
                          ) : (
                            <>
                              <i className="bi bi-person-check me-1"></i>
                              Activar
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="admin-action-btn"
                          disabled={esCuentaProtegida || estaProcesando}
                          onClick={() => onEliminarUsuario(usuario)}
                          title={
                            esCuentaProtegida
                              ? "No puedes eliminar esta cuenta"
                              : ""
                          }
                        >
                          <i className="bi bi-trash me-1"></i>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
                  No se encontraron usuarios para esa busqueda.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
