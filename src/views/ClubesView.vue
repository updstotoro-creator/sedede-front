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

const showViewModal = ref(false)
const viewingClub = ref(null)

const showDocModal = ref(false)
const reviewingClub = ref(null)
const savingDoc = ref(false)
const docError = ref('')
const docForm = reactive({
  personeria_juridica: '',
  fecha_eleccion_directiva: '',
  documento_personeria: '',
  documento_estatutos: '',
  documento_acta_directiva: '',
  estado_documentacion: 'en_tramite',
  observaciones_documentacion: '',
})

function openViewModal(club) {
  viewingClub.value = club
  showViewModal.value = true
}

function closeViewModal() {
  showViewModal.value = false
  viewingClub.value = null
}

function openDocModal(club) {
  reviewingClub.value = club
  docForm.personeria_juridica = club.personeria_juridica || ''
  docForm.fecha_eleccion_directiva = club.fecha_eleccion_directiva ? club.fecha_eleccion_directiva.slice(0, 10) : ''
  docForm.documento_personeria = club.documento_personeria || ''
  docForm.documento_estatutos = club.documento_estatutos || ''
  docForm.documento_acta_directiva = club.documento_acta_directiva || ''
  docForm.estado_documentacion = club.estado_documentacion || 'en_tramite'
  docForm.observaciones_documentacion = club.observaciones_documentacion || ''
  docError.value = ''
  showDocModal.value = true
}

function closeDocModal() {
  showDocModal.value = false
  reviewingClub.value = null
  docError.value = ''
}

async function dictaminarDocumentacion(nuevoEstado) {
  if (!reviewingClub.value) return
  savingDoc.value = true
  docError.value = ''
  try {
    const payload = {
      personeria_juridica: docForm.personeria_juridica.trim() || null,
      fecha_eleccion_directiva: docForm.fecha_eleccion_directiva || null,
      documento_personeria: docForm.documento_personeria.trim() || null,
      documento_estatutos: docForm.documento_estatutos.trim() || null,
      documento_acta_directiva: docForm.documento_acta_directiva.trim() || null,
      estado_documentacion: nuevoEstado,
      observaciones_documentacion: docForm.observaciones_documentacion.trim() || null,
    }

    if (nuevoEstado === 'vigente' && !payload.personeria_juridica) {
      docError.value = 'Debe registrar el número de resolución de personería jurídica para certificarla como vigente.'
      savingDoc.value = false
      return
    }

    await clubesService.actualizarDocumentacion(reviewingClub.value.id, payload)
    await loadData()
    closeDocModal()
  } catch (error) {
    docError.value = error.response?.data?.error || error.response?.data?.message || 'Error al actualizar el expediente de personería.'
  } finally {
    savingDoc.value = false
  }
}

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
  const advertencia = club.activo
    ? `¿Confirma la desactivación del club "${club.nombre}"?\n\nEl club pasará a estado Desactivado (Baja Lógica). Toda su información e histórico se conservarán en el sistema sin borrado físico de datos.`
    : `¿Confirma la reactivación formal del club "${club.nombre}"?`

  if (!confirm(advertencia)) return

  try {
    if (club.activo) {
      await clubesService.inactivar(club.asociacion_id, club.id)
    } else {
      await clubesService.reactivar(club.asociacion_id, club.id)
    }
    await loadData()
    if (viewingClub.value && viewingClub.value.id === club.id) {
      viewingClub.value.activo = !club.activo
    }
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
            <th class="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="club in clubesFiltrados"
            :key="`${club.asociacion_id}-${club.id}`"
            class="hover:bg-slate-50 transition"
            :class="{ 'opacity-60 bg-slate-50/50': !club.activo }"
          >
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
              <div class="text-slate-700 font-medium">{{ club.asociacion?.nombre || '—' }}</div>
              <div class="text-xs text-slate-400">{{ club.asociacion?.sigla || '' }}</div>
            </td>
            <td class="px-4 py-3">
              <span class="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {{ disciplinasDe(club) }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-600">
              <div class="font-medium text-ink">{{ club.personeria_juridica || 'En trámite' }}</div>
              <button
                type="button"
                @click="openDocModal(club)"
                class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase mt-0.5 hover:opacity-80 transition cursor-pointer"
                :class="{
                  'bg-emerald-100 text-emerald-800 border border-emerald-200': club.estado_documentacion === 'vigente',
                  'bg-amber-100 text-amber-800 border border-amber-200': club.estado_documentacion === 'en_tramite' || !club.estado_documentacion,
                  'bg-red-100 text-red-800 border border-red-200': club.estado_documentacion === 'observada'
                }"
                title="Haga clic para revisar la documentación y expediente legal"
              >
                <span>{{ club.estado_documentacion === 'vigente' ? '✓ Doc. Aprobada' : (club.estado_documentacion === 'observada' ? '⚠️ Observada' : '⏳ En Trámite') }}</span>
                <span class="text-[9px]">🔍</span>
              </button>
            </td>
            <td class="px-4 py-3 text-slate-600">
              {{ club.fecha_eleccion_directiva ? new Date(club.fecha_eleccion_directiva).toLocaleDateString('es-BO') : '—' }}
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="club.activo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="club.activo ? 'bg-emerald-500' : 'bg-slate-400'"></span>
                {{ club.activo ? 'Activo' : 'Desactivado' }}
              </span>
            </td>
            <!-- Columna Acciones: Formato Compacto Estandarizado en una sola línea -->
            <td class="px-3 py-2 text-center whitespace-nowrap">
              <div class="inline-flex items-center gap-0.5 rounded-lg border border-slate-200/80 bg-slate-50/90 p-0.5 shadow-2xs">
                <!-- 1. Opción VER -->
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white hover:text-blue-700 hover:shadow-2xs transition"
                  title="Ver detalles completos y ficha técnica del club"
                  @click="openViewModal(club)"
                >
                  <span class="text-blue-600">👁️</span>
                  <span>Ver</span>
                </button>

                <!-- 2. Opción REVISAR DOCUMENTACIÓN / EXPEDIENTE -->
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold hover:bg-white hover:shadow-2xs transition"
                  :class="{
                    'text-emerald-700 hover:text-emerald-800': club.estado_documentacion === 'vigente',
                    'text-amber-700 hover:text-amber-800': club.estado_documentacion === 'en_tramite' || !club.estado_documentacion,
                    'text-rose-700 hover:text-rose-800': club.estado_documentacion === 'observada'
                  }"
                  title="Revisar expediente, personería y documentos antes de certificar"
                  @click="openDocModal(club)"
                >
                  <span>📜</span>
                  <span>Doc</span>
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="{
                      'bg-emerald-500': club.estado_documentacion === 'vigente',
                      'bg-amber-500': club.estado_documentacion === 'en_tramite' || !club.estado_documentacion,
                      'bg-rose-500': club.estado_documentacion === 'observada'
                    }"
                  ></span>
                </button>

                <!-- 3. Opción EDITAR -->
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-2xs transition"
                  title="Editar datos institucionales y credenciales del club"
                  @click="openEditModal(club)"
                >
                  <span class="text-slate-500">✏️</span>
                  <span>Editar</span>
                </button>

                <!-- 4. Opción DESACTIVAR / REACTIVAR (Baja Lógica) -->
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold hover:bg-white hover:shadow-2xs transition"
                  :class="club.activo ? 'text-rose-600 hover:text-rose-700' : 'text-teal-600 hover:text-teal-700'"
                  :title="club.activo ? 'Desactivar club (Baja lógica sin borrado físico)' : 'Reactivar club'"
                  @click="toggleActive(club)"
                >
                  <span>{{ club.activo ? '🚫' : '✓' }}</span>
                  <span>{{ club.activo ? 'Baja' : 'Activar' }}</span>
                </button>
              </div>
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

    <!-- Modal VER Ficha del Club (CRUD Read) -->
    <div v-if="showViewModal && viewingClub" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-xs">
      <div class="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
        <div class="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <div class="flex items-center gap-2">
              <span
                class="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                :class="viewingClub.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'"
              >
                {{ viewingClub.activo ? 'Club Activo / Afiliado' : 'Desactivado (Baja Lógica)' }}
              </span>
              <span v-if="viewingClub.sigla" class="rounded bg-brand-50 text-brand-700 px-2 py-0.5 text-[11px] font-bold">
                Sigla: {{ viewingClub.sigla }}
              </span>
            </div>
            <h3 class="mt-2 font-display text-xl font-bold text-slate-900">{{ viewingClub.nombre }}</h3>
            <p class="text-xs text-slate-500">{{ viewingClub.asociacion?.nombre || 'Sin Asociación vinculada' }}</p>
          </div>
          <button @click="closeViewModal" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- 1. Afiliación & Disciplinas -->
          <div class="rounded-xl bg-slate-50 p-4 border border-slate-200/80">
            <h4 class="font-bold text-slate-800 uppercase tracking-wide text-[11px] mb-2 flex items-center gap-1.5">
              <span>🏅 Disciplina y Asociación Departamental</span>
            </h4>
            <div class="grid grid-cols-2 gap-3 text-slate-700">
              <div>
                <span class="text-slate-400 block text-[10px]">Asociación:</span>
                <span class="font-semibold">{{ viewingClub.asociacion?.nombre || '—' }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Disciplina(s):</span>
                <span class="font-semibold">{{ disciplinasDe(viewingClub) }}</span>
              </div>
            </div>
          </div>

          <!-- 2. Personería Jurídica y Documentación -->
          <div class="rounded-xl bg-slate-50 p-4 border border-slate-200/80">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-bold text-slate-800 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                <span>📜 Situación Legal y Personería Jurídica</span>
              </h4>
              <button
                type="button"
                class="rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[11px] px-2.5 py-1 transition flex items-center gap-1 shadow-2xs"
                @click="closeViewModal(); openDocModal(viewingClub)"
              >
                <span>📜</span>
                <span>Revisar Expediente & Documentación</span>
              </button>
            </div>
            <div class="grid grid-cols-2 gap-3 text-slate-700">
              <div>
                <span class="text-slate-400 block text-[10px]">Nº Personería Jurídica:</span>
                <span class="font-mono font-bold">{{ viewingClub.personeria_juridica || 'En trámite / No registrada' }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Estado Documentación:</span>
                <span
                  class="font-bold"
                  :class="{
                    'text-emerald-700': viewingClub.estado_documentacion === 'vigente',
                    'text-amber-700': viewingClub.estado_documentacion !== 'vigente' && viewingClub.estado_documentacion !== 'observada',
                    'text-red-700': viewingClub.estado_documentacion === 'observada'
                  }"
                >
                  {{ viewingClub.estado_documentacion === 'vigente' ? '✓ Aprobada y Vigente' : (viewingClub.estado_documentacion === 'observada' ? '⚠️ Observada' : '⏳ En Trámite') }}
                </span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Fecha Elección Directiva:</span>
                <span>{{ viewingClub.fecha_eleccion_directiva ? new Date(viewingClub.fecha_eleccion_directiva).toLocaleDateString('es-BO') : 'No informada' }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Atletas Vinculados:</span>
                <span class="font-bold text-brand-700">{{ viewingClub.deportistas?.length || 0 }} deportistas registrados</span>
              </div>
            </div>
          </div>

          <!-- 3. Acceso Oficial y Contacto -->
          <div class="rounded-xl bg-slate-50 p-4 border border-slate-200/80">
            <h4 class="font-bold text-slate-800 uppercase tracking-wide text-[11px] mb-2 flex items-center gap-1.5">
              <span>👤 Usuario Oficial de Acceso y Contacto</span>
            </h4>
            <div class="grid grid-cols-2 gap-3 text-slate-700">
              <div>
                <span class="text-slate-400 block text-[10px]">Usuario Responsable:</span>
                <span class="font-semibold">{{ viewingClub.user?.name || 'Directiva del Club' }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Correo Electrónico Oficial:</span>
                <span class="font-mono text-indigo-700 font-semibold">{{ viewingClub.user?.email || viewingClub.email || 'Sin correo' }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Teléfono de Contacto:</span>
                <span>{{ viewingClub.telefono || '—' }}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Dirección / Sede:</span>
                <span>{{ viewingClub.direccion || 'Sucre, Chuquisaca' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 flex-wrap gap-2">
          <button
            type="button"
            class="rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-2 transition flex items-center gap-1.5 shadow-xs"
            @click="verDetalle(viewingClub); closeViewModal()"
          >
            <span>Ir al Portal del Club</span>
            <span>➔</span>
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 transition"
              @click="closeViewModal(); openEditModal(viewingClub)"
            >
              ✏️ Editar
            </button>
            <button
              type="button"
              class="rounded-lg text-xs font-semibold px-3 py-2 transition"
              :class="viewingClub.activo ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'"
              @click="toggleActive(viewingClub)"
            >
              {{ viewingClub.activo ? '🚫 Desactivar' : '✓ Reactivar' }}
            </button>
            <button
              type="button"
              class="btn-primary text-xs"
              @click="closeViewModal"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal REVISIÓN DE DOCUMENTACIÓN Y PERSONERÍA JURÍDICA (Antes de dictaminar/certificar) -->
    <div v-if="showDocModal && reviewingClub" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-xs">
      <div class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[92vh] overflow-y-auto border border-slate-100">
        <!-- Encabezado del Expediente -->
        <div class="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <div class="flex items-center gap-2">
              <span
                class="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                :class="{
                  'bg-emerald-100 text-emerald-800 border border-emerald-300': docForm.estado_documentacion === 'vigente',
                  'bg-amber-100 text-amber-800 border border-amber-300': docForm.estado_documentacion === 'en_tramite',
                  'bg-rose-100 text-rose-800 border border-rose-300': docForm.estado_documentacion === 'observada'
                }"
              >
                {{ docForm.estado_documentacion === 'vigente' ? '✓ Personería Aprobada / Vigente' : (docForm.estado_documentacion === 'observada' ? '⚠️ Documentación Observada' : '⏳ En Trámite de Certificación') }}
              </span>
              <span class="rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-[11px] font-bold">
                {{ reviewingClub.sigla || 'Club' }}
              </span>
            </div>
            <h3 class="mt-2 font-display text-xl font-bold text-slate-900">
              Expediente Legal: {{ reviewingClub.nombre }}
            </h3>
            <p class="text-xs text-slate-500">
              Asociación: <strong>{{ reviewingClub.asociacion?.nombre || '—' }}</strong> · Disciplina: <strong>{{ disciplinasDe(reviewingClub) }}</strong>
            </p>
          </div>
          <button @click="closeDocModal" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <div class="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-blue-900 text-xs flex items-start gap-2.5">
            <span class="text-base">ℹ️</span>
            <div>
              <p class="font-semibold">Revisión y Dictamen Institucional SEDEDE</p>
              <p class="text-[11px] text-blue-800 mt-0.5">
                Revise la resolución legal, los estatutos orgánicos y el acta de posesión antes de emitir la aprobación de la personería jurídica. Si existe alguna inconsistencia, puede asentar observaciones técnicas.
              </p>
            </div>
          </div>

          <!-- Campos de Resolución y Fechas -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label class="block font-bold text-slate-700 mb-1">
                N° de Resolución de Personería Jurídica *
              </label>
              <input
                v-model="docForm.personeria_juridica"
                type="text"
                placeholder="Ej. Res. Adm. Departamental 102/2020"
                class="input-field text-xs font-semibold"
                :disabled="savingDoc"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">
                Fecha de Elección / Posesión Directiva
              </label>
              <input
                v-model="docForm.fecha_eleccion_directiva"
                type="date"
                class="input-field text-xs"
                :disabled="savingDoc"
              />
            </div>
          </div>

          <!-- Documentos de Respaldo Digital -->
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
            <h4 class="font-bold text-slate-800 uppercase tracking-wide text-[11px] flex items-center justify-between">
              <span>📄 Documentos de Respaldo Digital</span>
              <span class="text-[10px] font-normal text-slate-500">Formatos PDF / Actas escaneadas</span>
            </h4>

            <!-- 1. Documento Personería -->
            <div class="rounded-lg bg-white border border-slate-200 p-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="font-semibold text-slate-700">1. Resolución de Personería Jurídica:</span>
                <span
                  class="rounded px-2 py-0.5 text-[10px] font-bold"
                  :class="docForm.documento_personeria ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                >
                  {{ docForm.documento_personeria ? '✓ Documento Registrado' : '⚠️ Pendiente de Adjuntar' }}
                </span>
              </div>
              <input
                v-model="docForm.documento_personeria"
                type="text"
                placeholder="Nombre o ruta del archivo (ej: personeria_cas_2020.pdf)"
                class="input-field mt-1.5 text-xs font-mono"
                :disabled="savingDoc"
              />
            </div>

            <!-- 2. Estatutos Orgánicos -->
            <div class="rounded-lg bg-white border border-slate-200 p-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="font-semibold text-slate-700">2. Estatutos Orgánicos y Reglamentos:</span>
                <span
                  class="rounded px-2 py-0.5 text-[10px] font-bold"
                  :class="docForm.documento_estatutos ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                >
                  {{ docForm.documento_estatutos ? '✓ Documento Registrado' : '⚠️ Pendiente de Adjuntar' }}
                </span>
              </div>
              <input
                v-model="docForm.documento_estatutos"
                type="text"
                placeholder="Nombre o ruta del archivo (ej: estatutos_organicos_cas.pdf)"
                class="input-field mt-1.5 text-xs font-mono"
                :disabled="savingDoc"
              />
            </div>

            <!-- 3. Acta de Posesión Directiva -->
            <div class="rounded-lg bg-white border border-slate-200 p-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="font-semibold text-slate-700">3. Acta de Posesión de la Directiva:</span>
                <span
                  class="rounded px-2 py-0.5 text-[10px] font-bold"
                  :class="docForm.documento_acta_directiva ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                >
                  {{ docForm.documento_acta_directiva ? '✓ Documento Registrado' : '⚠️ Pendiente de Adjuntar' }}
                </span>
              </div>
              <input
                v-model="docForm.documento_acta_directiva"
                type="text"
                placeholder="Nombre o ruta del archivo (ej: acta_posesion_directiva_2025_2027.pdf)"
                class="input-field mt-1.5 text-xs font-mono"
                :disabled="savingDoc"
              />
            </div>
          </div>

          <!-- Observaciones Técnicas y Dictamen -->
          <div>
            <label class="block font-bold text-slate-700 mb-1">
              Observaciones Técnicas / Dictamen del SEDEDE
            </label>
            <textarea
              v-model="docForm.observaciones_documentacion"
              rows="3"
              placeholder="Indique las conclusiones de la revisión técnica o el motivo si la documentación resulta observada..."
              class="input-field text-xs w-full"
              :disabled="savingDoc"
            ></textarea>
          </div>

          <div v-if="docError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ docError }}
          </div>
        </div>

        <!-- Botones de Dictamen -->
        <div class="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 flex-wrap gap-2">
          <button
            type="button"
            class="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            @click="closeDocModal"
            :disabled="savingDoc"
          >
            Cancelar
          </button>

          <div class="flex items-center gap-2 flex-wrap">
            <!-- 1. Mantener En Trámite -->
            <button
              type="button"
              class="rounded-lg bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 px-3 py-2 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
              @click="dictaminarDocumentacion('en_tramite')"
              :disabled="savingDoc"
            >
              <span>⏳</span>
              <span>Guardar En Trámite</span>
            </button>

            <!-- 2. Observar Documentación -->
            <button
              type="button"
              class="rounded-lg bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 px-3 py-2 text-xs font-bold transition flex items-center gap-1 shadow-2xs"
              @click="dictaminarDocumentacion('observada')"
              :disabled="savingDoc"
            >
              <span>⚠️</span>
              <span>Observar Documentación</span>
            </button>

            <!-- 3. Aprobar y Certificar Personería -->
            <button
              type="button"
              class="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              @click="dictaminarDocumentacion('vigente')"
              :disabled="savingDoc"
            >
              <span>✓</span>
              <span>Aprobar Personería (Vigente)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
