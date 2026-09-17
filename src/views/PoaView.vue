<script setup>
import { ref, reactive, onMounted } from 'vue'
import { usePoaStore } from '../stores/poa'
import PoaTree from '../components/poa/PoaTree.vue'
import PoaModal from '../components/poa/PoaModal.vue'

const store = usePoaStore()

const showModal = ref(false)
const modalTipo = ref('programa')
const editing = ref(null)
const childInfo = ref(null)
const saving = ref(false)

async function loadAll() {
  await Promise.all([
    store.fetchProgramas(),
    store.fetchProyectos(),
    store.fetchActividades(),
  ])
}

function openCreatePrograma() {
  editing.value = null
  childInfo.value = null
  modalTipo.value = 'programa'
  showModal.value = true
}

function handleEdit(node) {
  const typeMap = {
    programa: 'programa',
    proyecto: 'proyecto',
    actividad: 'actividad',
    indicador: 'indicador',
  }
  editing.value = node
  childInfo.value = null
  modalTipo.value = typeMap[node.type] ?? 'programa'
  showModal.value = true
}

function handleAddChild({ parent, tipo, label }) {
  editing.value = null
  childInfo.value = { parent, tipo, label }
  modalTipo.value = tipo
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
  childInfo.value = null
}

async function submitForm(data) {
  saving.value = true
  try {
    if (editing.value) {
      await store[`update${capitalize(modalTipo.value)}`](editing.value.id, data)
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
      await store[`create${capitalize(modalTipo.value)}`](payload)
    }
    closeModal()
    await loadAll()
  } catch {
    // store.error ya contiene el mensaje
  } finally {
    saving.value = false
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

onMounted(() => {
  loadAll()
})
</script>

<template>
  <section class="mt-8">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="font-display text-xl font-bold text-ink">Estructura POA</h2>
      <button class="btn-primary" @click="openCreatePrograma">+ Nuevo programa</button>
    </div>

    <div v-if="store.loading" class="py-10 text-center text-sm text-slate-400">
      Cargando estructura POA…
    </div>

    <div v-else-if="store.error" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ store.error }}
    </div>

    <div v-else class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <PoaTree
        :programas="store.programas"
        @edit="handleEdit"
        @add-child="handleAddChild"
      />
    </div>

    <PoaModal
      :show="showModal"
      :tipo="modalTipo"
      :editing="editing"
      @close="closeModal"
      @submit="submitForm"
    />
  </section>
</template>
