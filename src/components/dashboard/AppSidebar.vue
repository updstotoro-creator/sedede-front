<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import logo from '../../assets/images/logo-sedede.png'

const auth = useAuthStore()
const poaOpen = ref(false)
const inventarioOpen = ref(false)

const mainLinks = [
  { to: '/dashboard', label: 'Resumen', exact: true },
  { to: '/dashboard/users', label: 'Usuarios' },
  { to: '/dashboard/roles', label: 'Roles' },
  { to: '/dashboard/asociaciones', label: 'Asociaciones' },
]

const poaSubmenu = [
  { to: '/dashboard/poa/dashboard', label: 'Dashboard POA' },
  { to: '/dashboard/poa/planes', label: 'Planes POA' },
  { to: '/dashboard/poa/techos', label: 'Techos Presup.' },
  { to: '/dashboard/poa/bitacora', label: 'Bitácora' },
]

const inventarioSubmenu = [
  { to: '/dashboard/inventario/tipos-item', label: 'Tipos de Ítem' },
  { to: '/dashboard/inventario/almacenes', label: 'Almacenes' },
  { to: '/dashboard/inventario/lotes', label: 'Lotes' },
  { to: '/dashboard/inventario/movimientos', label: 'Movimientos (Kardex)' },
  { to: '/dashboard/inventario/existencias', label: 'Existencias' },
]

function togglePoa() {
  poaOpen.value = !poaOpen.value
}

function toggleInventario() {
  inventarioOpen.value = !inventarioOpen.value
}

function handleClickOutside(event) {
  const sidebar = document.querySelector('aside')
  if (sidebar && !sidebar.contains(event.target)) {
    poaOpen.value = false
    inventarioOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function initials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}
</script>

<template>
  <aside class="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
    <div class="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
      <img :src="logo" alt="Logo SEDEDE" class="h-10 w-10 object-contain" />
      <div class="leading-tight">
        <p class="font-display text-sm font-extrabold text-brand-700">SEDEDE</p>
        <p class="text-[11px] font-semibold tracking-wide text-slate-400">PANEL DE GESTIÓN</p>
      </div>
    </div>

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

      <!-- Botón Activos e Inventario con submenú -->
      <div class="relative">
        <button
          @click="toggleInventario"
          class="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
          :class="inventarioOpen ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'"
        >
          <span class="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Activos e Inventario
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform"
               :class="inventarioOpen ? 'rotate-90' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- Submenú Activos e Inventario -->
        <div
          v-show="inventarioOpen"
          class="absolute bottom-full left-0 mb-1 w-full rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          <router-link
            v-for="sublink in inventarioSubmenu"
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

    <div class="border-t border-slate-100 px-4 py-4">
      <div class="mb-3 flex items-center gap-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {{ initials(auth.user?.name) }}
        </div>
        <div class="min-w-0 leading-tight">
          <p class="truncate text-sm font-semibold text-ink">{{ auth.user?.name }}</p>
          <p class="truncate text-xs text-slate-400">{{ auth.user?.role?.nombre ?? auth.user?.email }}</p>
        </div>
      </div>
      <button class="w-full rounded-md border border-slate-200 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600" @click="auth.logout()">
        Cerrar sesión
      </button>
    </div>
  </aside>
</template>

