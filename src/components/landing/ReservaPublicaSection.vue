<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { escenarioService } from '../../services/escenarioService'

const loadingEscenarios = ref(true)
const escenarios = ref([])
const errorMsg = ref('')
const successMsg = ref('')

// Filtros y selección
const selectedEscenarioNombre = ref('')
const selectedEspacio = ref('')
const fechaUso = ref(new Date().toISOString().split('T')[0])
const turnoFiltro = ref('Ambos')

// Disponibilidad
const loadingDisponibilidad = ref(false)
const franjas = ref([])
const horasDisponibles = ref([])

// Formulario de reserva
const form = ref({
  solicitante_nombre: '',
  solicitante_ci: '',
  solicitante_telefono: '',
  disciplina: 'Fútbol',
  concepto: 'Práctica deportiva recreativa / Particular',
  hora_inicio: '18:00',
  hora_fin: '20:00',
  observaciones: '',
})

// Cotización en tiempo real
const loadingCotizacion = ref(false)
const cotizacion = ref(null)
const sendingReserva = ref(false)
const reservaCompletada = ref(null)

// Lista de disciplinas populares
const disciplinasList = [
  'Fútbol',
  'Futsal',
  'Baloncesto',
  'Voleibol',
  'Atletismo',
  'Natación',
  'Tenis',
  'Ráquetbol',
  'Karate',
  'Gimnasia',
  'Deporte General',
]

// Lista de escenarios únicos
const escenariosUnicos = computed(() => {
  const set = new Set()
  escenarios.value.forEach((e) => {
    if (e.nombre) set.add(e.nombre)
  })
  return Array.from(set).sort()
})

// Espacios del escenario seleccionado
const espaciosDisponibles = computed(() => {
  if (!selectedEscenarioNombre.value) return []
  return escenarios.value.filter((e) => e.nombre === selectedEscenarioNombre.value)
})

// Espacio actualmente seleccionado en detalle
const espacioSeleccionadoObj = computed(() => {
  if (!selectedEspacio.value) return null
  return escenarios.value.find(
    (e) => e.nombre === selectedEscenarioNombre.value && e.espacio === selectedEspacio.value
  )
})

// Cargar escenarios públicos al montar
onMounted(async () => {
  try {
    loadingEscenarios.value = true
    const data = await escenarioService.getEscenariosPublicos()
    escenarios.value = Array.isArray(data) ? data : []

    // Seleccionar por defecto Estadio Patria o el primero
    const preferido = escenarios.value.find((e) => e.nombre.includes('Estadio Patria')) || escenarios.value[0]
    if (preferido) {
      selectedEscenarioNombre.value = preferido.nombre
      selectedEspacio.value = preferido.espacio
      if (preferido.disciplinas && preferido.disciplinas.length > 0) {
        form.value.disciplina = preferido.disciplinas[0]
      }
    }
  } catch (err) {
    console.error('Error al cargar escenarios públicos:', err)
    errorMsg.value = 'No se pudo conectar con el catálogo de escenarios deportivos.'
  } finally {
    loadingEscenarios.value = false
  }
})

// Cuando cambia el escenario, ajustar espacio
watch(selectedEscenarioNombre, (newVal) => {
  if (!newVal) return
  const espacios = escenarios.value.filter((e) => e.nombre === newVal)
  if (espacios.length > 0) {
    selectedEspacio.value = espacios[0].espacio
    if (espacios[0].disciplinas && espacios[0].disciplinas.length > 0) {
      form.value.disciplina = espacios[0].disciplinas[0]
    }
  }
})

// Consultar disponibilidad cuando cambia escenario, espacio o fecha
const consultarDisponibilidad = async () => {
  if (!selectedEscenarioNombre.value || !selectedEspacio.value || !fechaUso.value) return

  loadingDisponibilidad.value = true
  errorMsg.value = ''
  try {
    const data = await escenarioService.getDisponibilidadPublica({
      escenario_nombre: selectedEscenarioNombre.value,
      espacio: selectedEspacio.value,
      fecha: fechaUso.value,
      turno: turnoFiltro.value,
    })
    franjas.value = data.franjas || []
    horasDisponibles.value = data.horas_disponibles_inicio || []

    // Si la hora de inicio actual ya no está disponible, seleccionar la primera disponible
    if (horasDisponibles.value.length > 0) {
      if (!horasDisponibles.value.includes(form.value.hora_inicio)) {
        form.value.hora_inicio = horasDisponibles.value[0]
        const hNum = parseInt(form.value.hora_inicio.split(':')[0], 10)
        const hFin = String(Math.min(hNum + 2, 22)).padStart(2, '0') + ':00'
        form.value.hora_fin = hFin
      }
    }
    await calcularCotizacion()
  } catch (err) {
    console.error('Error al consultar disponibilidad:', err)
  } finally {
    loadingDisponibilidad.value = false
  }
}

watch([selectedEscenarioNombre, selectedEspacio, fechaUso, turnoFiltro], () => {
  consultarDisponibilidad()
})

// Calcular duración en horas
const duracionHoras = computed(() => {
  if (!form.value.hora_inicio || !form.value.hora_fin) return 0
  const tIni = parseInt(form.value.hora_inicio.split(':')[0], 10)
  const tFin = parseInt(form.value.hora_fin.split(':')[0], 10)
  return Math.max(0, tFin - tIni)
})

// Turno derivado
const turnoCalculado = computed(() => {
  if (!form.value.hora_inicio) return 'Dia'
  const h = parseInt(form.value.hora_inicio.split(':')[0], 10)
  return h >= 18 ? 'Noche' : 'Dia'
})

// Cotizar tarifa oficial
const calcularCotizacion = async () => {
  if (!selectedEscenarioNombre.value || !selectedEspacio.value || duracionHoras.value <= 0) {
    cotizacion.value = null
    return
  }

  loadingCotizacion.value = true
  try {
    const data = await escenarioService.cotizarPublico({
      escenario_nombre: selectedEscenarioNombre.value,
      espacio: selectedEspacio.value,
      duracion_horas: duracionHoras.value,
      turno: turnoCalculado.value,
    })
    cotizacion.value = data
  } catch (err) {
    console.error('Error al cotizar:', err)
  } finally {
    loadingCotizacion.value = false
  }
}

watch([() => form.value.hora_inicio, () => form.value.hora_fin], () => {
  calcularCotizacion()
})

// Seleccionar franja rápida
const seleccionarFranja = (franja) => {
  if (!franja.disponible) return
  form.value.hora_inicio = franja.hora_inicio
  const hNum = parseInt(franja.hora_inicio.split(':')[0], 10)
  const hFin = String(Math.min(hNum + 2, 22)).padStart(2, '0') + ':00'
  form.value.hora_fin = hFin
}

// Enviar solicitud de reserva particular
const enviarReserva = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!form.value.solicitante_nombre.trim()) {
    errorMsg.value = 'Por favor ingrese su nombre completo o denominación.'
    return
  }
  if (!form.value.solicitante_ci.trim()) {
    errorMsg.value = 'Por favor ingrese su Cédula de Identidad (CI).'
    return
  }
  if (!form.value.solicitante_telefono.trim()) {
    errorMsg.value = 'Por favor ingrese un número de celular o WhatsApp para coordinar la confirmación.'
    return
  }
  if (duracionHoras.value <= 0) {
    errorMsg.value = 'La hora de fin debe ser posterior a la hora de inicio.'
    return
  }

  sendingReserva.value = true
  try {
    const payload = {
      escenario_nombre: selectedEscenarioNombre.value,
      espacio: selectedEspacio.value,
      escenario_id: espacioSeleccionadoObj.value?.id || null,
      solicitante_nombre: form.value.solicitante_nombre.trim(),
      solicitante_ci: form.value.solicitante_ci.trim(),
      solicitante_telefono: form.value.solicitante_telefono.trim(),
      disciplina: form.value.disciplina,
      concepto: form.value.concepto.trim(),
      fecha_uso: fechaUso.value,
      hora_inicio: form.value.hora_inicio,
      hora_fin: form.value.hora_fin,
      duracion_horas: duracionHoras.value,
      turno: turnoCalculado.value,
      observaciones: form.value.observaciones ? form.value.observaciones.trim() : null,
    }

    const response = await escenarioService.solicitarReservaPublica(payload)
    reservaCompletada.value = response.data
    successMsg.value = response.message || 'Solicitud de reserva ingresada exitosamente.'
  } catch (err) {
    console.error('Error al enviar reserva:', err)
    const backendMsg = err.response?.data?.message || err.response?.data?.error
    errorMsg.value = backendMsg || 'No se pudo procesar la reserva. Verifique que el horario no haya sido reservado por otra persona.'
  } finally {
    sendingReserva.value = false
  }
}

// Reiniciar para otra reserva
const resetFormulario = () => {
  reservaCompletada.value = null
  successMsg.value = ''
  errorMsg.value = ''
  consultarDisponibilidad()
}
</script>

<template>
  <section id="reservas-publicas" class="py-20 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-t border-slate-200">
    <div class="mx-auto max-w-7xl px-6">
      
      <!-- ENCABEZADO INSTITUCIONAL -->
      <div class="text-center max-w-3xl mx-auto mb-14">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide uppercase shadow-sm">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Reserva Ciudadana Directa • Sin Cuenta Requerida
        </div>
        <h2 class="mt-4 font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Reserva de Escenarios y Ambientes Deportivos
        </h2>
        <p class="mt-3 text-base text-slate-600 leading-relaxed">
          Acceda a los recintos deportivos del Departamento de Chuquisaca para la práctica libre, entrenamientos y torneos recreativos.
          Consulte la disponibilidad horaria en tiempo real y envíe su solicitud directamente al SEDEDE.
        </p>
      </div>

      <!-- PANTALLA DE ÉXITO (COMPROBANTE EMITIDO) -->
      <div v-if="reservaCompletada" class="max-w-2xl mx-auto bg-white rounded-2xl border-2 border-emerald-500 shadow-xl overflow-hidden p-8 animate-fade-in">
        <div class="text-center">
          <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold shadow-inner">
            ✓
          </div>
          <span class="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-extrabold uppercase tracking-wider">
            ⏳ PENDIENTE DE APROBACIÓN POR SEDEDE
          </span>
          <h3 class="text-2xl font-bold text-slate-900 mt-3">¡Solicitud de Reserva Registrada!</h3>
          <p class="text-sm text-slate-600 mt-1">
            Su solicitud ha ingresado a la bandeja oficial de la Unidad de Escenarios Deportivos del SEDEDE.
          </p>
        </div>

        <div class="mt-6 bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 font-sans text-xs">
          <div class="flex justify-between items-center border-b border-slate-200 pb-2">
            <span class="text-slate-500 font-medium">Código Oficial de Reserva:</span>
            <span class="font-mono text-sm font-extrabold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
              {{ reservaCompletada.codigo_reserva }}
            </span>
          </div>
          <div v-if="reservaCompletada.liquidacion" class="flex justify-between items-center border-b border-slate-200 pb-2">
            <span class="text-slate-500 font-medium">Pre-Liquidación Tarifaria:</span>
            <span class="font-mono text-xs font-bold text-slate-700">
              {{ reservaCompletada.liquidacion.codigo_liquidacion }}
            </span>
          </div>
          <div class="flex justify-between items-center border-b border-slate-200 pb-2">
            <span class="text-slate-500 font-medium">Escenario y Espacio:</span>
            <span class="font-bold text-slate-900 text-right">{{ reservaCompletada.escenario_nombre }} — {{ reservaCompletada.espacio }}</span>
          </div>
          <div class="flex justify-between items-center border-b border-slate-200 pb-2">
            <span class="text-slate-500 font-medium">Fecha y Horario Solicitado:</span>
            <span class="font-bold text-emerald-800 text-right">
              📅 {{ reservaCompletada.fecha_uso }} • {{ reservaCompletada.hora_inicio }} a {{ reservaCompletada.hora_fin }} ({{ reservaCompletada.duracion_horas }}h)
            </span>
          </div>
          <div class="flex justify-between items-center border-b border-slate-200 pb-2">
            <span class="text-slate-500 font-medium">Solicitante:</span>
            <span class="font-bold text-slate-800">{{ reservaCompletada.solicitante_nombre }} (CI: {{ reservaCompletada.solicitante_ci }})</span>
          </div>
          <div v-if="reservaCompletada.liquidacion" class="flex justify-between items-center pt-1">
            <span class="text-slate-700 font-bold text-sm">Total Oficial a Cancelar (RAG 011/2024):</span>
            <span class="font-bold text-base text-emerald-700">Bs. {{ Number(reservaCompletada.liquidacion.monto_total).toFixed(2) }}</span>
          </div>
        </div>

        <!-- AVISO DE PROTOCOLO -->
        <div class="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5 leading-relaxed">
          <p class="font-bold flex items-center gap-1.5">
            <span>ℹ️</span> ¿Qué sucede a continuación?
          </p>
          <p>
            1. Un funcionario responsable de escenarios del SEDEDE revisará la solicitud y verificará la programación técnica.
          </p>
          <p>
            2. Se comunicará con usted al número <strong class="underline">{{ reservaCompletada.solicitante_telefono }}</strong> para coordinar la confirmación y el pago de la tasa oficial en ventanilla o transferencia bancaria.
          </p>
          <p>
            3. <em>En caso de rechazo o desistimiento, el horario seleccionado se liberará de forma automática e inmediata para otros usuarios.</em>
          </p>
        </div>

        <div class="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            class="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition-colors shadow-sm"
            @click="resetFormulario"
          >
            Realizar otra consulta o reserva
          </button>
          <button
            type="button"
            class="py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors"
            @click="window.print()"
          >
            Imprimir Comprobante
          </button>
        </div>
      </div>

      <!-- FORMULARIO INTERACTIVO (EN 2 COLUMNAS) -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- COLUMNA 1: AMBIENTE, FECHA Y DISPONIBILIDAD HORARIA (7 COLUMNAS) -->
        <div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 class="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-mono text-sm font-extrabold">1</span>
                Ambiente y Disponibilidad Horaria
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Seleccione el recinto y consulte las franjas horarias libres en tiempo real.</p>
            </div>
            <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              06:00 a 22:00
            </span>
          </div>

          <!-- Selectores Escenario y Espacio -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Escenario Deportivo
              </label>
              <select
                v-model="selectedEscenarioNombre"
                class="w-full text-xs rounded-xl border-slate-200 bg-slate-50/70 p-2.5 font-medium text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                :disabled="loadingEscenarios"
              >
                <option v-for="nombre in escenariosUnicos" :key="nombre" :value="nombre">
                  {{ nombre }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cancha / Espacio Específico
              </label>
              <select
                v-model="selectedEspacio"
                class="w-full text-xs rounded-xl border-slate-200 bg-slate-50/70 p-2.5 font-medium text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                :disabled="espaciosDisponibles.length <= 1"
              >
                <option v-for="esp in espaciosDisponibles" :key="esp.id" :value="esp.espacio">
                  {{ esp.espacio }}
                </option>
              </select>
            </div>
          </div>

          <!-- Selector de Fecha y Turno -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Fecha de Uso
              </label>
              <input
                v-model="fechaUso"
                type="date"
                :min="new Date().toISOString().split('T')[0]"
                class="w-full text-xs rounded-xl border-slate-200 bg-slate-50/70 p-2.5 font-medium text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Filtro de Turno
              </label>
              <div class="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold text-slate-600">
                <button
                  type="button"
                  :class="['py-1.5 rounded-lg transition-colors', turnoFiltro === 'Ambos' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900']"
                  @click="turnoFiltro = 'Ambos'"
                >
                  Todos
                </button>
                <button
                  type="button"
                  :class="['py-1.5 rounded-lg transition-colors', turnoFiltro === 'Dia' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900']"
                  @click="turnoFiltro = 'Dia'"
                >
                  ☀️ Día
                </button>
                <button
                  type="button"
                  :class="['py-1.5 rounded-lg transition-colors', turnoFiltro === 'Noche' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900']"
                  @click="turnoFiltro = 'Noche'"
                >
                  🌙 Noche
                </button>
              </div>
            </div>
          </div>

          <!-- Detalle del Espacio Seleccionado -->
          <div v-if="espacioSeleccionadoObj" class="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <span class="font-bold text-slate-700">Instalación:</span>
            <span class="text-slate-600">📍 {{ espacioSeleccionadoObj.ubicacion || 'Complejo Deportivo' }}</span>
            <span v-if="espacioSeleccionadoObj.capacidad_espectadores" class="text-slate-600">👥 {{ espacioSeleccionadoObj.capacidad_espectadores }} espectadores</span>
            <span :class="['px-2 py-0.5 rounded text-[10px] font-bold', espacioSeleccionadoObj.tiene_iluminacion ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700']">
              {{ espacioSeleccionadoObj.tiene_iluminacion ? '💡 Con Iluminación Nocturna CESSA' : 'Sin iluminación' }}
            </span>
          </div>

          <!-- VISUALIZADOR DE FRANJAS HORARIAS DEL DÍA -->
          <div>
            <div class="flex justify-between items-center mb-2.5">
              <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Cronograma de Horarios Disponibles ({{ fechaUso }})
              </span>
              <div class="flex items-center gap-3 text-[10px] font-bold">
                <span class="flex items-center gap-1 text-emerald-700">
                  <span class="w-2.5 h-2.5 rounded bg-emerald-500"></span> Libre
                </span>
                <span class="flex items-center gap-1 text-red-600">
                  <span class="w-2.5 h-2.5 rounded bg-red-400"></span> Ocupado
                </span>
              </div>
            </div>

            <div v-if="loadingDisponibilidad" class="py-12 text-center text-xs text-slate-500 animate-pulse">
              Consultando disponibilidad en tiempo real...
            </div>

            <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                v-for="franja in franjas"
                :key="franja.hora_inicio"
                type="button"
                :disabled="!franja.disponible"
                :class="[
                  'p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between',
                  franja.disponible
                    ? form.hora_inicio === franja.hora_inicio
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-300'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
                ]"
                @click="seleccionarFranja(franja)"
              >
                <div class="flex justify-between items-start">
                  <span class="font-mono text-xs font-extrabold">{{ franja.hora_inicio }} - {{ franja.hora_fin }}</span>
                  <span class="text-[9px] font-bold uppercase">{{ franja.turno === 'Noche' ? '🌙' : '☀️' }}</span>
                </div>
                <div class="mt-1 flex justify-between items-center text-[10px]">
                  <span :class="['font-bold', form.hora_inicio === franja.hora_inicio && franja.disponible ? 'text-white' : franja.disponible ? 'text-emerald-700' : 'text-red-500']">
                    {{ franja.disponible ? (form.hora_inicio === franja.hora_inicio ? '✓ Seleccionado' : 'Disponible') : 'Ocupado' }}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- COLUMNA 2: FORMULARIO Y COTIZACIÓN (5 COLUMNAS) -->
        <div class="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
          <div class="border-b border-slate-100 pb-4">
            <h3 class="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono text-sm font-extrabold">2</span>
              Datos del Solicitante Particular
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">El SEDEDE usará estos datos para contactarlo y confirmar la reserva.</p>
          </div>

          <!-- Horario Definido -->
          <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Hora Inicio</label>
              <select
                v-model="form.hora_inicio"
                class="w-full text-xs rounded-lg border-slate-200 bg-white p-2 font-mono font-bold text-slate-900"
              >
                <option v-for="h in horasDisponibles" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Hora Fin</label>
              <select
                v-model="form.hora_fin"
                class="w-full text-xs rounded-lg border-slate-200 bg-white p-2 font-mono font-bold text-slate-900"
              >
                <option v-for="h in ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00']" :key="h" :value="h">
                  {{ h }}
                </option>
              </select>
            </div>
          </div>

          <!-- TARJETA DE COTIZACIÓN RAG 011/2024 -->
          <div v-if="cotizacion" class="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-4 space-y-2 text-xs">
            <div class="flex justify-between items-center">
              <span class="font-bold text-emerald-950 uppercase tracking-wide text-[10px]">Tasa Oficial Particular (RAG 011/2024)</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-200 text-emerald-900">
                {{ cotizacion.horas }} hora(s)
              </span>
            </div>
            <div class="space-y-1 font-mono text-[11px] text-slate-600 border-t border-emerald-200/60 pt-2">
              <div class="flex justify-between">
                <span>Valor Base por Hora:</span>
                <span class="font-bold text-slate-800">Bs. {{ Number(cotizacion.valor_por_hora).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Subtotal ({{ cotizacion.horas }} hrs):</span>
                <span>Bs. {{ Number(cotizacion.subtotal).toFixed(2) }}</span>
              </div>
              <div v-if="cotizacion.recargo_cessa > 0" class="flex justify-between text-amber-900 font-bold">
                <span>Recargo Iluminación CESSA:</span>
                <span>+ Bs. {{ Number(cotizacion.recargo_cessa).toFixed(2) }}</span>
              </div>
            </div>
            <div class="flex justify-between items-center border-t border-emerald-300 pt-2 text-sm">
              <strong class="font-extrabold text-emerald-950">Total Presupuestado:</strong>
              <strong class="font-mono text-base font-extrabold text-emerald-700">Bs. {{ Number(cotizacion.total).toFixed(2) }}</strong>
            </div>
          </div>

          <!-- Campos de Contacto -->
          <div class="space-y-3.5 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">
                Nombre Completo del Solicitante / Responsable <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.solicitante_nombre"
                type="text"
                placeholder="Ej. Carlos Mendoza Beltrán"
                class="w-full rounded-xl border-slate-200 bg-slate-50/70 p-2.5 font-medium text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">
                  Cédula de Identidad (CI) <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.solicitante_ci"
                  type="text"
                  placeholder="Ej. 4567891 CH"
                  class="w-full rounded-xl border-slate-200 bg-slate-50/70 p-2.5 font-medium text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">
                  Celular / WhatsApp <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.solicitante_telefono"
                  type="tel"
                  placeholder="Ej. 71234567"
                  class="w-full rounded-xl border-slate-200 bg-slate-50/70 p-2.5 font-medium text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Disciplina / Deporte</label>
                <select
                  v-model="form.disciplina"
                  class="w-full rounded-xl border-slate-200 bg-slate-50/70 p-2.5 font-medium text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                >
                  <option v-for="d in disciplinasList" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Motivo / Concepto</label>
                <input
                  v-model="form.concepto"
                  type="text"
                  placeholder="Ej. Partido amistoso de básquetbol"
                  class="w-full rounded-xl border-slate-200 bg-slate-50/70 p-2.5 font-medium text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Observaciones adicionales (opcional)</label>
              <textarea
                v-model="form.observaciones"
                rows="2"
                placeholder="Detalles sobre uso de vestuarios, invitados, etc."
                class="w-full rounded-xl border-slate-200 bg-slate-50/70 p-2.5 font-medium text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-xs"
              ></textarea>
            </div>
          </div>

          <!-- Mensaje de error -->
          <div v-if="errorMsg" class="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2">
            <span>⚠️</span>
            <span>{{ errorMsg }}</span>
          </div>

          <!-- BOTÓN DE ENVÍO -->
          <button
            type="button"
            class="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="sendingReserva || duracionHoras <= 0"
            @click="enviarReserva"
          >
            <span v-if="sendingReserva" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ sendingReserva ? 'Registrando Reserva...' : '✓ Solicitar Reserva Oficial' }}</span>
          </button>
        </div>

      </div>

    </div>
  </section>
</template>
