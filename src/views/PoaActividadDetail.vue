<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { poaService } from '../services/poaService'

const route = useRoute()
const router = useRouter()

const actividad = ref(null)
const loading = ref(true)
const error = ref(null)

const estadoConfig = computed(() => {
  const map = {
    borrador: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Borrador' },
    vigente: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Vigente' },
    anulada: { bg: 'bg-red-100', text: 'text-red-600', label: 'Anulada' },
  }
  return map[actividad.value?.estado] ?? { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Borrador' }
})

onMounted(async () => {
  try {
    const res = await poaService.getActividad(route.params.id)
    actividad.value = res.data
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al cargar actividad'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="mt-8">
    <button 
      class="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-ink"
      @click="router.push({ name: 'dashboard-poa' })"
    >
      &larr; Volver al POA
    </button>

    <div v-if="loading" class="py-16 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-r-transparent"></div>
    </div>

    <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
      {{ error }}
    </div>

    <template v-else-if="actividad">
      <!-- Header -->
      <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div class="border-b border-slate-100 bg-gradient-to-r from-teal-50 to-emerald-50 px-6 py-5">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-xs font-bold text-teal-700">
                AC
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm font-bold text-slate-400">{{ actividad.codigo }}</span>
                  <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="[estadoConfig.bg, estadoConfig.text]">
                    {{ estadoConfig.label }}
                  </span>
                </div>
                <h2 class="mt-1 font-display text-xl font-bold text-ink">{{ actividad.denominacion }}</h2>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <div class="space-y-4">
            <div v-if="actividad.producto_esperado">
              <h3 class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Producto Esperado</h3>
              <p class="text-sm text-slate-700">{{ actividad.producto_esperado }}</p>
            </div>
            <div>
              <h3 class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Gestion</h3>
              <p class="text-sm font-semibold text-ink">{{ actividad.gestion_id }}</p>
            </div>
          </div>
          <div class="space-y-4">
            <div v-if="actividad.techo_presupuestario">
              <h3 class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Techo Presupuestario</h3>
              <p class="font-display text-2xl font-bold text-emerald-600">
                Bs. {{ Number(actividad.techo_presupuestario).toLocaleString('es-BO', { minimumFractionDigits: 2 }) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Indicadores -->
      <div class="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div class="border-b border-slate-100 px-6 py-4">
          <h3 class="text-sm font-semibold text-slate-700">Indicadores ({{ actividad.indicadores?.length ?? 0 }})</h3>
        </div>

        <div v-if="actividad.indicadores?.length" class="divide-y divide-slate-100">
          <div v-for="ind in actividad.indicadores" :key="ind.id" class="px-6 py-4">
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs font-bold text-slate-400">{{ ind.codigo }}</span>
                  <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{{ ind.tipo }}</span>
                </div>
                <p class="mt-1 text-sm font-medium text-ink">{{ ind.denominacion }}</p>
                <div class="mt-1 flex items-center gap-3 text-xs text-slate-400">
                  <span>Unidad: {{ ind.unidad_medida }}</span>
                  <span v-if="ind.formula">Formula: {{ ind.formula }}</span>
                </div>
              </div>
              <div v-if="ind.meta_vigente" class="text-right">
                <p class="text-xs text-slate-400">Meta v{{ ind.meta_vigente.version }}</p>
                <p class="font-display text-lg font-bold text-emerald-600">{{ ind.meta_vigente.meta_anual }}</p>
                <p class="text-xs text-slate-400">Base: {{ ind.meta_vigente.linea_base }}</p>
              </div>
            </div>

            <!-- Programacion por periodos -->
            <div v-if="ind.meta_vigente?.programaciones?.length" class="mt-3">
              <p class="mb-2 text-xs font-semibold text-slate-500">Programacion por periodos:</p>
              <div class="flex flex-wrap gap-2">
                <div v-for="prog in ind.meta_vigente.programaciones" :key="prog.id" class="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5">
                  <span class="text-xs text-slate-400">P{{ prog.numero_periodo }}:</span>
                  <span class="text-xs font-bold text-ink">{{ prog.meta_periodo }}</span>
                </div>
              </div>
            </div>

            <!-- Historial de metas -->
            <div v-if="ind.metas?.length > 1" class="mt-3">
              <p class="mb-1 text-xs font-semibold text-slate-500">Historial de metas:</p>
              <div class="flex flex-wrap gap-2">
                <div v-for="m in ind.metas" :key="m.id" class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs">
                  <span class="font-semibold text-slate-600">v{{ m.version }}:</span>
                  <span class="text-ink">{{ m.meta_anual }}</span>
                  <span v-if="m.motivo" class="text-slate-400">({{ m.motivo }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="py-12 text-center text-sm text-slate-400">
          No hay indicadores registrados para esta actividad
        </div>
      </div>
    </template>
  </section>
</template>
