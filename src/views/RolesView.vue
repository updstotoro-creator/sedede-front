<script setup>
import { ref, reactive, onMounted } from 'vue'
import { roleService } from '../services/roleService'

const roles = ref([])
const status = ref('idle') // idle | loading | error
const errorMessage = ref('')

const showModal = ref(false)
const editingRole = ref(null)
const formError = ref('')
const saving = ref(false)

const form = reactive({
  nombre: '',
  descripcion: '',
})

function resetForm() {
  form.nombre = ''
  form.descripcion = ''
  formError.value = ''
}

async function loadRoles() {
  status.value = 'loading'
  errorMessage.value = ''
  try {
    roles.value = await roleService.list()
    status.value = 'idle'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error.response?.data?.error || 'Error al cargar los roles.'
  }
}

function openCreateModal() {
  editingRole.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(role) {
  editingRole.value = role
  form.nombre = role.nombre
  form.descripcion = role.descripcion || ''
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingRole.value = null
}

async function submitForm() {
  saving.value = true
  formError.value = ''
  try {
    if (editingRole.value) {
      await roleService.update(editingRole.value.id, {
        nombre: form.nombre,
        descripcion: form.descripcion,
      })
    } else {
      await roleService.create({
        nombre: form.nombre,
        descripcion: form.descripcion,
      })
    }
    closeModal()
    await loadRoles()
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors
      formError.value = errors ? Object.values(errors).flat().join(' ') : 'Datos inválidos.'
    } else {
      formError.value = error.response?.data?.error || 'Error al guardar el rol.'
    }
  } finally {
    saving.value = false
  }
}

async function toggleActive(role) {
  try {
    await roleService.setActive(role.id, !role.activo)
    await loadRoles()
  } catch (error) {
    alert(error.response?.data?.error || 'Error al cambiar estado del rol.')
  }
}

onMounted(() => {
  loadRoles()
})
</script>

<template>
  <section class="mt-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="font-display text-xl font-bold text-ink">Gestión de Roles</h2>
        <p class="text-xs text-slate-500">Administra los roles del sistema y sus niveles de acceso</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">+ Nuevo Rol</button>
    </div>

    <div v-if="status === 'loading'" class="py-10 text-center text-sm text-slate-400">
      Cargando roles…
    </div>

    <div v-else-if="status === 'error'" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div v-else class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
          <tr>
            <th class="px-4 py-3">Nombre del Rol</th>
            <th class="px-4 py-3">Descripción</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="role in roles" :key="role.id" class="hover:bg-slate-50/50">
            <td class="px-4 py-3 font-semibold text-ink capitalize">{{ role.nombre }}</td>
            <td class="px-4 py-3 text-slate-600 max-w-xs truncate">{{ role.descripcion || '—' }}</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="role.activo ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ role.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button class="mr-3 text-xs font-semibold text-brand-600 hover:underline" @click="openEditModal(role)">
                Editar
              </button>
              <button
                class="text-xs font-semibold hover:underline"
                :class="role.activo ? 'text-red-600' : 'text-teal-700'"
                @click="toggleActive(role)"
              >
                {{ role.activo ? 'Desactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
          <tr v-if="!roles.length">
            <td colspan="4" class="px-4 py-8 text-center text-slate-400">No hay roles registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Crear / Editar -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">
          {{ editingRole ? 'Editar Rol' : 'Nuevo Rol' }}
        </h3>

        <form class="space-y-4" @submit.prevent="submitForm">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre del Rol</label>
            <input v-model="form.nombre" type="text" class="input-field" placeholder="ej. encargado_inventarios" required :disabled="saving" />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Descripción</label>
            <textarea v-model="form.descripcion" rows="3" class="input-field" placeholder="Descripción de las funciones del rol..." :disabled="saving"></textarea>
          </div>

          <div v-if="formError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700" :disabled="saving" @click="closeModal">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>