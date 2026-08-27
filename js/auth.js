import { llamarApi } from "./n8n-config.js";

const CLAVE_SESION = "restoapp_admin_token";
const listeners = [];

function notificarCambioSesion() {
  const token = obtenerToken();
  listeners.forEach((cb) => cb(token));
}

export async function iniciarSesion(email, password) {
  const resultado = await llamarApi("admin_login", { email, password });
  if (!resultado?.token) {
    throw new Error("Correo o contraseña incorrectos.");
  }
  sessionStorage.setItem(CLAVE_SESION, resultado.token);
  notificarCambioSesion();
  return resultado.token;
}
export function cerrarSesion() {
  sessionStorage.removeItem(CLAVE_SESION);
  notificarCambioSesion();
}
export function obtenerToken() {
  return sessionStorage.getItem(CLAVE_SESION);
}

export function observarSesion(callback) {
  listeners.push(callback);
  callback(obtenerToken());
}
export function mensajeErrorAuth(error) {
  return error?.message || "No se pudo iniciar sesión. Intenta nuevamente.";
}