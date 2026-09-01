import { llamarApi } from "./n8n-config.js";

export const ESTADOS_PEDIDO = ["Recibido", "Preparación", "En camino", "Entregado"];

export async function obtenerPedidos() {
  const resultado = await llamarApi("pedidos_get");
  return resultado?.pedidos || {};
}

export async function crearPedido({ idUsuario, detallesPedido, totalPago }) {
  const idLimpio = String(idUsuario ?? "").trim();
  const detallesLimpios = String(detallesPedido ?? "").trim();
  const totalNumerico = Number(totalPago);

  if (!idLimpio) {
    throw new Error("Indica la mesa o identificador del pedido.");
  }
  if (!detallesLimpios) {
    throw new Error("El pedido no puede estar vacío.");
  }
  if (!Number.isFinite(totalNumerico) || totalNumerico <= 0) {
    throw new Error("El total del pedido no es válido.");
  }

  return llamarApi("pedido_crear", {
    id_usuario: idLimpio,
    detalles_pedido: detallesLimpios,
    total_pago: totalNumerico,
  });
}

export async function actualizarEstadoPedido(idPedido, estado) {
  if (!idPedido) throw new Error("Falta el id del pedido.");
  if (!ESTADOS_PEDIDO.includes(estado)) {
    throw new Error("Estado de pedido no válido.");
  }
  return llamarApi("pedidos_actualizar_estado", { id_pedido: idPedido, estado });
}