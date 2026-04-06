export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\d{8,15}$/;
export const CODIGO_POSTAL_REGEX = /^[A-Za-z0-9-]{3,10}$/;
export const EMAIL_MIN_LENGTH = 6;
export const EMAIL_MAX_LENGTH = 120;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 40;
export const DOMICILIO_MAX_LENGTH = 160;
export const PRODUCT_STOCK_MAX = 9999;

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
  if (text.length < 2 || text.length > 50) {
    return `${label} debe contener entre 2 y 50 caracteres`;
  }

  return "";
};

export const validateApellido = (value, label = "El apellido") => {
  const text = normalizeText(value);

  if (!text) return `${label} es obligatorio`;
  if (text.length < 2 || text.length > 50) {
    return `${label} debe contener entre 2 y 50 caracteres`;
  }

  return "";
};

export const validateEmail = (value, { required = true } = {}) => {
  const text = normalizeEmail(value);

  if (!text) {
    return required ? "El email es obligatorio" : "";
  }

  if (text.length < EMAIL_MIN_LENGTH || text.length > EMAIL_MAX_LENGTH) {
    return `El email debe contener entre ${EMAIL_MIN_LENGTH} y ${EMAIL_MAX_LENGTH} caracteres`;
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

  if (!text) return "La contrase\u00f1a es obligatoria";
  if (text.length < PASSWORD_MIN_LENGTH) {
    return `La contrase\u00f1a debe contener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  if (text.length > PASSWORD_MAX_LENGTH) {
    return `La contrase\u00f1a no puede superar los ${PASSWORD_MAX_LENGTH} caracteres`;
  }

  return "";
};

export const validatePassword = (value) => {
  const text = String(value || "");

  if (!text) return "La contrase\u00f1a es obligatoria";
  if (text.length < PASSWORD_MIN_LENGTH) {
    return `La contrase\u00f1a debe contener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  if (text.length > PASSWORD_MAX_LENGTH) {
    return `La contrase\u00f1a no puede superar los ${PASSWORD_MAX_LENGTH} caracteres`;
  }

  return "";
};

export const validatePasswordConfirmation = (value, password) => {
  const text = String(value || "");

  if (!text) return "Debes repetir la contrase\u00f1a";
  if (text !== String(password || "")) {
    return "Las contrase\u00f1as no coinciden";
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
  if (text.length < 5 || text.length > DOMICILIO_MAX_LENGTH) {
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
  if (
    !Number.isInteger(numberValue) ||
    numberValue < 0 ||
    numberValue > PRODUCT_STOCK_MAX
  ) {
    return `El stock debe ser un numero entero entre 0 y ${PRODUCT_STOCK_MAX}`;
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
