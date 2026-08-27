import { llamarApi } from "./n8n-config.js";

export const CATEGORIAS_STOCK = [
  "Comida rápida",
  "Almuerzo",
  "Cena elegante",
  "General",
];

export const UNIDADES_STOCK = ["unidades", "g", "kg", "ml", "l"];

export async function obtenerStock() {
  const resultado = await llamarApi("stock_get");
  return resultado?.stock || {};
}
export async function agregarIngrediente(nombre, cantidad, unidad, categoria) {
  const nombreLimpio = String(nombre ?? "").trim();
  const cantidadNumerica = Number(cantidad);

  if (!nombreLimpio) {
    throw new Error("El nombre del ingrediente no puede estar vacío.");
  }
  if (!Number.isFinite(cantidadNumerica) || cantidadNumerica < 0) {
    throw new Error("La cantidad debe ser un número igual o mayor a 0.");
  }
  if (!UNIDADES_STOCK.includes(unidad)) {
    throw new Error("Selecciona una unidad de medida válida.");
  }
  if (!CATEGORIAS_STOCK.includes(categoria)) {
    throw new Error("Selecciona una categoría válida.");
  }

  return llamarApi("stock_crear", {
    nombre: nombreLimpio,
    cantidad: cantidadNumerica,
    unidad,
    categoria,
  });
}
export async function actualizarCantidad(id, nuevaCantidad) {
  if (!id) throw new Error("Falta el id del ingrediente.");
  const cantidadNumerica = Number(nuevaCantidad);
  if (!Number.isFinite(cantidadNumerica) || cantidadNumerica < 0) {
    throw new Error("La cantidad debe ser un número igual o mayor a 0.");
  }
  return llamarApi("stock_actualizar_cantidad", { id, cantidad: cantidadNumerica });
}
export async function eliminarIngrediente(id) {
  if (!id) throw new Error("Falta el id del ingrediente a eliminar.");
  return llamarApi("stock_eliminar", { id });
}