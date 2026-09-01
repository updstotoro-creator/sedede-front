<script setup>
import { useRoute } from 'vue-router'
import AppSidebar from '../components/dashboard/AppSidebar.vue'

const route = useRoute()

const titles = {
  dashboard: 'Resumen',
  'dashboard-users': 'Usuarios',
  'dashboard-roles': 'Roles',
  'dashboard-asociaciones': 'Padrón de Asociaciones',
  'dashboard-asociacion-detalle': 'Clubes de la Asociación',
  'dashboard-club-detalle': 'Deportistas del Club',
}
</script>

<template>
  <div class="flex bg-paper">
    <AppSidebar />
    <div class="flex-1">
      <header class="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">SEDEDE Chuquisaca</p>
          <h1 class="font-display text-xl font-bold text-ink">{{ titles[route.name] ?? 'Panel' }}</h1>
        </div>
      </header>

      <main class="p-8">
        <div v-if="route.name === 'dashboard'" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <router-link to="/dashboard/users" class="rounded-lg border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md">
            <p class="text-xs font-semibold uppercase tracking-wide text-brand-600">Gestión</p>
            <h2 class="mt-2 font-display text-lg font-bold text-ink">Usuarios</h2>
            <p class="mt-1 text-sm text-slate-500">Listar, crear, editar y desactivar cuentas del sistema.</p>
          </router-link>
          <router-link to="/dashboard/roles" class="rounded-lg border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md">
            <p class="text-xs font-semibold uppercase tracking-wide text-brand-600">Gestión</p>
            <h2 class="mt-2 font-display text-lg font-bold text-ink">Roles</h2>
            <p class="mt-1 text-sm text-slate-500">Definir roles y permisos de acceso al sistema.</p>
          </router-link>
          <router-link to="/dashboard/asociaciones" class="rounded-lg border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md">
            <p class="text-xs font-semibold uppercase tracking-wide text-brand-600">Padrón</p>
            <h2 class="mt-2 font-display text-lg font-bold text-ink">Asociaciones</h2>
            <p class="mt-1 text-sm text-slate-500">Consultar asociaciones, sus clubes y deportistas registrados.</p>
          </router-link>
        </div>

        <router-view v-else />
      </main>
    </div>
  </div>
</template>
