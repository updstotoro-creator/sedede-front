<script setup>
import { useRouter } from 'vue-router'
import { mockAsociaciones } from '../data/mockAsociaciones'

const router = useRouter()

function verClubes(asociacion) {
  router.push(`/dashboard/asociaciones/${asociacion.id}`)
}
</script>

<template>
  <section>
    <p class="mb-6 text-sm text-slate-500">Padrón de asociaciones deportivas del departamento.</p>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Asociación</th>
            <th class="px-4 py-3">Disciplina</th>
            <th class="px-4 py-3">Presidente</th>
            <th class="px-4 py-3">Clubes</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="asociacion in mockAsociaciones" :key="asociacion.id" class="cursor-pointer hover:bg-slate-50" @click="verClubes(asociacion)">
            <td class="px-4 py-3 font-medium text-ink">{{ asociacion.nombre }}</td>
            <td class="px-4 py-3 text-slate-600">{{ asociacion.disciplina }}</td>
            <td class="px-4 py-3 text-slate-600">{{ asociacion.presidente }}</td>
            <td class="px-4 py-3 text-slate-600">{{ asociacion.clubes.length }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="asociacion.activo ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'">
                {{ asociacion.activo ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="text-xs font-semibold text-brand-600 hover:underline">Ver clubes →</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="mt-4 text-xs text-slate-400">
      Vista sin funcionalidad todavía 
    </p>
  </section>
</template>
