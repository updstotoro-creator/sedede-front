# Diseño: Rediseño Estético del Dashboard con Paleta Vino Institucional

## Resumen
Aplicar el mockup HTML del usuario (sidebar/topbar/dashboard con paleta vino
#800020 "Vino oficial institucional Chuquisaca") al shell y al dashboard
ejecutivo de la app, manteniendo **toda la funcionalidad actual** y sin agregar
widgets sin datos backend. Alcance de toque mínimo: 3 archivos
(`tailwind.config.js`, `AppSidebar.vue`, `DashboardView.vue`).

## Decisiones tomadas
1. **Reemplazar la paleta `brand` completa** en `tailwind.config.js` por el vino
   institucional — toda la app (31 vistas) se tiñe automáticamente. No se crea
   una segunda paleta `sedede` paralela.
2. **Solo funcionalidad real**: se omiten del mockup la tabla "Últimas
   Solicitudes y Reservas" (no existe endpoint; `dashboardService` solo tiene
   `getExecutiveMetrics`), la campana de notificaciones, el botón de ayuda, el
   chip "Sistema en Línea" y el selector de período "Gestión 2026"
   (decorativos / sin datos).
3. **Buscador Ctrl+K funcional** en la topbar: filtra los ítems del sidebar en
   cliente (case-insensitive sobre labels). Es el único widget nuevo con
   comportamiento real.
4. **KPIs sin porcentajes inventados**: se omite "+14.2% vs mes ant." y la
   barra "65% ejecución" (el payload no trae comparativos). Único dato
   derivado permitido: `concluidos = total_tramites − en_revision`.
5. **Emojis → SVG**: los KPIs y accesos rápidos del dashboard usan iconos SVG
   (estilo mockup) en lugar de 💳📑🏆🏟️.
6. **Portal deportista intacto**: cero cambios de lógica; solo se tiñe con la
   paleta nueva y se actualizan gradients hardcodeados.

## 1. Paleta (`tailwind.config.js`)
Rampa `brand` completa (corrige el bug latente: hoy faltan 200/300/400 y clases
como `border-brand-300` — DashboardView:263 — no aplican estilo):

| Shade | Hex |
|---|---|
| 50 | `#fdf2f4` |
| 100 | `#fbe6e9` |
| 200 | `#f7cfd6` |
| 300 | `#efa9b8` |
| 400 | `#e0758a` |
| 500 | `#d44562` |
| 600 | `#b91c3c` |
| 700 | `#991532` |
| 800 | `#800020` ← vino oficial |
| 900 | `#690b21` |
| 950 | `#400210` |

Se conservan `navyflag`, `ink`, `paper` y las familias tipográficas
(Libre Franklin / Inter / IBM Plex Mono) sin cambios.

Ajustes fuera de la config (valores hex hardcodeados y utilidades `red-*`
sueltas que quedarían descoordinadas):
- `DashboardView.vue:281` y `:650` — gradientes
  `#5A0B17→#7A0F1F→#9F1327` → `#400210→#690b21→#800020`.
- `text-red-100` en banners → `text-brand-100`.
- Logout del sidebar (`hover:border-red-300 hover:bg-red-50 hover:text-red-700`)
  → equivalentes `brand`.

## 2. AppSidebar (`src/components/dashboard/AppSidebar.vue`)
Restyle visual; la lógica `groups` por rol (deportista / comunidades /
admin) y el uso de `router-link custom v-slot` se mantienen.
- Agregar `label` a cada grupo del árbol admin para el encabezado en
  mayúsculas del mockup: "Panel de Control" (Resumen Principal, Usuarios,
  Roles y Permisos — como en la imagen del mockup), "Gestión Deportiva"
  (Asociaciones, Clubes, Calendario Anual), "Deportistas y Trámites",
  "Mancomunidades", "Infraestructura y Tarifas", "Planificación (POA)",
  "Logística y Materiales". Árbol deportista: "Mi Panel" y
  "Mis Trámites y Eventos". Árbol comunidades: "Mi Registro".
- **Ícono SVG por ítem** (como el mockup): cada link lleva un `icon` con su
  path SVG inline (sin librerías externas), icono `w-5 h-5` color
  `text-slate-400` → `text-brand-700` en hover/activo. Asignación por
  label: Resumen/Resumen Principal → cuadrícula; Usuarios → personas;
  Roles → escudo; Asociaciones → grupo de personas; Clubes → escudo/estadio;
  Calendario Anual → calendario; Deportistas → usuario; Trámites →
  documento; Mancomunidades → casa/pueblo; Escenarios → edificio;
  Tarifario → tarjeta; ítems POA → según mockup (gráfico, carpeta,
  estructura, moneda, libreta); Almacenes → caja; Familias de Ítems →
  etiqueta; Existencias → clipboard; Lotes/Movimientos → flechas/caja.
  El árbol de deportista/comunidades recibe ítems equivalentes a sus labels
  actuales.
- Ítem activo estilo mockup: `bg-brand-50 text-brand-800 border-l-4
  border-brand-800`; inactivo: `text-slate-600 hover:bg-slate-50
  hover:text-brand-800`. Se quita el punto indicador `h-1.5 w-1.5` y los
  recuadros con borde por grupo (el mockup usa etiqueta + lista limpia).
- Ancho `w-72` (mockup) en vez de `w-64`.
- Footer: avatar `bg-brand-800`, botón "Cerrar sesión" con hover vino
  (conserva `auth.logout()`).
- Sin badges de conteo (no hay datos).
- Nueva prop `filter` (String): cuando tiene valor no vacío, `groups` filtra
  sus links por `label.toLowerCase().includes(filter.toLowerCase())`;
  grupos sin links visibles se omiten.

## 3. Topbar (header de `DashboardView.vue`)
- Breadcrumb: `SEDEDE CHUQUISACA › [título]` usando el mapa `titles` y
  `route.name` existentes (el `h1` actual pasa a ser el segundo ítem del
  breadcrumb, estilo mockup).
- Buscador a la derecha: input con ítem lupa + atajo `Ctrl+K`
  (`window.addEventListener('keydown', ...)` con `preventDefault`, enfoca el
  input; se remueve al desmontar). El `v-model` se pasa como prop `filter` a
  `<AppSidebar />`. Un `watch` sobre `route.fullPath` limpia la búsqueda al
  navegar para que la siguiente página no arrastre el filtro.
- Rama deportista conserva su chip de perfil (nombres, disciplina, iniciales).
- Se omiten: notificaciones, ayuda, "Gestión 2026", chip "en línea".

## 4. Contenido ejecutivo (`DashboardView.vue`, rama `v-else`)
Mismos bindings de datos (`metrics.recaudacion|tramites|escenarios`),
nuevos estilos:
- **Banner**: fondo `hero-pattern` vino (gradiente + radial), chip
  "Gobierno Autónomo Departamental de Chuquisaca", título "Resumen
  Departamental de Gestión", bajada, 3 botones → `navTo` a Trámites,
  Tarifario y Calendario Anual (ya existentes).
- **Filtro de fechas**: tarjeta blanca `rounded-xl`, dot vino, label
  "Filtro de Recaudación por Fechas", inputs `type="date"` reales con
  `@change="fetchMetrics"`, segmentos Hoy / Este Mes / Año actual / Todo
  (`setPresetFecha` existente) y botón "Aplicar" (`@click="fetchMetrics"`).
  El label del segmento anual usa `${new Date().getFullYear()}` en vez del
  "2026" hardcodeado.
- **KPIs** (grid 4, tarjeta blanca con barra superior `h-1 bg-brand-800`,
  icono SVG en caja de color):
  1. Total Recaudado — `recaudacion.total_recaudado` + "N pagos registrados"
     (`total_transacciones`).
  2. Trámites de Apoyo — `tramites.total_tramites` + "N en curso"
     (`en_revision`) + "N concluidos" (derivado `total − en_revision`,
     solo si ≥ 0).
  3. Presupuesto Apoyos — `tramites.monto_aprobado_total` + "Monto aprobado
     acumulado".
  4. Eventos en Agenda — `escenarios.total_reservas_activas` + link
     "Ver agenda →" → `navTo('/dashboard/calendario-anual')`.
- **Accesos rápidos**: 4 tarjetas (Nuevo Trámite, Cotizar Tarifario,
  Calendario Deportivo, Asociaciones) con ícono SVG, título y subtítulo,
  mismos `navTo` actuales.
- **Loading/error**: se restilizan (spinner vino / alerta con borde
  `brand`), misma lógica `isLoading`/`errorMessage`.
- **Footer institucional**: copyright SEDEDE Chuquisaca + línea de versión,
  texto estático.

## 5. Portal deportista (`DashboardView.vue`, rama `v-if="isDeportista"`)
- Sin cambios funcionales (formularios, servicios, estados intactos).
- Solo: gradientes hardcodeados actualizados (sección 1) y sustitución de
  `text-red-100` por `text-brand-100`. El resto se tiñe vía config.

## Fuera de alcance
- Tabla de solicitudes/reservas, notificaciones, ayuda, período "Gestión".
- Extracción de componentes (`AppTopbar`, `DashboardKpis`) — posible
  refactor futuro.
- Restilizar emojis/estilos de las otras 30 vistas (la paleta nueva las tiñe
  sola; el detalle fino queda para después).
- Cambios de rutas, stores, services o lógica del portal deportista.

## Verificación
1. `npm run lint` (oxlint + eslint, ambos con `--fix`).
2. `npm run build` — sin errores.
3. Smoke visual con `npm run dev`:
   - Login admin → sidebar con etiquetas/grupos, búsqueda Ctrl+K filtra,
     breadcrumb dinámico, banner/KPIs/accesos con datos reales del endpoint,
     filtros de fecha recargan métricas.
   - Login deportista → portal sin regresiones, tintado vino.
   - Navegar a una vista hija (p. ej. Usuarios) → título del breadcrumb
     correcto, sidebar resalta la ruta activa.
