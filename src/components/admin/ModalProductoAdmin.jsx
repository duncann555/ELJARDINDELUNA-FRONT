import { useEffect, useMemo } from "react";
import {
  Alert,
  Button,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { useForm, useWatch } from "react-hook-form";
import {
  getImageUrl,
  joinMultilineValue,
  PRODUCTO_VACIO,
} from "./utilidadesAdmin";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const getDefaultValues = (product) => ({
  name: product?.name || PRODUCTO_VACIO.name,
  slug: product?.slug || PRODUCTO_VACIO.slug,
  botanicalName:
    product?.botanicalName || PRODUCTO_VACIO.botanicalName,
  category: product?.category || PRODUCTO_VACIO.category,
  presentation: product?.presentation || PRODUCTO_VACIO.presentation,
  price: product?.price ?? PRODUCTO_VACIO.price,
  stock: product?.stock ?? PRODUCTO_VACIO.stock,
  description: product?.description || PRODUCTO_VACIO.description,
  ingredients: joinMultilineValue(product?.ingredients),
  warnings: joinMultilineValue(product?.warnings),
  active: product?.active ?? PRODUCTO_VACIO.active,
});

const validateImage = (files, hasExistingImage) => {
  const image = files?.[0];

  if (!image) {
    return hasExistingImage || "Seleccioná una imagen para el producto.";
  }

  if (!IMAGE_TYPES.includes(image.type)) {
    return "La imagen debe ser JPG, PNG, WebP o AVIF.";
  }

  if (image.size > MAX_IMAGE_SIZE) {
    return "La imagen no puede superar los 2 MB.";
  }

  return true;
};

export default function ModalProductoAdmin({
  show,
  mode,
  product,
  saving = false,
  errorMessage = "",
  onClose,
  onSave,
}) {
  const existingImage = getImageUrl(product?.images?.[0]);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    defaultValues: getDefaultValues(product),
  });
  const selectedImages = useWatch({ control, name: "image" });

  const localPreview = useMemo(() => {
    const image = selectedImages?.[0];
    return image ? URL.createObjectURL(image) : "";
  }, [selectedImages]);

  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );

  const submitProduct = (values) => {
    const formData = new FormData();
    const image = values.image?.[0];

    formData.append("name", values.name.trim());
    formData.append("slug", values.slug.trim().toLowerCase());
    formData.append("botanicalName", values.botanicalName.trim());
    formData.append("category", values.category.trim());
    formData.append("description", values.description.trim());
    formData.append("presentation", values.presentation.trim());
    formData.append("ingredients", values.ingredients.trim());
    formData.append("warnings", values.warnings.trim());
    formData.append("price", String(values.price));
    formData.append("stock", String(values.stock));
    formData.append("active", String(Boolean(values.active)));

    if (image) formData.append("image", image);

    onSave(formData);
  };

  const preview = localPreview || existingImage;
  const title = mode === "edit" ? "Editar producto" : "Nuevo producto";

  return (
    <Modal
      show={show}
      onHide={saving ? undefined : onClose}
      size="lg"
      centered
      backdrop={saving ? "static" : true}
      keyboard={!saving}
      dialogClassName="admin-modal"
    >
      <Modal.Header closeButton={!saving}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {errorMessage && (
          <Alert variant="danger" role="alert">
            {errorMessage}
          </Alert>
        )}

        <Form
          id="admin-product-form"
          noValidate
          onSubmit={handleSubmit(submitProduct)}
        >
          <Row className="g-3">
            <Col md={8}>
              <Form.Group controlId="admin-product-name">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  maxLength={120}
                  disabled={saving}
                  isInvalid={Boolean(errors.name)}
                  {...register("name", {
                    required: "Ingresá el nombre del producto.",
                    validate: (value) =>
                      Boolean(value.trim()) || "Ingresá el nombre del producto.",
                  })}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group controlId="admin-product-slug">
                <Form.Label>Slug</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="nombre-del-producto"
                  maxLength={120}
                  disabled={saving}
                  isInvalid={Boolean(errors.slug)}
                  {...register("slug", {
                    required: "Ingresá el slug.",
                    pattern: {
                      value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                      message:
                        "Usá minúsculas, números y guiones, sin espacios.",
                    },
                  })}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.slug?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="admin-product-botanical-name">
                <Form.Label>Nombre botánico</Form.Label>
                <Form.Control
                  type="text"
                  maxLength={160}
                  disabled={saving}
                  {...register("botanicalName")}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="admin-product-category">
                <Form.Label>Categoría</Form.Label>
                <Form.Control
                  type="text"
                  maxLength={80}
                  disabled={saving}
                  isInvalid={Boolean(errors.category)}
                  {...register("category", {
                    required: "Ingresá una categoría.",
                    validate: (value) =>
                      Boolean(value.trim()) || "Ingresá una categoría.",
                  })}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.category?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="admin-product-presentation">
                <Form.Label>Presentación</Form.Label>
                <Form.Control
                  type="text"
                  maxLength={120}
                  disabled={saving}
                  isInvalid={Boolean(errors.presentation)}
                  {...register("presentation", {
                    required: "Indicá la presentación.",
                    validate: (value) =>
                      Boolean(value.trim()) || "Indicá la presentación.",
                  })}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.presentation?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={6} md={3}>
              <Form.Group controlId="admin-product-price">
                <Form.Label>Precio</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={saving}
                  isInvalid={Boolean(errors.price)}
                  {...register("price", {
                    required: "Ingresá el precio.",
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: "El precio no puede ser negativo.",
                    },
                  })}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.price?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={6} md={3}>
              <Form.Group controlId="admin-product-stock">
                <Form.Label>Stock</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="1"
                  disabled={saving}
                  isInvalid={Boolean(errors.stock)}
                  {...register("stock", {
                    required: "Ingresá el stock.",
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: "El stock no puede ser negativo.",
                    },
                    validate: (value) =>
                      Number.isInteger(value) || "El stock debe ser un entero.",
                  })}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.stock?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="admin-product-description">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  maxLength={1600}
                  disabled={saving}
                  isInvalid={Boolean(errors.description)}
                  {...register("description", {
                    required: "Ingresá una descripción.",
                    validate: (value) =>
                      Boolean(value.trim()) || "Ingresá una descripción.",
                  })}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.description?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="admin-product-ingredients">
                <Form.Label>Ingredientes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  placeholder="Uno por línea"
                  disabled={saving}
                  {...register("ingredients")}
                />
                <Form.Text>Escribí un ingrediente por línea.</Form.Text>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="admin-product-warnings">
                <Form.Label>Advertencias</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  placeholder="Una por línea"
                  disabled={saving}
                  {...register("warnings")}
                />
                <Form.Text>Escribí una advertencia por línea.</Form.Text>
              </Form.Group>
            </Col>

            <Col md={8}>
              <Form.Group controlId="admin-product-image">
                <Form.Label>Imagen principal</Form.Label>
                <Form.Control
                  type="file"
                  accept={IMAGE_TYPES.join(",")}
                  disabled={saving}
                  isInvalid={Boolean(errors.image)}
                  {...register("image", {
                    validate: (files) =>
                      validateImage(files, Boolean(existingImage)),
                  })}
                />
                <Form.Text>JPG, PNG, WebP o AVIF. Máximo 2 MB.</Form.Text>
                <Form.Control.Feedback type="invalid">
                  {errors.image?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4} className="d-flex align-items-end">
              <Form.Group className="admin-switch-field">
                <Form.Check
                  id="admin-product-active"
                  type="switch"
                  label="Visible en la tienda"
                  disabled={saving}
                  {...register("active")}
                />
              </Form.Group>
            </Col>

            {preview && (
              <Col xs={12}>
                <div className="admin-image-preview">
                  <img src={preview} alt="Vista previa del producto" />
                </div>
              </Col>
            )}
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button
          type="button"
          variant="outline-secondary"
          onClick={onClose}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="admin-product-form"
          variant="success"
          disabled={saving}
        >
          {saving && <Spinner animation="border" size="sm" className="me-2" />}
          {saving ? "Guardando…" : "Guardar producto"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
