# Diseño: Pantalla de Registro de Movimiento de Inventario

## Resumen
Reemplazar el modal actual de "Registrar Movimiento" por una página completa
(`/dashboard/inventario/movimientos/nuevo`) con el diseño del mockup HTML
proporcionado: radios de tipo de movimiento, selects de ítem/almacén/lote,
costo unitario, motivo, documento y fecha con hora.

## Decisiones tomadas
1. **Página completa en nueva ruta** (mismo patrón que "Nuevo Lote"), no modal.
2. **Extender el store de inventario** con los campos nuevos del mockup.
3. **Incluir "Transferencia"** como quinto tipo (el mockup solo traía 4), con
   campo "Almacén destino" obligatorio cuando se selecciona.

## Ruta y navegación
- Nueva ruta: `dashboard/inventario/movimientos/nuevo`
  - nombre: `dashboard-inventario-movimientos-nuevo`
  - vista: `src/views/MovimientoNuevoView.vue`
  - `meta: { requiresAuth: true }` (hereda del padre `/dashboard`)
- En `MovimientosView.vue` el botón "Registrar Movimiento" pasa a ser
  `router-link` hacia esa ruta.
- Se eliminan del todo el modal y su lógica: `showModal`, `form`,
  `openCreateModal`, `closeModal`, `submitForm`.
- En `DashboardView.titles` se agregan las rutas que faltan para que el header
  muestre el título correcto:
  - `dashboard-inventario-movimientos` → "Movimientos (Kardex)"
  - `dashboard-inventario-existencias` → "Existencias"
  - `dashboard-inventario-movimientos-nuevo` → "Nuevo Movimiento"
  - rutas POA: `dashboard-poa` → "Estructura POA",
    `dashboard-poa-dashboard` → "Dashboard POA",
    `dashboard-poa-planes` → "Planes POA",
    `dashboard-poa-actividad` → "Actividad POA",
    `dashboard-poa-techos` → "Techos Presupuestarios",
    `dashboard-poa-bitacora` → "Bitácora de Metas"

## Formulario (`MovimientoNuevoView.vue`)
Estructura fiel al mockup, adaptada al layout de `DashboardView` (sin sidebar
propio: el formulario va dentro del `<main>` con `max-w-3xl mx-auto`).

Campos, en orden:
1. **Tipo de Movimiento** (obligatorio): 5 radios con tarjetas estilo mockup
   (peer-checked con borde/fondo de color):
   - Entrada (verde), Salida (rojo), Baja (gris), Ajuste (amarillo),
     Transferencia (azul, agregado fuera del mockup).
   - Transferencia muestra debajo el campo **Almacén destino** (select,
     obligatorio, mismos almacenes menos el elegido como origen).
2. **Ítem** (select, obligatorio): nombres únicos de
   `store.lotes[].item_nombre` + `store.existencias[].item_nombre`
   (ordenados, sin repetidos). Ya no es texto libre.
3. **Almacén** (select, obligatorio): `store.almacenes` con `activo: true`.
4. **Lote** (select, opcional): "— Sin lote / No aplica —" + `store.lotes`
   activos cuyo `item_nombre` coincide con el ítem elegido. Si no hay
   coincidencias, solo la opción "Sin lote".
5. **Cantidad** (number, obligatoria, `step="0.01"`, sin `min`: admite negativos
   solo para Ajuste) +
   **Costo Unitario** (number, opcional, `step="0.01"`, `min="0"`).
6. **Motivo** (select, opcional) con los valores del kardex:
   `compra`, `donacion`, `devolucion`, `solicitud_material`, `merma`,
   `vencimiento`, `extravio`, `recuento`, `entrega_asociacion`, `baja`
   (mostrar etiquetas legibles: "Compra", "Donación", "Solicitud de material"…).
7. **Documento**: "Tipo de Documento" (select, opcional): Nota de Ingreso,
   Nota de Salida, Acta de Recepción, Acta de Baja, Acta de Transferencia,
   Convenio — + "N° de Documento" (text, opcional). En 2 columnas.
8. **Fecha del Movimiento** (`datetime-local`) con valor por defecto: fecha y
   hora actuales (`YYYY-MM-DDTHH:mm`). Nunca bloquea el guardado: si el usuario
   la vacía, se usa la fecha/hora actual. **No lleva asterisco ni cuenta como
   campo obligatorio** (etiqueta sin `*`).
9. **Observaciones** (textarea, opcional).
10. Botones: **Cancelar** (vuelve a la lista) y **Registrar Movimiento**.

Validación y errores (patrón `LoteNuevoView`):
- El `<form>` lleva `novalidate`: la validación nativa del navegador no debe
  bloquear el envío con tooltips; los errores se muestran solo como texto rojo
  bajo cada campo, limpiados al modificar el formulario.
- Obligatorios: ítem, almacén, cantidad distinta de 0 (vacío/NaN/cero →
  "La cantidad debe ser distinta de 0."), y almacén destino si el tipo es
  transferencia (el tipo siempre tiene valor inicial).
- Signo de la cantidad tecleado: si es negativo y el tipo **no** es
  `ajuste`, error "Solo el tipo Ajuste admite valores negativos." (el texto
  se limpia también al cambiar el tipo).
- Costo Unitario negativo → error rojo "El costo unitario no puede ser
  negativo." (el `min="0"` es decorativo: con `novalidate` no bloquea).
- Resets de integridad: cambiar el **Ítem** limpia `lote` (evita enviar un
  lote de otro ítem) y cambiar el **Almacén** origen limpia
  `almacen_destino` (evita transferencia origen = destino).
- El botón "Registrar Movimiento" siempre está habilitado: al pulsarlo se
  muestran los errores rojos de los campos obligatorios faltantes y no se
  guarda hasta que todo sea válido.

## Store (`src/stores/inventario.js`)
- `addMovimiento(payload)` pasa a aceptar además: `costo_unitario`,
  `lote`, `tipo_documento`, `numero_documento`, `almacen_destino`.
- **Cálculo de saldo**: `saldo` = último `saldo` registrado para el mismo
  `item_nombre` (o 0 si es el primero) + `cantidad` del movimiento nuevo.
  Deja de guardarse en 0.
- Signo de `cantidad`: el signo tecleado **se conserva en `ajuste`**
  (negativo = disminución, positivo = aumento); `ingreso` siempre queda
  positivo; `salida`/`baja`/`transferencia` siempre quedan negativos
  sin importar el signo tecleado. La validación del formulario impide
  negativos cuando el tipo no es `ajuste`.
- Nuevos getters:
  - `itemsDisponibles`: nombres únicos de lotes + existencias, ordenados.
  - `lotesPorItem(itemNombre)`: lotes activos de ese ítem.
- `almacenesDisponibles` no hace falta como getter: las vistas filtran
  `store.almacenes` por `activo`.

## Tabla kardex (`MovimientosView.vue`)
- La columna **Documento**: si el movimiento trae `tipo_documento` y/o
  `numero_documento`, mostrar `tipo_documento + ' N° ' + numero_documento`
  (o solo la parte que exista); si no, caer al campo `documento` legacy de los
  datos de ejemplo; y si no hay nada, `—`.
- Nuevos campos (`costo_unitario`, `lote`) **no** se agregan como columnas en
  esta iteración; solo se persisten.
- No se tocan filtros, paginación ni el resto de la vista.

## Fuera de alcance
- Persistencia real (el store sigue siendo datos en memoria, ya documentado).
- Columnas de costo/lote en la tabla kardex.
- Edición/borrado de movimientos (siguen siendo inmutables).
- Exportar existencias.

## Criterios de aceptación
1. Desde la lista de movimientos, "Registrar Movimiento" abre la nueva ruta.
2. La pantalla muestra los campos del mockup en el orden definido, dentro del
   layout del dashboard (sidebar y header del dashboard se mantienen).
3. Se pueden crear los 5 tipos de movimiento; transferencia exige almacén
   destino y lo guarda.
4. Ítem, almacén, motivo y documento se eligen de selects (ya no texto libre).
5. El lote se filtra según el ítem elegido y es opcional.
6. El movimiento guardado refleja el nuevo saldo acumulado del ítem.
7. "Documento" en la tabla kardex se ve compuesto (tipo + número).
8. Cancelar y el guardado correcto regresan a la lista de movimientos.
9. `npm run lint` y `npm run build` pasan.
