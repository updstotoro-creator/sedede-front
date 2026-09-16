<script setup>
import { reactive, ref, computed } from 'vue'
import { useInventarioStore } from '../stores/inventario'

const store = useInventarioStore()

const naturalezas = [
  { value: 'consumible', label: 'Consumible' },
  { value: 'activo_fijo', label: 'Activo fijo' },
  { value: 'herramienta', label: 'Herramienta' },
]

const showModal = ref(false)
const editing = ref(null)
const form = reactive({
  codigo: '',
  nombre: '',
  descripcion: '',
  padre_id: '',
  naturaleza: 'consumible',
  controla_lote: false,
  controla_vencimiento: false,
})

// Para el <select> de "tipo padre", nunca puede ser el mismo que se edita
const opcionesPadre = computed(() =>
  store.tiposItem.filter((t) => !editing.value || t.id !== editing.value.id)
)

function resetForm() {
  form.codigo = ''
  form.nombre = ''
  form.descripcion = ''
  form.padre_id = ''
  form.naturaleza = 'consumible'
  form.controla_lote = false
  form.controla_vencimiento = false
}

function openCreateModal() {
  editing.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(tipo) {
  editing.value = tipo
  form.codigo = tipo.codigo
  form.nombre = tipo.nombre
  form.descripcion = tipo.descripcion ?? ''
  form.padre_id = tipo.padre_id ?? ''
  form.naturaleza = tipo.naturaleza
  form.controla_lote = tipo.controla_lote
  form.controla_vencimiento = tipo.controla_vencimiento
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
}

function submitForm() {
  const payload = { ...form, padre_id: form.padre_id ? Number(form.padre_id) : null }
  if (editing.value) {
    store.updateTipoItem(editing.value.id, payload)
  } else {
    store.addTipoItem(payload)
  }
  closeModal()
}

const naturalezaLabel = (value) => naturalezas.find((n) => n.value === value)?.label ?? value
</script>

<template>
  <section>
    <div class="mb-6 flex items-center justify-between">
      <p class="text-sm text-slate-500">Catálogo jerárquico de tipos de ítem del inventario.</p>
      <button class="btn-primary" @click="openCreateModal">+ Nuevo tipo</button>
    </div>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Código</th>
            <th class="px-4 py-3">Nombre / Jerarquía</th>
            <th class="px-4 py-3">Naturaleza</th>
            <th class="px-4 py-3">Controla</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="tipo in store.tiposItem" :key="tipo.id">
            <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ tipo.codigo }}</td>
            <td class="px-4 py-3">
              <p class="font-medium text-ink">{{ tipo.nombre }}</p>
              <p class="text-xs text-slate-400">{{ store.tipoRutaCompleta(tipo.id) }}</p>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ naturalezaLabel(tipo.naturaleza) }}</td>
            <td class="px-4 py-3 text-xs text-slate-500">
              <span v-if="tipo.controla_lote">Lote</span>
              <span v-if="tipo.controla_lote && tipo.controla_vencimiento"> · </span>
              <span v-if="tipo.controla_vencimiento">Vencimiento</span>
              <span v-if="!tipo.controla_lote && !tipo.controla_vencimiento">—</span>
            </td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="tipo.activo ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'">
                {{ tipo.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button class="mr-3 text-xs font-semibold text-slate-500 hover:underline" @click="openEditModal(tipo)">Editar</button>
              <button
                class="text-xs font-semibold hover:underline"
                :class="tipo.activo ? 'text-red-600' : 'text-teal-700'"
                @click="store.toggleTipoItemActivo(tipo.id)"
              >
                {{ tipo.activo ? 'Inactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="mt-4 text-xs text-slate-400">
      Vista funcional con datos en memoria — el backend aún no expone rutas para este módulo.
    </p>

    <!-- Modal crear/editar -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">{{ editing ? 'Editar tipo de ítem' : 'Nuevo tipo de ítem' }}</h3>
        <form novalidate class="space-y-4" @submit.prevent="submitForm">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Código</label>
              <input v-model="form.codigo" type="text" class="input-field" required />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Naturaleza</label>
              <select v-model="form.naturaleza" class="input-field">
                <option v-for="n in naturalezas" :key="n.value" :value="n.value">{{ n.label }}</option>
              </select>
            </div>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre</label>
            <input v-model="form.nombre" type="text" class="input-field" required />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Descripción</label>
            <input v-model="form.descripcion" type="text" class="input-field" />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Tipo padre (opcional)</label>
            <select v-model="form.padre_id" class="input-field">
              <option value="">— Ninguno (categoría raíz) —</option>
              <option v-for="opcion in opcionesPadre" :key="opcion.id" :value="opcion.id">{{ store.tipoRutaCompleta(opcion.id) }}</option>
            </select>
          </div>
          <div class="flex gap-6">
            <label class="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input v-model="form.controla_lote" type="checkbox" class="rounded border-slate-300" />
              Controla lote
            </label>
            <label class="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input v-model="form.controla_vencimiento" type="checkbox" class="rounded border-slate-300" />
              Controla vencimiento
            </label>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
