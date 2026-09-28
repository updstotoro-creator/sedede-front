<script setup>
import { computed, onMounted } from 'vue'
import { usePoaStore } from '../stores/poa'

const store = usePoaStore()
const d = computed(() => store.dashboard)

const stats = computed(() => {
  if (!d.value) return []
  return [
    { label: 'Programas', value: d.value.total_programas ?? 0, gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Proyectos', value: d.value.total_proyectos ?? 0, gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', text: 'text-purple-600' },
    { label: 'Actividades', value: d.value.total_actividades ?? 0, gradient: 'from-teal-500 to-teal-600', bg: 'bg-teal-50', text: 'text-teal-600' },
    { label: 'Indicadores', value: d.value.total_indicadores ?? 0, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Metas', value: d.value.total_metas ?? 0, gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  ]
})

const actividadesPorEstado = computed(() => {
  if (!d.value?.actividades_por_estado) return []
  const labels = { borrador: 'Borrador', vigente: 'Vigente', anulada: 'Anulada' }
  const colors = { 
    borrador: { bg: 'bg-slate-100', text: 'text-slate-700', bar: 'bg-slate-400' }, 
    vigente: { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' }, 
    anulada: { bg: 'bg-red-100', text: 'text-red-600', bar: 'bg-red-500' } 
  }
  const total = Object.values(d.value.actividades_por_estado).reduce((a, b) => a + b, 0)
  return Object.entries(d.value.actividades_por_estado).map(([key, val]) => ({
    key,
    label: labels[key] ?? key,
    count: val,
    percentage: total > 0 ? Math.round((val / total) * 100) : 0,
    color: colors[key] ?? { bg: 'bg-slate-100', text: 'text-slate-700', bar: 'bg-slate-400' },
  }))
})

const programas = computed(() => d.value?.programas ?? [])
const ultimoPlan = computed(() => d.value?.ultimo_plan ?? null)
const presupuesto = computed(() => d.value?.presupuesto ?? null)
const metas = computed(() => d.value?.metas ?? null)
const planesPorEstado = computed(() => d.value?.planes_por_estado ?? {})

onMounted(() => { store.fetchDashboard() })
</script>

<template>
  <section class="mt-8">
    <div class="mb-8">
      <h2 class="font-display text-2xl font-bold text-ink">Dashboard POA</h2>
      <p class="mt-1 text-sm text-slate-500">Resumen del Plan Operativo Anual 2026</p>
    </div>

    <div v-if="store.loading" class="py-16 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-r-transparent"></div>
      <p class="mt-3 text-sm text-slate-500">Cargando estadisticas...</p>
    </div>

    <div v-else-if="store.error" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
      {{ store.error }}
    </div>

    <template v-else-if="d">
      <!-- Stats Cards -->
      <div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div
          v-for="s in stats"
          :key="s.label"
          class="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
        >
          <div class="absolute inset-0 bg-gradient-to-br opacity-5" :class="s.gradient"></div>
          <div class="relative">
            <div class="flex items-center justify-between">
              <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="[s.bg, s.text]">{{ s.value }}</span>
            </div>
            <p class="mt-3 text-xs font-medium text-slate-500">{{ s.label }}</p>
            <p class="mt-1 font-display text-2xl font-bold text-ink">{{ s.value }}</p>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <!-- Actividades por Estado -->
          <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 class="mb-4 text-sm font-semibold text-slate-700">Actividades por Estado</h3>
            <div v-if="actividadesPorEstado.length" class="space-y-4">
              <div v-for="e in actividadesPorEstado" :key="e.key" class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-slate-700">{{ e.label }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-ink">{{ e.count }}</span>
                    <span class="text-xs text-slate-400">({{ e.percentage }}%)</span>
                  </div>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div class="h-full rounded-full transition-all duration-500" :class="e.color.bar" :style="{ width: `${e.percentage}%` }"></div>
                </div>
              </div>
            </div>
            <div v-else class="py-8 text-center text-sm text-slate-400">No hay actividades registradas</div>
          </div>

          <!-- Programas -->
          <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 class="mb-4 text-sm font-semibold text-slate-700">Programas Registrados</h3>
            <div v-if="programas.length" class="space-y-3">
              <div v-for="prog in programas" :key="prog.id" class="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
                    {{ prog.codigo }}
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-ink">{{ prog.denominacion }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-4 text-xs text-slate-500">
                  <span><span class="font-bold text-purple-600">{{ prog.proyectos_count }}</span> proyectos</span>
                  <span><span class="font-bold text-teal-600">{{ prog.actividades_count }}</span> actividades</span>
                </div>
              </div>
            </div>
            <div v-else class="py-8 text-center text-sm text-slate-400">No hay programas registrados</div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="space-y-6">
          <!-- Presupuesto -->
          <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 class="mb-4 text-sm font-semibold text-slate-700">Presupuesto POA</h3>
            <div v-if="presupuesto" class="space-y-4">
              <div class="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
                <p class="text-xs font-medium text-slate-500">Total Solicitado</p>
                <p class="mt-1 font-display text-2xl font-bold text-emerald-700">
                  Bs. {{ presupuesto.total_solicitado?.toLocaleString('es-BO', { minimumFractionDigits: 2 }) ?? '0.00' }}
                </p>
              </div>
              <div v-if="presupuesto.por_estado_actividad" class="space-y-2">
                <div v-for="(monto, estado) in presupuesto.por_estado_actividad" :key="estado" class="flex items-center justify-between text-sm">
                  <span class="text-slate-600">{{ estado }}</span>
                  <span class="font-semibold text-ink">Bs. {{ Number(monto).toLocaleString('es-BO') }}</span>
                </div>
              </div>
            </div>
            <div v-else class="py-8 text-center text-sm text-slate-400">Sin presupuesto asignado</div>
          </div>

          <!-- Metas -->
          <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 class="mb-4 text-sm font-semibold text-slate-700">Resumen de Metas</h3>
            <div v-if="metas" class="space-y-4">
              <div class="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                <p class="text-xs font-medium text-slate-500">Meta Anual Total</p>
                <p class="mt-1 font-display text-2xl font-bold text-amber-700">
                  {{ metas.total_meta_anual?.toLocaleString('es-BO') ?? '0' }}
                </p>
              </div>
              <div class="rounded-xl bg-slate-50 p-4">
                <p class="text-xs font-medium text-slate-500">Linea Base Total</p>
                <p class="mt-1 font-display text-xl font-bold text-slate-700">
                  {{ metas.total_linea_base?.toLocaleString('es-BO') ?? '0' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Planes -->
          <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 class="mb-4 text-sm font-semibold text-slate-700">Planes POA</h3>
            <div v-if="Object.keys(planesPorEstado).length" class="space-y-3">
              <div v-for="(count, estado) in planesPorEstado" :key="estado" class="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2">
                <span class="text-sm text-slate-600">{{ estado }}</span>
                <span class="font-bold text-ink">{{ count }}</span>
              </div>
            </div>
            <div v-else class="py-8 text-center text-sm text-slate-400">No hay planes registrados</div>
          </div>

          <!-- Ultimo Plan -->
          <div v-if="ultimoPlan" class="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 class="mb-4 text-sm font-semibold text-slate-700">Ultimo Plan</h3>
            <div class="rounded-xl bg-gradient-to-r from-brand-50 to-blue-50 p-4">
              <p class="font-semibold text-ink">{{ ultimoPlan.denominacion }}</p>
              <p class="mt-1 text-xs text-slate-500">Gestion {{ ultimoPlan.gestion_id }}</p>
              <div class="mt-2 flex items-center gap-2">
                <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="ultimoPlan.estado === 'aprobado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
                  {{ ultimoPlan.estado }}
                </span>
                <span class="text-xs text-slate-400">{{ ultimoPlan.tipo_periodo }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="py-16 text-center">
      <p class="text-sm font-medium text-slate-600">No hay datos disponibles</p>
    </div>
  </section>
</template>
