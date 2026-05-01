import { useEffect, useMemo } from "react";
import { Button, Col, FloatingLabel, Form, Modal, Row } from "react-bootstrap";
import { useForm, useWatch } from "react-hook-form";
import { obtenerCategoriaVisible, optimizarImagenCloudinary } from "../../helpers/app";
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
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });
  const imagenFile = useWatch({ control, name: "imagen" });

  const previewArchivo = useMemo(() => {
    if (!imagenFile || imagenFile.length === 0) {
      return null;
    }

    return URL.createObjectURL(imagenFile[0]);
  }, [imagenFile]);

  useEffect(() => {
    return () => {
      if (previewArchivo) {
        URL.revokeObjectURL(previewArchivo);
      }
    };
  }, [previewArchivo]);

  useEffect(() => {
    if (!show) return;
    if (productoInicial && modoProducto === "editar") {
      reset(productoInicial);
      return;
    }

    reset(PRODUCTO_VACIO);
  }, [productoInicial, modoProducto, show, reset]);

  const preview =
    previewArchivo ||
    (show && modoProducto === "editar"
      ? optimizarImagenCloudinary(productoInicial?.imagenUrl) || null
      : null);

  const enviarFormulario = (data) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (key === "oferta") {
        return;
      }

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
          {modoProducto === "crear" ? "Nuevo producto" : "Editar producto"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form id="formProducto" onSubmit={handleSubmit(enviarFormulario)}>
          <FloatingLabel label="Nombre del producto" className="mb-3">
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
              <FloatingLabel label="Categoría">
                <Form.Select
                  {...register("categoria", {
                    validate: asValidationRule((value) =>
                      validateProductoCategoria(value, CATEGORIAS_PRODUCTO),
                    ),
                  })}
                  isInvalid={!!errors.categoria}
                >
                  <option value="">Seleccioná una categoría</option>
                  {CATEGORIAS_PRODUCTO.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {obtenerCategoriaVisible(categoria)}
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
              <FloatingLabel label="Stock disponible">
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
              <FloatingLabel label="Estado del producto">
                <Form.Select {...register("estado")}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </Form.Select>
              </FloatingLabel>
            </Col>
          </Row>

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

          <FloatingLabel label="Descripción">
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
              label="Mostrar en la sección de destacados"
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
