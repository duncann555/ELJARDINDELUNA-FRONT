export const formatCurrency = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export const formatDate = (value) => {
  if (!value) return "Sin fecha informada";
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Sin fecha informada"
    : new Intl.DateTimeFormat("es-AR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
};
