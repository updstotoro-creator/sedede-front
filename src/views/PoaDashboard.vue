<script setup>
import { computed, onMounted } from 'vue'
import { usePoaStore } from '../stores/poa'

const store = usePoaStore()

const d = computed(() => store.dashboard)

const stats = computed(() => {
  if (!d.value) return []
  return [
    { label: 'Programas', value: d.value.total_programas ?? 0, color: 'bg-blue-100 text-blue-700' },
    { label: 'Proyectos', value: d.value.total_proyectos ?? 0, color: 'bg-purple-100 text-purple-700' },
    { label: 'Actividades', value: d.value.total_actividades ?? 0, color: 'bg-teal-100 text-teal-700' },
    { label: 'Metas', value: d.value.total_metas ?? 0, color: 'bg-amber-100 text-amber-700' },
  ]
})

const actividadesPorEstado = computed(() => {
  if (!d.value?.actividades_por_estado) return []
  const labels = { borrador: 'Borrador', vigente: 'Vigente', anulada: 'Anulada' }
  const colors = { borrador: 'bg-slate-100 text-slate-600', vigente: 'bg-teal-100 text-teal-700', anulada: 'bg-red-100 text-red-600' }
  return Object.entries(d.value.actividades_por_estado).map(([key, val]) => ({
    key,
    label: labels[key] ?? key,
    count: val,
    color: colors[key] ?? 'bg-slate-100 text-slate-600',
  }))
})

const planActual = computed(() => d.value?.plan_actual ?? null)

onMounted(() => {
  store.fetchDashboard()
})
</script>

<template>
  <section class="mt-8">
    <h2 class="mb-6 font-display text-xl font-bold text-ink">Dashboard POA</h2>

    <div v-if="store.loading" class="py-10 text-center text-sm text-slate-400">
      Cargando estadísticas…
    </div>

    <div v-else-if="store.error" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ store.error }}
    </div>

    <template v-else-if="d">
      <div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div
          v-for="s in stats"
          :key="s.label"
          class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ s.label }}</p>
          <p class="mt-1 font-display text-3xl font-bold" :class="s.color.split(' ').pop()">{{ s.value }}</p>
        </div>
      </div>

      <div v-if="actividadesPorEstado.length" class="mb-8">
        <h3 class="mb-3 text-sm font-semibold text-slate-600">Actividades por estado</h3>
        <div class="flex flex-wrap gap-3">
          <span
            v-for="e in actividadesPorEstado"
            :key="e.key"
            class="rounded-full px-3 py-1.5 text-xs font-semibold"
            :class="e.color"
          >
            {{ e.label }}: {{ e.count }}
          </span>
        </div>
      </div>

      <div v-if="planActual" class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 class="mb-2 text-sm font-semibold text-slate-600">Plan POA actual</h3>
        <p class="font-medium text-ink">{{ planActual.nombre ?? `Plan ${planActual.anio ?? ''}` }}</p>
        <span
          class="mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold"
          :class="planActual.estado === 'aprobado' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'"
        >
          {{ planActual.estado ?? '—' }}
        </span>
      </div>
    </template>

    <div v-else class="py-10 text-center text-sm text-slate-400">
      No hay datos disponibles.
    </div>
  </section>
</template>
