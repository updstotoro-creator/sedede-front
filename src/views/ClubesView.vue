<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { asociacionService } from '../services/asociacionService'
import clubesService from '../services/clubesService'

const router = useRouter()
const clubes = ref([])
const asociaciones = ref([])
const status = ref('idle')
const errorMessage = ref('')

const search = ref('')
const filterAsociacion = ref('')

const showModal = ref(false)
const editingClub = ref(null)
const formError = ref('')
const saving = ref(false)

const form = reactive({
  asociacion_id: '',
  nombre: '',
  sigla: '',
  personeria_juridica: '',
  fecha_eleccion_directiva: '',
  telefono: '',
  email: '',
  direccion: '',
  usuario_nombre: '',
  usuario_password: '',
})

const clubesFiltrados = computed(() => {
  const term = search.value.trim().toLowerCase()
  return clubes.value.filter((club) => {
    if (filterAsociacion.value && Number(club.asociacion_id) !== Number(filterAsociacion.value)) return false
    if (!term) return true
    return [club.nombre, club.sigla, club.asociacion?.nombre, club.email, club.user?.email]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(term))
  })
})

function disciplinasDe(club) {
  const list = club.asociacion?.disciplinas
  if (!list) return '—'
  const arr = Array.isArray(list) ? list : [list]
  return arr.length ? arr.join(', ') : '—'
}

function resetForm() {
  form.asociacion_id = ''
  form.nombre = ''
  form.sigla = ''
  form.personeria_juridica = ''
  form.fecha_eleccion_directiva = ''
  form.telefono = ''
  form.email = ''
  form.direccion = ''
  form.usuario_nombre = ''
  form.usuario_password = ''
  formError.value = ''
}

async function loadData() {
  status.value = 'loading'
  errorMessage.value = ''
  try {
    const rawUser = localStorage.getItem('user')
    const user = rawUser ? JSON.parse(rawUser) : null
    if (user?.role?.nombre === 'asociacion' && user?.asociacion_id && !filterAsociacion.value) {
      filterAsociacion.value = String(user.asociacion_id)
    }

    const [asoc, clbs] = await Promise.all([
      asociacionService.list(),
      clubesService.listarTodas(filterAsociacion.value || null),
    ])
    asociaciones.value = asoc
    clubes.value = clbs
    status.value = 'idle'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error.response?.data?.error || 'Error al cargar los clubes.'
  }
}

function openCreateModal() {
  editingClub.value = null
  resetForm()
  form.asociacion_id = filterAsociacion.value || (asociaciones.value[0]?.id ?? '')
  showModal.value = true
}

function openEditModal(club) {
  editingClub.value = club
  form.asociacion_id = club.asociacion_id
  form.nombre = club.nombre
  form.sigla = club.sigla || ''
  form.personeria_juridica = club.personeria_juridica || ''
  form.fecha_eleccion_directiva = (club.fecha_eleccion_directiva || '').slice(0, 10)
  form.telefono = club.telefono || ''
  form.email = club.email || club.user?.email || ''
  form.direccion = club.direccion || ''
  form.usuario_nombre = club.user?.name || ''
  form.usuario_password = ''
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
    // El backend toma la asociación de la ruta, sólo se envían los campos del club.
    const payload = {
      nombre: form.nombre.trim(),
      sigla: form.sigla.trim() || null,
      personeria_juridica: form.personeria_juridica.trim() || null,
      fecha_eleccion_directiva: form.fecha_eleccion_directiva || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      direccion: form.direccion.trim() || null,
      usuario_nombre: form.usuario_nombre.trim() || null,
      usuario_password: form.usuario_password.trim() || null,
    }
    if (editingClub.value) {
      await clubesService.actualizar(editingClub.value.asociacion_id, editingClub.value.id, payload)
    } else {
      await clubesService.crear(Number(form.asociacion_id), payload)
    }
    closeModal()
    await loadData()
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors
      formError.value = errors ? Object.values(errors).flat().join(' ') : 'Revise los campos requeridos.'
    } else {
      formError.value = error.response?.data?.error || 'Error al guardar el club.'
    }
  } finally {
    saving.value = false
  }
}

async function aprobarDocumentacionClub(club) {
  if (!confirm(`¿Desea validar y aprobar formalmente la personería y documentación del "${club.nombre}"?`)) return
  try {
    await clubesService.actualizarDocumentacion(club.id, { estado_documentacion: 'vigente' })
    await loadData()
    alert('Documentación y Personería del club aprobadas exitosamente.')
  } catch (error) {
    alert(error.response?.data?.error || 'Error al aprobar documentación del club.')
  }
}

async function toggleActive(club) {
  try {
    if (club.activo) {
      await clubesService.inactivar(club.asociacion_id, club.id)
    } else {
      await clubesService.reactivar(club.asociacion_id, club.id)
    }
    await loadData()
  } catch (error) {
    alert(error.response?.data?.error || 'Error al modificar el estado del club.')
  }
}

function verDetalle(club) {
  router.push(`/dashboard/asociaciones/${club.asociacion_id}/clubes/${club.id}`)
}

onMounted(loadData)
</script>

<template>
  <section class="mt-8">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="font-display text-xl font-bold text-ink">Clubes</h2>
        <p class="text-xs text-slate-500">Listado global de clubes afiliados a las asociaciones deportivas.</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">+ Nuevo Club</button>
    </div>

    <div class="mb-4 flex flex-wrap gap-3">
      <input
        v-model="search"
        type="text"
        class="input-field max-w-xs"
        placeholder="Buscar por nombre, sigla o asociación…"
      />
      <select v-model="filterAsociacion" class="input-field max-w-xs">
        <option value="">Todas las asociaciones</option>
        <option v-for="a in asociaciones" :key="a.id" :value="String(a.id)">
          {{ a.nombre }}
        </option>
      </select>
    </div>

    <div v-if="status === 'loading'" class="py-10 text-center text-sm text-slate-400">
      Cargando clubes…
    </div>

    <div v-else-if="status === 'error'" role="alert" class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div v-else class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
          <tr>
            <th class="px-4 py-3">Club</th>
            <th class="px-4 py-3">Acceso / Correo Oficial</th>
            <th class="px-4 py-3">Asociación</th>
            <th class="px-4 py-3">Disciplina</th>
            <th class="px-4 py-3">Personería Jurídica</th>
            <th class="px-4 py-3">Fecha Elección</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="club in clubesFiltrados" :key="`${club.asociacion_id}-${club.id}`" class="hover:bg-slate-50">
            <td class="px-4 py-3">
              <div class="font-semibold text-ink">{{ club.nombre }}</div>
              <div class="text-xs text-slate-500">Sigla: {{ club.sigla || '—' }}</div>
            </td>
            <td class="px-4 py-3 text-slate-700">
              <div class="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded inline-block">
                {{ club.user?.email || club.email || 'Sin correo oficial' }}
              </div>
              <div v-if="club.user?.name" class="text-[11px] text-slate-500 mt-0.5">
                👤 {{ club.user.name }}
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="text-slate-700">{{ club.asociacion?.nombre || '—' }}</div>
              <div class="text-xs text-slate-400">{{ club.asociacion?.sigla || '' }}</div>
            </td>
            <td class="px-4 py-3">
              <span class="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {{ disciplinasDe(club) }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-600">
              <div class="font-medium text-ink">{{ club.personeria_juridica || 'En trámite' }}</div>
              <span
                class="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase mt-0.5"
                :class="{
                  'bg-emerald-100 text-emerald-800': club.estado_documentacion === 'vigente',
                  'bg-amber-100 text-amber-800': club.estado_documentacion === 'en_tramite' || !club.estado_documentacion,
                  'bg-red-100 text-red-800': club.estado_documentacion === 'observada'
                }"
              >
                {{ club.estado_documentacion === 'vigente' ? '✓ Doc. Aprobada' : (club.estado_documentacion === 'observada' ? '⚠️ Observada' : '⏳ En Trámite') }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-600">
              {{ club.fecha_eleccion_directiva ? new Date(club.fecha_eleccion_directiva).toLocaleDateString('es-BO') : '—' }}
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="club.activo ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ club.activo ? 'Afiliado' : 'Baja Lógica' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right space-x-2">
              <button
                v-if="club.estado_documentacion !== 'vigente'"
                class="rounded bg-emerald-50 border border-emerald-300 px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                @click="aprobarDocumentacionClub(club)"
              >
                ✓ Validar Personería
              </button>
              <button class="text-xs font-semibold text-brand-600 hover:underline" @click="verDetalle(club)">
                Detalle →
              </button>
              <button class="text-xs font-semibold text-slate-600 hover:underline" @click="openEditModal(club)">
                Editar
              </button>
              <button
                class="text-xs font-semibold hover:underline"
                :class="club.activo ? 'text-red-600' : 'text-teal-700'"
                @click="toggleActive(club)"
              >
                {{ club.activo ? 'Dar de Baja' : 'Reactivar' }}
              </button>
            </td>
          </tr>
          <tr v-if="!clubesFiltrados.length">
            <td colspan="8" class="px-4 py-8 text-center text-slate-400">No hay clubes registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Crear / Editar Club -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 class="mb-1 font-display text-lg font-bold text-ink">
          {{ editingClub ? 'Editar Club' : 'Nuevo Club' }}
        </h3>
        <p class="text-xs text-slate-500 mb-4">
          Datos institucionales del Club Deportivo y credenciales de acceso unificadas.
        </p>

        <form class="space-y-4 text-xs" @submit.prevent="submitForm">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Asociación *</label>
            <select v-model="form.asociacion_id" class="input-field" required :disabled="saving || !!editingClub">
              <option value="" disabled>Seleccione una asociación</option>
              <option v-for="a in asociaciones" :key="a.id" :value="a.id">{{ a.nombre }}</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre del Club *</label>
            <input v-model="form.nombre" type="text" class="input-field text-sm" placeholder="ej. Club Deportivo Municipal" required :disabled="saving" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Sigla</label>
              <input v-model="form.sigla" type="text" class="input-field" placeholder="ej. CDM" :disabled="saving" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">N° Personería Jurídica</label>
              <input v-model="form.personeria_juridica" type="text" class="input-field" placeholder="ej. Res. Adm. 45/2021" :disabled="saving" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Teléfono de Contacto</label>
              <input v-model="form.telefono" type="text" class="input-field" placeholder="ej. 71234567" :disabled="saving" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Correo Oficial (Usuario de Acceso) *</label>
              <input v-model="form.email" type="email" class="input-field font-semibold text-ink" placeholder="ej. club@sedede.gob.bo" required :disabled="saving" />
              <p class="text-[10px] text-slate-400 mt-0.5">Correo único oficial para ingreso al portal del Club.</p>
            </div>
          </div>

          <!-- SECCIÓN DE DIRECTIVA Y ROTACIÓN DE CREDENCIALES DEL CLUB -->
          <div class="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                👤 Delegado / Directiva del Club & Acceso
              </span>
              <span class="rounded bg-indigo-100 border border-indigo-300 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                Rotación de Mando
              </span>
            </div>
            <p class="text-[11px] text-indigo-900 leading-relaxed">
              En caso de rotación de directiva del club, actualice el nombre del presidente/delegado y fije una nueva contraseña para que la nueva directiva gestione sus deportistas. Al guardar, el acceso se actualiza en el acto.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label class="block font-semibold text-slate-700 mb-1 text-[11px]">Nombre del Delegado / Presidente</label>
                <input v-model="form.usuario_nombre" type="text" placeholder="Ej: Lic. Marcelo Vaca" class="input-field bg-white text-xs" :disabled="saving" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1 text-[11px]">{{ editingClub ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial (Opcional)' }}</label>
                <input v-model="form.usuario_password" type="text" placeholder="Dejar en blanco para mantener actual" class="input-field bg-white text-xs font-mono" :disabled="saving" />
              </div>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Fecha de Elección de Directiva</label>
            <input v-model="form.fecha_eleccion_directiva" type="date" class="input-field" :disabled="saving" />
          </div>

          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Dirección / Sede del Club</label>
            <input v-model="form.direccion" type="text" class="input-field" placeholder="ej. Calle Sucre #123" :disabled="saving" />
          </div>

          <div v-if="formError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </div>

          <div class="flex justify-end gap-3 pt-3 border-t">
            <button type="button" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800" :disabled="saving" @click="closeModal">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Guardando…' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
