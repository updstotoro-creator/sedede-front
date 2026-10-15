<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { poaService, mensajeError } from '../services/poaService'
import PoaIndicadorCard from '../components/poa/PoaIndicadorCard.vue'
import PoaModal from '../components/poa/PoaModal.vue'
import { usePoaStore } from '../stores/poa'

const route = useRoute()
const router = useRouter()
const store = usePoaStore()

const actividad = ref(null)
const loading = ref(true)
const error = ref(null)

const estadoConfig = computed(() => {
  const map = {
    borrador: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Borrador' },
    vigente: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Vigente' },
    anulada: { bg: 'bg-red-100', text: 'text-red-600', label: 'Anulada' },
  }
  return map[actividad.value?.estado] ?? map.borrador
})

const plan = computed(() => actividad.value?.plan ?? null)
const enBorrador = computed(() => plan.value?.estado === 'borrador')
const techo = computed(() => actividad.value?.techo_vigente ?? null)
const anulada = computed(() => actividad.value?.estado === 'anulada')
const bs = (v) => Number(v ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

async function cargar({ silencioso = false } = {}) {
  if (!silencioso) loading.value = true
  try {
    actividad.value = await poaService.getActividad(route.params.id)
    error.value = null
  } catch (e) {
    error.value = mensajeError(e, 'Error al cargar la actividad')
  } finally {
    loading.value = false
  }
}

// ── Techo presupuestario ────────────────────────────────────
const techoAbierto = ref(false)
const techoForm = reactive({ monto_solicitado_bs: '', justificacion: '' })
const techoError = ref('')
const guardandoTecho = ref(false)

function abrirTecho() {
  techoForm.monto_solicitado_bs = techo.value ? Number(techo.value.monto_solicitado_bs) : ''
  techoForm.justificacion = ''
  techoError.value = ''
  techoAbierto.value = true
}

async function guardarTecho() {
  guardandoTecho.value = true
  techoError.value = ''
  try {
    await poaService.createTecho({
      actividad_id: actividad.value.id,
      monto_solicitado_bs: Number(techoForm.monto_solicitado_bs),
      justificacion: techoForm.justificacion || null,
    })
    techoAbierto.value = false
    await cargar({ silencioso: true })
  } catch (e) {
    techoError.value = mensajeError(e, 'No se pudo registrar el techo')
  } finally {
    guardandoTecho.value = false
  }
}

// ── Nuevo indicador ─────────────────────────────────────────
const showModal = ref(false)
const saving = ref(false)
const modalError = ref('')

async function crearIndicador(data) {
  saving.value = true
  modalError.value = ''
  try {
    await poaService.createIndicador({ ...data, actividad_id: actividad.value.id })
    showModal.value = false
    await cargar({ silencioso: true })
  } catch (e) {
    modalError.value = mensajeError(e, 'No se pudo crear el indicador')
  } finally {
    saving.value = false
  }
}

onMounted(() => cargar())
</script>

<template>
  <section class="mt-8">
    <button
      class="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-ink"
      @click="router.push({ name: 'dashboard-poa' })"
    >
      &larr; Volver a la estructura
    </button>

    <div v-if="loading" class="py-16 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-r-transparent"></div>
    </div>

    <div v-else-if="error" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
      {{ error }}
    </div>

    <template v-else-if="actividad">
      <!-- Cabecera -->
      <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div class="border-b border-slate-100 bg-gradient-to-r from-teal-50 to-emerald-50 px-6 py-5">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-xs font-bold text-teal-700">AC</div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-sm font-bold text-slate-400">{{ actividad.codigo }}</span>
                <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="[estadoConfig.bg, estadoConfig.text]">{{ estadoConfig.label }}</span>
              </div>
              <h2 class="mt-1 font-display text-xl font-bold text-ink">{{ actividad.denominacion }}</h2>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
          <dl class="space-y-4 md:col-span-2">
            <div>
              <dt class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Plan</dt>
              <dd class="text-sm text-ink">{{ plan?.denominacion }} · gestión {{ actividad.gestion_id }} · <span class="capitalize">{{ plan?.estado }}</span></dd>
            </div>
            <div>
              <dt class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Estructura</dt>
              <dd class="text-sm text-ink">
                {{ actividad.programa?.codigo }} {{ actividad.programa?.denominacion }}
                <template v-if="actividad.proyecto"> &rarr; {{ actividad.proyecto.codigo }} {{ actividad.proyecto.denominacion }}</template>
              </dd>
            </div>
            <div v-if="actividad.producto_esperado">
              <dt class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Producto esperado</dt>
              <dd class="text-sm text-slate-700">{{ actividad.producto_esperado }}</dd>
            </div>
            <div>
              <dt class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Unidad responsable</dt>
              <dd class="text-sm text-ink">{{ actividad.unidad_organizacional ?? `Unidad #${actividad.unidad_organizacional_id}` }}</dd>
            </div>
          </dl>

          <!-- Techo -->
          <div class="rounded-xl bg-slate-50 p-4">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400">Techo solicitado</h3>
            <template v-if="techo">
              <p class="mt-1 font-display text-2xl font-bold text-emerald-600">Bs. {{ bs(techo.monto_solicitado_bs) }}</p>
              <p class="text-xs text-slate-400">Versión {{ techo.version }}<span v-if="techo.justificacion"> · {{ techo.justificacion }}</span></p>
            </template>
            <p v-else class="mt-1 text-sm text-slate-500">Sin techo registrado</p>

            <button v-if="!techoAbierto && plan?.estado !== 'cerrado' && store.puede('poa.crear')" class="mt-3 text-xs font-semibold text-brand-600 hover:underline" @click="abrirTecho">
              {{ techo ? 'Registrar nueva versión' : 'Registrar techo' }}
            </button>

            <form v-if="techoAbierto" novalidate class="mt-3 space-y-2" @submit.prevent="guardarTecho">
              <label class="block text-xs font-semibold text-slate-600">
                Monto (Bs.) <span class="text-red-500">*</span>
                <input v-model="techoForm.monto_solicitado_bs" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" :disabled="guardandoTecho" />
              </label>
              <label class="block text-xs font-semibold text-slate-600">
                Justificación <span v-if="techo" class="text-red-500">*</span>
                <textarea v-model="techoForm.justificacion" rows="2" class="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" :disabled="guardandoTecho"></textarea>
              </label>
              <p v-if="techoError" role="alert" class="text-xs text-red-600">{{ techoError }}</p>
              <div class="flex justify-end gap-2">
                <button type="button" class="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200" :disabled="guardandoTecho" @click="techoAbierto = false">Cancelar</button>
                <button type="submit" class="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50" :disabled="guardandoTecho || techoForm.monto_solicitado_bs === '' || (techo && !techoForm.justificacion.trim())">
                  {{ guardandoTecho ? 'Guardando…' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div v-if="anulada" class="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
        Actividad anulada: no admite avances y no cuenta para el cumplimiento del plan.
      </div>

      <!-- Indicadores -->
      <div class="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
          <h3 class="text-sm font-semibold text-slate-700">Indicadores y metas ({{ actividad.indicadores?.length ?? 0 }})</h3>
          <div class="flex items-center gap-3">
            <router-link :to="{ name: 'dashboard-poa-bitacora' }" class="text-xs font-semibold text-slate-500 hover:text-ink">Ver bitácora</router-link>
            <button v-if="enBorrador && store.puede('poa.crear')" class="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100" @click="modalError = ''; showModal = true">+ Indicador</button>
          </div>
        </div>

        <div v-if="actividad.indicadores?.length" class="divide-y divide-slate-100">
          <PoaIndicadorCard
            v-for="ind in actividad.indicadores"
            :key="ind.id"
            :indicador="ind"
            :plan="plan"
            :actividad-anulada="anulada"
            @changed="cargar({ silencioso: true })"
          />
        </div>

        <div v-else class="py-12 text-center text-sm text-slate-400">
          No hay indicadores registrados para esta actividad
        </div>
      </div>
    </template>

    <PoaModal
      :show="showModal"
      tipo="indicador"
      :saving="saving"
      :child-info="actividad ? { parent: actividad } : null"
      :error="modalError"
      @close="showModal = false"
      @submit="crearIndicador"
    />
  </section>
</template>
