<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePoaStore } from '../stores/poa'
import { poaService, mensajeError } from '../services/poaService'
import PoaTree from '../components/poa/PoaTree.vue'
import PoaModal from '../components/poa/PoaModal.vue'
import PoaPlanSelector from '../components/poa/PoaPlanSelector.vue'

const store = usePoaStore()

const showModal = ref(false)
const modalTipo = ref('programa')
const editing = ref(null)
const childInfo = ref(null)
const saving = ref(false)
const formError = ref('')
const accionError = ref('')

const bloqueado = computed(() => !!store.planActivo && !store.planEditable)
const soloLectura = computed(() => !store.puede('poa.crear') && !store.puede('poa.editar'))

function abrirModal(tipo, { nodo = null, hijo = null } = {}) {
  modalTipo.value = tipo
  editing.value = nodo
  childInfo.value = hijo
  formError.value = ''
  showModal.value = true
}

function openCreatePrograma() {
  abrirModal('programa')
}

function handleEdit(node) {
  abrirModal(node.type, { nodo: node })
}

function handleAddChild({ parent, tipo, label }) {
  abrirModal(tipo, { hijo: { parent, tipo, label } })
}

const servicios = {
  programa: { create: poaService.createPrograma, update: poaService.updatePrograma, delete: poaService.deletePrograma },
  proyecto: { create: poaService.createProyecto, update: poaService.updateProyecto, delete: poaService.deleteProyecto },
  actividad: { create: poaService.createActividad, update: poaService.updateActividad, delete: poaService.deleteActividad },
  indicador: { create: poaService.createIndicador, update: poaService.updateIndicador, delete: poaService.deleteIndicador },
}

async function handleDelete(node) {
  if (!confirm(`¿Eliminar ${node.type} "${node.denominacion}"?`)) return
  accionError.value = ''
  try {
    await servicios[node.type].delete(node.id)
    await store.fetchArbol()
  } catch (e) {
    accionError.value = mensajeError(e, 'No se pudo eliminar el elemento')
  }
}

function closeModal() {
  showModal.value = false
  editing.value = null
  childInfo.value = null
}

// Llaves del padre según el tipo que se crea. Una actividad necesita además
// el plan y el programa: el backend toma la gestión del plan.
function payloadHijo(tipo, parent) {
  if (tipo === 'proyecto') return { programa_id: parent.id }
  if (tipo === 'indicador') return { actividad_id: parent.id }
  if (tipo === 'actividad') {
    return parent.type === 'proyecto'
      ? { plan_id: store.planId, programa_id: parent.programa_id, proyecto_id: parent.id }
      : { plan_id: store.planId, programa_id: parent.id }
  }
  return {}
}

async function submitForm(data) {
  saving.value = true
  formError.value = ''
  try {
    const servicio = servicios[modalTipo.value]
    if (editing.value) {
      await servicio.update(editing.value.id, data)
    } else {
      const extra = childInfo.value ? payloadHijo(modalTipo.value, childInfo.value.parent) : {}
      await servicio.create({ ...data, ...extra })
    }
    closeModal()
    await store.fetchArbol()
  } catch (e) {
    formError.value = mensajeError(e, 'No se pudo guardar')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  store.fetchUnidades()
  await store.fetchPlanes()
  await store.fetchArbol()
})
</script>

<template>
  <section class="mt-8">
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="font-display text-2xl font-bold text-ink">Estructura POA</h2>
        <p class="mt-1 text-sm text-slate-500">Programa &rarr; Proyecto &rarr; Actividad &rarr; Indicador</p>
      </div>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <PoaPlanSelector @change="store.fetchArbol()" />
        <button
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-brand-600 hover:to-brand-700 hover:shadow-md disabled:opacity-50"
          v-if="store.puede('poa.crear')"
          :disabled="!store.planActivo"
          @click="openCreatePrograma"
        >
          + Nuevo programa
        </button>
      </div>
    </div>

    <div v-if="!store.loading && !store.planes.length" class="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
      Primero registre un plan en
      <router-link :to="{ name: 'dashboard-poa-planes' }" class="font-semibold underline">Planes POA</router-link>:
      las actividades se formulan dentro de un plan.
    </div>

    <div v-if="bloqueado" class="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">
      Este plan está {{ store.planActivo.estado }}: su línea base está congelada. Las metas se cambian registrando una nueva versión desde el detalle de cada actividad.
    </div>

    <div v-if="accionError" role="alert" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
      {{ accionError }}
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="py-16 text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-r-transparent"></div>
      <p class="mt-3 text-sm text-slate-500">Cargando estructura POA…</p>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
      {{ store.error }}
    </div>

    <!-- Tree -->
    <div v-else class="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
      <PoaTree
        :programas="store.arbol"
        :bloqueado="bloqueado"
        :solo-lectura="soloLectura"
        @edit="handleEdit"
        @add-child="handleAddChild"
        @delete="handleDelete"
      />
    </div>

    <!-- Modal -->
    <PoaModal
      :show="showModal"
      :tipo="modalTipo"
      :editing="editing"
      :saving="saving"
      :child-info="childInfo"
      :error="formError"
      :gestion-id="store.planActivo?.gestion_id ?? null"
      :unidades="store.unidades"
      @close="closeModal"
      @submit="submitForm"
    />
  </section>
</template>
