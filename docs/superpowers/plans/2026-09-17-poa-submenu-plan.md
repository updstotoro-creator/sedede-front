# Submenú POA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidar los 5 elementos del POA en el sidebar en un solo botón "POA" con submenú desplegable hacia arriba.

**Architecture:** Modificar el componente AppSidebar.vue para agregar un submenú desplegable con CSS positioning que se despliega hacia arriba desde el botón POA.

**Tech Stack:** Vue 3, Tailwind CSS

## Global Constraints
- Usar CSS positioning (position: absolute, bottom: 100%)
- Icono de menú (☰) junto al texto "POA"
- Submenús: Dashboard POA, Planes POA, Techos Presup., Bitácora
- Cerrar submenú al hacer clic fuera

---

### Task 1: Modificar estructura de datos del sidebar

**Files:**
- Modify: `src/components/dashboard/AppSidebar.vue:7-19`

**Interfaces:**
- Consumes: Array `links` actual
- Produces: Estructura de datos separada para enlaces principales y submenús del POA

- [ ] **Step 1: Separar enlaces principales de submenús del POA**

```javascript
const mainLinks = [
  { to: '/dashboard', label: 'Resumen', exact: true },
  { to: '/dashboard/users', label: 'Usuarios' },
  { to: '/dashboard/roles', label: 'Roles' },
  { to: '/dashboard/asociaciones', label: 'Asociaciones' },
  { to: '/dashboard/inventario/tipos-item', label: 'Tipos de Ítem' },
  { to: '/dashboard/inventario/almacenes', label: 'Almacenes' },
]

const poaSubmenu = [
  { to: '/dashboard/poa/dashboard', label: 'Dashboard POA' },
  { to: '/dashboard/poa/planes', label: 'Planes POA' },
  { to: '/dashboard/poa/techos', label: 'Techos Presup.' },
  { to: '/dashboard/poa/bitacora', label: 'Bitácora' },
]
```

- [ ] **Step 2: Verificar que el código se ejecuta sin errores**

Run: `npm run dev` y verificar que no hay errores en consola

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/AppSidebar.vue
git commit -m "feat: separate POA links from main navigation"
```

---

### Task 2: Agregar estado para controlar submenú POA

**Files:**
- Modify: `src/components/dashboard/AppSidebar.vue:1-5`

**Interfaces:**
- Consumes: Importación de `ref` de Vue
- Produces: Variable reactiva `poaOpen` para controlar apertura del submenú

- [ ] **Step 1: Importar ref de Vue**

```javascript
import { ref } from 'vue'
```

- [ ] **Step 2: Agregar estado para submenú POA**

```javascript
const poaOpen = ref(false)
```

- [ ] **Step 3: Verificar que el código se ejecuta sin errores**

Run: `npm run dev` y verificar que no hay errores en consola

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/AppSidebar.vue
git commit -m "feat: add POA submenu state management"
```

---

### Task 3: Agregar función para toggle del submenú

**Files:**
- Modify: `src/components/dashboard/AppSidebar.vue:21-24`

**Interfaces:**
- Consumes: Variable `poaOpen`
- Produces: Función `togglePoa` para abrir/cerrar submenú

- [ ] **Step 1: Agregar función toggle**

```javascript
function togglePoa() {
  poaOpen.value = !poaOpen.value
}
```

- [ ] **Step 2: Verificar que el código se ejecuta sin errores**

Run: `npm run dev` y verificar que no hay errores en consola

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/AppSidebar.vue
git commit -m "feat: add POA submenu toggle function"
```

---

### Task 4: Modificar template para botón POA con submenú

**Files:**
- Modify: `src/components/dashboard/AppSidebar.vue:37-54`

**Interfaces:**
- Consumes: Array `mainLinks`, array `poaSubmenu`, función `togglePoa`, variable `poaOpen`
- Produce: Botón POA con icono ☰ y submenú desplegable

- [ ] **Step 1: Reemplazar loop de links por estructura con botón POA**

```html
<nav class="flex-1 space-y-1 px-3 py-5">
  <!-- Enlaces principales -->
  <router-link
    v-for="link in mainLinks"
    :key="link.to"
    :to="link.to"
    custom
    v-slot="{ href, navigate, isExactActive, isActive }"
  >
    <a
      :href="href"
      class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
      :class="(link.exact ? isExactActive : isActive) ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'"
      @click="navigate"
    >
      <span class="h-1.5 w-1.5 rounded-full" :class="(link.exact ? isExactActive : isActive) ? 'bg-brand-600' : 'bg-transparent'"></span>
      {{ link.label }}
    </a>
  </router-link>

  <!-- Botón POA con submenú -->
  <div class="relative">
    <button
      @click="togglePoa"
      class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
      :class="poaOpen ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'"
    >
      <span class="text-lg">☰</span>
      POA
    </button>
    
    <!-- Submenú POA -->
    <div
      v-show="poaOpen"
      class="absolute bottom-full left-0 mb-1 w-full rounded-md border border-slate-200 bg-white py-1 shadow-lg"
    >
      <router-link
        v-for="sublink in poaSubmenu"
        :key="sublink.to"
        :to="sublink.to"
        custom
        v-slot="{ href, navigate, isActive }"
      >
        <a
          :href="href"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          :class="isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'"
          @click="navigate"
        >
          <span class="h-1.5 w-1.5 rounded-full" :class="isActive ? 'bg-brand-600' : 'bg-transparent'"></span>
          {{ sublink.label }}
        </a>
      </router-link>
    </div>
  </div>
</nav>
```

- [ ] **Step 2: Verificar que el submenú se despliega correctamente**

Run: `npm run dev` y hacer clic en el botón POA para verificar que se despliegan los submenús

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/AppSidebar.vue
git commit -m "feat: add POA submenu with dropdown functionality"
```

---

### Task 5: Agregar cierre del submenú al hacer clic fuera

**Files:**
- Modify: `src/components/dashboard/AppSidebar.vue:1-5`

**Interfaces:**
- Consumes: Importación de `onMounted`, `onUnmounted` de Vue
- Produce: Event listener para cerrar submenú al hacer clic fuera

- [ ] **Step 1: Importar lifecycle hooks**

```javascript
import { ref, onMounted, onUnmounted } from 'vue'
```

- [ ] **Step 2: Agregar función para cerrar submenú al hacer clic fuera**

```javascript
function handleClickOutside(event) {
  const sidebar = document.querySelector('aside')
  if (sidebar && !sidebar.contains(event.target)) {
    poaOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
```

- [ ] **Step 3: Verificar que el submenú se cierra al hacer clic fuera**

Run: `npm run dev`, abrir submenú POA y hacer clic fuera para verificar que se cierra

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/AppSidebar.vue
git commit -m "feat: close POA submenu when clicking outside"
```

---

### Task 6: Verificación final

**Files:**
- Verify: `src/components/dashboard/AppSidebar.vue`

**Interfaces:**
- Consumes: Todos los cambios anteriores
- Produce: Funcionalidad completa del submenú POA

- [ ] **Step 1: Ejecutar linting**

Run: `npm run lint` (si está disponible)

- [ ] **Step 2: Verificar funcionalidad completa**

Run: `npm run dev` y verificar:
1. Botón POA muestra icono ☰ y texto "POA"
2. Al hacer clic se despliegan los submenús hacia arriba
3. Los submenús incluyen: Dashboard POA, Planes POA, Techos Presup., Bitácora
4. El submenú se cierra al hacer clic fuera
5. Los submenús mantienen el mismo estilo que los demás enlaces del sidebar

- [ ] **Step 3: Commit final**

```bash
git add src/components/dashboard/AppSidebar.vue
git commit -m "feat: complete POA submenu implementation"
```
