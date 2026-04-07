import { useEffect, useState } from "react";
import { Button, Col, FloatingLabel, Form, Modal, Row } from "react-bootstrap";
import { useForm, useWatch } from "react-hook-form";
import {
  asValidationRule,
  normalizeText,
  validateProductImageFile,
  validateProductoCategoria,
  validateProductoDescripcion,
  validateProductoNombre,
  validateProductoPrecio,
  validateProductoStock,
} from "../../helpers/validation";
import {
  CATEGORIAS_PRODUCTO,
  PRODUCTO_VACIO,
} from "./utilidadesAdmin";

export default function ModalProductoAdmin({
  show,
  modoProducto,
  productoInicial,
  cerrarModalProducto,
  guardarProducto,
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    reValidateMode: "onChange",
  });
  const [preview, setPreview] = useState(null);
  const imagenFile = useWatch({ control, name: "imagen" });

  useEffect(() => {
    let objectUrl;

    if (imagenFile && imagenFile.length > 0) {
      objectUrl = URL.createObjectURL(imagenFile[0]);
      setPreview(objectUrl);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imagenFile]);

  useEffect(() => {
    if (!show) return;

    if (productoInicial && modoProducto === "editar") {
      reset(productoInicial);
      setPreview(productoInicial.imagenUrl || null);
      return;
    }

    reset(PRODUCTO_VACIO);
    setPreview(null);
  }, [productoInicial, modoProducto, show, reset]);

  const enviarFormulario = (data) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (key === "imagen") {
        if (value && value.length > 0) {
          formData.append("imagen", value[0]);
        }
        return;
      }

      formData.append(key, typeof value === "string" ? normalizeText(value) : value);
    });

    guardarProducto(formData);
  };

  return (
    <Modal
      show={show}
      onHide={cerrarModalProducto}
      centered
      size="lg"
      backdrop="static"
      dialogClassName="admin-modal-dialog"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {modoProducto === "crear" ? "Nuevo Producto" : "Editar Producto"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form id="formProducto" onSubmit={handleSubmit(enviarFormulario)}>
          <FloatingLabel label="Nombre del Producto" className="mb-3">
            <Form.Control
              type="text"
              {...register("nombre", {
                validate: asValidationRule(validateProductoNombre),
              })}
              isInvalid={!!errors.nombre}
            />
            <Form.Control.Feedback type="invalid">
              {errors.nombre?.message}
            </Form.Control.Feedback>
          </FloatingLabel>

          <Row className="mb-3">
            <Col md={6}>
              <FloatingLabel label="Categoria">
                <Form.Select
                  {...register("categoria", {
                    validate: asValidationRule((value) =>
                      validateProductoCategoria(value, CATEGORIAS_PRODUCTO),
                    ),
                  })}
                  isInvalid={!!errors.categoria}
                >
                  <option value="">Seleccione una categoria</option>
                  {CATEGORIAS_PRODUCTO.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.categoria?.message}
                </Form.Control.Feedback>
              </FloatingLabel>
            </Col>

            <Col md={6}>
              <FloatingLabel label="Precio ($)">
                <Form.Control
                  type="number"
                  step="0.01"
                  {...register("precio", {
                    validate: asValidationRule(validateProductoPrecio),
                  })}
                  isInvalid={!!errors.precio}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.precio?.message}
                </Form.Control.Feedback>
              </FloatingLabel>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <FloatingLabel label="Stock Disponible">
                <Form.Control
                  type="number"
                  {...register("stock", {
                    validate: asValidationRule(validateProductoStock),
                  })}
                  isInvalid={!!errors.stock}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.stock?.message}
                </Form.Control.Feedback>
              </FloatingLabel>
            </Col>

            <Col md={6}>
              <FloatingLabel label="Estado del Producto">
                <Form.Select {...register("estado")}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </Form.Select>
              </FloatingLabel>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Esta en oferta"
              {...register("oferta")}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Imagen</Form.Label>
            <Form.Control
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              isInvalid={!!errors.imagen}
              {...register("imagen", {
                validate: (value) => validateProductImageFile(value?.[0]) || true,
              })}
            />
            <Form.Control.Feedback type="invalid">
              {errors.imagen?.message}
            </Form.Control.Feedback>
          </Form.Group>

          {preview && (
            <div className="text-center mb-3">
              <img
                src={preview}
                alt="Preview del producto"
                className="admin-modal-preview img-fluid rounded shadow-sm"
                style={{ maxHeight: "150px" }}
              />
            </div>
          )}

          <FloatingLabel label="Descripcion">
            <Form.Control
              as="textarea"
              style={{ height: "100px" }}
              {...register("descripcion", {
                validate: asValidationRule(validateProductoDescripcion),
              })}
              isInvalid={!!errors.descripcion}
            />
            <Form.Control.Feedback type="invalid">
              {errors.descripcion?.message}
            </Form.Control.Feedback>
          </FloatingLabel>

          <Form.Group className="admin-modal-switchbox my-3 p-3 bg-light rounded border">
            <Form.Check
              type="switch"
              label="Mostrar en la seccion de destacados"
              id="destacado-switch"
              {...register("destacado")}
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={cerrarModalProducto}>
          Cancelar
        </Button>
        <Button variant="success" type="submit" form="formProducto">
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
