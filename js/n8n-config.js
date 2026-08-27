export const N8N_API_URL = "https://TU-INSTANCIA-N8N/webhook/restoapp-api";
export async function llamarApi(action, datos = {}) {
  const respuesta = await fetch(N8N_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...datos }),
  });

  const cuerpo = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new Error(cuerpo?.error || `Error del servidor (${respuesta.status}).`);
  }
  if (cuerpo && cuerpo.error) {
    throw new Error(cuerpo.error);
  }
  return cuerpo;
}