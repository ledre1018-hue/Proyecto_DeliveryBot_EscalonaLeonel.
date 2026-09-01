import { llamarApi } from "./n8n-config.js";

export async function obtenerStock() {
  const resultado = await llamarApi("menu_get");
  return resultado?.menu || {};
}

export async function actualizarStock(idProducto, nuevoStock) {
  if (!idProducto) throw new Error("Falta el id del producto.");
  const stockNumerico = Number(nuevoStock);
  if (!Number.isFinite(stockNumerico) || stockNumerico < 0) {
    throw new Error("El stock debe ser un número igual o mayor a 0.");
  }
  return llamarApi("menu_actualizar", { id_producto: idProducto, stock: stockNumerico });
}