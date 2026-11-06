<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import clubesService from '../services/clubesService'

const route = useRoute()
const clubIdParam = route.params.clubId || null

const loading = ref(true)
const savingDoc = ref(false)
const processingAtleta = ref(null)
const error = ref(null)
const successMsg = ref('')

const club = ref(null)
const asociacion = ref(null)
const metricas = ref({
  total_deportistas: 0,
  atletas_aceptados: 0,
  solicitudes_pendientes: 0,
  documentacion_completa: false,
  estado_documentacion: 'en_tramite',
})

const atletasPendientes = ref([])
const atletasAceptados = ref([])
const activeTab = ref('pendientes') // 'pendientes' | 'activos' | 'documentacion'

// Formulario de documentación
const docForm = reactive({
  nombre: '',
  sigla: '',
  personeria_juridica: '',
  fecha_eleccion_directiva: '',
  telefono: '',
  email: '',
  direccion: '',
  documento_personeria: '',
  documento_estatutos: '',
  documento_acta_directiva: '',
  estado_documentacion: 'en_tramite',
})

// Modal de Rechazar/Observar
const showRechazarModal = ref(false)
const atletaARechazar = ref(null)
const motivoRechazo = ref('')

// Modal Afiliar Atleta Directo
const showNuevoAtletaModal = ref(false)
const guardandoAtleta = ref(false)
const nuevoAtletaError = ref('')
const nuevoAtletaForm = reactive({
  nombres: '',
  apellidos: '',
  ci: '',
  expedido: 'CH',
  sexo: 'M',
  fecha_nacimiento: '',
  telefono: '',
  categoria: 'Élite',
  ranking_nacional: '',
})

async function cargarDatosClub() {
  loading.value = true
  error.value = null
  try {
    const res = clubIdParam
      ? await clubesService.getClubPortal(clubIdParam)
      : await clubesService.getMiClub()

    club.value = res.data || {}
    asociacion.value = club.value.asociacion || null
    metricas.value = res.metricas || metricas.value

    // Llenar formulario de documentación
    docForm.nombre = club.value.nombre || ''
    docForm.sigla = club.value.sigla || ''
    docForm.personeria_juridica = club.value.personeria_juridica || ''
    docForm.fecha_eleccion_directiva = club.value.fecha_eleccion_directiva ? club.value.fecha_eleccion_directiva.slice(0, 10) : ''
    docForm.telefono = club.value.telefono || ''
    docForm.email = club.value.email || ''
    docForm.direccion = club.value.direccion || ''
    docForm.documento_personeria = club.value.documento_personeria || ''
    docForm.documento_estatutos = club.value.documento_estatutos || ''
    docForm.documento_acta_directiva = club.value.documento_acta_directiva || ''
    docForm.estado_documentacion = club.value.estado_documentacion || 'en_tramite'

    // Cargar listas de deportistas
    await cargarDeportistas()
  } catch (err) {
    console.error('Error cargando portal del club:', err)
    error.value = err.response?.data?.error || 'Error al conectar con la ficha oficial del club deportivo.'
  } finally {
    loading.value = false
  }
}

async function cargarDeportistas() {
  if (!club.value?.id) return
  try {
    const res = await clubesService.getDeportistasClub(club.value.id)
    atletasPendientes.value = res.pendientes || []
    atletasAceptados.value = res.aceptados || []
    metricas.value.solicitudes_pendientes = atletasPendientes.value.length
    metricas.value.atletas_aceptados = atletasAceptados.value.length
    metricas.value.total_deportistas = res.total || 0

    // Si no hay pendientes, mostrar por defecto la pestaña de activos
    if (atletasPendientes.value.length === 0 && activeTab.value === 'pendientes') {
      activeTab.value = 'activos'
    }
  } catch (err) {
    console.error('Error cargando deportistas del club:', err)
  }
}

async function guardarDocumentacion() {
  savingDoc.value = true
  successMsg.value = ''
  error.value = null
  try {
    const payload = { ...docForm }
    const res = await clubesService.actualizarDocumentacion(club.value.id, payload)
    club.value = res.data || club.value
    successMsg.value = 'Documentación institucional y personería jurídica guardadas exitosamente.'
    setTimeout(() => { successMsg.value = '' }, 4000)
  } catch (err) {
    error.value = err.response?.data?.message || err.response?.data?.error || 'Error al actualizar la documentación del club.'
  } finally {
    savingDoc.value = false
  }
}

async function aceptarDeportista(dep) {
  processingAtleta.value = dep.id
  try {
    await clubesService.aceptarDeportista(club.value.id, dep.id)
    await cargarDeportistas()
  } catch (err) {
    alert(err.response?.data?.message || 'Error al aceptar deportista.')
  } finally {
    processingAtleta.value = null
  }
}

function abrirModalRechazar(dep) {
  atletaARechazar.value = dep
  motivoRechazo.value = ''
  showRechazarModal.value = true
}

async function confirmarRechazo() {
  if (!motivoRechazo.value) {
    alert('Debe especificar un motivo para observar o rechazar la solicitud.')
    return
  }
  processingAtleta.value = atletaARechazar.value.id
  try {
    await clubesService.rechazarDeportista(club.value.id, atletaARechazar.value.id, {
      observaciones: motivoRechazo.value,
    })
    showRechazarModal.value = false
    await cargarDeportistas()
  } catch (err) {
    alert(err.response?.data?.message || 'Error al procesar el rechazo.')
  } finally {
    processingAtleta.value = null
  }
}

async function guardarNuevoAtleta() {
  guardandoAtleta.value = true
  nuevoAtletaError.value = ''
  try {
    await clubesService.afiliarDeportista(club.value.id, { ...nuevoAtletaForm })
    showNuevoAtletaModal.value = false
    nuevoAtletaForm.nombres = ''
    nuevoAtletaForm.apellidos = ''
    nuevoAtletaForm.ci = ''
    nuevoAtletaForm.ranking_nacional = ''
    await cargarDeportistas()
  } catch (err) {
    nuevoAtletaError.value = err.response?.data?.message || err.response?.data?.error || 'Error al registrar deportista.'
  } finally {
    guardandoAtleta.value = false
  }
}

onMounted(() => {
  cargarDatosClub()
})
</script>

<template>
  <div class="mt-8 space-y-6">
    <!-- Breadcrumb si viene de Asociaciones -->
    <nav v-if="clubIdParam && asociacion" class="flex items-center gap-2 text-xs text-slate-500">
      <router-link to="/dashboard/clubes" class="hover:text-brand-700">Clubes</router-link>
      <span>/</span>
      <router-link :to="`/dashboard/asociaciones/${asociacion.id}`" class="hover:text-brand-700">{{ asociacion.nombre }}</router-link>
      <span>/</span>
      <span class="font-bold text-slate-800">{{ club?.nombre }}</span>
    </nav>

    <!-- Estado de Carga -->
    <div v-if="loading" class="py-20 text-center text-slate-400">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-brand-700 border-r-transparent"></div>
      <p class="mt-3 text-xs font-semibold">Cargando expediente del club deportivo…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
      {{ error }}
    </div>

    <template v-else-if="club">
      <!-- Banner Principal del Club -->
      <div
        class="rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style="background: linear-gradient(135deg, #5A0B17 0%, #7A0F1F 45%, #9F1327 100%);"
      >
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold tracking-wide uppercase backdrop-blur-sm border border-white/25">
              Portal Oficial de Club Deportivo
            </span>
            <span
              class="px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm"
              :class="club.estado_documentacion === 'vigente' 
                ? 'bg-emerald-400 text-slate-900' 
                : club.estado_documentacion === 'observada' 
                  ? 'bg-rose-400 text-white' 
                  : 'bg-amber-400 text-slate-900'"
            >
              {{ club.estado_documentacion === 'vigente' ? '✓ Personería Vigente' : 'En Trámite de Personería' }}
            </span>
          </div>

          <h1 class="text-2xl font-display font-bold tracking-tight mt-2 text-white flex items-center gap-2">
            <span>{{ club.nombre }}</span>
            <span v-if="club.sigla" class="text-base text-red-200 font-normal">({{ club.sigla }})</span>
          </h1>

          <p class="text-red-100 text-xs mt-1 max-w-2xl leading-relaxed">
            Afiliado a: <strong>{{ asociacion?.nombre || 'Asociación Departamental' }}</strong>
            <span v-if="club.personeria_juridica"> · Personería Jurídica N°: {{ club.personeria_juridica }}</span>
          </p>
        </div>

        <div class="flex flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            @click="showNuevoAtletaModal = true"
            class="px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-red-50 transition-all flex items-center gap-1.5"
            style="background-color: #ffffff; color: #7A0F1F;"
          >
            <span class="font-black text-sm">+</span>
            <span>Afiliar Deportista</span>
          </button>
        </div>
      </div>

      <!-- Alerta si hay atletas pendientes de aceptación -->
      <div
        v-if="atletasPendientes.length > 0"
        class="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl">⏳</span>
          <div>
            <h3 class="text-xs font-bold text-amber-900">
              ¡Tienes {{ atletasPendientes.length }} deportista(s) esperando ser aceptado(s) en tu club!
            </h3>
            <p class="text-[11px] text-amber-800">
              Revisa la lista de solicitudes y acéptalos formalmente para que queden habilitados en las competencias oficiales.
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="activeTab = 'pendientes'"
          class="btn-primary text-xs font-bold py-1.5 px-4 bg-amber-700 hover:bg-amber-800 text-white shrink-0 shadow-xs"
        >
          Revisar Solicitudes ({{ atletasPendientes.length }})
        </button>
      </div>

      <!-- Tarjetas Métricas Rápidas -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Atletas</span>
          <p class="mt-2 font-display text-2xl font-black text-slate-900">{{ metricas.total_deportistas }}</p>
          <p class="text-[11px] text-slate-500 mt-0.5">En el padrón del club</p>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span class="text-xs font-bold text-emerald-700 uppercase tracking-wide">Atletas Aceptados</span>
          <p class="mt-2 font-display text-2xl font-black text-emerald-700">✓ {{ metricas.atletas_aceptados }}</p>
          <p class="text-[11px] text-slate-500 mt-0.5">Afiliados y habilitados</p>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span class="text-xs font-bold text-amber-700 uppercase tracking-wide">Pendientes Aprobación</span>
          <p class="mt-2 font-display text-2xl font-black text-amber-700">⏳ {{ metricas.solicitudes_pendientes }}</p>
          <p class="text-[11px] text-slate-500 mt-0.5">Esperan decisión del club</p>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span class="text-xs font-bold text-brand-700 uppercase tracking-wide">Documentación Legal</span>
          <p class="mt-2 font-display text-base font-black text-slate-900 capitalize truncate">
            {{ club.estado_documentacion || 'En Trámite' }}
          </p>
          <p class="text-[11px] text-slate-500 mt-0.5">Personería y Estatutos</p>
        </div>
      </div>

      <!-- Mensaje de Éxito Temporal -->
      <div v-if="successMsg" class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
        ✓ {{ successMsg }}
      </div>

      <!-- Selector de Pestañas: Documentación vs Deportistas -->
      <div class="border-b border-slate-200">
        <nav class="flex gap-4">
          <button
            type="button"
            class="py-3 px-1 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5"
            :class="activeTab === 'pendientes'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'"
            @click="activeTab = 'pendientes'"
          >
            <span>⏳ Solicitudes Pendientes</span>
            <span
              v-if="atletasPendientes.length"
              class="rounded-full bg-amber-100 text-amber-900 px-1.5 py-0.2 text-[10px] font-black"
            >
              {{ atletasPendientes.length }}
            </span>
          </button>

          <button
            type="button"
            class="py-3 px-1 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5"
            :class="activeTab === 'activos'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'"
            @click="activeTab = 'activos'"
          >
            <span>👥 Atletas Aceptados ({{ atletasAceptados.length }})</span>
          </button>

          <button
            type="button"
            class="py-3 px-1 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5"
            :class="activeTab === 'documentacion'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'"
            @click="activeTab = 'documentacion'"
          >
            <span>📜 Personería Jurídica y Documentos Legales</span>
          </button>
        </nav>
      </div>

      <!-- CONTENIDO PESTAÑA 1: SOLICITUDES PENDIENTES DE ACEPTACIÓN -->
      <div v-if="activeTab === 'pendientes'" class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-display text-base font-bold text-slate-900">
              Deportistas que solicitan afiliarse a {{ club.nombre }}
            </h3>
            <p class="text-xs text-slate-500">
              Como club con personería jurídica, tienes la potestad de aceptar o rechazar formalmente la inscripción de los atletas.
            </p>
          </div>
        </div>

        <div v-if="atletasPendientes.length === 0" class="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400">
          <span class="text-3xl">🎉</span>
          <p class="mt-2 text-sm font-bold text-slate-700">No hay solicitudes pendientes en este momento.</p>
          <p class="text-xs text-slate-400 mt-0.5">Todos los deportistas registrados en el club ya han sido procesados.</p>
        </div>

        <div v-else class="grid gap-3 sm:grid-cols-2">
          <div
            v-for="dep in atletasPendientes"
            :key="dep.id"
            class="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class="font-display text-base font-bold text-slate-900">
                    {{ dep.nombres }} {{ dep.apellidos }}
                  </h4>
                  <p class="text-xs font-semibold text-brand-700">{{ dep.disciplina }} · {{ dep.categoria }}</p>
                  <p class="text-[11px] text-slate-500 font-mono mt-0.5">CI: {{ dep.ci }} {{ dep.expedido }}</p>
                </div>
                <span class="rounded bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5">
                  Pendiente
                </span>
              </div>

              <div class="mt-3 pt-2 border-t border-amber-200/60 text-xs text-slate-600 space-y-1">
                <p><strong>Teléfono:</strong> {{ dep.telefono || 'Sin teléfono' }}</p>
                <p v-if="dep.ranking_nacional"><strong>Ranking:</strong> N° {{ dep.ranking_nacional }}</p>
                <p v-if="dep.historial_logros" class="italic text-[11px] line-clamp-1">"{{ dep.historial_logros }}"</p>
              </div>
            </div>

            <!-- Botones de Acción: Aceptar o Rechazar -->
            <div class="mt-4 pt-3 border-t border-amber-200 flex items-center justify-end gap-2">
              <button
                type="button"
                @click="abrirModalRechazar(dep)"
                class="px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50 text-xs font-bold transition-all"
                :disabled="processingAtleta === dep.id"
              >
                ✕ Rechazar / Observar
              </button>
              <button
                type="button"
                @click="aceptarDeportista(dep)"
                class="btn-primary px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                :disabled="processingAtleta === dep.id"
              >
                <span>✓ Aceptar en el Club</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CONTENIDO PESTAÑA 2: ATLETAS ACEPTADOS Y ACTIVOS -->
      <div v-if="activeTab === 'activos'" class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="font-display text-base font-bold text-slate-900">
              Padrón de Deportistas Afiliados a {{ club.nombre }}
            </h3>
            <p class="text-xs text-slate-500">Atletas con ficha técnica activa y aprobación del club.</p>
          </div>
          <button
            type="button"
            @click="showNuevoAtletaModal = true"
            class="btn-primary text-xs font-bold py-1.5 px-4 bg-brand-700 hover:bg-brand-800"
          >
            + Afiliar Nuevo Atleta
          </button>
        </div>

        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3">Deportista</th>
                <th class="px-4 py-3">C.I.</th>
                <th class="px-4 py-3">Categoría / Rama</th>
                <th class="px-4 py-3">Ranking Deptal</th>
                <th class="px-4 py-3">Fecha Afiliación</th>
                <th class="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="dep in atletasAceptados" :key="dep.id" class="hover:bg-slate-50">
                <td class="px-4 py-3">
                  <div class="font-bold text-slate-900">{{ dep.nombres }} {{ dep.apellidos }}</div>
                  <div class="text-[11px] text-slate-400">{{ dep.disciplina }} · {{ dep.telefono || 'Sin celular' }}</div>
                </td>
                <td class="px-4 py-3 font-mono text-xs text-slate-700 font-bold">
                  {{ dep.ci }} {{ dep.expedido }}
                </td>
                <td class="px-4 py-3 text-xs text-slate-600">
                  {{ dep.categoria }} ({{ dep.sexo === 'F' ? 'Femenino' : 'Masculino' }})
                </td>
                <td class="px-4 py-3 text-xs font-mono font-bold text-brand-700">
                  {{ dep.ranking_nacional ? `Puesto #${dep.ranking_nacional}` : '—' }}
                </td>
                <td class="px-4 py-3 text-xs text-slate-500 font-mono">
                  {{ dep.fecha_afiliacion_club ? new Date(dep.fecha_afiliacion_club).toLocaleDateString('es-BO') : 'Acreditado' }}
                </td>
                <td class="px-4 py-3">
                  <span class="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5">
                    ✓ Afiliado Activo
                  </span>
                </td>
              </tr>
              <tr v-if="!atletasAceptados.length">
                <td colspan="6" class="px-4 py-8 text-center text-slate-400">No hay atletas aceptados en este club.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- CONTENIDO PESTAÑA 3: DOCUMENTACIÓN LEGAL Y PERSONERÍA JURÍDICA -->
      <div v-if="activeTab === 'documentacion'" class="space-y-6">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div class="border-b border-slate-100 pb-4 mb-6">
            <h3 class="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>📜 Expediente de Personería Jurídica y Documentos del Club</span>
            </h3>
            <p class="text-xs text-slate-500 mt-1">
              Los clubes deportivos con personería jurídica departamental tienen acreditación plena para recibir aportes institucionales y emitir avales de competencia.
            </p>
          </div>

          <form @submit.prevent="guardarDocumentacion" class="space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Nombre Oficial del Club *</label>
                <input v-model="docForm.nombre" type="text" class="input-field text-sm w-full" required :disabled="savingDoc" />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Sigla Oficial</label>
                <input v-model="docForm.sigla" type="text" class="input-field text-sm w-full" placeholder="ej. CAS" :disabled="savingDoc" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">N° de Resolución de Personería Jurídica *</label>
                <input
                  v-model="docForm.personeria_juridica"
                  type="text"
                  class="input-field text-sm w-full"
                  placeholder="ej. Res. Adm. Departamental 102/2020"
                  required
                  :disabled="savingDoc"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Fecha de Elección / Posesión Directiva</label>
                <input v-model="docForm.fecha_eleccion_directiva" type="date" class="input-field text-sm w-full" :disabled="savingDoc" />
              </div>
            </div>

            <!-- Bloque de Archivos y Documentos Digitales -->
            <div class="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-4">
              <h4 class="text-xs font-bold uppercase tracking-wider text-brand-800">Archivos y Documentos de Respaldo Digital</h4>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">1. Documento Personería (PDF)</label>
                  <input
                    v-model="docForm.documento_personeria"
                    type="text"
                    placeholder="archivo_personeria.pdf"
                    class="input-field text-xs w-full font-mono"
                    :disabled="savingDoc"
                  />
                  <p class="text-[10px] text-slate-400 mt-1">Copia legalizada de la Resolución</p>
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">2. Estatutos Orgánicos (PDF)</label>
                  <input
                    v-model="docForm.documento_estatutos"
                    type="text"
                    placeholder="estatutos_club.pdf"
                    class="input-field text-xs w-full font-mono"
                    :disabled="savingDoc"
                  />
                  <p class="text-[10px] text-slate-400 mt-1">Estatuto y reglamento interno</p>
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">3. Acta de Posesión Directiva</label>
                  <input
                    v-model="docForm.documento_acta_directiva"
                    type="text"
                    placeholder="acta_posesion.pdf"
                    class="input-field text-xs w-full font-mono"
                    :disabled="savingDoc"
                  />
                  <p class="text-[10px] text-slate-400 mt-1">Nómina oficial de directivos</p>
                </div>
              </div>
            </div>

            <!-- Datos de Contacto y Sede -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Teléfono / Celular de Contacto</label>
                <input v-model="docForm.telefono" type="text" class="input-field text-sm w-full" placeholder="ej. 72891234" :disabled="savingDoc" />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico Oficial</label>
                <input v-model="docForm.email" type="email" class="input-field text-sm w-full" placeholder="club@gmail.com" :disabled="savingDoc" />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Dirección / Sede Social</label>
                <input v-model="docForm.direccion" type="text" class="input-field text-sm w-full" placeholder="Calle / Zona" :disabled="savingDoc" />
              </div>
            </div>

            <!-- Estado de Documentación -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Estado de Acreditación Institucional</label>
              <select v-model="docForm.estado_documentacion" class="input-field text-sm w-full max-w-xs" :disabled="savingDoc">
                <option value="vigente">Vigente / Completa</option>
                <option value="en_tramite">En Trámite de Renovación</option>
                <option value="observada">Observada por la Asociación / SEDEDE</option>
              </select>
            </div>

            <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                class="btn-primary text-xs font-bold py-2.5 px-6 bg-brand-700 hover:bg-brand-800 shadow-sm"
                :disabled="savingDoc"
              >
                {{ savingDoc ? 'Guardando expediente…' : 'Guardar Documentación del Club' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </template>

    <!-- MODAL RECHAZAR O OBSERVAR DEPORTISTA -->
    <div
      v-if="showRechazarModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <div class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <h3 class="font-display text-base font-bold text-slate-900">
          Observar o Rechazar Afiliación
        </h3>
        <p class="text-xs text-slate-500 mt-1">
          Deportista: <strong>{{ atletaARechazar?.nombres }} {{ atletaARechazar?.apellidos }}</strong>
        </p>

        <div class="mt-4">
          <label class="block text-xs font-bold text-slate-700 mb-1">Motivo u Observación *</label>
          <textarea
            v-model="motivoRechazo"
            rows="3"
            class="input-field text-xs w-full"
            placeholder="Indica el motivo por el cual no se acepta la afiliación (ej. cupo completo, falta de documentación de pase, etc.)..."
            required
          ></textarea>
        </div>

        <div class="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800"
            @click="showRechazarModal = false"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn-primary text-xs font-bold py-1.5 px-4 bg-red-600 hover:bg-red-700 text-white"
            @click="confirmarRechazo"
          >
            Confirmar Observación
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL AFILIAR NUEVO DEPORTISTA DIRECTO -->
    <div
      v-if="showNuevoAtletaModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <div class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="font-display text-base font-bold text-slate-900">
            Afiliar Nuevo Atleta a {{ club?.nombre }}
          </h3>
          <button type="button" class="text-slate-400 hover:text-slate-600" @click="showNuevoAtletaModal = false">✕</button>
        </div>

        <form @submit.prevent="guardarNuevoAtleta" class="mt-4 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Nombres *</label>
              <input v-model="nuevoAtletaForm.nombres" type="text" class="input-field text-xs w-full" required :disabled="guardandoAtleta" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Apellidos *</label>
              <input v-model="nuevoAtletaForm.apellidos" type="text" class="input-field text-xs w-full" required :disabled="guardandoAtleta" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div class="col-span-2">
              <label class="block text-xs font-bold text-slate-700 mb-1">C.I. *</label>
              <input v-model="nuevoAtletaForm.ci" type="text" class="input-field text-xs w-full" placeholder="ej. 10458921" required :disabled="guardandoAtleta" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Exp.</label>
              <select v-model="nuevoAtletaForm.expedido" class="input-field text-xs w-full" :disabled="guardandoAtleta">
                <option value="CH">CH</option>
                <option value="LP">LP</option>
                <option value="CB">CB</option>
                <option value="SC">SC</option>
                <option value="OR">OR</option>
                <option value="PT">PT</option>
                <option value="TJ">TJ</option>
                <option value="BE">BE</option>
                <option value="PD">PD</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
              <input v-model="nuevoAtletaForm.fecha_nacimiento" type="date" class="input-field text-xs w-full" :disabled="guardandoAtleta" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Sexo *</label>
              <select v-model="nuevoAtletaForm.sexo" class="input-field text-xs w-full" :disabled="guardandoAtleta">
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
              <input v-model="nuevoAtletaForm.categoria" type="text" class="input-field text-xs w-full" placeholder="ej. Élite / Juvenil" :disabled="guardandoAtleta" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Ranking Inicial</label>
              <input v-model="nuevoAtletaForm.ranking_nacional" type="number" class="input-field text-xs w-full" placeholder="ej. 1" :disabled="guardandoAtleta" />
            </div>
          </div>

          <div v-if="nuevoAtletaError" class="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
            {{ nuevoAtletaError }}
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" class="px-3 py-1.5 text-xs font-bold text-slate-600" @click="showNuevoAtletaModal = false">
              Cancelar
            </button>
            <button type="submit" class="btn-primary text-xs font-bold py-2 px-5 bg-brand-700 hover:bg-brand-800" :disabled="guardandoAtleta">
              {{ guardandoAtleta ? 'Afiliando…' : 'Afiliar al Club' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
