<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mockAsociaciones } from '../data/mockAsociaciones'

const route = useRoute()
const router = useRouter()

const asociacion = computed(() =>
  mockAsociaciones.find((a) => a.id === Number(route.params.asociacionId))
)

function verDeportistas(club) {
  router.push(`/dashboard/asociaciones/${asociacion.value.id}/clubes/${club.id}`)
}
</script>

<template>
  <section v-if="asociacion">
    <!-- Breadcrumb -->
    <nav class="mb-4 flex items-center gap-2 text-sm text-slate-500">
      <router-link to="/dashboard/asociaciones" class="hover:text-brand-600 hover:underline">Asociaciones</router-link>
      <span>/</span>
      <span class="font-semibold text-ink">{{ asociacion.nombre }}</span>
    </nav>

    <div class="mb-6 rounded-lg border border-slate-200 bg-white p-5">
      <p class="text-xs font-semibold uppercase tracking-wide text-brand-600">{{ asociacion.disciplina }}</p>
      <h2 class="mt-1 font-display text-lg font-bold text-ink">{{ asociacion.nombre }}</h2>
      <p class="mt-1 text-sm text-slate-500">Presidente: {{ asociacion.presidente }}</p>
    </div>

    <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Clubes afiliados</h3>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Club</th>
            <th class="px-4 py-3">Entrenador</th>
            <th class="px-4 py-3">Deportistas</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="club in asociacion.clubes" :key="club.id" class="cursor-pointer hover:bg-slate-50" @click="verDeportistas(club)">
            <td class="px-4 py-3 font-medium text-ink">{{ club.nombre }}</td>
            <td class="px-4 py-3 text-slate-600">{{ club.entrenador }}</td>
            <td class="px-4 py-3 text-slate-600">{{ club.deportistas.length }}</td>
            <td class="px-4 py-3 text-right">
              <span class="text-xs font-semibold text-brand-600 hover:underline">Ver deportistas →</span>
            </td>
          </tr>
          <tr v-if="!asociacion.clubes.length">
            <td colspan="4" class="px-4 py-8 text-center text-slate-400"> aún no tiene clubes registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <p v-else class="text-sm text-slate-500">Asociación no encontrada.</p>
</template>
