<script setup>
import { ref, reactive, onMounted } from 'vue'
import { escenarioService } from '../services/escenarioService'

const escenarios = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

const showEscenarioModal = ref(false)
const showProgModal = ref(false)
const editingEscenario = ref(null)
const targetEscenario = ref(null)

const formError = ref('')
const saving = ref(false)
const modalTab = ref('general') // 'general' | 'disciplinas' | 'horarios' | 'tarifas'

const listaDisciplinasDisponibles = [
  'Fútbol', 'Atletismo', 'Baloncesto', 'Voleibol', 'Futsal', 
  'Ráquetbol', 'Karate', 'Lucha Olímpica', 'Judo', 'Natación', 
  'Gimnasia', 'Tenis de Mesa', 'Ciclismo', 'Billar', 'Bádminton'
]

const escenarioForm = reactive({
  nombre: '',
  espacio: '',
  ubicacion: '',
  capacidad_espectadores: '',
  tiene_iluminacion: true,
  disciplinas: ['Fútbol'],
  hora_apertura: '06:00',
  hora_cierre: '22:00',
  turnos_habilitados: ['Dia', 'Noche'],
  tarifa_base_dia: 120.00,
  tarifa_base_noche: 180.00,
  recargo_iluminacion_cessa: 75.00,
  tarifa_entrenamiento: 80.00,
  tarifa_partido_oficial: 200.00,
  estado_operativo: 'Habilitado',
  observaciones_tecnicas: '',
})

const progForm = reactive({
  dia_semana: 'Lunes',
  hora_inicio: '14:00',
  hora_fin: '16:00',
  usuario_asignado: '',
  tipo_evento: 'Entrenamiento',
  turno: 'Día',
})

function resetEscenarioForm() {
  escenarioForm.nombre = ''
  escenarioForm.espacio = ''
  escenarioForm.ubicacion = ''
  escenarioForm.capacidad_espectadores = ''
  escenarioForm.tiene_iluminacion = true
  escenarioForm.disciplinas = ['Fútbol']
  escenarioForm.hora_apertura = '06:00'
  escenarioForm.hora_cierre = '22:00'
  escenarioForm.turnos_habilitados = ['Dia', 'Noche']
  escenarioForm.tarifa_base_dia = 120.00
  escenarioForm.tarifa_base_noche = 180.00
  escenarioForm.recargo_iluminacion_cessa = 75.00
  escenarioForm.tarifa_entrenamiento = 80.00
  escenarioForm.tarifa_partido_oficial = 200.00
  escenarioForm.estado_operativo = 'Habilitado'
  escenarioForm.observaciones_tecnicas = ''
  modalTab.value = 'general'
  formError.value = ''
}

function toggleDisciplinaSelection(disc) {
  const index = escenarioForm.disciplinas.indexOf(disc)
  if (index > -1) {
    if (escenarioForm.disciplinas.length > 1) {
      escenarioForm.disciplinas.splice(index, 1)
    }
  } else {
    escenarioForm.disciplinas.push(disc)
  }
}

function toggleTurnoSelection(turno) {
  const index = escenarioForm.turnos_habilitados.indexOf(turno)
  if (index > -1) {
    if (escenarioForm.turnos_habilitados.length > 1) {
      escenarioForm.turnos_habilitados.splice(index, 1)
    }
  } else {
    escenarioForm.turnos_habilitados.push(turno)
  }
}

function resetProgForm() {
  progForm.dia_semana = 'Lunes'
  progForm.hora_inicio = '14:00'
  progForm.hora_fin = '16:00'
  progForm.usuario_asignado = ''
  progForm.tipo_evento = 'Entrenamiento'
  progForm.turno = 'Día'
  formError.value = ''
}

async function fetchEscenarios() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const rawData = await escenarioService.list()
    escenarios.value = (rawData || []).map(e => {
      if (typeof e.disciplinas === 'string') {
        try { e.disciplinas = JSON.parse(e.disciplinas) } catch { e.disciplinas = [e.disciplinas] }
      }
      if (typeof e.turnos_habilitados === 'string') {
        try { e.turnos_habilitados = JSON.parse(e.turnos_habilitados) } catch { e.turnos_habilitados = ['Dia', 'Noche'] }
      }
      return e
    })
  } catch (error) {
    errorMessage.value = error.response?.data?.error || 'Error al cargar escenarios deportivos.'
  } finally {
    isLoading.value = false
  }
}

function openCreateEscenarioModal() {
  editingEscenario.value = null
  resetEscenarioForm()
  showEscenarioModal.value = true
}

function openEditEscenarioModal(esc) {
  editingEscenario.value = esc
  escenarioForm.nombre = esc.nombre || ''
  escenarioForm.espacio = esc.espacio || ''
  escenarioForm.ubicacion = esc.ubicacion || ''
  escenarioForm.capacidad_espectadores = esc.capacidad_espectadores || ''
  escenarioForm.tiene_iluminacion = Boolean(esc.tiene_iluminacion)

  let listDisc = esc.disciplinas || ['Fútbol']
  if (typeof listDisc === 'string') {
    try { listDisc = JSON.parse(listDisc) } catch { listDisc = [listDisc] }
  }
  escenarioForm.disciplinas = Array.isArray(listDisc) ? [...listDisc] : ['Fútbol']

  escenarioForm.hora_apertura = esc.hora_apertura || '06:00'
  escenarioForm.hora_cierre = esc.hora_cierre || '22:00'

  let listTurnos = esc.turnos_habilitados || ['Dia', 'Noche']
  if (typeof listTurnos === 'string') {
    try { listTurnos = JSON.parse(listTurnos) } catch { listTurnos = ['Dia', 'Noche'] }
  }
  escenarioForm.turnos_habilitados = Array.isArray(listTurnos) ? [...listTurnos] : ['Dia', 'Noche']

  escenarioForm.tarifa_base_dia = esc.tarifa_base_dia ?? 120.00
  escenarioForm.tarifa_base_noche = esc.tarifa_base_noche ?? 180.00
  escenarioForm.recargo_iluminacion_cessa = esc.recargo_iluminacion_cessa ?? 75.00
  escenarioForm.tarifa_entrenamiento = esc.tarifa_entrenamiento ?? 80.00
  escenarioForm.tarifa_partido_oficial = esc.tarifa_partido_oficial ?? 200.00
  escenarioForm.estado_operativo = esc.estado_operativo || 'Habilitado'
  escenarioForm.observaciones_tecnicas = esc.observaciones_tecnicas || ''

  modalTab.value = 'general'
  formError.value = ''
  showEscenarioModal.value = true
}

function openProgModal(esc) {
  targetEscenario.value = esc
  resetProgForm()
  showProgModal.value = true
}

function closeModals() {
  showEscenarioModal.value = false
  showProgModal.value = false
  editingEscenario.value = null
  targetEscenario.value = null
}

async function submitEscenarioForm() {
  saving.value = true
  formError.value = ''
  try {
    const payload = { ...escenarioForm }
    if (editingEscenario.value) {
      await escenarioService.update(editingEscenario.value.id, payload)
    } else {
      await escenarioService.create(payload)
    }
    closeModals()
    await fetchEscenarios()
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors
      formError.value = errors ? Object.values(errors).flat().join(' ') : 'Campos requeridos vacíos o inválidos.'
    } else {
      formError.value = error.response?.data?.error || 'Error al guardar escenario.'
    }
  } finally {
    saving.value = false
  }
}

async function submitProgForm() {
  saving.value = true
  formError.value = ''
  try {
    await escenarioService.createProgramacion(targetEscenario.value.id, { ...progForm })
    closeModals()
    await fetchEscenarios()
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data?.errors
      formError.value = errors ? Object.values(errors).flat().join(' ') : 'Verifique los datos de la reserva.'
    } else {
      formError.value = error.response?.data?.error || 'Error al guardar la programación.'
    }
  } finally {
    saving.value = false
  }
}

async function toggleActiveEscenario(esc) {
  try {
    if (esc.activo) {
      await escenarioService.delete(esc.id)
    } else {
      await escenarioService.reactivar(esc.id)
    }
    await fetchEscenarios()
  } catch (error) {
    alert(error.response?.data?.error || 'Error al modificar estado del escenario.')
  }
}

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(fetchEscenarios)
</script>

<template>
  <div class="mt-8 space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div>
        <h1 class="font-display text-2xl font-bold text-slate-800">Escenarios Deportivos</h1>
        <p class="text-xs text-slate-500 mt-1">Lista de escenarios, horarios y tarifas.</p>
      </div>
      <button class="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-all shadow flex items-center gap-2" @click="openCreateEscenarioModal">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        + Registrar Nuevo Escenario
      </button>
    </div>

    <div v-if="isLoading" class="p-8 text-center text-slate-500">Cargando programación y parámetros de escenarios...</div>
    <div v-else-if="errorMessage" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ errorMessage }}
    </div>

    <div v-else class="space-y-6">
      <div v-for="esc in escenarios" :key="esc.id" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-emerald-300 transition-all">
        <!-- Encabezado principal del escenario -->
        <div class="mb-4 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="font-display text-xl font-bold text-slate-900">{{ esc.nombre }} — <span class="text-emerald-700">{{ esc.espacio }}</span></h2>
              <span
                :class="[
                  'rounded-full px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wide',
                  esc.estado_operativo === 'Habilitado' && esc.activo ? 'bg-emerald-100 text-emerald-800' :
                  esc.estado_operativo === 'En Mantenimiento' ? 'bg-amber-100 text-amber-800' :
                  esc.estado_operativo === 'En Remodelación' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                ]"
              >
                ● {{ esc.estado_operativo || (esc.activo ? 'Habilitado' : 'Inactivo') }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              📍 Ubicación: <span class="font-semibold text-slate-700">{{ esc.ubicacion || 'Complejo Deportivo Patria' }}</span> | 
              🏟️ Capacidad: <span class="font-semibold text-slate-700">{{ esc.capacidad_espectadores ? esc.capacidad_espectadores.toLocaleString() : 'N/A' }} personas</span>
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
              {{ esc.tiene_iluminacion ? '💡 Iluminación Nocturna' : '☀️ Solo Día' }}
            </span>
            <button class="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all" @click="openProgModal(esc)">
              + Asignar Horario
            </button>
            <button class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-all" @click="openEditEscenarioModal(esc)">
              ✏️ Editar Parámetros
            </button>
            <button
              class="px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all"
              :class="esc.activo ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'"
              @click="toggleActiveEscenario(esc)"
            >
              {{ esc.activo ? 'Inactivar' : 'Reactivar' }}
            </button>
          </div>
        </div>

        <!-- Parámetros Clave: Disciplinas, Horarios y Tarifas RAG 011/2024 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-xs mb-4">
          <!-- Disciplinas -->
          <div>
            <span class="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">Disciplinas Oficiales Aptas:</span>
            <div class="flex flex-wrap gap-1">
              <span v-for="disc in (esc.disciplinas || ['Fútbol'])" :key="disc" class="px-2 py-0.5 bg-emerald-50 text-emerald-900 font-semibold rounded border border-emerald-100 text-[10px]">
                ⚽ {{ disc }}
              </span>
            </div>
          </div>

          <!-- Horarios Operativos -->
          <div>
            <span class="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">Horarios Operativos de Atención:</span>
            <p class="font-bold text-slate-800 text-xs">⏰ {{ esc.hora_apertura || '06:00' }} - {{ esc.hora_cierre || '22:00' }}</p>
            <p class="text-slate-500 text-[11px] mt-0.5">
              Turnos: <span class="font-semibold text-emerald-700">{{ (esc.turnos_habilitados || ['Dia', 'Noche']).join(', ') }}</span>
            </p>
          </div>

          <!-- Cánones & Tarifas -->
          <div>
            <span class="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">Tarifario Aprobado (RAG 011/2024):</span>
            <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
              <div>Día: <span class="font-mono font-bold text-emerald-800">Bs. {{ formatMoney(esc.tarifa_base_dia || 120) }}</span></div>
              <div>Noche: <span class="font-mono font-bold text-emerald-800">Bs. {{ formatMoney(esc.tarifa_base_noche || 180) }}</span></div>
              <div>Entrenamiento: <span class="font-mono font-bold text-slate-800">Bs. {{ formatMoney(esc.tarifa_entrenamiento || 80) }}</span></div>
              <div>Oficial: <span class="font-mono font-bold text-slate-800">Bs. {{ formatMoney(esc.tarifa_partido_oficial || 200) }}</span></div>
            </div>
          </div>
        </div>

        <!-- Franjas horarias reservadas -->
        <div v-if="!esc.programaciones || esc.programaciones.length === 0" class="text-xs text-slate-400 py-1 italic">
          Sin reservas de franjas horarias fijas asignadas.
        </div>

        <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="p in esc.programaciones" :key="p.id" class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div class="mb-1 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>{{ p.dia_semana }}</span>
              <span class="font-mono text-emerald-700">{{ p.hora_inicio }} - {{ p.hora_fin }}</span>
            </div>
            <p class="text-xs font-semibold text-slate-900">{{ p.usuario_asignado }}</p>
            <div class="mt-2 flex items-center justify-between text-[11px]">
              <span class="rounded bg-slate-100 px-2 py-0.5 text-slate-700 font-medium">{{ p.tipo_evento }}</span>
              <span class="font-bold" :class="p.turno === 'Noche' ? 'text-indigo-600' : 'text-amber-600'">Turno {{ p.turno }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL CREAR / EDITAR ESCENARIO (COMPLETO CON MULTISECCIÓN) -->
    <div v-if="showEscenarioModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 p-4">
      <div class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center border-b pb-3">
          <div>
            <h3 class="font-display text-lg font-bold text-slate-900">
              {{ editingEscenario ? 'Editar Parámetros de Escenario Deportivo' : 'Registrar Nuevo Escenario Deportivo' }}
            </h3>
            <p class="text-xs text-slate-500">Configure los datos técnicos, disciplinas habilitadas, horarios y tarifas RAG 011/2024.</p>
          </div>
          <button @click="closeModals" class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        <!-- Pestañas de Navegación dentro del Modal -->
        <div class="flex border-b border-slate-200 text-xs font-bold gap-2">
          <button
            type="button"
            @click="modalTab = 'general'"
            :class="['py-2 px-3 border-b-2 transition-all', modalTab === 'general' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-700']"
          >
            1. Datos Generales
          </button>
          <button
            type="button"
            @click="modalTab = 'disciplinas'"
            :class="['py-2 px-3 border-b-2 transition-all', modalTab === 'disciplinas' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-700']"
          >
            2. Disciplinas Aptas ({{ escenarioForm.disciplinas.length }})
          </button>
          <button
            type="button"
            @click="modalTab = 'horarios'"
            :class="['py-2 px-3 border-b-2 transition-all', modalTab === 'horarios' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-700']"
          >
            3. Horarios & Mantenimiento
          </button>
          <button
            type="button"
            @click="modalTab = 'tarifas'"
            :class="['py-2 px-3 border-b-2 transition-all', modalTab === 'tarifas' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-700']"
          >
            4. Cánones & Tarifario
          </button>
        </div>

        <form @submit.prevent="submitEscenarioForm" class="space-y-4 pt-2">
          <!-- PESTAÑA 1: DATOS GENERALES -->
          <div v-if="modalTab === 'general'" class="space-y-4 text-xs">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Nombre del Escenario / Recinto *</label>
                <input v-model="escenarioForm.nombre" type="text" class="w-full rounded-xl border-slate-200 py-2 text-xs" placeholder="ej. Estadio Patria" required :disabled="saving" />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Espacio Específico *</label>
                <input v-model="escenarioForm.espacio" type="text" class="w-full rounded-xl border-slate-200 py-2 text-xs" placeholder="ej. Óvalo Central / Sintética Pequeña" required :disabled="saving" />
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Ubicación / Dirección Exacta</label>
              <input v-model="escenarioForm.ubicacion" type="text" class="w-full rounded-xl border-slate-200 py-2 text-xs" placeholder="ej. Av. Jaime Mendoza S/N, Complejo Patria" :disabled="saving" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Capacidad de Espectadores</label>
                <input v-model.number="escenarioForm.capacidad_espectadores" type="number" class="w-full rounded-xl border-slate-200 py-2 text-xs" placeholder="ej. 30000" :disabled="saving" />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Estado Operativo *</label>
                <select v-model="escenarioForm.estado_operativo" class="w-full rounded-xl border-slate-200 py-2 text-xs font-semibold">
                  <option value="Habilitado">🟢 Habilitado (Operativo)</option>
                  <option value="En Mantenimiento">🟡 En Mantenimiento</option>
                  <option value="En Remodelación">🔵 En Remodelación</option>
                  <option value="Deshabilitado">🔴 Deshabilitado</option>
                </select>
              </div>
            </div>

            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
              <input v-model="escenarioForm.tiene_iluminacion" type="checkbox" id="ilumCheck" class="rounded text-emerald-600" :disabled="saving" />
              <label for="ilumCheck" class="font-semibold text-slate-800 cursor-pointer">
                Posee Iluminación Nocturna (permite recargo por luz)
              </label>
            </div>
          </div>

          <!-- PESTAÑA 2: DISCIPLINAS DEPORTIVAS APTAS -->
          <div v-if="modalTab === 'disciplinas'" class="space-y-3 text-xs">
            <p class="font-semibold text-slate-700">Seleccione todas las disciplinas técnicas permitidas en esta infraestructura:</p>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label
                v-for="disc in listaDisciplinasDisponibles"
                :key="disc"
                @click.prevent="toggleDisciplinaSelection(disc)"
                :class="[
                  'p-2 rounded-lg border font-semibold flex items-center gap-2 cursor-pointer transition-all select-none',
                  escenarioForm.disciplinas.includes(disc)
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-950 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                ]"
              >
                <input
                  type="checkbox"
                  :checked="escenarioForm.disciplinas.includes(disc)"
                  class="rounded text-emerald-600 pointer-events-none"
                />
                ⚽ {{ disc }}
              </label>
            </div>
          </div>

          <!-- PESTAÑA 3: HORARIOS DE FUNCIONAMIENTO -->
          <div v-if="modalTab === 'horarios'" class="space-y-4 text-xs">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Hora de Apertura *</label>
                <input v-model="escenarioForm.hora_apertura" type="time" class="w-full rounded-xl border-slate-200 py-2 text-xs font-mono font-bold" required :disabled="saving" />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Hora de Cierre *</label>
                <input v-model="escenarioForm.hora_cierre" type="time" class="w-full rounded-xl border-slate-200 py-2 text-xs font-mono font-bold" required :disabled="saving" />
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Turnos Habilitados</label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    :checked="escenarioForm.turnos_habilitados.includes('Dia')"
                    @change="toggleTurnoSelection('Dia')"
                    class="rounded text-emerald-600"
                  />
                  ☀️ Turno Día (06:00 - 18:00)
                </label>

                <label class="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    :checked="escenarioForm.turnos_habilitados.includes('Noche')"
                    @change="toggleTurnoSelection('Noche')"
                    class="rounded text-emerald-600"
                  />
                  🌙 Turno Noche (18:00 - 22:00)
                </label>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Observaciones Técnicas / Equipamiento</label>
              <textarea v-model="escenarioForm.observaciones_tecnicas" rows="3" class="w-full rounded-xl border-slate-200 py-2 text-xs" placeholder="ej. Gramado sintético homologado, arcos reglamentarios..." :disabled="saving"></textarea>
            </div>
          </div>

          <!-- PESTAÑA 4: CÁNONES & TARIFARIO RAG 011/2024 -->
          <div v-if="modalTab === 'tarifas'" class="space-y-4 text-xs">
            <p class="font-semibold text-slate-700">Configure los valores oficiales aprobados en el Tarifario (RAG CH/N.º 011/2024):</p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Tarifa Base por Hora (Día) Bs. *</label>
                <input v-model.number="escenarioForm.tarifa_base_dia" type="number" step="10" min="0" class="w-full rounded-xl border-slate-200 py-2 text-xs font-mono font-bold" required :disabled="saving" />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Tarifa Base por Hora (Noche) Bs. *</label>
                <input v-model.number="escenarioForm.tarifa_base_noche" type="number" step="10" min="0" class="w-full rounded-xl border-slate-200 py-2 text-xs font-mono font-bold" required :disabled="saving" />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Recargo Hora Iluminación Nocturna Bs.</label>
                <input v-model.number="escenarioForm.recargo_iluminacion_cessa" type="number" step="5" min="0" class="w-full rounded-xl border-slate-200 py-2 text-xs font-mono font-bold" :disabled="saving" />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Tarifa Hora Entrenamiento Bs.</label>
                <input v-model.number="escenarioForm.tarifa_entrenamiento" type="number" step="10" min="0" class="w-full rounded-xl border-slate-200 py-2 text-xs font-mono font-bold" :disabled="saving" />
              </div>

              <div class="md:col-span-2">
                <label class="block font-semibold text-slate-700 mb-1">Tarifa Hora Partido Oficial / Evento Bs.</label>
                <input v-model.number="escenarioForm.tarifa_partido_oficial" type="number" step="10" min="0" class="w-full rounded-xl border-slate-200 py-2 text-xs font-mono font-bold text-emerald-800" :disabled="saving" />
              </div>
            </div>
          </div>

          <div v-if="formError" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </div>

          <div class="flex justify-between items-center pt-4 border-t border-slate-200">
            <div class="flex gap-2">
              <button
                type="button"
                v-if="modalTab !== 'general'"
                @click="modalTab = modalTab === 'tarifas' ? 'horarios' : modalTab === 'horarios' ? 'disciplinas' : 'general'"
                class="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                ‹ Anterior
              </button>
              <button
                type="button"
                v-if="modalTab !== 'tarifas'"
                @click="modalTab = modalTab === 'general' ? 'disciplinas' : modalTab === 'disciplinas' ? 'horarios' : 'tarifas'"
                class="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold"
              >
                Siguiente ›
              </button>
            </div>

            <div class="flex gap-2">
              <button type="button" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl" :disabled="saving" @click="closeModals">
                Cancelar
              </button>
              <button type="submit" class="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md" :disabled="saving">
                {{ saving ? 'Guardando…' : 'Guardar Parámetros' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL RESERVAR PROGRAMACIÓN HORARIA -->
    <div v-if="showProgModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <h3 class="mb-1 font-display text-lg font-bold text-slate-900">Reservar Franja Horaria</h3>
        <p class="mb-2 text-xs text-slate-500">{{ targetEscenario?.nombre }} — {{ targetEscenario?.espacio }}</p>

        <form class="space-y-4 text-xs" @submit.prevent="submitProgForm">
          <div>
            <label class="mb-1 block font-semibold text-slate-700">Entidad / Usuario Asignado *</label>
            <input v-model="progForm.usuario_asignado" type="text" class="w-full rounded-xl border-slate-200 py-2 text-xs" placeholder="ej. Asociación Departamental de Fútbol" required :disabled="saving" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block font-semibold text-slate-700">Día de la semana *</label>
              <select v-model="progForm.dia_semana" class="w-full rounded-xl border-slate-200 py-2 text-xs" required :disabled="saving">
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miércoles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
                <option value="Sábado">Sábado</option>
                <option value="Domingo">Domingo</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block font-semibold text-slate-700">Turno *</label>
              <select v-model="progForm.turno" class="w-full rounded-xl border-slate-200 py-2 text-xs" required :disabled="saving">
                <option value="Día">Día</option>
                <option value="Noche">Noche</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block font-semibold text-slate-700">Hora Inicio *</label>
              <input v-model="progForm.hora_inicio" type="time" class="w-full rounded-xl border-slate-200 py-2 text-xs font-mono" required :disabled="saving" />
            </div>
            <div>
              <label class="mb-1 block font-semibold text-slate-700">Hora Fin *</label>
              <input v-model="progForm.hora_fin" type="time" class="w-full rounded-xl border-slate-200 py-2 text-xs font-mono" required :disabled="saving" />
            </div>
          </div>

          <div>
            <label class="mb-1 block font-semibold text-slate-700">Tipo de Evento *</label>
            <input v-model="progForm.tipo_evento" type="text" class="w-full rounded-xl border-slate-200 py-2 text-xs" placeholder="ej. Entrenamiento / Competencia Oficial" required :disabled="saving" />
          </div>

          <div v-if="formError" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {{ formError }}
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl" :disabled="saving" @click="closeModals">
              Cancelar
            </button>
            <button type="submit" class="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md" :disabled="saving">
              {{ saving ? 'Guardando…' : 'Reservar Franja' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
