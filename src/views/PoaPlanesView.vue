<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePoaStore } from '../stores/poa'
import { poaService, mensajeError } from '../services/poaService'

const store = usePoaStore()
const router = useRouter()

const showModal = ref(false)
const editing = ref(null)
const saving = ref(false)
const formError = ref('')

// Periodicidades que admite la base [SP-02]; la cantidad la fija el backend.
const periodos = { mensual: 12, trimestral: 4, semestral: 2 }
const anioActual = new Date().getFullYear()

const form = reactive({
  denominacion: '',
  gestion_id: anioActual,
  unidad_ejecutora_id: 1,
  origen: 'formulado',
  tipo_periodo: 'trimestral',
})

// Aprobación
const aprobando = ref(null)
const aprobacion = reactive({ resolucion_aprobacion: '', fecha_aprobacion: '' })
const aprobacionError = ref('')
const aprobacionCuadre = ref([])

const estadoConfig = {
  borrador: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Borrador' },
  aprobado: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Aprobado' },
  cerrado: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Cerrado' },
}
const estado = (plan) => estadoConfig[plan.estado] ?? estadoConfig.borrador

function openCreate() {
  editing.value = null
  Object.assign(form, {
    denominacion: `POA ${anioActual}`,
    gestion_id: anioActual,
    unidad_ejecutora_id: 1,
    origen: 'formulado',
    tipo_periodo: 'trimestral',
  })
  formError.value = ''
  showModal.value = true
}

function handleEdit(plan) {
  editing.value = plan
  Object.assign(form, {
    denominacion: plan.denominacion ?? '',
    gestion_id: plan.gestion_id ?? anioActual,
    unidad_ejecutora_id: plan.unidad_ejecutora_id ?? 1,
    origen: plan.origen ?? 'formulado',
    tipo_periodo: plan.tipo_periodo ?? 'trimestral',
  })
  formError.value = ''
  showModal.value = true
}

function abrirEstructura(plan) {
  store.seleccionarPlan(plan.id)
  router.push({ name: 'dashboard-poa' })
}

function openAprobar(plan) {
  aprobando.value = plan
  aprobacion.resolucion_aprobacion = plan.resolucion_aprobacion ?? ''
  aprobacion.fecha_aprobacion = new Date().toISOString().slice(0, 10)
  aprobacionError.value = ''
  aprobacionCuadre.value = []
}

async function confirmarAprobacion() {
  saving.value = true
  aprobacionError.value = ''
  aprobacionCuadre.value = []
  try {
    await poaService.aprobarPlan(aprobando.value.id, { ...aprobacion })
    aprobando.value = null
    await store.fetchPlanes()
  } catch (e) {
    // El backend devuelve el detalle del descuadre en errors.cuadre.
    const cuadre = e.response?.data?.errors?.cuadre
    if (cuadre) {
      aprobacionError.value = e.response.data.message
      aprobacionCuadre.value = cuadre
    } else {
      aprobacionError.value = mensajeError(e, 'No se pudo aprobar el plan')
    }
  } finally {
    saving.value = false
  }
}

async function submitForm() {
  saving.value = true
  formError.value = ''
  try {
    const payload = { ...form }
    if (editing.value) {
      await poaService.updatePlan(editing.value.id, payload)
    } else {
      const plan = await poaService.createPlan(payload)
      store.seleccionarPlan(plan.id)
    }
    showModal.value = false
    await store.fetchPlanes()
  } catch (e) {
    formError.value = mensajeError(e, 'No se pudo guardar el plan')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  store.fetchUnidades()
  store.fetchPlanes()
})
</script>

<template>
  <section class="mt-8">
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="font-display text-2xl font-bold text-ink">Planes POA</h2>
        <p class="mt-1 text-sm text-slate-500">Un POA por gestión y unidad ejecutora. Se aprueba con resolución y congela la línea base de metas.</p>
      </div>
      <button v-if="store.puede('poa.crear')" class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-brand-600 hover:to-brand-700 hover:shadow-md" @click="openCreate">
        + Nuevo plan
      </button>
    </div>

    <div v-if="store.loading" class="py-16 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-r-transparent"></div>
    </div>

    <div v-else-if="store.error" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{{ store.error }}</div>

    <div v-else-if="store.planes.length" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="plan in store.planes" :key="plan.id" class="flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md" :class="plan.id === store.planId ? 'border-brand-300' : 'border-slate-100'">
        <div class="border-b border-slate-100 px-5 py-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <span class="font-mono text-xs font-bold text-slate-400">Gestión {{ plan.gestion_id }} · {{ plan.unidad_ejecutora ?? store.nombreUnidad(plan.unidad_ejecutora_id) }}</span>
              <h3 class="mt-1 font-display text-base font-bold text-ink">{{ plan.denominacion }}</h3>
            </div>
            <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" :class="[estado(plan).bg, estado(plan).text]">
              {{ estado(plan).label }}
            </span>
          </div>
        </div>
        <dl class="flex-1 space-y-2 px-5 py-4 text-sm">
          <div class="flex items-center justify-between">
            <dt class="text-slate-500">Periodicidad</dt>
            <dd class="font-semibold capitalize text-ink">{{ plan.tipo_periodo }} ({{ plan.cantidad_periodos }} periodos)</dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="text-slate-500">Origen</dt>
            <dd class="capitalize text-ink">{{ plan.origen }}</dd>
          </div>
          <div v-if="plan.resolucion_aprobacion" class="flex items-center justify-between">
            <dt class="text-slate-500">Resolución</dt>
            <dd class="text-ink">{{ plan.resolucion_aprobacion }}</dd>
          </div>
          <div v-if="plan.fecha_aprobacion" class="flex items-center justify-between">
            <dt class="text-slate-500">Aprobado el</dt>
            <dd class="text-ink">{{ String(plan.fecha_aprobacion).slice(0, 10) }}</dd>
          </div>
        </dl>
        <div class="flex flex-wrap items-center gap-2 border-t border-slate-100 px-5 py-3">
          <button class="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50" @click="abrirEstructura(plan)">Abrir estructura</button>
          <router-link v-if="plan.estado !== 'borrador'" :to="{ name: 'dashboard-poa-seguimiento' }" class="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100" @click="store.seleccionarPlan(plan.id)">Seguimiento</router-link>
          <template v-if="plan.estado === 'borrador' && store.puede('poa.editar')">
            <button class="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100" @click="handleEdit(plan)">Editar</button>
            <button class="rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50" @click="openAprobar(plan)">Aprobar</button>
          </template>
        </div>
      </div>
    </div>

    <div v-else class="py-16 text-center">
      <p class="text-sm font-medium text-slate-600">No hay planes registrados</p>
      <p class="mt-1 text-xs text-slate-400">Cree el POA de la gestión para empezar a formular actividades.</p>
    </div>

    <!-- Modal crear / editar -->
    <Teleport to="body">
      <Transition enter-active-class="duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="!saving && (showModal = false)"></div>
          <div class="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div class="border-b border-slate-100 px-6 py-5">
              <h3 class="font-display text-lg font-bold text-ink">{{ editing ? 'Editar plan' : 'Nuevo plan POA' }}</h3>
            </div>
            <form novalidate class="max-h-[70vh] overflow-y-auto p-6" @submit.prevent="submitForm">
              <div class="space-y-5">
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700">Denominación <span class="text-red-500">*</span></label>
                  <input v-model="form.denominacion" type="text" maxlength="240" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="POA 2027" :disabled="saving" />
                </div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-2 block text-sm font-semibold text-slate-700">Gestión (año) <span class="text-red-500">*</span></label>
                    <input v-model.number="form.gestion_id" type="number" min="2000" max="2100" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" :disabled="saving" />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-semibold text-slate-700">Unidad ejecutora <span class="text-red-500">*</span></label>
                    <select v-if="store.unidades.length" v-model.number="form.unidad_ejecutora_id" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" :disabled="saving">
                      <option v-for="u in store.unidades" :key="u.id" :value="u.id">{{ u.nombre }}</option>
                    </select>
                    <input v-else v-model.number="form.unidad_ejecutora_id" type="number" min="1" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" :disabled="saving" />
                  </div>
                </div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-2 block text-sm font-semibold text-slate-700">Periodicidad</label>
                    <select v-model="form.tipo_periodo" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" :disabled="saving">
                      <option v-for="(n, tipo) in periodos" :key="tipo" :value="tipo">{{ tipo[0].toUpperCase() + tipo.slice(1) }} ({{ n }} periodos)</option>
                    </select>
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-semibold text-slate-700">Origen</label>
                    <select v-model="form.origen" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" :disabled="saving">
                      <option value="formulado">Formulado en el sistema</option>
                      <option value="importado">Importado</option>
                    </select>
                  </div>
                </div>
              </div>
              <div v-if="formError" role="alert" class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ formError }}</div>
              <div class="mt-6 flex items-center justify-end gap-3">
                <button type="button" class="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100" :disabled="saving" @click="showModal = false">Cancelar</button>
                <button type="submit" class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-50" :disabled="saving || !form.denominacion || !form.gestion_id || !form.unidad_ejecutora_id">
                  <span v-if="saving" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></span>
                  {{ editing ? 'Guardar' : 'Crear plan' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal aprobar -->
    <Teleport to="body">
      <Transition enter-active-class="duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="aprobando" class="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="!saving && (aprobando = null)"></div>
          <div class="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div class="border-b border-slate-100 px-6 py-5">
              <h3 class="font-display text-lg font-bold text-ink">Aprobar {{ aprobando.denominacion }}</h3>
              <p class="mt-1 text-xs text-slate-500">Congela la línea base: después las metas solo cambian con una nueva versión y su motivo.</p>
            </div>
            <form novalidate class="max-h-[70vh] overflow-y-auto p-6" @submit.prevent="confirmarAprobacion">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700">Resolución <span class="text-red-500">*</span></label>
                  <input v-model="aprobacion.resolucion_aprobacion" type="text" maxlength="80" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="RA-001/2026" :disabled="saving" />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700">Fecha de aprobación</label>
                  <input v-model="aprobacion.fecha_aprobacion" type="date" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" :disabled="saving" />
                </div>
              </div>
              <div v-if="aprobacionError" role="alert" class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p class="font-semibold">{{ aprobacionError }}</p>
                <ul v-if="aprobacionCuadre.length" class="mt-2 list-disc space-y-1 pl-5 text-xs">
                  <li v-for="(linea, i) in aprobacionCuadre" :key="i">{{ linea }}</li>
                </ul>
              </div>
              <div class="mt-6 flex items-center justify-end gap-3">
                <button type="button" class="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100" :disabled="saving" @click="aprobando = null">Cancelar</button>
                <button type="submit" class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50" :disabled="saving || !aprobacion.resolucion_aprobacion.trim()">
                  <span v-if="saving" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></span>
                  Aprobar POA
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>
