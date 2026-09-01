import { llamarApi } from "./n8n-config.js";

export const CATEGORIAS_MENU = ["Bebidas", "Comidas", "Snacks"];

export async function obtenerMenu() {
  const resultado = await llamarApi("menu_get");
  return resultado?.menu || {};
}

export async function agregarPlato({ nombre, descripcion, precio, categoria, stock }) {
  const nombreLimpio = String(nombre ?? "").trim();
  const descripcionLimpia = String(descripcion ?? "").trim();
  const precioNumerico = Number(precio);
  const stockNumerico = Number(stock);

  if (!nombreLimpio) {
    throw new Error("El nombre del plato no puede estar vacío.");
  }
  if (!CATEGORIAS_MENU.includes(categoria)) {
    throw new Error("Selecciona una categoría válida.");
  }
  if (!Number.isFinite(precioNumerico) || precioNumerico <= 0) {
    throw new Error("El precio debe ser un número mayor a 0.");
  }
  if (!Number.isFinite(stockNumerico) || stockNumerico < 0) {
    throw new Error("El stock debe ser un número igual o mayor a 0.");
  }

  return llamarApi("menu_crear", {
    nombre: nombreLimpio,
    descripcion: descripcionLimpia,
    precio: precioNumerico,
    categoria,
    stock: stockNumerico,
  });
}

export async function actualizarPlato(idProducto, cambios) {
  if (!idProducto) throw new Error("Falta el id del plato a actualizar.");
  return llamarApi("menu_actualizar", { id_producto: idProducto, ...cambios });
}

export async function eliminarPlato(idProducto) {
  if (!idProducto) throw new Error("Falta el id del plato a eliminar.");
  return llamarApi("menu_eliminar", { id_producto: idProducto });
}