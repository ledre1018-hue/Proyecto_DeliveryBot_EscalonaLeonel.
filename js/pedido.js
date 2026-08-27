export const TASA_IVA = 0.19;

export function calcularTotales(cantidad, precioUnitario, tasaIva = TASA_IVA) {
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new Error("La cantidad debe ser un número mayor a 0.");
  }
  if (!Number.isFinite(precioUnitario) || precioUnitario <= 0) {
    throw new Error("Selecciona un plato válido.");
  }

  const subtotal = cantidad * precioUnitario;
  const iva = subtotal * tasaIva;
  const total = subtotal + iva;

  return { subtotal, iva, total };
}

export function calcularTotalCarrito(items, tasaIva = TASA_IVA) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("El carrito está vacío.");
  }

  const subtotal = items.reduce((acumulado, item) => {
    if (!Number.isFinite(item.cantidad) || item.cantidad <= 0) {
      throw new Error("Hay un ítem con cantidad inválida en el carrito.");
    }
    if (!Number.isFinite(item.precioUnitario) || item.precioUnitario <= 0) {
      throw new Error("Hay un ítem con precio inválido en el carrito.");
    }
    return acumulado + item.cantidad * item.precioUnitario;
  }, 0);

  const iva = subtotal * tasaIva;
  const total = subtotal + iva;

  return { subtotal, iva, total };
}

export function formatearMoneda(valor) {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}