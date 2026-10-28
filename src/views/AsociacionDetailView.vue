<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { asociacionService } from '../services/asociacionService'
import { tramiteService } from '../services/tramiteService'

const route = useRoute()
const router = useRouter()

const asociacionId = route.params.asociacionId
const asociacion = ref(null)
const clubes = ref([])
const deportistas = ref([])
const tramites = ref([])
const status = ref('loading')
const errorMessage = ref('')
const activeTab = ref('clubes') // 'clubes', 'deportistas', 'tramites'

// Filtros para Clubes
const searchClub = ref('')
const clubesFiltrados = computed(() => {
  const term = searchClub.value.trim().toLowerCase()
  if (!term) return clubes.value
  return clubes.value.filter(c =>
    (c.nombre && c.nombre.toLowerCase().includes(term)) ||
    (c.sigla && c.sigla.toLowerCase().includes(term)) ||
    (c.personeria_juridica && c.personeria_juridica.toLowerCase().includes(term))
  )
})

// Filtros para Deportistas
const searchDep = ref('')
const filterClubDep = ref('')
const filterEstadoAsocDep = ref('')
const filterSeleccionadoDep = ref('')

const deportistasFiltrados = computed(() => {
  const term = searchDep.value.trim().toLowerCase()
  return deportistas.value.filter(d => {
    if (filterClubDep.value && Number(d.club_id) !== Number(filterClubDep.value)) return false
    if (filterEstadoAsocDep.value && d.estado_afiliacion_asociacion !== filterEstadoAsocDep.value) return false
    if (filterSeleccionadoDep.value) {
      if (filterSeleccionadoDep.value === 'departamental' && !d.es_seleccionado_departamental) return false
      if (filterSeleccionadoDep.value === 'nacional' && !d.es_seleccionado_nacional) return false
      if (filterSeleccionadoDep.value === 'ambos' && (!d.es_seleccionado_departamental || !d.es_seleccionado_nacional)) return false
    }
    if (!term) return true
    return [d.nombres, d.apellidos, d.ci, d.disciplina, d.categoria, d.club?.nombre]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(term))
  })
})

// Filtros para Trámites
const searchTramite = ref('')
const filterEstadoTramite = ref('')
const tramitesFiltrados = computed(() => {
  const term = searchTramite.value.trim().toLowerCase()
  return tramites.value.filter(t => {
    if (filterEstadoTramite.value && t.estado !== filterEstadoTramite.value) return false
    if (!term) return true
    return [t.codigo_tramite, t.deportista?.nombres, t.deportista?.apellidos, t.unidad_actual, t.estado]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(term))
  })
})

// Modales
const showClubModal = ref(false)
const editingClub = ref(null)
const clubFormError = ref('')
const savingClub = ref(false)

const clubForm = reactive({
  nombre: '',
  sigla: '',
  personeria_juridica: '',
  telefono: '',
  email: '',
  direccion: '',
})

// Modal Rechazo Deportista
const showRechazarModal = ref(false)
const selectedDeportista = ref(null)
const motivoRechazo = ref('')
const procesandoRechazo = ref(false)

// Modal Expediente Trámite
const showExpedienteModal = ref(false)
const tramiteSeleccionado = ref(null)
const loadingExpediente = ref(false)

function resetClubForm() {
  clubForm.nombre = ''
  clubForm.sigla = ''
  clubForm.personeria_juridica = ''
  clubForm.telefono = ''
  clubForm.email = ''
  clubForm.direccion = ''
  clubFormError.value = ''
}

async function loadData() {
  status.value = 'loading'
  errorMessage.value = ''
  try {
    const [asocData, clubesData] = await Promise.all([
      asociacionService.get(asociacionId),
      asociacionService.listClubes(asociacionId),
    ])
    asociacion.value = asocData
    clubes.value = clubesData

    // Cargar deportistas y trámites en segundo plano
    cargarDeportistas()
    cargarTramites()

    status.value = 'idle'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error.response?.data?.error || 'Error al cargar los datos de la asociación.'
  }
}

async function cargarDeportistas() {
  try {
    const res = await asociacionService.getDeportistas(asociacionId)
    deportistas.value = res.data || []
  } catch (e) {
    console.error('Error cargando deportistas:', e)
  }
}

async function cargarTramites() {
  try {
    const res = await asociacionService.getTramites(asociacionId)
    tramites.value = res.data || []
  } catch (e) {
    console.error('Error cargando trámites:', e)
  }
}

function verDeportistasClub(club) {
  filterClubDep.value = String(club.id)
  activeTab.value = 'deportistas'
}

function openCreateClubModal() {
  editingClub.value = null
  resetClubForm()
  showClubModal.value = true
}

function openEditClubModal(club) {
  editingClub.value = club
  clubForm.nombre = club.nombre
  clubForm.sigla = club.sigla || ''
  clubForm.personeria_juridica = club.personeria_juridica || ''
  clubForm.telefono = club.telefono || ''
  clubForm.email = club.email || ''
  clubForm.direccion = club.direccion || ''
  clubFormError.value = ''
  showClubModal.value = true
}

function closeClubModal() {
  showClubModal.value = false
  editingClub.value = null
}

async function submitClubForm() {
  savingClub.value = true
  clubFormError.value = ''
  try {
    if (editingClub.value) {
      await asociacionService.updateClub(asociacionId, editingClub.value.id, { ...clubForm })
    } else {
      await asociacionService.createClub(asociacionId, { ...clubForm })
    }
    closeClubModal()
    const res = await asociacionService.listClubes(asociacionId)
    clubes.value = res
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors
      clubFormError.value = errors ? Object.values(errors).flat().join(' ') : 'Revise los campos requeridos.'
    } else {
      clubFormError.value = error.response?.data?.error || 'Error al guardar el club.'
    }
  } finally {
    savingClub.value = false
  }
}

async function toggleActiveClub(club) {
  try {
    if (club.activo) {
      if (!confirm(`¿Dar de baja lógica al club "${club.nombre}"?`)) return
      await asociacionService.deleteClub(asociacionId, club.id)
    }
    const res = await asociacionService.listClubes(asociacionId)
    clubes.value = res
  } catch (error) {
    alert(error.response?.data?.error || 'Error al modificar estado del club.')
  }
}

// Validación de Deportistas en 2 Fases
async function aceptarDeportista(dep) {
  if (dep.club_id && dep.estado_afiliacion_club !== 'aceptado') {
    alert(`No se puede validar en la Asociación: El deportista debe contar primero con el visto bueno formal de su club (${dep.club?.nombre || 'Club asignado'}).`)
    return
  }

  if (!confirm(`¿Confirmar validación y aceptación oficial de ${dep.nombres} ${dep.apellidos} en la Asociación?`)) return

  try {
    await asociacionService.aceptarDeportista(asociacionId, dep.id, {
      observaciones: 'Aceptado formalmente por la Directiva de la Asociación Departamental.'
    })
    alert(`✓ Deportista ${dep.nombres} ${dep.apellidos} validado exitosamente en la asociación.`)
    await cargarDeportistas()
  } catch (error) {
    alert(error.response?.data?.error || error.response?.data?.message || 'Error al aceptar al deportista.')
  }
}

function openRechazarModal(dep) {
  selectedDeportista.value = dep
  motivoRechazo.value = ''
  showRechazarModal.value = true
}

async function submitRechazoDeportista() {
  if (!motivoRechazo.value.trim()) {
    alert('Por favor detalle el motivo de observación o rechazo.')
    return
  }
  procesandoRechazo.value = true
  try {
    await asociacionService.rechazarDeportista(asociacionId, selectedDeportista.value.id, {
      observaciones: motivoRechazo.value.trim()
    })
    alert('Observación registrada correctamente.')
    showRechazarModal.value = false
    selectedDeportista.value = null
    await cargarDeportistas()
  } catch (error) {
    alert(error.response?.data?.error || 'Error al registrar observación.')
  } finally {
    procesandoRechazo.value = false
  }
}

// Visualización de Expediente de Trámite
async function verExpediente(tramite) {
  loadingExpediente.value = true
  showExpedienteModal.value = true
  try {
    const res = await tramiteService.expediente(tramite.id)
    tramiteSeleccionado.value = res.data || res
  } catch (e) {
    alert('Error al cargar expediente digital.')
    showExpedienteModal.value = false
  } finally {
    loadingExpediente.value = false
  }
}

const generandoPdf = ref(false)

async function imprimirChecklist() {
  if (!tramiteSeleccionado.value || generandoPdf.value) return
  try {
    generandoPdf.value = true
    const blob = await tramiteService.descargarPdfCierre(tramiteSeleccionado.value.id)
    const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const win = window.open(blobUrl, '_blank')
    if (!win) {
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `Checklist_Cierre_${tramiteSeleccionado.value.codigo_tramite}.pdf`
      a.click()
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120000)
  } catch (e) {
    console.error('Error al generar PDF de checklist:', e)
    alert('No se pudo generar el documento PDF oficial. Por favor intente nuevamente.')
  } finally {
    generandoPdf.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Estado de Carga -->
    <section v-if="status === 'loading'" class="py-12 text-center text-sm text-slate-400">
      Cargando información integral de la asociación deportiva…
    </section>

    <!-- Error -->
    <section v-else-if="status === 'error'" role="alert" class="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
      <div class="font-bold text-red-800">Error al consultar la asociación</div>
      <p class="mt-1">{{ errorMessage }}</p>
    </section>

    <div v-else-if="asociacion" class="space-y-6">
      <!-- Breadcrumb y Encabezado Principal -->
      <nav class="flex items-center gap-2 text-xs font-medium text-slate-500">
        <router-link to="/dashboard/asociaciones" class="hover:text-brand-600 transition">Asociaciones Departamentales</router-link>
        <span>/</span>
        <span class="font-bold text-slate-800">{{ asociacion.nombre }}</span>
      </nav>

      <!-- Ficha Institucional de la Asociación -->
      <div class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
                NIT: {{ asociacion.nit }}
              </span>
              <span class="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                Nivel {{ asociacion.nivel || 'Departamental' }}
              </span>
              <span v-if="asociacion.sigla" class="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                {{ asociacion.sigla }}
              </span>
            </div>
            <h1 class="mt-2 font-display text-2xl font-black tracking-tight text-ink">
              {{ asociacion.nombre }}
            </h1>
            <p class="mt-1 text-xs text-slate-500 flex flex-wrap gap-4">
              <span>🏛️ Personería Jurídica: <strong>{{ asociacion.personeria_juridica || 'En trámite' }}</strong></span>
              <span>📞 Contacto: <strong>{{ asociacion.telefono || 'Sin teléfono' }}</strong></span>
              <span>✉️ Correo: <strong>{{ asociacion.correo || asociacion.users?.[0]?.email || 'Sin correo oficial' }}</strong></span>
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button
              v-if="activeTab === 'clubes'"
              class="btn-primary flex items-center gap-1.5 shadow-sm"
              @click="openCreateClubModal"
            >
              <span>+ Nuevo Club</span>
            </button>
          </div>
        </div>

        <!-- Tarjetas de Métricas -->
        <div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 pt-6 border-t border-slate-100">
          <div
            class="rounded-xl border border-slate-100 bg-slate-50/70 p-4 cursor-pointer hover:bg-slate-100/70 transition"
            :class="{ 'ring-2 ring-brand-500 bg-white': activeTab === 'clubes' }"
            @click="activeTab = 'clubes'"
          >
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Clubes Afiliados</div>
            <div class="mt-1 flex items-baseline gap-2">
              <span class="text-2xl font-black text-ink">{{ clubes.length }}</span>
              <span class="text-xs text-slate-400">clubes registrados</span>
            </div>
          </div>
          <div
            class="rounded-xl border border-slate-100 bg-slate-50/70 p-4 cursor-pointer hover:bg-slate-100/70 transition"
            :class="{ 'ring-2 ring-brand-500 bg-white': activeTab === 'deportistas' }"
            @click="activeTab = 'deportistas'"
          >
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Padrón de Deportistas</div>
            <div class="mt-1 flex items-baseline gap-2">
              <span class="text-2xl font-black text-ink">{{ deportistas.length }}</span>
              <span class="text-xs text-amber-600 font-bold" v-if="deportistas.filter(d => d.estado_afiliacion_asociacion === 'pendiente').length">
                ({{ deportistas.filter(d => d.estado_afiliacion_asociacion === 'pendiente').length }} pendientes de validación)
              </span>
            </div>
          </div>
          <div
            class="rounded-xl border border-slate-100 bg-slate-50/70 p-4 cursor-pointer hover:bg-slate-100/70 transition"
            :class="{ 'ring-2 ring-brand-500 bg-white': activeTab === 'tramites' }"
            @click="activeTab = 'tramites'"
          >
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Trámites Institucionales</div>
            <div class="mt-1 flex items-baseline gap-2">
              <span class="text-2xl font-black text-ink">{{ tramites.length }}</span>
              <span class="text-xs text-slate-400">expedientes de sus atletas</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Navegación por Pestañas -->
      <div class="border-b border-slate-200">
        <nav class="flex gap-4">
          <button
            class="pb-3 text-sm font-bold transition border-b-2"
            :class="activeTab === 'clubes' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
            @click="activeTab = 'clubes'"
          >
            🏢 Clubes Registrados ({{ clubes.length }})
          </button>
          <button
            class="pb-3 text-sm font-bold transition border-b-2 flex items-center gap-1.5"
            :class="activeTab === 'deportistas' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
            @click="activeTab = 'deportistas'"
          >
            🏃 Padrón de Deportistas ({{ deportistas.length }})
            <span
              v-if="deportistas.filter(d => d.estado_afiliacion_asociacion === 'pendiente').length"
              class="rounded-full bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 font-bold"
            >
              {{ deportistas.filter(d => d.estado_afiliacion_asociacion === 'pendiente').length }}
            </span>
          </button>
          <button
            class="pb-3 text-sm font-bold transition border-b-2 flex items-center gap-1.5"
            :class="activeTab === 'tramites' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'"
            @click="activeTab = 'tramites'"
          >
            📑 Trámites de Deportistas ({{ tramites.length }})
          </button>
        </nav>
      </div>

      <!-- PESTAÑA 1: CLUBES REGISTRADOS -->
      <section v-if="activeTab === 'clubes'" class="space-y-4">
        <!-- Barra de Búsqueda y Filtro de Clubes -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="relative w-full max-w-sm">
            <input
              v-model="searchClub"
              type="text"
              class="input-field pl-9 text-sm"
              placeholder="Buscar club por nombre, sigla o personería…"
            />
            <span class="absolute left-3 top-2.5 text-slate-400">🔍</span>
          </div>
          <div class="text-xs text-slate-500">
            Mostrando <strong>{{ clubesFiltrados.length }}</strong> de {{ clubes.length }} clubes
          </div>
        </div>

        <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3">Club Deportivo</th>
                <th class="px-4 py-3">Sigla</th>
                <th class="px-4 py-3">Personería Jurídica</th>
                <th class="px-4 py-3">Deportistas</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="club in clubesFiltrados" :key="club.id" class="hover:bg-slate-50/70 transition">
                <td class="px-4 py-3">
                  <div class="font-bold text-slate-900">{{ club.nombre }}</div>
                  <div v-if="club.email" class="text-xs text-slate-400">✉️ {{ club.email }}</div>
                </td>
                <td class="px-4 py-3 font-semibold text-slate-700">
                  {{ club.sigla || '—' }}
                </td>
                <td class="px-4 py-3 text-slate-600">
                  <div class="font-medium text-slate-800">{{ club.personeria_juridica || 'En trámite' }}</div>
                  <span
                    class="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase mt-0.5"
                    :class="{
                      'bg-emerald-100 text-emerald-800': club.estado_documentacion === 'vigente',
                      'bg-amber-100 text-amber-800': club.estado_documentacion === 'en_tramite' || !club.estado_documentacion,
                      'bg-red-100 text-red-800': club.estado_documentacion === 'observada'
                    }"
                  >
                    {{ club.estado_documentacion === 'vigente' ? '✓ Doc. Aprobada' : (club.estado_documentacion === 'observada' ? '⚠️ Observada' : '⏳ En Trámite') }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <button
                    class="inline-flex items-center gap-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 text-xs font-bold transition"
                    @click="verDeportistasClub(club)"
                  >
                    👥 {{ club.deportistas?.length || deportistas.filter(d => Number(d.club_id) === Number(club.id)).length }} atletas →
                  </button>
                </td>
                <td class="px-4 py-3">
                  <span
                    class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    :class="club.activo ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-500'"
                  >
                    {{ club.activo ? 'Afiliado' : 'Baja' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right space-x-2">
                  <button class="text-xs font-semibold text-brand-600 hover:underline" @click="openEditClubModal(club)">
                    Editar
                  </button>
                  <button
                    v-if="club.activo"
                    class="text-xs font-semibold text-red-600 hover:underline"
                    @click="toggleActiveClub(club)"
                  >
                    Dar de Baja
                  </button>
                </td>
              </tr>
              <tr v-if="!clubesFiltrados.length">
                <td colspan="6" class="px-4 py-12 text-center text-slate-400">
                  No se encontraron clubes registrados en esta asociación con los criterios especificados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- PESTAÑA 2: PADRÓN DE DEPORTISTAS Y VALIDACIÓN EN 2 FASES -->
      <section v-if="activeTab === 'deportistas'" class="space-y-4">
        <!-- Banner Normativo de Doble Validación -->
        <div class="rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-900 flex items-start gap-3">
          <span class="text-xl">ℹ️</span>
          <div>
            <div class="font-bold text-sky-950">Flujo de Afiliación Reglamentaria en Dos Fases:</div>
            <p class="mt-0.5 text-sky-800">
              Para que un deportista sea validado como miembro de la Asociación Departamental, primero debe contar obligatoriamente con el <strong>visto bueno y aceptación de su Club</strong>. La Asociación únicamente puede aprobar a deportistas que ya hayan sido validados por su respectivo club.
            </p>
          </div>
        </div>

        <!-- Filtros de Deportistas -->
        <div class="flex flex-wrap items-center gap-3">
          <input
            v-model="searchDep"
            type="text"
            class="input-field max-w-xs text-sm"
            placeholder="Buscar por nombre, CI o disciplina…"
          />
          <select v-model="filterClubDep" class="input-field max-w-xs text-sm">
            <option value="">Todos los Clubes</option>
            <option v-for="c in clubes" :key="c.id" :value="String(c.id)">
              {{ c.nombre }}
            </option>
          </select>
          <select v-model="filterEstadoAsocDep" class="input-field max-w-xs text-sm">
            <option value="">Estado en Asociación (Todos)</option>
            <option value="pendiente">⏳ Pendientes de Validación</option>
            <option value="aceptado">✓ Aceptados / Validados</option>
            <option value="rechazado">❌ Observados / Rechazados</option>
          </select>
        </div>

        <!-- Tabla de Deportistas -->
        <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3">Deportista</th>
                <th class="px-4 py-3">Club Adscrito</th>
                <th class="px-4 py-3">Disciplina / Categoría</th>
                <th class="px-4 py-3">1. Visto Bueno Club</th>
                <th class="px-4 py-3">2. Validación Asociación</th>
                <th class="px-4 py-3 text-right">Acción Reglamentaria</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="dep in deportistasFiltrados" :key="dep.id" class="hover:bg-slate-50/70 transition">
                <td class="px-4 py-3">
                  <div class="font-bold text-slate-900">{{ dep.apellidos }} {{ dep.nombres }}</div>
                  <div class="text-xs text-slate-400">CI: {{ dep.ci }} {{ dep.ci_expedido || '' }}</div>
                </td>
                <td class="px-4 py-3 text-slate-700">
                  <div class="font-medium text-slate-900">{{ dep.club?.nombre || '— Sin Club —' }}</div>
                  <div v-if="dep.club?.sigla" class="text-xs text-slate-400">Sigla: {{ dep.club.sigla }}</div>
                </td>
                <td class="px-4 py-3">
                  <span class="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {{ dep.disciplina || asociacion.disciplinas?.[0] || 'General' }}
                  </span>
                  <div class="text-xs text-slate-500 mt-0.5">{{ dep.categoria || 'Senior' }}</div>
                </td>
                <!-- Fase 1: Club -->
                <td class="px-4 py-3">
                  <span
                    class="rounded-full px-2.5 py-0.5 text-xs font-bold inline-block"
                    :class="{
                      'bg-emerald-100 text-emerald-800 border border-emerald-200': dep.estado_afiliacion_club === 'aceptado',
                      'bg-amber-100 text-amber-800 border border-amber-200': dep.estado_afiliacion_club === 'pendiente',
                      'bg-red-100 text-red-800 border border-red-200': dep.estado_afiliacion_club === 'rechazado'
                    }"
                  >
                    {{ dep.estado_afiliacion_club === 'aceptado' ? '✓ Visto Bueno' : (dep.estado_afiliacion_club === 'rechazado' ? '❌ Rechazado' : '⏳ Pendiente') }}
                  </span>
                </td>
                <!-- Fase 2: Asociación -->
                <td class="px-4 py-3">
                  <span
                    class="rounded-full px-2.5 py-0.5 text-xs font-bold inline-block"
                    :class="{
                      'bg-emerald-100 text-emerald-800 border border-emerald-200': dep.estado_afiliacion_asociacion === 'aceptado',
                      'bg-amber-100 text-amber-800 border border-amber-200': dep.estado_afiliacion_asociacion === 'pendiente',
                      'bg-red-100 text-red-800 border border-red-200': dep.estado_afiliacion_asociacion === 'rechazado'
                    }"
                  >
                    {{ dep.estado_afiliacion_asociacion === 'aceptado' ? '✓ Validado' : (dep.estado_afiliacion_asociacion === 'rechazado' ? '❌ Observado' : '⏳ Pendiente') }}
                  </span>
                </td>
                <!-- Acciones -->
                <td class="px-4 py-3 text-right">
                  <div v-if="dep.estado_afiliacion_asociacion === 'pendiente'" class="inline-flex items-center gap-1.5">
                    <button
                      v-if="dep.estado_afiliacion_club === 'aceptado'"
                      class="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1.5 transition shadow-sm"
                      title="Validar deportista en la asociación"
                      @click="aceptarDeportista(dep)"
                    >
                      ✓ Aceptar en Asociación
                    </button>
                    <button
                      v-else
                      disabled
                      class="rounded-lg bg-slate-100 text-slate-400 font-medium text-xs px-2.5 py-1.5 cursor-not-allowed border border-slate-200"
                      title="Requiere primero visto bueno formal de su club"
                    >
                      ⏳ Espera Club
                    </button>
                    <button
                      class="rounded-lg bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 text-xs px-2 py-1.5 transition"
                      title="Observar o rechazar deportista"
                      @click="openRechazarModal(dep)"
                    >
                      Observar
                    </button>
                  </div>
                  <div v-else-if="dep.estado_afiliacion_asociacion === 'aceptado'" class="text-xs font-semibold text-emerald-700">
                    ✓ Validado y Activo
                  </div>
                  <div v-else class="text-xs text-red-600 font-medium">
                    Observado
                  </div>
                </td>
              </tr>
              <tr v-if="!deportistasFiltrados.length">
                <td colspan="7" class="px-4 py-12 text-center text-slate-400">
                  No se encontraron deportistas registrados en esta asociación con los filtros aplicados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- PESTAÑA 3: SEGUIMIENTO DE TRÁMITES DE DEPORTISTAS -->
      <section v-if="activeTab === 'tramites'" class="space-y-4">
        <!-- Banner de Rol SEDEDE -->
        <div class="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-900 flex items-start gap-3">
          <span class="text-xl">⚖️</span>
          <div>
            <div class="font-bold text-indigo-950">Seguimiento Institucional de Trámites:</div>
            <p class="mt-0.5 text-indigo-800">
              La Asociación Deportiva puede consultar el avance, etapas cumplidas y formularios de seguimiento de los expedientes de sus atletas. <strong>El avance, derivación y resolución de cada etapa es facultad exclusiva del SEDEDE</strong>.
            </p>
          </div>
        </div>

        <!-- Filtros de Trámites -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <input
              v-model="searchTramite"
              type="text"
              class="input-field max-w-xs text-sm"
              placeholder="Buscar por código de trámite o atleta…"
            />
            <select v-model="filterEstadoTramite" class="input-field max-w-xs text-sm">
              <option value="">Todos los Estados</option>
              <option value="Iniciado / En Revisión">Iniciado / En Revisión</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Observada / Subsanación">Observada / Subsanación</option>
              <option value="Aprobado / Concluido">Aprobado / Concluido</option>
            </select>
          </div>
          <div class="text-xs text-slate-500">
            Total expedientes: <strong>{{ tramitesFiltrados.length }}</strong>
          </div>
        </div>

        <!-- Tabla de Trámites -->
        <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3">Expediente</th>
                <th class="px-4 py-3">Deportista</th>
                <th class="px-4 py-3">Club</th>
                <th class="px-4 py-3">Etapa Actual (Flujo SEDEDE)</th>
                <th class="px-4 py-3">Unidad Responsable</th>
                <th class="px-4 py-3">Estado</th>
                <th class="px-4 py-3 text-right">Expediente</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="t in tramitesFiltrados" :key="t.id" class="hover:bg-slate-50/70 transition">
                <td class="px-4 py-3 font-mono font-bold text-brand-600">
                  {{ t.codigo_tramite }}
                </td>
                <td class="px-4 py-3">
                  <div class="font-bold text-slate-900">{{ t.deportista?.apellidos }} {{ t.deportista?.nombres }}</div>
                  <div class="text-xs text-slate-400">CI: {{ t.deportista?.ci }}</div>
                </td>
                <td class="px-4 py-3 text-slate-700">
                  {{ t.deportista?.club?.nombre || 'Directo Asociación' }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <span class="rounded bg-brand-50 text-brand-700 px-2 py-0.5 text-xs font-bold border border-brand-200">
                      Etapa {{ t.etapa_actual }} de 17
                    </span>
                  </div>
                  <div class="w-32 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      class="bg-brand-600 h-1.5 rounded-full"
                      :style="{ width: `${Math.min(100, Math.round((t.etapa_actual / 17) * 100))}%` }"
                    ></div>
                  </div>
                </td>
                <td class="px-4 py-3 text-slate-600 font-medium">
                  🏢 {{ t.unidad_actual || 'SEDEDE' }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="rounded-full px-2.5 py-0.5 text-xs font-bold"
                    :class="{
                      'bg-emerald-100 text-emerald-800': t.etapa_actual >= 17 || t.estado?.includes('Concluido'),
                      'bg-amber-100 text-amber-800': t.estado?.includes('Observada'),
                      'bg-indigo-100 text-indigo-800': !t.estado?.includes('Concluido') && !t.estado?.includes('Observada')
                    }"
                  >
                    {{ t.estado }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    class="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 transition"
                    @click="verExpediente(t)"
                  >
                    Ver Expediente 📑
                  </button>
                </td>
              </tr>
              <tr v-if="!tramitesFiltrados.length">
                <td colspan="7" class="px-4 py-12 text-center text-slate-400">
                  No hay trámites registrados para los deportistas de esta asociación.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Modal Crear / Editar Club -->
      <div v-if="showClubModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-fade-in">
          <h3 class="mb-4 font-display text-lg font-bold text-ink">
            {{ editingClub ? 'Editar Club' : 'Nuevo Club Afiliado' }}
          </h3>

          <form class="space-y-4" @submit.prevent="submitClubForm">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre del Club *</label>
              <input v-model="clubForm.nombre" type="text" class="input-field text-sm" placeholder="ej. Club Deportivo Independiente" required :disabled="savingClub" />
            </div>

            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Sigla</label>
              <input v-model="clubForm.sigla" type="text" class="input-field text-sm" placeholder="ej. CDI" :disabled="savingClub" />
            </div>

            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">N° Personería Jurídica</label>
              <input v-model="clubForm.personeria_juridica" type="text" class="input-field text-sm" placeholder="ej. Res. Deptal. 045/2021" :disabled="savingClub" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">Teléfono</label>
                <input v-model="clubForm.telefono" type="text" class="input-field text-sm" placeholder="4-4123456" :disabled="savingClub" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-semibold text-slate-600">Email Oficial</label>
                <input v-model="clubForm.email" type="email" class="input-field text-sm" placeholder="club@gmail.com" :disabled="savingClub" />
              </div>
            </div>

            <div v-if="clubFormError" role="alert" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {{ clubFormError }}
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700" :disabled="savingClub" @click="closeClubModal">
                Cancelar
              </button>
              <button type="submit" class="btn-primary" :disabled="savingClub">
                {{ savingClub ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Rechazo / Observación Deportista -->
      <div v-if="showRechazarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-fade-in">
          <h3 class="font-display text-lg font-bold text-red-800">
            Observar / Rechazar Postulación
          </h3>
          <p class="text-xs text-slate-500 mt-1">
            Deportista: <strong>{{ selectedDeportista?.nombres }} {{ selectedDeportista?.apellidos }}</strong>
          </p>

          <form class="space-y-4 mt-4" @submit.prevent="submitRechazoDeportista">
            <div>
              <label class="mb-1 block text-xs font-semibold text-slate-600">Motivo u Observación *</label>
              <textarea
                v-model="motivoRechazo"
                rows="4"
                class="input-field text-sm"
                placeholder="Indique claramente por qué se observa la afiliación del deportista en la asociación..."
                required
                :disabled="procesandoRechazo"
              ></textarea>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                class="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                :disabled="procesandoRechazo"
                @click="showRechazarModal = false"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-4 py-2 transition"
                :disabled="procesandoRechazo"
              >
                {{ procesandoRechazo ? 'Registrando…' : 'Confirmar Observación' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Expediente Digital & Formulario / Checklist -->
      <div v-if="showExpedienteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto py-8">
        <div class="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl space-y-5 my-auto">
          <div class="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span class="rounded bg-brand-50 text-brand-700 font-mono text-xs font-bold px-2 py-0.5">
                {{ tramiteSeleccionado?.codigo_tramite }}
              </span>
              <h3 class="font-display text-xl font-black text-ink mt-1">
                Expediente Digital del Atleta
              </h3>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                :disabled="generandoPdf"
                @click="imprimirChecklist"
              >
                <span>{{ generandoPdf ? '⏳ Generando PDF…' : '📄 Imprimir Checklist Oficial (PDF)' }}</span>
              </button>
              <button
                class="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
                @click="showExpedienteModal = false"
              >
                ✕
              </button>
            </div>
          </div>

          <div v-if="loadingExpediente" class="py-12 text-center text-sm text-slate-400">
            Cargando expediente digital…
          </div>

          <div v-else-if="tramiteSeleccionado" class="space-y-5 text-sm">
            <!-- Datos del Deportista -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span class="text-slate-400 block font-semibold">Deportista:</span>
                <span class="font-bold text-slate-800">{{ tramiteSeleccionado.deportista?.nombres }} {{ tramiteSeleccionado.deportista?.apellidos }}</span>
              </div>
              <div>
                <span class="text-slate-400 block font-semibold">Cédula de Identidad:</span>
                <span class="font-bold text-slate-800">{{ tramiteSeleccionado.deportista?.ci }}</span>
              </div>
              <div>
                <span class="text-slate-400 block font-semibold">Etapa Actual:</span>
                <span class="font-bold text-brand-700">Etapa {{ tramiteSeleccionado.etapa_actual }} ({{ tramiteSeleccionado.unidad_actual }})</span>
              </div>
              <div>
                <span class="text-slate-400 block font-semibold">Estado General:</span>
                <span class="font-bold text-emerald-700">{{ tramiteSeleccionado.estado }}</span>
              </div>
            </div>

            <!-- Checklist de Seguimiento de las 17 Etapas Oficiales SEDEDE -->
            <div>
              <h4 class="font-bold text-slate-900 text-sm mb-2 flex items-center justify-between">
                <span>Checklist de Verificación de Etapas Cumplidas</span>
                <span class="text-xs text-brand-600 font-semibold">{{ tramiteSeleccionado.etapa_actual }}/17 completadas</span>
              </h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs">
                <div
                  v-for="i in 17"
                  :key="i"
                  class="flex items-center gap-2 p-2 rounded-lg border transition"
                  :class="i < tramiteSeleccionado.etapa_actual ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : (i === tramiteSeleccionado.etapa_actual ? 'bg-amber-50/80 border-amber-300 text-amber-900 font-bold' : 'bg-white border-slate-200 text-slate-400')"
                >
                  <span class="text-sm">
                    {{ i < tramiteSeleccionado.etapa_actual ? '✅' : (i === tramiteSeleccionado.etapa_actual ? '⏳' : '⚪') }}
                  </span>
                  <span>Paso {{ i }}: {{ i < tramiteSeleccionado.etapa_actual ? 'Etapa Cumplida' : (i === tramiteSeleccionado.etapa_actual ? 'En Proceso en SEDEDE' : 'Etapa Siguiente') }}</span>
                </div>
              </div>
            </div>

            <!-- Requisitos Adjuntos -->
            <div>
              <h4 class="font-bold text-slate-900 text-sm mb-2">Requisitos y Documentos Adjuntos</h4>
              <div class="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                <div
                  v-for="req in tramiteSeleccionado.requisitos"
                  :key="req.id"
                  class="p-3 flex items-center justify-between hover:bg-slate-50"
                >
                  <div>
                    <div class="font-semibold text-slate-800">{{ req.requisito_nombre }}</div>
                    <div class="text-[11px] text-slate-400">Archivo: {{ req.archivo_nombre }}</div>
                  </div>
                  <span
                    class="rounded-full px-2 py-0.5 font-bold text-[10px]"
                    :class="req.estado_validacion === 'Valido' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                  >
                    {{ req.estado_validacion }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Bitácora de Derivaciones -->
            <div>
              <h4 class="font-bold text-slate-900 text-sm mb-2">Trazabilidad de Derivaciones SEDEDE</h4>
              <div class="space-y-2 max-h-48 overflow-y-auto text-xs">
                <div
                  v-for="der in tramiteSeleccionado.derivaciones"
                  :key="der.id"
                  class="rounded-lg border border-slate-200 p-2.5 bg-slate-50/60"
                >
                  <div class="flex justify-between items-center text-slate-500 font-semibold">
                    <span>{{ der.unidad_origen }} → {{ der.unidad_destino }}</span>
                    <span>{{ new Date(der.created_at).toLocaleDateString('es-BO') }}</span>
                  </div>
                  <div class="text-slate-800 font-medium mt-1">{{ der.accion }}</div>
                  <div v-if="der.observacion" class="text-slate-500 text-[11px] mt-0.5 italic">"{{ der.observacion }}"</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
