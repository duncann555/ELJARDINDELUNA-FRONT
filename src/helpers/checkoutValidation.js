const normalizeText = (value) => String(value || "").trim();
const normalizePhone = (value) => normalizeText(value).replace(/\D/g, "");

export const validateName = (value, label = "El nombre") => {
  const text = normalizeText(value);
  if (!text) return `${label} es obligatorio.`;
  if (text.length < 2 || text.length > 50) {
    return `${label} debe tener entre 2 y 50 caracteres.`;
  }
  return "";
};

export const validateEmail = (value) => {
  const text = normalizeText(value).toLowerCase();
  if (!text) return "El correo electrónico es obligatorio.";
  if (text.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return "Ingresá un correo electrónico válido.";
  }
  return "";
};

export const validatePhone = (value) => {
  const phone = normalizePhone(value);
  if (!phone) return "El teléfono es obligatorio.";
  if (!/^\d{8,15}$/.test(phone)) {
    return "Ingresá un teléfono de entre 8 y 15 dígitos.";
  }
  return "";
};

export const validateLocation = (value, label) => {
  const text = normalizeText(value);
  if (!text) return `${label} es obligatorio.`;
  if (text.length < 2 || text.length > 80) return `${label} no es válido.`;
  return "";
};

export const validatePostalCode = (value) => {
  const text = normalizeText(value);
  if (!text) return "El código postal es obligatorio.";
  if (!/^[A-Za-z0-9-]{3,10}$/.test(text)) {
    return "Ingresá un código postal válido.";
  }
  return "";
};

export const validateAddress = (value) => {
  const text = normalizeText(value);
  if (!text) return "La dirección es obligatoria.";
  if (text.length < 5 || text.length > 160) return "La dirección no es válida.";
  return "";
};

export const validateNotes = (value) =>
  normalizeText(value).length <= 300
    ? ""
    : "Las aclaraciones no pueden superar los 300 caracteres.";

export const validateCheckout = (values = {}) => {
  const homeDelivery = values.metodo === "domicilio";
  const errors = {
    nombre: validateName(values.nombre),
    apellido: validateName(values.apellido, "El apellido"),
    telefono: validatePhone(values.telefono),
    email: validateEmail(values.email),
    metodo: ["domicilio", "retiro"].includes(values.metodo)
      ? ""
      : "Seleccioná un método de entrega.",
    provincia: homeDelivery
      ? validateLocation(values.provincia, "La provincia")
      : "",
    localidad: homeDelivery
      ? validateLocation(values.localidad, "La localidad")
      : "",
    codigoPostal: homeDelivery ? validatePostalCode(values.codigoPostal) : "",
    direccion: homeDelivery ? validateAddress(values.direccion) : "",
    aclaraciones: validateNotes(values.aclaraciones),
  };

  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message)),
  );
};

export const normalizeCheckoutPayload = (values = {}, cart = []) => {
  const metodo = values.metodo === "retiro" ? "retiro" : "domicilio";

  return {
    cliente: {
      nombre: normalizeText(values.nombre),
      apellido: normalizeText(values.apellido),
      telefono: normalizePhone(values.telefono),
      email: normalizeText(values.email).toLowerCase(),
    },
    entrega: {
      metodo,
      provincia: metodo === "domicilio" ? normalizeText(values.provincia) : "",
      localidad: metodo === "domicilio" ? normalizeText(values.localidad) : "",
      codigoPostal:
        metodo === "domicilio" ? normalizeText(values.codigoPostal) : "",
      direccion: metodo === "domicilio" ? normalizeText(values.direccion) : "",
      aclaraciones: normalizeText(values.aclaraciones),
    },
    productos: cart.map((item) => ({
      productoId: item.id,
      cantidad: item.quantity,
    })),
  };
};
