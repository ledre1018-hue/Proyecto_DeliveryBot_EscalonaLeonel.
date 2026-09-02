# DeliveryBot — Gestión de Pedidos Internos de Cafetería

Sistema de automatización basado en **n8n** que convierte a **Telegram** en una
terminal de pedidos inteligente para entornos institucionales (oficinas,
universidades, centros de trabajo). Permite a los usuarios consultar el menú,
armar su carrito, confirmar el pedido y recibir notificaciones en tiempo real
sobre su estado (Recibido → Preparación → En camino → Entregado), mientras el
personal de cocina gestiona las órdenes desde un grupo de Telegram dedicado.

## Enlace a la base de datos (Google Sheets)

[DeliveryBot_DB](https://docs.google.com/spreadsheets/d/1iEVpsOVrAdFpuCH2eoZet6rYh18K1NvxnYFXXyZ-WzI/edit?usp=sharing)

## Objetivos

- Implementar un sistema de pedidos digital mediante una interfaz conversacional en Telegram.
- Automatizar el cálculo de totales y la generación de números de orden únicos.
- Gestionar el ciclo de vida del pedido mediante estados dinámicos.
- Centralizar el inventario y menú en Google Sheets.
- Notificar en tiempo real a cliente y cocina sobre cada cambio de estado.
- Permitir cancelaciones controladas según reglas de negocio.

## Modelo de datos (Google Sheets — `DeliveryBot_DB`)

| Hoja | Columnas |
|---|---|
| `MENU` | `id_producto, nombre, descripcion, precio, categoria, stock` |
| `PEDIDOS` | `id_pedido, id_usuario, detalles_pedido, total_pago, estado, fecha, hora` |
| `USUARIOS` | `telegram_id, nombre_completo, departamento, puntos_lealtad` |
| `SESSIONS` | `telegram_id, pantalla_actual, carrito_temporal, ultimo_cambio` |

La hoja `SESSIONS` funciona como una **máquina de estados**: cada interacción
del usuario actualiza su `pantalla_actual` (inicio, categoría, producto,
cantidad, carrito, confirmar) y su `carrito_temporal` en formato JSON,
identificado por su `telegram_id`. Esto permite que el bot recuerde en qué
paso está cada cliente entre un mensaje y el siguiente, ya que cada mensaje de
Telegram dispara una ejecución independiente y sin memoria propia en n8n.

## Arquitectura general

```
Cliente (Telegram) ⇄ Bot n8n ⇄ Google Sheets (DeliveryBot_DB)
                         ⇅
                 Grupo de Cocina (Telegram)
```

El workflow de n8n está dividido en 6 módulos funcionales:

### 1. Módulo de Entrada y Enrutamiento Global

Punto de entrada único del sistema. Recibe cualquier mensaje o clic de botón,
lo normaliza a un formato común y decide si corresponde a una compra, a un
avance de cocina o a una cancelación.

| Nodo | Tipo | Función |
|---|---|---|
| Telegram Trigger | `telegramTrigger` | Escucha mensajes y callbacks entrantes de Telegram. |
| Normalizar Update | `code` | Extrae `chatId`, `telegramId`, `texto` y `callbackData` sin importar el origen del evento. |
| Enrutar Tipo Mensaje | `switch` | Clasifica entre flujo de compra, avance de cocina (`avanzar_`) o cancelación (`/cancelar`). |
| Leer Sesion | `googleSheets` | Consulta `SESSIONS` para saber en qué pantalla está el usuario. |
| Procesar Sesion | `code` | Valida datos, recupera el carrito en JSON y define la pantalla activa. |
| Enrutar Pantalla | `switch` | Deriva al usuario según su fase: inicio, categoría, producto, cantidad, carrito o confirmación. |

### 2. Módulo de Exploración de Menú y Catálogo

| Nodo | Tipo | Función |
|---|---|---|
| Enviar Categorias | `telegram` | Envía el mensaje de bienvenida con botones de categorías. |
| Guardar Sesion Categoria | `googleSheets` | Registra que el usuario está eligiendo categoría. |
| Extraer Categoria | `code` | Obtiene la categoría elegida. |
| Leer Menu Categoria | `googleSheets` | Filtra los productos de `MENU` por esa categoría. |
| Armar Botones Productos | `code` | Construye la lista de productos con nombre y precio. |
| Enviar Productos | `telegram` | Envía la lista numerada con botones y opción de volver. |
| Guardar Sesion Producto | `googleSheets` | Guarda el catálogo temporal y el estado `producto`. |

### 3. Módulo de Selección de Cantidad y Carrito

| Nodo | Tipo | Función |
|---|---|---|
| Extraer Producto | `code` | Identifica el producto elegido por número. |
| Enviar Botones Cantidad | `telegram` | Pregunta la cantidad con botones (1 a 5 unidades). |
| Guardar Sesion Cantidad | `googleSheets` | Actualiza el estado a `cantidad`. |
| Leer Producto Elegido | `googleSheets` | Verifica el producto en `MENU`. |
| Agregar Al Carrito | `code` | Suma unidades y calcula subtotales/total acumulado. |
| Enviar Resumen Carrito | `telegram` | Muestra el carrito con botones "Agregar más" / "Confirmar pedido". |
| Guardar Sesion Carrito | `googleSheets` | Persiste el carrito actualizado en JSON. |
| Rama Carrito | `switch` | Bifurca entre seguir comprando o pasar a confirmación. |
| Reenviar Categorias | `telegram` | Vuelve a mostrar categorías si el cliente agrega más productos. |
| Volver A Categoria | `googleSheets` | Actualiza la sesión sin perder el carrito. |
| Enviar Confirmacion | `telegram` | Resumen final con botones "Sí, confirmar" / "Cancelar". |
| Guardar Sesion Confirmar | `googleSheets` | Actualiza el estado a `confirmar`. |

### 4. Módulo de Procesamiento de Pedido e Inventario

| Nodo | Tipo | Función |
|---|---|---|
| Rama Confirmar | `switch` | Evalúa si el pedido fue confirmado o cancelado. |
| Armar Pedido | `code` | Genera el `id_pedido` único (`PED-...`), fecha y hora. |
| Guardar Pedido | `googleSheets` | Inserta la orden en `PEDIDOS` con estado inicial. |
| Separar Items Carrito | `splitOut` | Descompone el carrito en productos individuales. |
| Leer Stock Actual | `googleSheets` | Consulta el stock vigente de cada producto en `MENU`. |
| Calcular Descuento Stock | `code` | Resta las unidades compradas al stock actual. |
| Descontar Stock | `googleSheets` | Actualiza el stock en `MENU`. |
| Confirmar Al Cliente | `telegram` | Notifica al cliente su número de pedido. |
| Reiniciar Sesion | `googleSheets` | Limpia el carrito y devuelve la sesión a `inicio`. |

### 5. Módulo de Operaciones de Cocina y Despacho

| Nodo | Tipo | Función |
|---|---|---|
| Notificar Cocina | `telegram` | Envía la comanda al grupo de cocina con botones de estado. |
| Parsear Avance | `code` | Extrae el pedido y el nuevo estado desde el botón presionado. |
| Leer Pedido Por Id | `googleSheets` | Recupera el `chatId` del cliente desde `PEDIDOS`. |
| Actualizar Estado Pedido | `googleSheets` | Modifica la columna `estado` en `PEDIDOS`. |
| Notificar Cliente Avance | `telegram` | Informa al cliente el nuevo estado de su pedido. |
| Confirmar Avance En Cocina | `telegram` | Confirma en el grupo que el cambio quedó registrado. |

### 6. Módulo de Cancelaciones y Reglas de Negocio

| Nodo | Tipo | Función |
|---|---|---|
| Notificar Cancelacion | `telegram` | Avisa al cliente que su pedido fue cancelado antes de confirmarlo. |
| Reiniciar Sesion Cancelada | `googleSheets` | Restablece la sesión tras una cancelación previa a cocina. |
| Leer Pedidos Para Cancelar | `googleSheets` | Busca el historial del cliente al escribir `/cancelar`. |
| Evaluar Cancelacion | `code` | Regla de negocio: bloquea cancelación si el estado es "En camino", "Listo" o "Entregado". |
| Es Cancelable | `if` | Bifurca según si la cancelación fue aprobada o rechazada. |
| Actualizar Pedido Cancelado | `googleSheets` | Marca el pedido como cancelado en `PEDIDOS`. |
| Avisar Cocina Cancelacion | `telegram` | Alerta prioritaria al grupo de cocina para detener la preparación. |
| Confirmar Cancelacion Cliente | `telegram` | Confirma al cliente que la cancelación fue exitosa. |
| Notificar Rechazo Cancelacion | `telegram` | Explica al cliente por qué no se pudo cancelar. |

## Convención de colores de nodos en n8n

| Color | Tipo de nodo | Rol en la arquitectura |
|---|---|---|
| 🟩 Verde | Google Sheets | Base de datos: sesiones, catálogo/stock y órdenes. |
| 🟦 Azul celeste | Telegram | Interfaz de usuario: canal de compra del cliente y canal de comandas de cocina. |
| 🟧 Naranja | Code (JavaScript) | Lógica de negocio: cálculos de totales, formato de menú, generación de `id_pedido`, descuento de stock. |
| 🟣 Azul oscuro / violáceo | Switch / IF | Enrutador del sistema: decide pantalla del cliente y separa flujos de cocina/cancelación. |
| 🟪 Morado | Split Out | Descompone el carrito en ítems individuales para descontar stock uno por uno. |

## Preguntas frecuentes de sustentación

**¿Dónde y cómo se almacenan los datos del bot?**
En Google Sheets, mediante integración nativa por OAuth2, funcionando como
base de datos cloud sin costo de infraestructura adicional.

**¿Cómo maneja el bot el estado y la sesión de cada usuario?**
Mediante una máquina de estados: cada interacción registra `pantalla_actual`
y `carrito_temporal` (JSON) en la hoja `SESSIONS`, asociados al `telegram_id`
único de cada cliente.

**¿Qué ocurre si varios clientes interactúan al mismo tiempo?**
n8n procesa cada mensaje en una ejecución aislada e independiente. La
concurrencia queda protegida porque todas las operaciones sobre `SESSIONS` y
`PEDIDOS` se filtran por el `telegram_id` de cada usuario.

**¿Cómo se comunican el cliente y la cocina en tiempo real?**
Al confirmar el pedido, el bot envía automáticamente la comanda al grupo de
Telegram del personal, con botones de estado (En preparación, Listo, En
camino, Entregado, Cancelar). Al presionarlos, se actualiza `PEDIDOS` y el
cliente recibe la notificación correspondiente en privado.

## Resultado esperado

- Cero pérdida de pedidos gracias al registro automático en la nube.
- Reducción de tiempos de espera al permitir pedidos anticipados.
- Transparencia total del estado del pedido para el cliente.
- Inteligencia de negocio mediante reportes de ventas y productos más vendidos.

## Entregables

- Repositorio GitHub: `Proyecto_DeliveryBot_ApellidoNombre`
- Documentación técnica: este `README.md`
- Archivo `.json` del workflow modular de n8n
- Google Sheets configurado con datos de prueba (enlace arriba)
