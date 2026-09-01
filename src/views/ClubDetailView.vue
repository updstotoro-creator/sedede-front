<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { mockAsociaciones } from '../data/mockAsociaciones'

const route = useRoute()

const asociacion = computed(() =>
  mockAsociaciones.find((a) => a.id === Number(route.params.asociacionId))
)

const club = computed(() =>
  asociacion.value?.clubes.find((c) => c.id === Number(route.params.clubId))
)
</script>

<template>
  <section v-if="asociacion && club">
    <!-- Breadcrumb de 3 niveles -->
    <nav class="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
      <router-link to="/dashboard/asociaciones" class="hover:text-brand-600 hover:underline">Asociaciones</router-link>
      <span>/</span>
      <router-link :to="`/dashboard/asociaciones/${asociacion.id}`" class="hover:text-brand-600 hover:underline">{{ asociacion.nombre }}</router-link>
      <span>/</span>
      <span class="font-semibold text-ink">{{ club.nombre }}</span>
    </nav>

    <div class="mb-6 rounded-lg border border-slate-200 bg-white p-5">
      <p class="text-xs font-semibold uppercase tracking-wide text-brand-600">Club</p>
      <h2 class="mt-1 font-display text-lg font-bold text-ink">{{ club.nombre }}</h2>
      <p class="mt-1 text-sm text-slate-500">Entrenador: {{ club.entrenador }}</p>
    </div>

    <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Deportistas registrados</h3>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Nombre</th>
            <th class="px-4 py-3">Edad</th>
            <th class="px-4 py-3">Categoría</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="deportista in club.deportistas" :key="deportista.id">
            <td class="px-4 py-3 font-medium text-ink">{{ deportista.nombre }}</td>
            <td class="px-4 py-3 text-slate-600">{{ deportista.edad }}</td>
            <td class="px-4 py-3 text-slate-600">{{ deportista.categoria }}</td>
          </tr>
          <tr v-if="!club.deportistas.length">
            <td colspan="3" class="px-4 py-8 text-center text-slate-400">Este club aún no tiene deportistas registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <p v-else class="text-sm text-slate-500">Club no encontrado.</p>
</template>
