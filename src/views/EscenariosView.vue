<script setup>
import { ref, reactive, onMounted } from 'vue'
import { escenarioService } from '../services/escenarioService'

const escenarios = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

const showEscenarioModal = ref(false)
const editingEscenario = ref(null)

const formError = ref('')
const saving = ref(false)
const modalTab = ref('general') // 'general' | 'disciplinas' | 'horarios' | 'tarifas'

const listaDisciplinasDisponibles = [
  'Fútbol', 'Atletismo', 'Baloncesto', 'Voleibol', 'Futsal', 
  'Ráquetbol', 'Karate', 'Lucha Olímpica', 'Judo', 'Natación', 
  'Gimnasia', 'Tenis de Mesa', 'Ciclismo', 'Billar', 'Bádminton'
]

const opcionesTipoUsuario = [
  'Club / Asociación',
  'Particular / Escuela',
  'Particular / Empresa',
  'Particular / Promotor',
  'Equipo Local Profesional',
  'Equipo Nacional Profesional',
  'Equipo Extranjero Profesional',
  'Federación / Simón Bolívar',
  'Asociación Chuquisaqueña de Fútbol',
  'Arrendatario Permanente',
  'Público General'
]

const opcionesConcepto = [
  'Entrenamiento',
  'Uso Deportivo',
  'Uso Nocturno',
  'Partido Oficial',
  'Uso Particular',
  'Partido Oficial con Taquilla',
  'Evento No Deportivo con Entrada',
  'Evento Extradeportivo',
  'Kiosco / Alquiler Comercial',
  'Parqueo Vehicular',
  'Baño Público'
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
  tarifas_valores: [],
})

const nuevaTarifaTemp = reactive({
  tipo_usuario: 'Particular / Escuela',
  concepto: 'Entrenamiento',
  turno: 'Dia',
  unidad: 'Hora',
  modalidad: 'monto_fijo',
  valor: 100.00,
  recargo_cessa: false,
  observaciones: '',
})

function agregarTarifaMatriz() {
  if (!nuevaTarifaTemp.tipo_usuario || !nuevaTarifaTemp.concepto || nuevaTarifaTemp.valor === null || nuevaTarifaTemp.valor === '') {
    alert('Por favor complete Tipo de Usuario, Concepto y Tarifa.')
    return
  }
  escenarioForm.tarifas_valores.push({
    tipo_usuario: nuevaTarifaTemp.tipo_usuario,
    concepto: nuevaTarifaTemp.concepto,
    turno: nuevaTarifaTemp.turno,
    unidad: nuevaTarifaTemp.unidad,
    modalidad: nuevaTarifaTemp.modalidad,
    valor: Number(nuevaTarifaTemp.valor),
    recargo_cessa: Boolean(nuevaTarifaTemp.recargo_cessa),
    observaciones: nuevaTarifaTemp.observaciones || '',
  })
  nuevaTarifaTemp.valor = 100.00
  nuevaTarifaTemp.observaciones = ''
}

function eliminarTarifaMatriz(index) {
  escenarioForm.tarifas_valores.splice(index, 1)
}

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
  escenarioForm.tarifas_valores = [
    {
      tipo_usuario: 'Club / Asociación',
      concepto: 'Entrenamiento',
      turno: 'Dia',
      unidad: 'Hora',
      modalidad: 'monto_fijo',
      valor: 80.00,
      recargo_cessa: false,
      observaciones: 'Tarifa preferencial asociacionista'
    },
    {
      tipo_usuario: 'Particular / Escuela',
      concepto: 'Uso Deportivo',
      turno: 'Dia',
      unidad: 'Hora',
      modalidad: 'monto_fijo',
      valor: 120.00,
      recargo_cessa: false,
      observaciones: 'Horario diurno general'
    },
    {
      tipo_usuario: 'Particular / Escuela',
      concepto: 'Uso Nocturno',
      turno: 'Noche',
      unidad: 'Hora',
      modalidad: 'monto_fijo',
      valor: 180.00,
      recargo_cessa: true,
      observaciones: 'Horario nocturno con iluminación'
    },
    {
      tipo_usuario: 'Asociación / Particular',
      concepto: 'Partido Oficial',
      turno: 'Ambos',
      unidad: 'Evento',
      modalidad: 'monto_fijo',
      valor: 200.00,
      recargo_cessa: true,
      observaciones: 'Competencia o torneo homologado'
    }
  ]
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

  // Cargar matriz de tarifas desde espacio_tarifario si existe
  const valores = esc.espacio_tarifario?.valores || []
  if (valores.length > 0) {
    escenarioForm.tarifas_valores = valores.map(v => ({
      id: v.id,
      tipo_usuario: v.tipo_usuario,
      concepto: v.concepto,
      turno: v.turno || 'Dia',
      unidad: v.unidad || 'Hora',
      modalidad: v.modalidad || 'monto_fijo',
      valor: Number(v.valor),
      recargo_cessa: Boolean(v.recargo_cessa),
      observaciones: v.observaciones || '',
    }))
  } else {
    // Generar defaults si no tenía matriz
    escenarioForm.tarifas_valores = [
      {
        tipo_usuario: 'Club / Asociación',
        concepto: 'Entrenamiento',
        turno: 'Dia',
        unidad: 'Hora',
        modalidad: 'monto_fijo',
        valor: Number(esc.tarifa_entrenamiento || 80.00),
        recargo_cessa: false,
        observaciones: 'Tarifa preferencial asociacionista'
      },
      {
        tipo_usuario: 'Particular / Escuela',
        concepto: 'Uso Deportivo',
        turno: 'Dia',
        unidad: 'Hora',
        modalidad: 'monto_fijo',
        valor: Number(esc.tarifa_base_dia || 120.00),
        recargo_cessa: false,
        observaciones: 'Horario diurno general'
      },
      {
        tipo_usuario: 'Particular / Escuela',
        concepto: 'Uso Nocturno',
        turno: 'Noche',
        unidad: 'Hora',
        modalidad: 'monto_fijo',
        valor: Number(esc.tarifa_base_noche || 180.00),
        recargo_cessa: Boolean(esc.tiene_iluminacion),
        observaciones: 'Horario nocturno con iluminación'
      },
      {
        tipo_usuario: 'Asociación / Particular',
        concepto: 'Partido Oficial',
        turno: 'Ambos',
        unidad: 'Evento',
        modalidad: 'monto_fijo',
        valor: Number(esc.tarifa_partido_oficial || 200.00),
        recargo_cessa: Boolean(esc.tiene_iluminacion),
        observaciones: 'Competencia o torneo homologado'
      }
    ]
  }

  modalTab.value = 'general'
  formError.value = ''
  showEscenarioModal.value = true
}

function closeModals() {
  showEscenarioModal.value = false
  editingEscenario.value = null
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
            <button class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-all" @click="openEditEscenarioModal(esc)">
              ✏️ Editar Parámetros y Tarifas
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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-xs">
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

          <!-- Cánones & Tarifas RAG 011/2024 Normalizadas -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Tarifario Aprobado (RAG 011/2024):</span>
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                {{ esc.espacio_tarifario?.valores?.length || 0 }} tarifas
              </span>
            </div>

            <!-- Si tiene tarifas en la matriz normalizada -->
            <div v-if="esc.espacio_tarifario?.valores && esc.espacio_tarifario.valores.length > 0" class="space-y-1">
              <div
                v-for="v in esc.espacio_tarifario.valores.slice(0, 3)"
                :key="v.id"
                class="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-slate-200/80 text-[11px]"
              >
                <div class="truncate max-w-[170px]" :title="`${v.tipo_usuario} - ${v.concepto}`">
                  <span class="font-bold text-slate-800">{{ v.tipo_usuario }}:</span>
                  <span class="text-slate-500 ml-1">{{ v.concepto }}</span>
                </div>
                <span class="font-mono font-bold text-emerald-800 whitespace-nowrap ml-1 text-xs">
                  {{ v.modalidad === 'porcentaje' ? `${formatMoney(v.valor)}%` : `Bs. ${formatMoney(v.valor)}` }}
                  <span class="text-[9px] font-normal text-slate-400">/{{ v.unidad }}</span>
                </span>
              </div>
              <div v-if="esc.espacio_tarifario.valores.length > 3" class="text-[10px] text-emerald-700 font-semibold text-right pt-0.5">
                + {{ esc.espacio_tarifario.valores.length - 3 }} tarifa(s) adicionales configuradas
              </div>
            </div>

            <!-- Fallback a tarifas base si aún no tuviese matriz -->
            <div v-else class="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px]">
              <div>Día: <span class="font-mono font-bold text-emerald-800">Bs. {{ formatMoney(esc.tarifa_base_dia || 120) }}</span></div>
              <div>Noche: <span class="font-mono font-bold text-emerald-800">Bs. {{ formatMoney(esc.tarifa_base_noche || 180) }}</span></div>
              <div>Entrenamiento: <span class="font-mono font-bold text-slate-800">Bs. {{ formatMoney(esc.tarifa_entrenamiento || 80) }}</span></div>
              <div>Oficial: <span class="font-mono font-bold text-slate-800">Bs. {{ formatMoney(esc.tarifa_partido_oficial || 200) }}</span></div>
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

          <!-- PESTAÑA 4: MATRIZ DE TARIFAS NORMALIZADA (RAG 011/2024) -->
          <div v-if="modalTab === 'tarifas'" class="space-y-4 text-xs">
            <div>
              <h4 class="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span>📋</span> Matriz Oficial de Tarifas Homologadas (RAG CH/N.º 011/2024)
              </h4>
              <p class="text-slate-500 text-[11px] mt-0.5">
                Defina los cánones y tarifas aplicables según el Tipo de Usuario y Concepto para este recinto deportivo:
              </p>
            </div>

            <!-- Tabla de Tarifas Actuales en el Escenario -->
            <div class="overflow-x-auto max-h-56 rounded-xl border border-slate-200">
              <table class="w-full text-left text-xs text-slate-700">
                <thead class="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th class="py-2 px-2.5">Tipo de Usuario</th>
                    <th class="py-2 px-2.5">Concepto de Uso</th>
                    <th class="py-2 px-2">Turno</th>
                    <th class="py-2 px-2">Tarifa</th>
                    <th class="py-2 px-2">Unidad</th>
                    <th class="py-2 px-2 text-center">CESSA</th>
                    <th class="py-2 px-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="(tv, idx) in escenarioForm.tarifas_valores" :key="idx" class="hover:bg-slate-50">
                    <td class="py-2 px-2.5 font-semibold text-slate-900">{{ tv.tipo_usuario }}</td>
                    <td class="py-2 px-2.5 text-emerald-800 font-medium">{{ tv.concepto }}</td>
                    <td class="py-2 px-2">
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100">
                        {{ tv.turno }}
                      </span>
                    </td>
                    <td class="py-2 px-2 font-mono font-bold text-emerald-700">
                      {{ tv.modalidad === 'porcentaje' ? `${formatMoney(tv.valor)}%` : `Bs. ${formatMoney(tv.valor)}` }}
                    </td>
                    <td class="py-2 px-2 text-slate-500">{{ tv.unidad }}</td>
                    <td class="py-2 px-2 text-center">
                      <span v-if="tv.recargo_cessa" class="text-amber-600 font-bold text-[10px]">⚡ Sí</span>
                      <span v-else class="text-slate-400 text-[10px]">No</span>
                    </td>
                    <td class="py-2 px-2 text-center">
                      <button
                        type="button"
                        @click="eliminarTarifaMatriz(idx)"
                        class="text-red-500 hover:text-red-700 font-bold p-1 rounded hover:bg-red-50"
                        title="Eliminar tarifa"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                  <tr v-if="escenarioForm.tarifas_valores.length === 0">
                    <td colspan="7" class="py-3 text-center text-slate-400 italic">
                      No hay tarifas configuradas en la matriz para este escenario. Agregue al menos una tarifa a continuación.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Formulario Rápido para Agregar Tarifa a la Matriz -->
            <div class="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/70 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <span>➕</span> Agregar Nueva Tarifa a la Matriz
                </span>
                <span class="text-[11px] text-emerald-800 font-medium">Norma RAG 011/2024</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Tipo de Usuario *</label>
                  <select v-model="nuevaTarifaTemp.tipo_usuario" class="w-full rounded-lg border-slate-200 py-1.5 text-xs bg-white">
                    <option v-for="tu in opcionesTipoUsuario" :key="tu" :value="tu">{{ tu }}</option>
                  </select>
                </div>

                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Concepto de Uso *</label>
                  <select v-model="nuevaTarifaTemp.concepto" class="w-full rounded-lg border-slate-200 py-1.5 text-xs bg-white">
                    <option v-for="c in opcionesConcepto" :key="c" :value="c">{{ c }}</option>
                  </select>
                </div>

                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Turno Horario</label>
                  <select v-model="nuevaTarifaTemp.turno" class="w-full rounded-lg border-slate-200 py-1.5 text-xs bg-white">
                    <option value="Dia">☀️ Día (06:00 - 18:00)</option>
                    <option value="Noche">🌙 Noche (18:00 - 22:00)</option>
                    <option value="Ambos">☀️🌙 Ambos Turnos</option>
                  </select>
                </div>

                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Tarifa Oficial *</label>
                  <input
                    v-model.number="nuevaTarifaTemp.valor"
                    type="number"
                    step="5"
                    min="0"
                    class="w-full rounded-lg border-slate-200 py-1.5 text-xs font-mono font-bold"
                    placeholder="ej. 150"
                  />
                </div>

                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Unidad de Medida</label>
                  <select v-model="nuevaTarifaTemp.unidad" class="w-full rounded-lg border-slate-200 py-1.5 text-xs bg-white">
                    <option value="Hora">Hora</option>
                    <option value="Evento">Evento</option>
                    <option value="Mes">Mes</option>
                    <option value="Día">Día</option>
                    <option value="Porcentaje">Porcentaje (Taquilla)</option>
                  </select>
                </div>

                <div class="flex items-center gap-2 pt-4">
                  <input type="checkbox" id="tempCessa" v-model="nuevaTarifaTemp.recargo_cessa" class="rounded text-emerald-600" />
                  <label for="tempCessa" class="text-[11px] font-semibold text-slate-700 cursor-pointer">
                    Aplica Recargo CESSA (Noche)
                  </label>
                </div>
              </div>

              <div class="flex justify-end pt-1">
                <button
                  type="button"
                  @click="agregarTarifaMatriz"
                  class="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  + Agregar a la Matriz
                </button>
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
                {{ saving ? 'Guardando…' : 'Guardar Escenario & Tarifas' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
