<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import logo from '../../assets/images/logo-sedede.png'

const auth = useAuthStore()
const poaOpen = ref(false)

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

function togglePoa() {
  poaOpen.value = !poaOpen.value
}

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

