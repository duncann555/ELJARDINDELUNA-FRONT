export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\d{8,15}$/;
export const CODIGO_POSTAL_REGEX = /^[A-Za-z0-9-]{3,10}$/;

const PRODUCT_IMAGE_MAX_SIZE = 2 * 1024 * 1024;
const PRODUCT_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

export const normalizeEmail = (value) =>
  normalizeText(value).toLowerCase();

export const asValidationRule = (validator) => (value) => validator(value) || true;

export const validateNombre = (value, label = "El nombre") => {
  const text = normalizeText(value);

  if (!text) return `${label} es obligatorio`;
  if (text.length < 3 || text.length > 50) {
    return `${label} debe contener entre 3 y 50 caracteres`;
  }

  return "";
};

export const validateApellido = (value, label = "El apellido") => {
  const text = normalizeText(value);

  if (!text) return `${label} es obligatorio`;
  if (text.length < 3 || text.length > 50) {
    return `${label} debe contener entre 3 y 50 caracteres`;
  }

  return "";
};

export const validateEmail = (value, { required = true } = {}) => {
  const text = normalizeEmail(value);

  if (!text) {
    return required ? "El email es obligatorio" : "";
  }

  if (!EMAIL_REGEX.test(text)) {
    return "El email ingresado no es valido";
  }

  return "";
};

export const validateTelefono = (value, { required = true } = {}) => {
  const text = normalizeText(value);

  if (!text) {
    return required ? "El telefono es obligatorio" : "";
  }

  if (!/^\d+$/.test(text)) {
    return "El telefono debe contener solo numeros";
  }

  if (!PHONE_REGEX.test(text)) {
    return "El telefono debe contener entre 8 y 15 digitos";
  }

  return "";
};

export const validateLoginPassword = (value) => {
  const text = String(value || "");

  if (!text) return "La contraseña es obligatoria";
  if (text.length < 8 || text.length > 128) {
    return "La contraseña debe contener entre 8 y 128 caracteres";
  }

  return "";
};

export const validatePassword = (value) => {
  const text = String(value || "");

  if (!text) return "La contraseña es obligatoria";
  if (text.length < 8 || text.length > 72) {
    return "La contraseña debe contener entre 8 y 72 caracteres";
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(text)) {
    return "La contraseña debe contener al menos una letra y un numero";
  }

  return "";
};

export const validatePasswordConfirmation = (value, password) => {
  const text = String(value || "");

  if (!text) return "Debes repetir la contraseña";
  if (text !== String(password || "")) {
    return "Las contraseñas no coinciden";
  }

  return "";
};

export const validateMensajeContacto = (value) => {
  const text = normalizeText(value);

  if (!text) return "La consulta es obligatoria";
  if (text.length < 10 || text.length > 1000) {
    return "La consulta debe contener entre 10 y 1000 caracteres";
  }

  return "";
};

export const validateProvincia = (value) => {
  const text = normalizeText(value);

  if (!text) return "La provincia es obligatoria";
  if (text.length < 2 || text.length > 80) {
    return "La provincia no es valida";
  }

  return "";
};

export const validateCiudad = (value) => {
  const text = normalizeText(value);

  if (!text) return "La ciudad es obligatoria";
  if (text.length < 2 || text.length > 80) {
    return "La ciudad no es valida";
  }

  return "";
};

export const validateDomicilio = (value) => {
  const text = normalizeText(value);

  if (!text) return "El domicilio es obligatorio";
  if (text.length < 5 || text.length > 150) {
    return "El domicilio no es valido";
  }

  return "";
};

export const validateCodigoPostal = (value) => {
  const text = normalizeText(value);

  if (!text) return "El codigo postal es obligatorio";
  if (!CODIGO_POSTAL_REGEX.test(text)) {
    return "El codigo postal no es valido";
  }

  return "";
};

export const validateProductoNombre = (value) => {
  const text = normalizeText(value);

  if (!text) return "El nombre del producto es obligatorio";
  if (text.length < 3 || text.length > 100) {
    return "El nombre del producto debe contener entre 3 y 100 caracteres";
  }

  return "";
};

export const validateProductoCategoria = (value, categorias = []) => {
  const text = normalizeText(value);

  if (!text) return "La categoria es un dato obligatorio";
  if (categorias.length > 0 && !categorias.includes(text)) {
    return `La categoria debe ser valida (${categorias.join(", ")})`;
  }

  return "";
};

export const validateProductoPrecio = (value) => {
  const text = String(value ?? "").trim();

  if (!text) return "El precio es un dato obligatorio";

  const numberValue = Number(text);
  if (!Number.isFinite(numberValue)) {
    return "El precio debe ser un numero valido";
  }
  if (numberValue < 0 || numberValue > 1000000) {
    return "El precio debe ser un numero valido entre 0 y 1.000.000";
  }

  return "";
};

export const validateProductoStock = (value) => {
  const text = String(value ?? "").trim();

  if (!text) return "El stock es un dato obligatorio";

  const numberValue = Number(text);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    return "El stock debe ser un numero entero mayor o igual a 0";
  }

  return "";
};

export const validateProductoDescripcion = (value) => {
  const text = normalizeText(value);

  if (!text) return "La descripcion es un dato obligatorio";
  if (text.length < 10 || text.length > 1000) {
    return "La descripcion debe contener entre 10 y 1000 caracteres";
  }

  return "";
};

export const validateProductImageFile = (file) => {
  if (!file) return "";
  if (!PRODUCT_IMAGE_TYPES.has(file.type)) {
    return "Solo se permiten imagenes JPG, PNG, WEBP o AVIF";
  }
  if (file.size > PRODUCT_IMAGE_MAX_SIZE) {
    return "La imagen no puede superar los 2 MB";
  }

  return "";
};

export const validateTrackingId = (value) => {
  const text = normalizeText(value);

  if (!text) return "";
  if (text.length < 3 || text.length > 120) {
    return "Tracking no valido";
  }

  return "";
};
