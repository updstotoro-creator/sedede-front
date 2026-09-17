<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  tipo: { type: String, default: 'programa' },
  editing: { type: Object, default: null },
})

const emit = defineEmits(['close', 'submit'])

const form = reactive({
  codigo: '',
  denominacion: '',
  estado: 'borrador',
})

watch(
  () => props.editing,
  (val) => {
    if (val) {
      form.codigo = val.codigo ?? ''
      form.denominacion = val.denominacion ?? ''
      form.estado = val.estado ?? 'borrador'
    } else {
      form.codigo = ''
      form.denominacion = ''
      form.estado = 'borrador'
    }
  },
  { immediate: true }
)

function close() {
  emit('close')
}

function submit() {
  emit('submit', {
    codigo: form.codigo,
    denominacion: form.denominacion,
    estado: form.estado,
  })
}

const titulo = {
  programa: 'Programa',
  proyecto: 'Proyecto',
  actividad: 'Actividad',
  indicador: 'Indicador',
  meta: 'Meta',
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
      <h3 class="mb-4 font-display text-lg font-bold text-ink">
        {{ editing ? `Editar ${titulo[tipo]}` : `Nuevo ${titulo[tipo]}` }}
      </h3>

      <form novalidate class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-600">Código</label>
          <input v-model="form.codigo" type="text" class="input-field" required />
        </div>

        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-600">Denominación</label>
          <input v-model="form.denominacion" type="text" class="input-field" required />
        </div>

        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-600">Estado</label>
          <select v-model="form.estado" class="input-field">
            <option value="borrador">Borrador</option>
            <option value="vigente">Vigente</option>
            <option value="aprobado">Aprobado</option>
            <option value="anulada">Anulada</option>
          </select>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500" @click="close">
            Cancelar
          </button>
          <button type="submit" class="btn-primary">
            {{ editing ? 'Guardar' : 'Crear' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
