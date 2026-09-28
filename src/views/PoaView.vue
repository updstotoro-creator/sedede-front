<script setup>
import { ref, onMounted } from 'vue'
import { usePoaStore } from '../stores/poa'
import PoaTree from '../components/poa/PoaTree.vue'
import PoaModal from '../components/poa/PoaModal.vue'

const store = usePoaStore()

const showModal = ref(false)
const modalTipo = ref('programa')
const editing = ref(null)
const childInfo = ref(null)
const saving = ref(false)

function openCreatePrograma() {
  editing.value = null
  childInfo.value = null
  modalTipo.value = 'programa'
  showModal.value = true
}

function handleEdit(node) {
  editing.value = node
  childInfo.value = null
  modalTipo.value = node.type
  showModal.value = true
}

function handleAddChild({ parent, tipo, label }) {
  editing.value = null
  childInfo.value = { parent, tipo, label }
  modalTipo.value = tipo
  showModal.value = true
}

function handleDelete(node) {
  if (!confirm(`¿Eliminar ${node.type} "${node.denominacion}"?`)) return
  const deleteMap = {
    programa: () => store.deletePrograma(node.id),
    proyecto: () => store.deleteProyecto(node.id),
    actividad: () => store.deleteActividad(node.id),
    indicador: () => store.deleteIndicador(node.id),
  }
  if (deleteMap[node.type]) {
    deleteMap[node.type].then(() => store.fetchArbol())
  }
}

function closeModal() {
  showModal.value = false
  editing.value = null
  childInfo.value = null
  store.setError(null)
}

async function submitForm(data) {
  saving.value = true
  try {
    if (editing.value) {
      const updateMap = {
        programa: () => store.updatePrograma(editing.value.id, data),
        proyecto: () => store.updateProyecto(editing.value.id, data),
        actividad: () => store.updateActividad(editing.value.id, data),
        indicador: () => store.updateIndicador(editing.value.id, data),
      }
      if (updateMap[modalTipo.value]) {
        await updateMap[modalTipo.value]()
      }
    } else {
      const payload = { ...data }
      if (childInfo.value) {
        const parentKey = {
          proyecto: 'programa_id',
          actividad: 'proyecto_id',
          indicador: 'actividad_id',
          meta: 'indicador_id',
        }
        if (parentKey[modalTipo.value]) {
          payload[parentKey[modalTipo.value]] = childInfo.value.parent.id
        }
      }
      const createMap = {
        programa: () => store.createPrograma(payload),
        proyecto: () => store.createProyecto(payload),
        actividad: () => store.createActividad(payload),
        indicador: () => store.createIndicador(payload),
        meta: () => store.createMeta(payload),
      }
      if (createMap[modalTipo.value]) {
        await createMap[modalTipo.value]()
      }
    }
    closeModal()
    await store.fetchArbol()
  } catch {
    // store.error ya contiene el mensaje
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  store.fetchArbol()
})
</script>

<template>
  <section class="mt-8">
    <!-- Header -->
    <div class="mb-8 flex items-start justify-between">
      <div>
        <h2 class="font-display text-2xl font-bold text-ink">Estructura POA</h2>
        <p class="mt-1 text-sm text-slate-500">Programa &rarr; Proyecto &rarr; Actividad &rarr; Indicador &rarr; Meta</p>
      </div>
      <button 
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-brand-600 hover:to-brand-700 hover:shadow-md"
        @click="openCreatePrograma"
      >
        + Nuevo programa
      </button>
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
    <div v-else class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <PoaTree
        :programas="store.arbol"
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
      :error="store.error"
      @close="closeModal"
      @submit="submitForm"
    />
  </section>
</template>
