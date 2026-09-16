<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAsociacionesStore } from '../stores/asociaciones'

const router = useRouter()
const store = useAsociacionesStore()

const showModal = ref(false)
const editing = ref(null) // null = creando, objeto = editando
const form = reactive({ nombre: '', disciplina: '', presidente: '' })

function verClubes(asociacion) {
  router.push(`/dashboard/asociaciones/${asociacion.id}`)
}

function openCreateModal() {
  editing.value = null
  form.nombre = ''
  form.disciplina = ''
  form.presidente = ''
  showModal.value = true
}

function openEditModal(asociacion) {
  editing.value = asociacion
  form.nombre = asociacion.nombre
  form.disciplina = asociacion.disciplina
  form.presidente = asociacion.presidente
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = null
}

function submitForm() {
  if (editing.value) {
    store.updateAsociacion(editing.value.id, { ...form })
  } else {
    store.addAsociacion({ ...form })
  }
  closeModal()
}
</script>

<template>
  <section>
    <div class="mb-6 flex items-center justify-between">
      <p class="text-sm text-slate-500">Padrón de asociaciones deportivas del departamento.</p>
      <button class="btn-primary" @click="openCreateModal">+ Nueva asociación</button>
    </div>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Asociación</th>
            <th class="px-4 py-3">Disciplina</th>
            <th class="px-4 py-3">Presidente</th>
            <th class="px-4 py-3">Clubes</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="asociacion in store.asociaciones" :key="asociacion.id">
            <td class="px-4 py-3 font-medium text-ink">{{ asociacion.nombre }}</td>
            <td class="px-4 py-3 text-slate-600">{{ asociacion.disciplina }}</td>
            <td class="px-4 py-3 text-slate-600">{{ asociacion.presidente }}</td>
            <td class="px-4 py-3 text-slate-600">{{ asociacion.clubes.length }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="asociacion.activo ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'">
                {{ asociacion.activo ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button class="mr-3 text-xs font-semibold text-brand-600 hover:underline" @click="verClubes(asociacion)">Ver clubes</button>
              <button class="mr-3 text-xs font-semibold text-slate-500 hover:underline" @click="openEditModal(asociacion)">Editar</button>
              <button
                class="text-xs font-semibold hover:underline"
                :class="asociacion.activo ? 'text-red-600' : 'text-teal-700'"
                @click="store.toggleAsociacionActivo(asociacion.id)"
              >
                {{ asociacion.activo ? 'Inactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
          <tr v-if="!store.asociaciones.length">
            <td colspan="6" class="px-4 py-8 text-center text-slate-400">No hay asociaciones registradas.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="mt-4 text-xs text-slate-400">
      Vista funcional con datos en memoria — la conexión con el backend real se agrega cuando exponga las rutas de asociaciones.
    </p>

    <!-- Modal crear/editar asociación -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">
          {{ editing ? 'Editar asociación' : 'Nueva asociación' }}
        </h3>
        <form novalidate class="space-y-4" @submit.prevent="submitForm">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre</label>
            <input v-model="form.nombre" type="text" class="input-field" required />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Disciplina</label>
            <input v-model="form.disciplina" type="text" class="input-field" required />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Presidente</label>
            <input v-model="form.presidente" type="text" class="input-field" required />
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

