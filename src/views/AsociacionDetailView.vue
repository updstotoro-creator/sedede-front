<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { asociacionService } from '../services/asociacionService'

const route = useRoute()
const router = useRouter()
const store = useAsociacionesStore()

const asociacionId = route.params.asociacionId
const asociacion = ref(null)
const clubes = ref([])
const status = ref('loading')
const errorMessage = ref('')

const showModal = ref(false)
const editingClub = ref(null)
const formError = ref('')
const saving = ref(false)

const form = reactive({
  nombre: '',
  sigla: '',
  personeria_juridica: '',
})

function resetForm() {
  form.nombre = ''
  form.sigla = ''
  form.personeria_juridica = ''
  formError.value = ''
}

async function loadData() {
  status.value = 'loading'
  errorMessage.value = ''
  try {
    asociacion.value = await asociacionService.get(asociacionId)
    clubes.value = await asociacionService.listClubes(asociacionId)
    status.value = 'idle'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error.response?.data?.error || 'Error al cargar los datos de la asociación.'
  }
}

function verDeportistas(club) {
  router.push(`/dashboard/asociaciones/${asociacionId}/clubes/${club.id}`)
}

function openCreateModal() {
  editingClub.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(club) {
  editingClub.value = club
  form.nombre = club.nombre
  form.sigla = club.sigla || ''
  form.personeria_juridica = club.personeria_juridica || ''
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingClub.value = null
}

async function submitForm() {
  saving.value = true
  formError.value = ''
  try {
    if (editingClub.value) {
      await asociacionService.updateClub(asociacionId, editingClub.value.id, { ...form })
    } else {
      await asociacionService.createClub(asociacionId, { ...form })
    }
    closeModal()
    await loadData()
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors
      formError.value = errors ? Object.values(errors).flat().join(' ') : 'Revise los campos del club.'
    } else {
      formError.value = error.response?.data?.error || 'Error al guardar el club.'
    }
  } finally {
    saving.value = false
  }
}

async function toggleActive(club) {
  try {
    if (club.activo) {
      await asociacionService.deleteClub(asociacionId, club.id)
    } else {
      // Reactivar club si hiciera falta
    }
    await loadData()
  } catch (error) {
    alert(error.response?.data?.error || 'Error al modificar estado del club.')
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <section v-if="status === 'loading'" class="py-10 text-center text-sm text-slate-400">
    Cargando detalles de la asociación…
  </section>

  <section v-else-if="status === 'error'" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {{ errorMessage }}
  </section>

  <section v-else-if="asociacion">
    <!-- Breadcrumb -->
    <nav class="mb-4 flex items-center gap-2 text-sm text-slate-500">
      <router-link to="/dashboard/asociaciones" class="hover:text-brand-600 hover:underline">Asociaciones</router-link>
      <span>/</span>
      <span class="font-semibold text-ink">{{ asociacion.nombre }}</span>
    </nav>

    <div class="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex justify-between items-start">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-brand-600">NIT: {{ asociacion.nit }} | Nivel: {{ asociacion.nivel || 'Departamental' }}</p>
        <h2 class="mt-1 font-display text-lg font-bold text-ink">{{ asociacion.nombre }}</h2>
        <p class="mt-1 text-sm text-slate-500">Personería Jurídica: {{ asociacion.personeria_juridica || 'En trámite' }}</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">+ Nuevo Club</button>
    </div>

    <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Clubes Afiliados</h3>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
          <tr>
            <th class="px-4 py-3">Nombre del Club</th>
            <th class="px-4 py-3">Sigla</th>
            <th class="px-4 py-3">Personería Jurídica</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="club in clubes" :key="club.id" class="hover:bg-slate-50">
            <td class="px-4 py-3 font-semibold text-ink">{{ club.nombre }}</td>
            <td class="px-4 py-3 text-slate-600">{{ club.sigla || '—' }}</td>
            <td class="px-4 py-3 text-slate-600">{{ club.personeria_juridica || '—' }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="club.activo ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'">
                {{ club.activo ? 'Afiliado' : 'Baja' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right space-x-2">
              <button class="text-xs font-semibold text-brand-600 hover:underline" @click="verDeportistas(club)">
                Deportistas →
              </button>
              <button class="text-xs font-semibold text-slate-600 hover:underline" @click="openEditModal(club)">
                Editar
              </button>
              <button
                v-if="club.activo"
                class="text-xs font-semibold text-red-600 hover:underline"
                @click="toggleActive(club)"
              >
                Dar de Baja
              </button>
            </td>
          </tr>
          <tr v-if="!clubes.length">
            <td colspan="5" class="px-4 py-8 text-center text-slate-400">Esta asociación aún no tiene clubes afiliados.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Crear / Editar Club -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">
          {{ editingClub ? 'Editar Club' : 'Nuevo Club Afiliado' }}
        </h3>

        <form class="space-y-4" @submit.prevent="submitForm">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre del Club *</label>
            <input v-model="form.nombre" type="text" class="input-field" placeholder="ej. Club Deportivo Independiente" required :disabled="saving" />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Sigla</label>
            <input v-model="form.sigla" type="text" class="input-field" placeholder="ej. CDI" :disabled="saving" />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">N° Personería Jurídica</label>
            <input v-model="form.personeria_juridica" type="text" class="input-field" placeholder="ej. Res. Deptal. 045/2021" :disabled="saving" />
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
