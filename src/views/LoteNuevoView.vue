<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useInventarioStore } from '../stores/inventario'

const router = useRouter()
const store = useInventarioStore()

const form = reactive({
  item_nombre: '',
  numero_lote: '',
  fecha_fabricacion: '',
  fecha_vencimiento: '',
  observaciones: '',
  activo: true,
})

const errorLote = ref('')

const nombresExistentes = computed(() =>
  [...new Set(store.lotes.map((l) => l.item_nombre).filter(Boolean))].sort()
)

watch([() => form.item_nombre, () => form.numero_lote], () => {
  errorLote.value = ''
})

function submitForm() {
  errorLote.value = ''

  const item = form.item_nombre.trim()
  const numero = form.numero_lote.trim()
  const duplicado = store.lotes.some(
    (l) =>
      (l.numero_lote ?? '').toLowerCase() === numero.toLowerCase() &&
      l.item_nombre === item
  )
  if (duplicado) {
    errorLote.value = 'Ya existe un lote con ese número para este ítem.'
    return
  }

  store.addLote({
    item_nombre: item,
    numero_lote: numero,
    fecha_fabricacion: form.fecha_fabricacion || null,
    fecha_vencimiento: form.fecha_vencimiento || null,
    observaciones: form.observaciones.trim() || null,
    stock: 0,
    activo: form.activo,
  })
  router.push({ name: 'dashboard-inventario-lotes' })
}

function cancelar() {
  router.push({ name: 'dashboard-inventario-lotes' })
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <!-- Encabezado -->
    <div class="mb-5">
      <h2 class="text-xl font-bold text-gray-800">Registrar Nuevo Lote</h2>
      <p class="mt-1 text-sm text-gray-500">
        Complete los datos del lote. Los campos marcados con
        <span class="text-red-600">*</span> son obligatorios.
      </p>
    </div>

    <!-- Formulario -->
    <form class="space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm" @submit.prevent="submitForm">
      <!-- Ítem -->
      <div>
        <label class="mb-1 block text-sm font-semibold text-gray-700">
          Ítem <span class="text-red-600">*</span>
        </label>
        <input
          v-model="form.item_nombre"
          type="text"
          list="items-lote"
          placeholder="— Seleccione o escriba un ítem —"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500"
        />
        <datalist id="items-lote">
          <option v-for="nombre in nombresExistentes" :key="nombre" :value="nombre" />
        </datalist>
        <p class="mt-1 text-xs text-gray-500">
          Aparecen como sugerencia los ítems existentes con control de lote habilitado.
        </p>
      </div>

      <!-- N° Lote -->
      <div>
        <label class="mb-1 block text-sm font-semibold text-gray-700">
          Número de Lote <span class="text-red-600">*</span>
        </label>
        <input
          v-model="form.numero_lote"
          type="text"
          placeholder="Ej: L-2026-015"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500"
        />
        <p v-if="errorLote" class="mt-1 text-xs font-semibold text-red-600">{{ errorLote }}</p>
        <p v-else class="mt-1 text-xs text-gray-500">Debe ser único por ítem.</p>
      </div>

      <!-- Fechas en 2 columnas -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-semibold text-gray-700">Fecha de Fabricación</label>
          <input
            v-model="form.fecha_fabricacion"
            type="date"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-semibold text-gray-700">Fecha de Vencimiento</label>
          <input
            v-model="form.fecha_vencimiento"
            type="date"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500"
          />
          <p class="mt-1 text-xs text-gray-500">Dejar vacío si el ítem no vence.</p>
        </div>
      </div>

      <!-- Observaciones -->
      <div>
        <label class="mb-1 block text-sm font-semibold text-gray-700">Observaciones</label>
        <textarea
          v-model="form.observaciones"
          rows="3"
          placeholder="Notas adicionales sobre el lote..."
          class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500"
        ></textarea>
      </div>

      <!-- Estado -->
      <div>
        <label class="flex cursor-pointer items-center gap-2">
          <input v-model="form.activo" type="checkbox" class="h-4 w-4 rounded text-red-600 focus:ring-red-500" />
          <span class="text-sm font-medium text-gray-700">Lote activo</span>
        </label>
        <p class="ml-6 mt-1 text-xs text-gray-500">
          Los lotes inactivos se muestran atenuados en el listado principal.
        </p>
      </div>

      <!-- Botones -->
      <div class="flex justify-end gap-3 border-t border-gray-100 pt-4">
        <button
          type="button"
          class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          @click="cancelar"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-800"
        >
          Guardar Lote
        </button>
      </div>
    </form>
  </div>
</template>
