<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePoaStore } from '../stores/poa'
import { poaService, mensajeError } from '../services/poaService'
import PoaPlanSelector from '../components/poa/PoaPlanSelector.vue'

const store = usePoaStore()

const datos = ref(null)
const loading = ref(false)
const error = ref('')
const filtro = ref('')
const abiertas = ref(new Set())

const SEMAFORO = {
  verde: { label: 'En meta', chip: 'bg-emerald-100 text-emerald-700', barra: 'bg-emerald-500' },
  amarillo: { label: 'En riesgo', chip: 'bg-amber-100 text-amber-800', barra: 'bg-amber-500' },
  rojo: { label: 'Rezagada', chip: 'bg-red-100 text-red-700', barra: 'bg-red-500' },
  sin_dato: { label: 'Sin dato', chip: 'bg-slate-100 text-slate-600', barra: 'bg-slate-300' },
}

const fmt = (v) => Number(v ?? 0).toLocaleString('es-BO', { maximumFractionDigits: 2 })
const pct = (v) => (v === null || v === undefined ? '—' : `${fmt(v)} %`)
const bs = (v) => Number(v ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const enBorrador = computed(() => store.planActivo?.estado === 'borrador')
const ultimoCerrado = computed(() => datos.value?.periodos.filter((p) => p.cerrado).at(-1) ?? null)

const programas = computed(() => {
  if (!datos.value) return []
  return datos.value.programas
    .map((p) => ({ ...p, actividades: p.actividades.filter((a) => !filtro.value || a.semaforo === filtro.value) }))
    .filter((p) => p.actividades.length)
})

function alternar(id) {
  const s = new Set(abiertas.value)
  s.has(id) ? s.delete(id) : s.add(id)
  abiertas.value = s
}

async function cargar() {
  datos.value = null
  error.value = ''
  if (!store.planActivo || enBorrador.value) return
  loading.value = true
  try {
    datos.value = await poaService.getCumplimiento(store.planId)
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo calcular el cumplimiento')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await store.fetchPlanes()
  await cargar()
})
</script>

<template>
  <section class="mt-8">
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="font-display text-2xl font-bold text-ink">Seguimiento del POA</h2>
        <p class="mt-1 text-sm text-slate-500">Lo ejecutado frente a lo programado, por actividad e indicador</p>
      </div>
      <PoaPlanSelector @change="cargar" />
    </div>

    <div v-if="store.loading || loading" class="py-16 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-r-transparent"></div>
    </div>

    <div v-else-if="store.error || error" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
      {{ store.error || error }}
    </div>

    <div v-else-if="enBorrador" class="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
      Este plan está en formulación. El seguimiento empieza cuando el plan se aprueba y se registran los avances.
    </div>

    <template v-else-if="datos">
      <!-- Resumen -->
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p class="text-xs font-medium text-slate-500">Cumplimiento a la fecha</p>
          <p class="mt-1 font-display text-3xl font-bold text-ink">{{ pct(datos.resumen.cumplimiento) }}</p>
          <span class="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold" :class="SEMAFORO[datos.resumen.semaforo].chip">
            {{ SEMAFORO[datos.resumen.semaforo].label }}
          </span>
        </div>
        <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p class="text-xs font-medium text-slate-500">Periodos cerrados</p>
          <p class="mt-1 font-display text-3xl font-bold text-ink">{{ datos.periodos_cerrados }} de {{ datos.periodos.length }}</p>
          <p class="mt-2 text-xs text-slate-400">
            {{ ultimoCerrado ? `Medido hasta ${ultimoCerrado.etiqueta} (${ultimoCerrado.fin})` : 'Aún no cierra ningún periodo' }}
          </p>
        </div>
        <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p class="text-xs font-medium text-slate-500">Actividades ({{ datos.resumen.actividades }})</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="(n, clave) in datos.resumen.actividades_por_semaforo"
              :key="clave"
              type="button"
              class="rounded-full px-2.5 py-1 text-xs font-semibold ring-offset-1 transition"
              :class="[SEMAFORO[clave].chip, filtro === clave && 'ring-2 ring-brand-500']"
              :aria-pressed="filtro === clave"
              @click="filtro = filtro === clave ? '' : clave"
            >
              {{ n }} {{ SEMAFORO[clave].label.toLowerCase() }}
            </button>
          </div>
        </div>
        <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p class="text-xs font-medium text-slate-500">Techo solicitado</p>
          <p class="mt-1 font-display text-2xl font-bold text-emerald-700">Bs. {{ bs(datos.resumen.techo_solicitado_bs) }}</p>
          <p class="mt-2 text-xs text-slate-400">La ejecución financiera llegará con el módulo Financiero.</p>
        </div>
      </div>

      <p class="mb-4 text-xs text-slate-500">
        En meta desde {{ datos.umbrales.verde }} % de lo programado a la fecha; en riesgo desde {{ datos.umbrales.amarillo }} %; rezagada por debajo.
        Para promediar, cada indicador cuenta como máximo 100 %.
      </p>

      <!-- Programas -->
      <div class="space-y-6">
        <div v-for="prog in programas" :key="prog.id" class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div class="min-w-0">
              <span class="font-mono text-xs font-bold text-slate-400">{{ prog.codigo }}</span>
              <h3 class="font-display text-base font-bold text-ink">{{ prog.denominacion }}</h3>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-display text-lg font-bold text-ink">{{ pct(prog.cumplimiento) }}</span>
              <span class="rounded-full px-2 py-0.5 text-xs font-semibold" :class="SEMAFORO[prog.semaforo].chip">{{ SEMAFORO[prog.semaforo].label }}</span>
            </div>
          </div>

          <ul class="divide-y divide-slate-100">
            <li v-for="act in prog.actividades" :key="act.id">
              <button type="button" class="flex w-full flex-col gap-2 px-5 py-3 text-left hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4" :aria-expanded="abiertas.has(act.id)" @click="alternar(act.id)">
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-ink">
                    <span class="font-mono text-xs text-slate-400">{{ act.codigo }}</span> {{ act.denominacion }}
                  </p>
                  <p class="text-xs text-slate-400">{{ act.unidad }}</p>
                </div>
                <div class="flex items-center gap-3 sm:w-72">
                  <div class="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div class="h-full rounded-full" :class="SEMAFORO[act.semaforo].barra" :style="{ width: `${Math.min(act.cumplimiento ?? 0, 100)}%` }"></div>
                  </div>
                  <span class="w-16 text-right text-sm font-bold tabular-nums text-ink">{{ pct(act.cumplimiento) }}</span>
                  <span class="w-20 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold" :class="SEMAFORO[act.semaforo].chip">{{ SEMAFORO[act.semaforo].label }}</span>
                </div>
              </button>

              <div v-if="abiertas.has(act.id)" class="space-y-4 bg-slate-50/60 px-5 pb-4 pt-1">
                <div v-for="ind in act.indicadores" :key="ind.id" class="rounded-xl border border-slate-100 bg-white p-4">
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <p class="text-sm text-ink">
                      <span class="font-mono text-xs text-slate-400">{{ ind.codigo }}</span> {{ ind.denominacion }}
                      <span class="text-xs text-slate-400">({{ ind.unidad_medida }}<template v-if="ind.meta_version > 1">, meta v{{ ind.meta_version }}</template>)</span>
                    </p>
                    <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="SEMAFORO[ind.semaforo].chip">{{ pct(ind.cumplimiento_a_la_fecha) }}</span>
                  </div>
                  <p class="mt-1 text-xs text-slate-500">
                    A la fecha: {{ fmt(ind.ejecutado_a_la_fecha) }} de {{ fmt(ind.programado_a_la_fecha) }} programado ·
                    Anual: {{ fmt(ind.ejecutado_total) }} de {{ fmt(ind.meta_anual) }} ({{ pct(ind.cumplimiento_anual) }})
                  </p>
                  <div class="mt-3 overflow-x-auto">
                    <table class="w-full min-w-[320px] text-xs">
                      <thead>
                        <tr class="text-slate-400">
                          <th class="py-1 pr-3 text-left font-semibold">Periodo</th>
                          <th v-for="p in ind.periodos" :key="p.numero" class="px-2 py-1 text-right font-semibold" :class="!p.cerrado && 'text-slate-300'">{{ p.etiqueta }}</th>
                        </tr>
                      </thead>
                      <tbody class="tabular-nums">
                        <tr>
                          <td class="py-1 pr-3 text-slate-500">Programado</td>
                          <td v-for="p in ind.periodos" :key="p.numero" class="px-2 py-1 text-right text-slate-600">{{ fmt(p.programado) }}</td>
                        </tr>
                        <tr>
                          <td class="py-1 pr-3 text-slate-500">Ejecutado</td>
                          <td v-for="p in ind.periodos" :key="p.numero" class="px-2 py-1 text-right font-semibold text-ink">
                            {{ p.ejecutado === null ? '—' : fmt(p.ejecutado) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <router-link :to="{ name: 'dashboard-poa-actividad', params: { id: act.id } }" class="inline-block text-xs font-semibold text-brand-600 hover:underline">
                  Abrir la actividad para registrar avances &rarr;
                </router-link>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <p v-if="!programas.length" class="py-12 text-center text-sm text-slate-500">No hay actividades con ese estado.</p>
    </template>
  </section>
</template>
