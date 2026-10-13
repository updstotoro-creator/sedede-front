# Rediseño Estético del Dashboard con Paleta Vino Institucional Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar el mockup del usuario al shell y dashboard ejecutivo: paleta vino #800020 en toda la app, AppSidebar con grupos/íconos/estilo del mockup, topbar con breadcrumb + buscador Ctrl+K funcional, y contenido ejecutivo restilizado — sin perder ninguna funcionalidad actual.

**Architecture:** Cambio de valores en `tailwind.config.js` (la app entera se tiñe sola), restyle completo de `AppSidebar.vue` (nueva prop `filter` para el buscador), y cambios de template + pequeños additions de script en `DashboardView.vue` (breadcrumb, Ctrl+K, KPIs con SVG, banner/filtro/accesos/footer al estilo mockup). Sin nuevos servicios, stores, rutas ni dependencias.

**Tech Stack:** Vue 3 (`<script setup>`), Tailwind CSS (sin framework de tests), Heroicons-style SVG inline (paths embebidos, sin librería externa).

## Global Constraints

- El proyecto NO tiene framework de tests: la verificación es `npm run lint`, `npm run build` y checks manuales con `npm run dev`. No agregar dependencias de testing ni nuevas dependencias. No tocar `package.json`.
- Usar siempre `git add <archivos concretos>`, nunca `git add -a`.
- Convenciones: `<script setup>`, Composition API, Tailwind inline, sin comentarios innecesarios, mensajes/labels en español.
- Paleta institucional: `brand.800 = #800020` (vino oficial Chuquisaca). Conservar `navyflag`, `ink`, `paper` y las familias tipográficas.
- Funcionalidad intocada: `fetchMetrics`, `setPresetFecha`, `fetchDeportistaData`, `guardarPerfilDeportista`, mapa `titles`, árboles por rol, servicios y rutas existentes.
- Omitidos a propósito (sin datos backend): tabla de solicitudes/reservas, notificaciones, ayuda, chip "Sistema en Línea", "Gestión 2026", badges de conteo, porcentajes inventados.
- Spec: `docs/superpowers/specs/2026-10-12-dashboard-estetica-vino-design.md`.

---

### Task 1: Paleta vino en Tailwind + ajuste de colores del banner deportista

**Files:**
- Modify: `tailwind.config.js` (theme.extend.colors.brand, líneas 8–16)
- Modify: `src/views/DashboardView.vue:280-281,295,303-304` (banner del portal deportista)

**Interfaces:**
- Consumes: clases `brand-*` ya usadas en todo el codebase (50–900; se agregan 200/300/400/950 que hoy faltan).
- Produces: rampa `brand` completa 50→950 que consumen los Tasks 2–4.

- [ ] **Step 1: Reemplazar la paleta `brand` en `tailwind.config.js`**

Reemplazar el bloque `brand: { ... }` (líneas 8–16) por:

```js
        brand: {
          50: '#fdf2f4',
          100: '#fbe6e9',
          200: '#f7cfd6',
          300: '#efa9b8',
          400: '#e0758a',
          500: '#d44562',
          600: '#b91c3c',
          700: '#991532',
          800: '#800020', // vino oficial institucional Chuquisaca
          900: '#690b21',
          950: '#400210',
        },
```

El archivo completo queda así (solo cambia el bloque `brand`):

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta institucional SEDEDE Chuquisaca — vino oficial #800020
        brand: {
          50: '#fdf2f4',
          100: '#fbe6e9',
          200: '#f7cfd6',
          300: '#efa9b8',
          400: '#e0758a',
          500: '#d44562',
          600: '#b91c3c',
          700: '#991532',
          800: '#800020', // vino oficial institucional Chuquisaca
          900: '#690b21',
          950: '#400210',
        },
        navyflag: '#1E3A8A', // azul de detalle (franja bandera)
        ink: '#1F2937',
        paper: '#F7F8FA',
      },
      fontFamily: {
        display: ['"Libre Franklin"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Actualizar gradientes y `red-*` de marca en el banner deportista**

En `src/views/DashboardView.vue`, dentro de la rama del portal deportista:

Línea 280 — cambiar `border border-red-950/20` por `border border-brand-950/20`:

```vue
              class="rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-brand-950/20"
```

Línea 281 — gradiente al vino:

```vue
              style="background: linear-gradient(135deg, #400210 0%, #690b21 45%, #800020 100%);"
```

Línea 295 — `text-red-100` → `text-brand-100`:

```vue
                <p class="text-brand-100 text-xs mt-1 max-w-2xl leading-relaxed">
```

Líneas 303–304 — botón "Nueva Solicitud":

```vue
                  class="px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-brand-50 transition-all flex items-center gap-1.5"
                  style="background-color: #ffffff; color: #800020;"
```

NO tocar los `red-*` semánticos de alertas/error (líneas 323, 384, 698 y la rama ejecutiva completa — esta última se reescribe en Task 4).

- [ ] **Step 3: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores; build termina `✓ built in …s`.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js src/views/DashboardView.vue
git commit -m "feat(core): paleta brand reemplazada por vino institucional #800020"
```

---

### Task 2: AppSidebar — grupos, íconos SVG, estilo mockup, prop `filter`

**Files:**
- Modify: `src/components/dashboard/AppSidebar.vue` (reescritura completa del archivo, 191 líneas actuales)

**Interfaces:**
- Consumes: `useAuthStore` (`stores/auth.js`), logo `assets/images/logo-sedede.png` (sin cambios).
- Produces (lo usa Task 3):
  - Prop `filter: String` (default `''`): filtra links por label, case-insensitive; grupos sin links visibles se omiten; si nada coincide muestra "Sin resultados".
  - El template del `<aside>` mantiene la raíz para que `<AppSidebar :filter="searchQuery" />` funcione.

- [ ] **Step 1: Reescribir el script de `AppSidebar.vue`**

Reemplazar TODO el bloque `<script setup>` actual por:

```vue
<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import logo from '../../assets/images/logo-sedede.png'

const auth = useAuthStore()

const props = defineProps({
  filter: { type: String, default: '' },
})

const icons = {
  grid: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
  users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  user: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  document: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
  building: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21',
  buildingLibrary: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A4.814 4.814 0 0012 9.75c-2.552 0-5.056.4-7 1.242V21M3 21h18M12 6.75h.008v.008H12V6.75z',
  creditCard: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
  chartBar: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  folder: 'M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z',
  list: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
  banknotes: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z',
  book: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
  cube: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
  tag: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3zM6 6h.008v.008H6V6z',
  clipboard: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75',
  archiveBox: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
  arrows: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
  home: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  logout: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9',
}

const groups = computed(() => {
  const role = auth.user?.role?.nombre
  if (role === 'deportista') {
    return [
      {
        id: 'resumen-deportista',
        label: 'Mi Panel',
        links: [
          { to: '/dashboard', label: 'Mi Panel & Perfil', exact: true, icon: 'user' },
        ],
      },
      {
        id: 'tramites-deportista',
        label: 'Mis Trámites y Eventos',
        links: [
          { to: '/dashboard/tramites', label: 'Mis Solicitudes y Apoyos', icon: 'document' },
          { to: '/dashboard/calendario-anual', label: 'Eventos del Calendario', icon: 'calendar' },
        ],
      },
    ]
  }

  if (role === 'representante_mancomunidad' || role === 'comunidades') {
    return [
      {
        id: 'gestion-comunidades',
        label: 'Mi Registro',
        links: [
          { to: '/dashboard/comunidades', label: 'Mi Registro & Solicitudes', exact: true, icon: 'home' },
        ],
      },
    ]
  }

  return [
    {
      id: 'resumen',
      label: 'Panel de Control',
      links: [
        { to: '/dashboard', label: 'Resumen Principal', exact: true, icon: 'grid' },
        { to: '/dashboard/users', label: 'Usuarios', icon: 'users' },
        { to: '/dashboard/roles', label: 'Roles y Permisos', icon: 'shield' },
      ],
    },
    {
      id: 'gestion-deportiva',
      label: 'Gestión Deportiva',
      links: [
        { to: '/dashboard/asociaciones', label: 'Asociaciones', icon: 'users' },
        { to: '/dashboard/clubes', label: 'Clubes', icon: 'buildingLibrary' },
        { to: '/dashboard/calendario-anual', label: 'Calendario Anual', icon: 'calendar' },
      ],
    },
    {
      id: 'deportistas-tramites',
      label: 'Deportistas y Trámites',
      links: [
        { to: '/dashboard/deportistas', label: 'Deportistas', icon: 'user' },
        { to: '/dashboard/tramites', label: 'Trámites de Apoyo', icon: 'document' },
      ],
    },
    {
      id: 'mancomunidades-rural',
      label: 'Mancomunidades',
      links: [
        { to: '/dashboard/comunidades', label: 'Mancomunidades Rurales', icon: 'home' },
      ],
    },
    {
      id: 'escenarios-tarifario',
      label: 'Infraestructura y Tarifas',
      links: [
        { to: '/dashboard/escenarios', label: 'Escenarios Deportivos', icon: 'building' },
        { to: '/dashboard/tarifario', label: 'Tarifario Departamental', icon: 'creditCard' },
      ],
    },
    {
      id: 'poa-gestion',
      label: 'Planificación (POA)',
      links: [
        { to: '/dashboard/poa/dashboard', label: 'Dashboard POA', icon: 'chartBar' },
        { to: '/dashboard/poa/planes', label: 'Planes POA', icon: 'folder' },
        { to: '/dashboard/poa', label: 'Estructura POA', icon: 'list' },
        { to: '/dashboard/poa/techos', label: 'Techos Presupuestarios', icon: 'banknotes' },
        { to: '/dashboard/poa/bitacora', label: 'Bitácora POA', icon: 'book' },
      ],
    },
    {
      id: 'inventario-almacenes',
      label: 'Logística y Materiales',
      links: [
        { to: '/dashboard/inventario/almacenes', label: 'Almacenes', icon: 'cube' },
        { to: '/dashboard/inventario/tipos-item', label: 'Familias de Ítems', icon: 'tag' },
        { to: '/dashboard/inventario/existencias', label: 'Existencias', icon: 'clipboard' },
        { to: '/dashboard/inventario/lotes', label: 'Lotes de Inventario', icon: 'archiveBox' },
        { to: '/dashboard/inventario/movimientos', label: 'Movimientos (Kardex)', icon: 'arrows' },
      ],
    },
  ]
})

const filteredGroups = computed(() => {
  const q = props.filter.trim().toLowerCase()
  if (!q) return groups.value
  return groups.value
    .map((g) => ({ ...g, links: g.links.filter((l) => l.label.toLowerCase().includes(q)) }))
    .filter((g) => g.links.length > 0)
})

function initials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}
</script>
```

- [ ] **Step 2: Reescribir el template de `AppSidebar.vue`**

Reemplazar TODO el bloque `<template>` por:

```vue
<template>
  <aside class="flex h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm select-none">
    <!-- Header del Sidebar con Marca Institucional -->
    <div class="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
      <img :src="logo" alt="Logo SEDEDE" class="h-11 w-11 object-contain" />
      <div class="leading-tight">
        <p class="font-display text-base font-extrabold uppercase tracking-tight text-brand-800">SEDEDE</p>
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Chuquisaca · Gestión</p>
      </div>
    </div>

    <!-- Navegación por Módulos (Scrollable) -->
    <nav class="flex-1 overflow-y-auto px-4 py-4 space-y-5">
      <div v-for="group in filteredGroups" :key="group.id">
        <span class="mb-2 block px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{{ group.label }}</span>
        <ul class="space-y-1">
          <li v-for="link in group.links" :key="link.to">
            <router-link
              :to="link.to"
              custom
              v-slot="{ href, navigate, isActive, isExactActive }"
            >
              <a
                :href="href"
                class="flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm font-semibold transition-all"
                :class="(link.exact ? isExactActive : isActive)
                  ? 'border-brand-800 bg-brand-50 text-brand-800 shadow-sm'
                  : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-brand-800'"
                @click="navigate"
              >
                <svg
                  class="h-5 w-5 shrink-0"
                  :class="(link.exact ? isExactActive : isActive) ? 'text-brand-700' : 'text-slate-400'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path :d="icons[link.icon]" />
                </svg>
                <span>{{ link.label }}</span>
              </a>
            </router-link>
          </li>
        </ul>
      </div>
      <p v-if="filteredGroups.length === 0" class="px-3 text-xs text-slate-400">
        Sin resultados para “{{ filter }}”
      </p>
    </nav>

    <!-- Footer del Sidebar: Perfil de Usuario Activo -->
    <div class="border-t border-slate-200 bg-slate-50/70 p-4">
      <div class="mb-3 flex items-center gap-3">
        <div class="relative">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-800 text-sm font-bold text-white shadow-sm ring-2 ring-white">
            {{ initials(auth.user?.name) }}
          </div>
          <span class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" title="En línea"></span>
        </div>
        <div class="min-w-0 leading-tight">
          <p class="truncate text-xs font-bold text-slate-900">{{ auth.user?.name }}</p>
          <p class="truncate text-[11px] text-slate-500">{{ auth.user?.email ?? auth.user?.role?.nombre }}</p>
        </div>
      </div>
      <button
        class="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
        @click="auth.logout()"
      >
        <svg class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path :d="icons.logout" />
        </svg>
        <span>Cerrar sesión</span>
      </button>
    </div>
  </aside>
</template>
```

- [ ] **Step 3: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores; build termina `✓ built in …s`.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/AppSidebar.vue
git commit -m "feat(dashboard): sidebar con grupos, iconos SVG y estilo institucional"
```

---

### Task 3: Topbar con breadcrumb y buscador Ctrl+K funcional

**Files:**
- Modify: `src/views/DashboardView.vue` (imports línea 2, script — nuevos refs/handlers, `<AppSidebar />` línea 246, `<header>` líneas 250–267)

**Interfaces:**
- Consumes: prop `filter` de `AppSidebar` (Task 2); mapa `titles` y `route` existentes.
- Produces: `searchQuery` (ref string) compartido con el sidebar; header restilizado que usan las ramas deportista y ejecutiva.

- [ ] **Step 1: Extender los imports de vue**

Línea 2 — reemplazar:

```js
import { ref, reactive, computed, onMounted } from 'vue'
```

por:

```js
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
```

- [ ] **Step 2: Agregar estado y handlers del buscador**

Insertar después del bloque `perfilForm` (tras la línea 78, antes de `deportistaEdad`):

```js
const searchQuery = ref('')
const searchInput = ref(null)

function onGlobalKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

watch(() => route.fullPath, () => {
  searchQuery.value = ''
})
```

- [ ] **Step 3: Registrar/desregistrar el listener de teclado**

Reemplazar el `onMounted` actual (líneas 234–240) por:

```js
onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
  if (isDeportista.value) {
    fetchDeportistaData()
  } else {
    fetchMetrics()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
```

- [ ] **Step 4: Pasar `filter` al sidebar**

Línea 246 — reemplazar `<AppSidebar />` por:

```vue
    <AppSidebar :filter="searchQuery" />
```

- [ ] **Step 5: Reescribir el `<header>` (líneas 250–267)**

Reemplazar el header completo por (conserva el chip de perfil deportista tal cual):

```vue
      <header class="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-xs">
        <div class="flex items-center gap-3">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">SEDEDE Chuquisaca</span>
          <svg class="h-4 w-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
          <h1 class="text-sm font-bold text-slate-900">
            {{ isDeportista ? 'Portal del Atleta & Trámites' : (titles[route.name] ?? 'Panel') }}
          </h1>
        </div>

        <div class="flex items-center gap-4">
          <div class="relative w-64">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Buscar en el menú..."
              class="w-full rounded-lg border border-transparent bg-slate-100 py-1.5 pl-9 pr-12 text-xs transition-all placeholder-slate-400 focus:border-brand-700 focus:bg-white focus:ring-1 focus:ring-brand-700"
            />
            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 font-mono text-[10px] text-slate-400">Ctrl+K</span>
          </div>

          <div v-if="isDeportista && deportistaPerfil" class="flex items-center gap-3">
            <div class="hidden text-right sm:block">
              <p class="text-xs font-bold text-slate-800">{{ deportistaPerfil.nombres }} {{ deportistaPerfil.apellidos }}</p>
              <p class="text-[11px] font-semibold text-brand-700">{{ deportistaPerfil.disciplina }} · {{ deportistaPerfil.asociacion?.sigla || 'Deportista' }}</p>
            </div>
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-300 bg-brand-100 text-xs font-bold text-brand-800">
              {{ deportistaPerfil.nombres?.[0] }}{{ deportistaPerfil.apellidos?.[0] }}
            </span>
          </div>
        </div>
      </header>
```

- [ ] **Step 6: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores; build termina `✓ built in …s`.

- [ ] **Step 7: Commit**

```bash
git add src/views/DashboardView.vue
git commit -m "feat(dashboard): topbar con breadcrumb y buscador Ctrl+K funcional"
```

---

### Task 4: Contenido ejecutivo al estilo mockup (banner, filtro, KPIs, accesos, footer)

**Files:**
- Modify: `src/views/DashboardView.vue` (script: tras `formatMoney` ~línea 228; template rama ejecutiva `v-else` líneas 646–788)

**Interfaces:**
- Consumes: `metrics` (`recaudacion|tramites|escenarios`), `fetchMetrics`, `setPresetFecha`, `fechaDesde`, `fechaHasta`, `isLoading`, `errorMessage`, `navTo`, `formatMoney` — todos ya existentes.
- Produces: `tramitesConcluidos` (computed), `presetActivo` (ref), `anioActual` (const) — usados solo en el template de esta misma tarea.

- [ ] **Step 1: Agregar computeds y estado del filtro**

Insertar después del computed `esMenorDeportista` (tras la línea 92), antes de `setPresetFecha`:

```js
const anioActual = new Date().getFullYear()
const presetActivo = ref(null)

const tramitesConcluidos = computed(() => {
  const t = metrics.value?.tramites
  if (!t) return null
  const rest = (t.total_tramites || 0) - (t.en_revision || 0)
  return rest >= 0 ? rest : null
})
```

- [ ] **Step 2: Marcar preset activo en `setPresetFecha`**

Reemplazar `setPresetFecha` (líneas 94–113) por:

```js
function setPresetFecha(preset) {
  presetActivo.value = preset
  const hoy = new Date()
  if (preset === 'hoy') {
    const str = hoy.toISOString().split('T')[0]
    fechaDesde.value = str
    fechaHasta.value = str
  } else if (preset === 'mes') {
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    fechaDesde.value = inicio.toISOString().split('T')[0]
    fechaHasta.value = fin.toISOString().split('T')[0]
  } else if (preset === 'anio') {
    fechaDesde.value = `${hoy.getFullYear()}-01-01`
    fechaHasta.value = `${hoy.getFullYear()}-12-31`
  } else if (preset === 'todo') {
    fechaDesde.value = ''
    fechaHasta.value = ''
  }
  fetchMetrics()
}
```

- [ ] **Step 3: Reescribir la rama ejecutiva del template**

Reemplazar TODO el bloque `<div v-else class="space-y-6">` (líneas 646–788, desde el comentario "2. VISTA EJECUTIVA GENERAL" hasta su cierre) por:

```vue
          <div v-else class="space-y-6">
            <!-- Banner Superior Institucional -->
            <section
              class="relative overflow-hidden rounded-2xl p-7 text-white shadow-lg shadow-brand-950/15"
              style="background-color: #800020; background-image: radial-gradient(circle at 10% 20%, rgba(219, 39, 119, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 35%);"
            >
              <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div class="max-w-2xl">
                  <div class="mb-3 inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                    <span>Gobierno Autónomo Departamental de Chuquisaca</span>
                  </div>
                  <h2 class="text-2xl md:text-3xl font-display font-extrabold tracking-tight">Resumen Departamental de Gestión</h2>
                  <p class="mt-1.5 text-sm font-normal leading-relaxed text-brand-100">
                    Consolidado de recaudación por uso de escenarios deportivos, seguimiento a trámites de apoyo a asociaciones y monitoreo presupuestario POA.
                  </p>
                </div>
                <div class="flex shrink-0 flex-wrap items-center gap-2.5">
                  <button @click="navTo('/dashboard/tramites')" class="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition-all shadow-sm hover:bg-white/25">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    <span>Trámites</span>
                  </button>
                  <button @click="navTo('/dashboard/tarifario')" class="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition-all shadow-sm hover:bg-white/25">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                    <span>Tarifario Oficial</span>
                  </button>
                  <button @click="navTo('/dashboard/calendario-anual')" class="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-brand-900 transition-all shadow-md hover:bg-brand-50">
                    <svg class="h-4 w-4 text-brand-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                    <span>Calendario Anual</span>
                  </button>
                </div>
              </div>
            </section>

            <!-- Filtro por Rango de Fechas para Recaudación -->
            <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div class="flex items-center gap-2">
                  <div class="h-2 w-2 rounded-full bg-brand-800"></div>
                  <span class="text-xs font-bold uppercase tracking-wide text-slate-800">Filtro de Recaudación por Fechas:</span>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                  <div class="flex items-center gap-2 text-xs">
                    <label class="font-medium text-slate-500" for="fecha-desde">Desde:</label>
                    <input id="fecha-desde" type="date" v-model="fechaDesde" @change="presetActivo = null; fetchMetrics()" class="rounded-lg border-slate-300 py-1.5 px-3 text-xs font-semibold text-slate-800 focus:border-brand-700 focus:ring-brand-700" />
                  </div>
                  <div class="flex items-center gap-2 text-xs">
                    <label class="font-medium text-slate-500" for="fecha-hasta">Hasta:</label>
                    <input id="fecha-hasta" type="date" v-model="fechaHasta" @change="presetActivo = null; fetchMetrics()" class="rounded-lg border-slate-300 py-1.5 px-3 text-xs font-semibold text-slate-800 focus:border-brand-700 focus:ring-brand-700" />
                  </div>
                  <div class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
                    <button @click="setPresetFecha('hoy')" class="rounded-md px-3 py-1 transition" :class="presetActivo === 'hoy' ? 'bg-white font-bold text-brand-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'">Hoy</button>
                    <button @click="setPresetFecha('mes')" class="rounded-md px-3 py-1 transition" :class="presetActivo === 'mes' ? 'bg-white font-bold text-brand-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'">Este Mes</button>
                    <button @click="setPresetFecha('anio')" class="rounded-md px-3 py-1 transition" :class="presetActivo === 'anio' ? 'bg-white font-bold text-brand-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'">{{ anioActual }}</button>
                    <button @click="setPresetFecha('todo')" class="rounded-md px-3 py-1 transition" :class="presetActivo === 'todo' ? 'bg-white font-bold text-brand-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'">Todo</button>
                  </div>
                  <button @click="fetchMetrics" class="flex items-center gap-1.5 rounded-lg bg-brand-800 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-brand-900">
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>
                    <span>Aplicar</span>
                  </button>
                </div>
              </div>
            </section>

            <!-- Indicador de Carga / Error -->
            <div v-if="isLoading" class="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-sm text-slate-500">
              <span class="inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-brand-600 border-r-transparent"></span>
              Cargando datos del resumen...
            </div>
            <div v-else-if="errorMessage" role="alert" class="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">
              {{ errorMessage }}
            </div>

            <div v-else class="space-y-6">
              <!-- KPIs -->
              <section class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <!-- KPI 1: Total Recaudado -->
                <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
                  <div class="absolute left-0 right-0 top-0 h-1 bg-brand-700"></div>
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Recaudado</p>
                      <h3 class="mt-2 text-2xl font-black text-slate-900">Bs {{ formatMoney(metrics?.recaudacion?.total_recaudado) }}</h3>
                    </div>
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600">
                      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                    </div>
                  </div>
                  <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span class="text-slate-400 font-medium">{{ metrics?.recaudacion?.total_transacciones || 0 }} pagos registrados</span>
                  </div>
                </div>

                <!-- KPI 2: Trámites de Apoyo -->
                <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
                  <div class="absolute left-0 right-0 top-0 h-1 bg-brand-700"></div>
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trámites de Apoyo</p>
                      <h3 class="mt-2 text-2xl font-black text-slate-900">{{ metrics?.tramites?.total_tramites || 0 }} <span class="text-sm font-semibold text-slate-400">Solicitudes</span></h3>
                    </div>
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    </div>
                  </div>
                  <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span class="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">{{ metrics?.tramites?.en_revision || 0 }} en curso</span>
                    <span v-if="tramitesConcluidos !== null" class="font-semibold text-emerald-600">{{ tramitesConcluidos }} concluidos</span>
                  </div>
                </div>

                <!-- KPI 3: Presupuesto Apoyos -->
                <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
                  <div class="absolute left-0 right-0 top-0 h-1 bg-brand-700"></div>
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Presupuesto Apoyos</p>
                      <h3 class="mt-2 text-2xl font-black text-slate-900">Bs {{ formatMoney(metrics?.tramites?.monto_aprobado_total) }}</h3>
                    </div>
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-200/60 bg-amber-50 text-amber-700">
                      <svg class="h-6 w-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                  </div>
                  <div class="mt-4 border-t border-slate-100 pt-3 text-xs">
                    <span class="text-slate-500 font-medium">Monto aprobado acumulado</span>
                  </div>
                </div>

                <!-- KPI 4: Eventos en Agenda -->
                <div class="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
                  <div class="absolute left-0 right-0 top-0 h-1 bg-brand-700"></div>
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Eventos en Agenda</p>
                      <h3 class="mt-2 text-2xl font-black text-slate-900">{{ metrics?.escenarios?.total_reservas_activas || 0 }} <span class="text-sm font-semibold text-slate-400">Reservas</span></h3>
                    </div>
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-700">
                      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                    </div>
                  </div>
                  <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span class="font-medium text-slate-600">Reservas y eventos oficiales</span>
                    <button @click="navTo('/dashboard/calendario-anual')" class="cursor-pointer font-bold text-brand-700 hover:underline">Ver agenda →</button>
                  </div>
                </div>
              </section>

              <!-- Accesos Rápidos -->
              <section class="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <div class="mb-4 flex items-center justify-between">
                  <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400">Accesos Rápidos y Operativos</h4>
                  <span class="text-xs text-slate-400">Atajos frecuentes para gestión diaria</span>
                </div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <a @click.prevent="navTo('/dashboard/tramites')" href="#" class="group flex cursor-pointer items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-brand-600 hover:bg-brand-50/40">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs transition-colors group-hover:border-brand-800 group-hover:bg-brand-800 group-hover:text-white">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-800 transition-colors group-hover:text-brand-900">Nuevo Trámite</p>
                      <p class="text-xs text-slate-500">Solicitud de personería o apoyo</p>
                    </div>
                  </a>
                  <a @click.prevent="navTo('/dashboard/tarifario')" href="#" class="group flex cursor-pointer items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-brand-600 hover:bg-brand-50/40">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs transition-colors group-hover:border-brand-800 group-hover:bg-brand-800 group-hover:text-white">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-800 transition-colors group-hover:text-brand-900">Cotizar Tarifario</p>
                      <p class="text-xs text-slate-500">Cálculo de alquiler y garantías</p>
                    </div>
                  </a>
                  <a @click.prevent="navTo('/dashboard/calendario-anual')" href="#" class="group flex cursor-pointer items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-brand-600 hover:bg-brand-50/40">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs transition-colors group-hover:border-brand-800 group-hover:bg-brand-800 group-hover:text-white">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-800 transition-colors group-hover:text-brand-900">Calendario Deportivo</p>
                      <p class="text-xs text-slate-500">Fechas de torneos nacionales</p>
                    </div>
                  </a>
                  <a @click.prevent="navTo('/dashboard/asociaciones')" href="#" class="group flex cursor-pointer items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-brand-600 hover:bg-brand-50/40">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs transition-colors group-hover:border-brand-800 group-hover:bg-brand-800 group-hover:text-white">
                      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                    </div>
                    <div>
                      <p class="text-sm font-bold text-slate-800 transition-colors group-hover:text-brand-900">Asociaciones</p>
                      <p class="text-xs text-slate-500">Padrón de federaciones</p>
                    </div>
                  </a>
                </div>
              </section>
            </div>

            <!-- Footer Institucional -->
            <footer class="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pb-6 pt-2 text-center text-xs text-slate-400 md:flex-row">
              <p>© {{ anioActual }} Servicio Departamental de Deportes (SEDEDE) - Chuquisaca. Todos los derechos reservados.</p>
              <p class="font-medium text-slate-500">Plataforma Centralizada de Deporte Departamental</p>
            </footer>
          </div>
```

- [ ] **Step 4: Verificar lint y build**

Run: `npm run lint && npm run build`
Expected: sin errores; build termina `✓ built in …s`.

- [ ] **Step 5: Smoke visual con el dev server**

Run: `npm run dev` e iniciar sesión como admin. Verificar:
1. Sidebar: grupos con etiquetas, íconos SVG visibles, ítem activo con fondo vino + borde izquierdo, footer con iniciales y "Cerrar sesión".
2. Topbar: breadcrumb `SEDEDE CHUQUISACA › Resumen`; Ctrl+K enfoca el buscador; escribir "poa" filtra el menú; navegar limpia la búsqueda.
3. Dashboard: banner vino con las 3 acciones (navegan), filtro con presets resaltando el activo y "Aplicar" recargando, 4 KPIs con datos reales (`en_revision`, `concluidos` derivado), accesos rápidos navegan, footer visible.
4. Login deportista: portal carga sin regresiones, banner tintado vino, formulario de perfil funcional.
5. Navegar a Usuarios: breadcrumb muestra "Usuarios", sidebar resalta la ruta.

- [ ] **Step 6: Commit**

```bash
git add src/views/DashboardView.vue
git commit -m "feat(dashboard): rediseño estético del resumen ejecutivo con paleta vino"
```
