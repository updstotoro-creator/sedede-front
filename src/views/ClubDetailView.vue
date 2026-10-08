<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { asociacionService } from '../services/asociacionService'
import { deportistaService } from '../services/deportistaService'

const route = useRoute()
const asociacionId = route.params.asociacionId
const clubId = route.params.clubId

const asociacion = ref(null)
const club = ref(null)
const deportistas = ref([])
const status = ref('loading')
const errorMessage = ref('')

async function loadData() {
  status.value = 'loading'
  errorMessage.value = ''
  try {
    asociacion.value = await asociacionService.get(asociacionId)
    const clubes = await asociacionService.listClubes(asociacionId)
    club.value = clubes.find((c) => c.id === Number(clubId)) || null

    const res = await deportistaService.list({ club_id: clubId })
    deportistas.value = res.items || []
    status.value = 'idle'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error.response?.data?.error || 'Error al cargar los deportistas del club.'
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <section v-if="status === 'loading'" class="py-10 text-center text-sm text-slate-400">
    Cargando información del club…
  </section>

  <section v-else-if="status === 'error'" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {{ errorMessage }}
  </section>

  <section v-else-if="asociacion && club">
    <!-- Breadcrumb de 3 niveles -->
    <nav class="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
      <router-link to="/dashboard/asociaciones" class="hover:text-brand-600 hover:underline">Asociaciones</router-link>
      <span>/</span>
      <router-link :to="`/dashboard/asociaciones/${asociacion.id}`" class="hover:text-brand-600 hover:underline">{{ asociacion.nombre }}</router-link>
      <span>/</span>
      <span class="font-semibold text-ink">{{ club.nombre }}</span>
    </nav>

    <div class="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p class="text-xs font-semibold uppercase tracking-wide text-brand-600">Club Deportivo Afiliado</p>
      <h2 class="mt-1 font-display text-lg font-bold text-ink">{{ club.nombre }}</h2>
      <p class="mt-1 text-sm text-slate-500">Sigla: {{ club.sigla || '—' }} | Personería: {{ club.personeria_juridica || 'En trámite' }}</p>
    </div>

    <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Deportistas Registrados en este Club</h3>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
          <tr>
            <th class="px-4 py-3">Deportista</th>
            <th class="px-4 py-3">C.I.</th>
            <th class="px-4 py-3">Disciplina</th>
            <th class="px-4 py-3">Categoría</th>
            <th class="px-4 py-3">Ranking Deptal</th>
            <th class="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="dep in deportistas" :key="dep.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 font-semibold text-ink">{{ dep.nombres }} {{ dep.primer_apellido }} {{ dep.segundo_apellido }}</td>
            <td class="px-4 py-3 text-slate-600">{{ dep.ci }} {{ dep.expedido ? `(${dep.expedido})` : '' }}</td>
            <td class="px-4 py-3 text-slate-600">{{ dep.disciplina }}</td>
            <td class="px-4 py-3 text-slate-600">{{ dep.categoria || 'Senior' }}</td>
            <td class="px-4 py-3 font-mono text-slate-600">#{{ dep.ranking_departamental || '—' }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="dep.activo ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'">
                {{ dep.estado_atleta || (dep.activo ? 'Activo' : 'Inactivo') }}
              </span>
            </td>
          </tr>
          <tr v-if="!deportistas.length">
            <td colspan="6" class="px-4 py-8 text-center text-slate-400">Este club aún no tiene deportistas registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <p v-else class="text-sm text-slate-500">Club no encontrado.</p>
</template>
