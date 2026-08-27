
import { llamarApi } from "./n8n-config.js";

export async function obtenerMenu() {
  const resultado = await llamarApi("menu_get");
  return resultado?.menu || {};
}

export async function agregarPlato(nombre, precio) {
  const nombreLimpio = String(nombre ?? "").trim();
  const precioNumerico = Number(precio);

  if (!nombreLimpio) {
    throw new Error("El nombre del plato no puede estar vacío.");
  }
  if (!Number.isFinite(precioNumerico) || precioNumerico <= 0) {
    throw new Error("El precio debe ser un número mayor a 0.");
  }

  return llamarApi("menu_crear", { nombre: nombreLimpio, precio: precioNumerico });
}

export async function actualizarPrecio(id, nuevoPrecio) {
  if (!id) throw new Error("Falta el id del plato a actualizar.");
  const precioNumerico = Number(nuevoPrecio);
  if (!Number.isFinite(precioNumerico) || precioNumerico <= 0) {
    throw new Error("El precio debe ser un número mayor a 0.");
  }
  return llamarApi("menu_actualizar_precio", { id, precio: precioNumerico });
}

export async function eliminarPlato(id) {
  if (!id) throw new Error("Falta el id del plato a eliminar.");
  return llamarApi("menu_eliminar", { id });
}