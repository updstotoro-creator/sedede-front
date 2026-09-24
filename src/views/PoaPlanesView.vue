<script setup>
import { ref, reactive, onMounted } from 'vue'
import { usePoaStore } from '../stores/poa'

const store = usePoaStore()
const showModal = ref(false)
const editing = ref(null)
const saving = ref(false)

const form = reactive({
  denominacion: '',
  gestion_id: 2026,
  unidad_ejecutora_id: '',
  origen: '',
  tipo_periodo: 'mensual',
  cantidad_periodos: 12,
  resolucion_aprobacion: '',
})

const estadoConfig = {
  borrador: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Borrador' },
  aprobado: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Aprobado' },
}

function openCreate() {
  editing.value = null
  form.denominacion = ''
  form.gestion_id = 2026
  form.unidad_ejecutora_id = ''
  form.origen = ''
  form.tipo_periodo = 'mensual'
  form.cantidad_periodos = 12
  form.resolucion_aprobacion = ''
  showModal.value = true
}

function handleEdit(plan) {
  editing.value = plan
  form.denominacion = plan.denominacion ?? ''
  form.gestion_id = plan.gestion_id ?? 2026
  form.unidad_ejecutora_id = plan.unidad_ejecutora_id ?? ''
  form.origen = plan.origen ?? ''
  form.tipo_periodo = plan.tipo_periodo ?? 'mensual'
  form.cantidad_periodos = plan.cantidad_periodos ?? 12
  form.resolucion_aprobacion = plan.resolucion_aprobacion ?? ''
  showModal.value = true
}

async function handleAprobar(plan) {
  if (!confirm(`Aprobar el plan "${plan.denominacion}"?`)) return
  await store.aprobarPlan(plan.id)
  await store.fetchPlanes()
}

async function submitForm() {
  saving.value = true
  try {
    const payload = {
      denominacion: form.denominacion,
      gestion_id: form.gestion_id,
      unidad_ejecutora_id: form.unidad_ejecutora_id,
      origen: form.origen || undefined,
      tipo_periodo: form.tipo_periodo,
      cantidad_periodos: form.cantidad_periodos,
      resolucion_aprobacion: form.resolucion_aprobacion || undefined,
    }
    if (editing.value) {
      await store.updatePlan(editing.value.id, payload)
    } else {
      await store.createPlan(payload)
    }
    showModal.value = false
    await store.fetchPlanes()
  } catch {
    // Los errores del store ya quedan registrados en store.error
  } finally {
    saving.value = false
  }
}

onMounted(() => { store.fetchPlanes() })
</script>

<template>
  <section class="mt-8">
    <div class="mb-8 flex items-start justify-between">
      <div>
        <h2 class="font-display text-2xl font-bold text-ink">Planes POA</h2>
        <p class="mt-1 text-sm text-slate-500">Gestion de planes operativos anuales</p>
      </div>
      <button class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-brand-600 hover:to-brand-700 hover:shadow-md" @click="openCreate">
        + Nuevo plan
      </button>
    </div>

    <div v-if="store.loading" class="py-16 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-r-transparent"></div>
    </div>

    <div v-else-if="store.error" class="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{{ store.error }}</div>

    <div v-else-if="store.planes.length" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="plan in store.planes" :key="plan.id" class="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md">
        <div class="border-b border-slate-100 px-5 py-4">
          <div class="flex items-start justify-between">
            <div>
              <span class="font-mono text-xs font-bold text-slate-400">Gestion {{ plan.gestion_id }}</span>
              <h3 class="mt-1 font-display text-base font-bold text-ink">{{ plan.denominacion }}</h3>
            </div>
            <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="(estadoConfig[plan.estado] ?? estadoConfig.borrador).bg + ' ' + (estadoConfig[plan.estado] ?? estadoConfig.borrador).text">
              {{ (estadoConfig[plan.estado] ?? estadoConfig.borrador).label }}
            </span>
          </div>
        </div>
        <div class="space-y-2 px-5 py-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-500">Tipo de periodo</span>
            <span class="font-semibold text-ink">{{ plan.tipo_periodo ?? '-' }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-500">Cantidad periodos</span>
            <span class="font-semibold text-ink">{{ plan.cantidad_periodos ?? '-' }}</span>
          </div>
          <div v-if="plan.origen" class="flex items-center justify-between text-sm">
            <span class="text-slate-500">Origen</span>
            <span class="text-ink">{{ plan.origen }}</span>
          </div>
          <div v-if="plan.resolucion_aprobacion" class="flex items-center justify-between text-sm">
            <span class="text-slate-500">Resolucion</span>
            <span class="text-ink">{{ plan.resolucion_aprobacion }}</span>
          </div>
        </div>
        <div class="border-t border-slate-100 px-5 py-3 opacity-0 transition-opacity group-hover:opacity-100">
          <div class="flex items-center gap-2">
            <button class="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100" @click="handleEdit(plan)">Editar</button>
            <button v-if="plan.estado === 'borrador'" class="rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50" @click="handleAprobar(plan)">Aprobar</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="py-16 text-center">
      <p class="text-sm font-medium text-slate-600">No hay planes registrados</p>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition enter-active-class="duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showModal = false"></div>
          <div class="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div class="border-b border-slate-100 px-6 py-5">
              <h3 class="font-display text-lg font-bold text-ink">{{ editing ? 'Editar Plan' : 'Nuevo Plan POA' }}</h3>
            </div>
            <form novalidate class="max-h-[60vh] overflow-y-auto p-6" @submit.prevent="submitForm">
              <div class="space-y-5">
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700">Denominacion <span class="text-red-500">*</span></label>
                  <input v-model="form.denominacion" type="text" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="Nombre del plan" required :disabled="saving" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="mb-2 block text-sm font-semibold text-slate-700">Gestion</label>
                    <input v-model.number="form.gestion_id" type="number" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" :disabled="saving" />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-semibold text-slate-700">Unidad Ejecutora ID <span class="text-red-500">*</span></label>
                    <input v-model.number="form.unidad_ejecutora_id" type="number" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="ID unidad ejecutora" required :disabled="saving" />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="mb-2 block text-sm font-semibold text-slate-700">Tipo de Periodo</label>
                    <select v-model="form.tipo_periodo" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" :disabled="saving">
                      <option value="mensual">Mensual</option>
                      <option value="bimestral">Bimestral</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-semibold text-slate-700">Cantidad Periodos</label>
                    <input v-model.number="form.cantidad_periodos" type="number" min="1" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" :disabled="saving" />
                  </div>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700">Origen</label>
                  <input v-model="form.origen" type="text" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="Ej: Direccion General" :disabled="saving" />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-semibold text-slate-700">Resolucion de Aprobacion</label>
                  <input v-model="form.resolucion_aprobacion" type="text" class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="Numero de resolucion" :disabled="saving" />
                </div>
              </div>
              <div class="mt-6 flex items-center justify-end gap-3">
                <button type="button" class="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100" :disabled="saving" @click="showModal = false">Cancelar</button>
                <button type="submit" class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-50" :disabled="saving || !form.denominacion">
                  <span v-if="saving" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></span>
                  {{ editing ? 'Guardar' : 'Crear Plan' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>
