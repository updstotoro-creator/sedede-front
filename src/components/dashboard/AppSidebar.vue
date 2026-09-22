<script setup>
import { useAuthStore } from '../../stores/auth'
import logo from '../../assets/images/logo-sedede.png'

const auth = useAuthStore()

const groups = [
  {
    id: 'resumen',
    standalone: true,
    links: [
      { to: '/dashboard', label: 'Resumen', exact: true },
    ]
  },
  {
    id: 'gestion-sistema',
    links: [
      { to: '/dashboard/users', label: 'Usuarios' },
      { to: '/dashboard/roles', label: 'Roles' },
    ]
  },
  {
    id: 'asociaciones-calendario',
    links: [
      { to: '/dashboard/asociaciones', label: 'Asociaciones' },
      { to: '/dashboard/calendario-anual', label: 'Calendario Anual' },
    ]
  },
  {
    id: 'deportistas-tramites',
    links: [
      { to: '/dashboard/deportistas', label: 'Deportistas' },
      { to: '/dashboard/tramites', label: 'Trámites' },
    ]
  },
  {
    id: 'escenarios-tarifario',
    links: [
      { to: '/dashboard/escenarios', label: 'Escenarios' },
      { to: '/dashboard/tarifario', label: 'Tarifario' },
    ]
  },
]

function initials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}
</script>

<template>
  <aside class="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm">
    <!-- Header del Sidebar con Logo SEDEDE -->
    <div class="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
      <img :src="logo" alt="Logo SEDEDE" class="h-10 w-10 object-contain" />
      <div class="leading-tight">
        <p class="font-display text-sm font-extrabold text-brand-700">SEDEDE</p>
        <p class="text-[11px] font-semibold tracking-wide text-slate-400">PANEL DE GESTIÓN</p>
      </div>
    </div>

    <!-- Navegación Agrupada con Recuadros de Borde Rojo y Bordes Redondeados (Sin Relleno) -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-3">
      <div v-for="group in groups" :key="group.id">
        <!-- Item Standalone (Resumen) -->
        <div v-if="group.standalone" class="rounded-xl border border-brand-500 p-1.5 bg-white">
          <router-link
            v-for="link in group.links"
            :key="link.to"
            :to="link.to"
            custom
            v-slot="{ href, navigate, isExactActive }"
          >
            <a
              :href="href"
              class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
              :class="isExactActive ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-brand-700'"
              @click="navigate"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="isExactActive ? 'bg-brand-600' : 'bg-slate-300'"></span>
              {{ link.label }}
            </a>
          </router-link>
        </div>

        <!-- Grupo Recuadro con Borde Rojo Institucional, Esquinas Redondeadas, Fondo Blanco -->
        <div v-else class="rounded-xl border border-brand-500 p-1.5 space-y-1 bg-white">
          <router-link
            v-for="link in group.links"
            :key="link.to"
            :to="link.to"
            custom
            v-slot="{ href, navigate, isExactActive, isActive }"
          >
            <a
              :href="href"
              class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
              :class="(link.exact ? isExactActive : isActive) ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-brand-700'"
              @click="navigate"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="(link.exact ? isExactActive : isActive) ? 'bg-brand-600' : 'bg-slate-300'"></span>
              {{ link.label }}
            </a>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Usuario Autenticado & Cierre de Sesión -->
    <div class="border-t border-slate-100 px-4 py-4">
      <div class="mb-3 flex items-center gap-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-sm">
          {{ initials(auth.user?.name) }}
        </div>
        <div class="min-w-0 leading-tight">
          <p class="truncate text-sm font-semibold text-slate-900">{{ auth.user?.name }}</p>
          <p class="truncate text-xs text-slate-400">{{ auth.user?.role?.nombre ?? auth.user?.email }}</p>
        </div>
      </div>
      <button
        class="w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
        @click="auth.logout()"
      >
        Cerrar sesión
      </button>
    </div>
  </aside>
</template>
