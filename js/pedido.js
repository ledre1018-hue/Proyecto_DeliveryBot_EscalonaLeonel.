export function formatearMoneda(valor) {
  return `$${Math.round(valor).toLocaleString("es-CO")}`;
}