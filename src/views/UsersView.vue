<script setup>
import { ref, reactive, onMounted } from 'vue'
import { userService } from '../services/userService'
import { roleService } from '../services/roleService'
import PasswordRequisitos from '../components/common/PasswordRequisitos.vue'
import { errorPasswordConConfirmacion } from '../utils/validaciones'

const users = ref([])
const roles = ref([])
const meta = ref(null)
const currentPage = ref(1)

const status = ref('idle') // idle | loading | error
const errorMessage = ref('')

const showModal = ref(false)
const editingUser = ref(null) // null = creando, objeto = editando
const formError = ref('')
const saving = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role_id: '',
})

function resetForm() {
  form.name = ''
  form.email = ''
  form.password = ''
  form.password_confirmation = ''
  form.role_id = ''
  formError.value = ''
}

async function loadUsers(page = 1) {
  status.value = 'loading'
  errorMessage.value = ''
  try {
    const { items, meta: pageMeta } = await userService.list(page)
    users.value = items
    meta.value = pageMeta
    currentPage.value = page
    status.value = 'idle'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = mapListError(error)
  }
}

async function loadRoles() {
  try {
    roles.value = await roleService.list()
  } catch {
    // La lista de roles es secundaria: si falla, el select queda vacío
    // pero no bloqueamos el listado de usuarios por esto.
    roles.value = []
  }
}

function mapListError(error) {
  if (error.response?.status === 403) {
    return 'No tienes permisos para ver los usuarios.'
  }
  if (!error.response) {
    return 'No se pudo conectar con el servidor.'
  }
  return 'Ocurrió un error al cargar los usuarios.'
}

function openCreateModal() {
  editingUser.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(user) {
  editingUser.value = user
  form.name = user.name
  form.email = user.email
  form.password = ''
  form.password_confirmation = ''
  form.role_id = user.role_id ?? user.role?.id ?? ''
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingUser.value = null
}

async function submitForm() {
  formError.value = ''

  // Al crear, la contraseña cumple la política antes de enviar (el servidor la vuelve a validar).
  if (!editingUser.value) {
    const errPassword = errorPasswordConConfirmacion(form.password, form.password_confirmation)
    if (errPassword) {
      formError.value = errPassword
      return
    }
  }

  saving.value = true
  try {
    if (editingUser.value) {
      const payload = {
        name: form.name,
        email: form.email,
        role_id: form.role_id,
      }
      await userService.update(editingUser.value.id, payload)
    } else {
      await userService.create({
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        role_id: form.role_id,
      })
    }
    closeModal()
    await loadUsers(currentPage.value)
  } catch (error) {
    formError.value = mapFormError(error)
  } finally {
    saving.value = false
  }
}

function mapFormError(error) {
  const status = error.response?.status
  if (status === 422) {
    const errors = error.response.data?.errors
    if (errors) {
      return Object.values(errors).flat().join(' ')
    }
    return 'Revisa los datos ingresados.'
  }
  if (status === 403) {
    return 'No tienes permisos para esta acción.'
  }
  if (!error.response) {
    return 'No se pudo conectar con el servidor.'
  }
  return 'Ocurrió un error al guardar. Intenta nuevamente.'
}

async function toggleActive(user) {
  try {
    await userService.setActive(user.id, !user.activo)
    await loadUsers(currentPage.value)
  } catch (error) {
    errorMessage.value = mapListError(error)
  }
}

onMounted(() => {
  loadUsers()
  loadRoles()
})
</script>

<template>
  <section class="mt-8">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="font-display text-xl font-bold text-ink">Usuarios</h2>
      <button class="btn-primary" @click="openCreateModal">+ Nuevo usuario</button>
    </div>

    <div v-if="status === 'loading'" class="py-10 text-center text-sm text-slate-400">
      Cargando usuarios…
    </div>

    <div v-else-if="status === 'error'" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div v-else class="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Nombre</th>
            <th class="px-4 py-3">Correo</th>
            <th class="px-4 py-3">Rol</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="user in users" :key="user.id">
            <td class="px-4 py-3 font-medium text-ink">{{ user.name }}</td>
            <td class="px-4 py-3 text-slate-600">{{ user.email }}</td>
            <td class="px-4 py-3 text-slate-600">{{ user.role?.nombre ?? '—' }}</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="user.activo ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ user.activo ? 'Activo' : 'Desactivado' }}
              </span>
            </td>
            <td class="px-3 py-2 text-center whitespace-nowrap">
              <div class="inline-flex items-center gap-0.5 rounded-lg border border-slate-200/80 bg-slate-50/90 p-0.5 shadow-2xs">
                <!-- 1. Editar -->
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-2xs transition"
                  title="Editar datos del usuario"
                  @click="openEditModal(user)"
                >
                  <span class="text-slate-500">✏️</span>
                  <span>Editar</span>
                </button>

                <!-- 2. Desactivar / Activar (Baja Lógica) -->
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold hover:bg-white hover:shadow-2xs transition"
                  :class="user.activo ? 'text-rose-600 hover:text-rose-700' : 'text-teal-600 hover:text-teal-700'"
                  :title="user.activo ? 'Desactivar acceso del usuario' : 'Activar acceso del usuario'"
                  @click="toggleActive(user)"
                >
                  <span>{{ user.activo ? '🚫' : '✓' }}</span>
                  <span>{{ user.activo ? 'Baja' : 'Activar' }}</span>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!users.length">
            <td colspan="5" class="px-4 py-8 text-center text-slate-400">No hay usuarios registrados.</td>
          </tr>
        </tbody>
      </table>

      <div v-if="meta" class="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <span>Página {{ meta.current_page }} de {{ Math.ceil(meta.total / meta.per_page) || 1 }} · {{ meta.total }} usuarios</span>
        <div class="flex gap-2">
          <button
            class="rounded border border-slate-200 px-2.5 py-1 disabled:opacity-40"
            :disabled="meta.current_page <= 1"
            @click="loadUsers(meta.current_page - 1)"
          >
            Anterior
          </button>
          <button
            class="rounded border border-slate-200 px-2.5 py-1 disabled:opacity-40"
            :disabled="meta.current_page * meta.per_page >= meta.total"
            @click="loadUsers(meta.current_page + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Modal crear/editar -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">
          {{ editingUser ? 'Editar usuario' : 'Nuevo usuario' }}
        </h3>

        <form novalidate class="space-y-4" @submit.prevent="submitForm">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre</label>
            <input v-model="form.name" type="text" class="input-field" required :disabled="saving" />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Correo</label>
            <input v-model="form.email" type="email" class="input-field" required :disabled="saving" />
          </div>

          <template v-if="!editingUser">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Contraseña</label>
              <input v-model="form.password" type="password" autocomplete="new-password" class="input-field" required :disabled="saving" />
              <PasswordRequisitos :valor="form.password" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Confirmar contraseña</label>
              <input v-model="form.password_confirmation" type="password" class="input-field" required :disabled="saving" />
            </div>
          </template>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Rol</label>
            <select v-model="form.role_id" class="input-field" required :disabled="saving">
              <option value="" disabled>Selecciona un rol</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.nombre }}</option>
            </select>
          </div>

          <div v-if="formError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500" :disabled="saving" @click="closeModal">
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
