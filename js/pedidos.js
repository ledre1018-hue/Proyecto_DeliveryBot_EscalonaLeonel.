import { llamarApi } from "./n8n-config.js";
export const ESTADOS_PEDIDO = ["Recibido", "Preparación", "En camino", "Entregado"];

export const TIPOS_PEDIDO = ["Mesa", "Domicilio", "Reserva"];
export async function crearPedido({ tipoPedido, mesaODireccion, items, subtotal, iva, total }) {
  if (!TIPOS_PEDIDO.includes(tipoPedido)) {
    throw new Error("Selecciona el tipo de pedido (Mesa, Domicilio o Reserva).");
  }

  const datoLimpio = String(mesaODireccion ?? "").trim();
  if (!datoLimpio) {
    throw new Error(
      tipoPedido === "Mesa"
        ? "Indica el número de mesa."
        : tipoPedido === "Domicilio"
        ? "Indica la dirección de entrega."
        : "Indica la fecha y hora de la reserva."
    );
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("El pedido necesita al menos un plato.");
  }
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error("El total del pedido no es válido.");
  }

  return llamarApi("pedidos_crear", {
    tipoPedido,
    mesaODireccion: datoLimpio,
    items,
    subtotal,
    iva,
    total,
  });
}
export async function obtenerPedidos() {
  const resultado = await llamarApi("pedidos_get");
  return resultado?.pedidos || {};
}

export async function actualizarEstadoPedido(id, estado) {
  if (!id) throw new Error("Falta el id del pedido.");
  if (!ESTADOS_PEDIDO.includes(estado)) {
    throw new Error("Estado de pedido no válido.");
  }
  return llamarApi("pedidos_actualizar_estado", { id, estado });
}