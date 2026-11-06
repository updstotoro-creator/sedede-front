<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { escenarioService } from '../services/escenarioService'
import { deportistaService } from '../services/deportistaService'
import { useAuthStore } from '../stores/auth'
import logo from '../assets/images/logo-sedede.png'
import {
  errorCI,
  mensajeDeError,
  formatoFecha,
  hoyMasDiasISO,
  normalizarTexto,
  RESERVA_DIAS_MAX_ANTICIPACION,
} from '../utils/validaciones'

const router = useRouter()
const auth = useAuthStore()

// Pestaña principal: 'nueva' | 'consultar'
const activeTab = ref('nueva')

// Estado de carga del catálogo
const loadingEscenarios = ref(true)
const escenarios = ref([])
const errorMsg = ref('')
const successMsg = ref('')

// Filtros y selección
const selectedEscenarioNombre = ref('')
const selectedEspacio = ref('')
const fechaUso = ref(new Date().toISOString().split('T')[0])
const turnoFiltro = ref('Ambos')

// Disponibilidad de franjas
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
const copiadoFeedback = ref(false)

// Consulta de reserva existente
const codigoConsulta = ref('')
const consultando = ref(false)
const reservaEncontrada = ref(null)
const errorConsulta = ref('')

// Consulta sin código: por C.I. y celular
const consultaCi = ref('')
const consultaTelefono = ref('')
const buscandoPorDatos = ref(false)
const reservasPorDatos = ref(null)
const errorPorDatos = ref('')

// Catálogo de disciplinas populares
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

// Ventana de reserva: desde hoy hasta N días (igual que el servidor).
const fechaMinima = hoyMasDiasISO(0)
const fechaMaxima = hoyMasDiasISO(RESERVA_DIAS_MAX_ANTICIPACION)

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

// Las disciplinas se limitan a las del escenario elegido: antes se podían
// reservar los frontones para natación. Sin disciplinas declaradas, el listado general.
const opcionesDisciplina = computed(() => {
  const propias = espacioSeleccionadoObj.value?.disciplinas
  return Array.isArray(propias) && propias.length > 0 ? propias : disciplinasList
})

watch(opcionesDisciplina, (opciones) => {
  const vigente = opciones.some((d) => normalizarTexto(d) === normalizarTexto(form.value.disciplina))
  if (!vigente && opciones.length > 0) form.value.disciplina = opciones[0]
})

// Cargar catálogo público al iniciar
// Un deportista con sesión no vuelve a escribir sus datos (obs. 13).
// Si falla (sin perfil, sin red) el formulario queda como siempre.
async function precargarDatosDelDeportista() {
  if (auth.user?.role?.nombre !== 'deportista') return
  try {
    const res = await deportistaService.getMiPerfil()
    const dep = res.data || res.deportista
    if (!dep) return
    if (!form.value.solicitante_nombre) form.value.solicitante_nombre = `${dep.nombres || ''} ${dep.apellidos || ''}`.trim()
    if (!form.value.solicitante_ci) form.value.solicitante_ci = [dep.ci, dep.expedido].filter(Boolean).join(' ')
    if (!form.value.solicitante_telefono) form.value.solicitante_telefono = dep.telefono || ''
  } catch {
    // sin precarga
  }
}

onMounted(async () => {
  precargarDatosDelDeportista()
  try {
    loadingEscenarios.value = true
    const data = await escenarioService.getEscenariosPublicos()
    escenarios.value = Array.isArray(data) ? data : []

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

// Ajustar espacio al cambiar escenario
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

// Consultar disponibilidad horaria en tiempo real
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

// Cálculo de duración y turno
const duracionHoras = computed(() => {
  if (!form.value.hora_inicio || !form.value.hora_fin) return 0
  const tIni = parseInt(form.value.hora_inicio.split(':')[0], 10)
  const tFin = parseInt(form.value.hora_fin.split(':')[0], 10)
  return Math.max(0, tFin - tIni)
})

const turnoCalculado = computed(() => {
  if (!form.value.hora_inicio) return 'Dia'
  const h = parseInt(form.value.hora_inicio.split(':')[0], 10)
  return h >= 18 ? 'Noche' : 'Dia'
})

// Calcular cotización según RAG 011/2024
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

// Selección interactiva de franja
const seleccionarFranja = (franja) => {
  if (!franja.disponible) return
  form.value.hora_inicio = franja.hora_inicio
  const hNum = parseInt(franja.hora_inicio.split(':')[0], 10)
  const hFin = String(Math.min(hNum + 2, 22)).padStart(2, '0') + ':00'
  form.value.hora_fin = hFin
}

// Envío de la solicitud de reserva
const enviarReserva = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!form.value.solicitante_nombre.trim()) {
    errorMsg.value = 'Por favor ingrese su nombre completo o denominación de grupo.'
    return
  }
  const errCi = errorCI(form.value.solicitante_ci, 'C.I.')
  if (errCi) {
    errorMsg.value = errCi
    return
  }
  if (fechaUso.value < fechaMinima || fechaUso.value > fechaMaxima) {
    errorMsg.value = `La fecha de uso debe estar entre hoy y los próximos ${RESERVA_DIAS_MAX_ANTICIPACION} días.`
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
    errorMsg.value = mensajeDeError(err, 'No se pudo procesar la reserva. Verifique que el horario no haya sido reservado por otra persona.')
  } finally {
    sendingReserva.value = false
  }
}

// Copiar código de reserva al portapapeles
const copiarCodigo = (codigo) => {
  navigator.clipboard.writeText(codigo)
  copiadoFeedback.value = true
  setTimeout(() => {
    copiadoFeedback.value = false
  }, 2500)
}

// Reiniciar formulario
const resetFormulario = () => {
  reservaCompletada.value = null
  successMsg.value = ''
  errorMsg.value = ''
  consultarDisponibilidad()
}

// Consultar sin el código (obs. 15): con C.I. y celular
const buscarPorDatos = async () => {
  errorPorDatos.value = ''
  reservasPorDatos.value = null

  const errCi = errorCI(consultaCi.value, 'C.I.')
  if (errCi) {
    errorPorDatos.value = errCi
    return
  }
  if (!consultaTelefono.value.trim()) {
    errorPorDatos.value = 'Ingrese el celular con el que hizo la reserva.'
    return
  }

  buscandoPorDatos.value = true
  try {
    const res = await escenarioService.consultarReservasPorSolicitante({
      ci: consultaCi.value.trim(),
      telefono: consultaTelefono.value.trim(),
    })
    reservasPorDatos.value = res.data || []
    if (reservasPorDatos.value.length === 0) {
      errorPorDatos.value = res.message || 'No se encontraron reservas con esos datos.'
    }
  } catch (err) {
    errorPorDatos.value = mensajeDeError(err, 'No se pudo consultar. Intente nuevamente en unos minutos.')
  } finally {
    buscandoPorDatos.value = false
  }
}

// Abrir una reserva de la lista como si se hubiera escrito su código
const abrirReservaDeLista = (codigo) => {
  codigoConsulta.value = codigo
  buscarReservaExistente()
}

// Consultar reserva existente
const buscarReservaExistente = async () => {
  if (!codigoConsulta.value.trim()) return
  consultando.value = true
  errorConsulta.value = ''
  reservaEncontrada.value = null

  try {
    const res = await escenarioService.consultarEstadoPublico(codigoConsulta.value.trim().toUpperCase())
    reservaEncontrada.value = res.data
  } catch (err) {
    console.error('Error al consultar reserva:', err)
    errorConsulta.value = err.response?.data?.message || 'No se encontró ninguna reserva con el código especificado.'
  } finally {
    consultando.value = false
  }
}

const formatFecha = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <div class="min-h-screen bg-slate-900/95 py-8 px-4 sm:px-6 lg:px-8 text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
    
    <!-- ENCABEZADO CON LOGO Y NAVEGACIÓN (Estilo idéntico a Registro y Login) -->
    <header class="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
      <router-link to="/" class="flex items-center gap-3.5 group">
        <div class="h-12 w-12 rounded-2xl bg-white/10 p-2 backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-all flex items-center justify-center shadow-lg">
          <img :src="logo" alt="Logo SEDEDE" class="h-full w-full object-contain" />
        </div>
        <div>
          <span class="font-display font-extrabold text-xl text-white tracking-wide block">SEDEDE Chuquisaca</span>
          <span class="text-xs text-brand-400 font-medium">Portal de Reservas Ciudadanas • Particulares sin Cuenta</span>
        </div>
      </router-link>

      <div class="flex items-center gap-2.5">
        <router-link
          to="/"
          class="rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
        >
          <span>←</span>
          <span>Volver al Inicio</span>
        </router-link>
        <router-link
          to="/registro"
          class="rounded-xl border border-brand-500/40 hover:border-brand-500 bg-brand-500/10 px-3.5 py-2 text-xs font-semibold text-brand-300 hover:text-white transition-all"
        >
          Registrarse
        </router-link>
        <router-link
          to="/login"
          class="rounded-xl bg-brand-600 hover:bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5"
        >
          <span>Acceder</span>
          <span>→</span>
        </router-link>
      </div>
    </header>

    <main class="max-w-6xl mx-auto">
      
      <!-- TÍTULO Y PRESENTACIÓN -->
      <div class="text-center max-w-3xl mx-auto mb-8">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase shadow-sm">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Reserva Pública Ciudadana • Sin Inicio de Sesión
        </div>
        <h1 class="mt-3.5 font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Reserva de Escenarios y Ambientes Deportivos
        </h1>
        <p class="mt-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
          Los ciudadanos particulares pueden consultar los horarios disponibles en tiempo real y solicitar el uso de canchas y coliseos departamentales.
          Un funcionario del SEDEDE revisará la solicitud para su confirmación o liberación inmediata.
        </p>

        <!-- Pestañas de modo: Nueva Reserva vs Consultar Estado -->
        <div class="inline-flex items-center gap-2 mt-6 p-1 bg-slate-800/90 rounded-2xl border border-slate-700/80 backdrop-blur-md">
          <button
            type="button"
            @click="activeTab = 'nueva'"
            :class="[
              'px-5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2',
              activeTab === 'nueva'
                ? 'bg-emerald-600 text-white shadow-lg scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            ]"
          >
            <span>📅</span>
            <span>Nueva Solicitud de Reserva</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'consultar'"
            :class="[
              'px-5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2',
              activeTab === 'consultar'
                ? 'bg-brand-600 text-white shadow-lg scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            ]"
          >
            <span>🔍</span>
            <span>Consultar Estado de Reserva</span>
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- PESTAÑA 1: NUEVA RESERVA -->
      <!-- ========================================================================= -->
      <div v-if="activeTab === 'nueva'">
        
        <!-- PANTALLA DE ÉXITO (COMPROBANTE EMITIDO) -->
        <div v-if="reservaCompletada" class="max-w-2xl mx-auto bg-slate-800/90 rounded-3xl border border-emerald-500/60 shadow-2xl overflow-hidden p-7 sm:p-9 backdrop-blur-xl animate-fade-in text-slate-100">
          <div class="text-center">
            <div class="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-extrabold shadow-inner">
              ✓
            </div>
            <span class="px-3.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-extrabold uppercase tracking-wider">
              ⏳ PENDIENTE DE CONFIRMACIÓN POR SEDEDE
            </span>
            <h2 class="text-2xl font-display font-extrabold text-white mt-3.5">¡Solicitud de Reserva Registrada!</h2>
            <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
              Su solicitud ha ingresado a la bandeja de administración de escenarios deportivos del SEDEDE.
            </p>
          </div>

          <!-- DATOS OFICIALES DE LA RESERVA -->
          <div class="mt-6 bg-slate-900/80 rounded-2xl p-5 border border-slate-700/80 space-y-3 font-sans text-xs">
            <div class="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <span class="text-slate-400 font-medium">Código Oficial de Reserva:</span>
              <div class="flex items-center gap-2">
                <span class="font-mono text-sm font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                  {{ reservaCompletada.codigo_reserva }}
                </span>
                <button
                  type="button"
                  @click="copiarCodigo(reservaCompletada.codigo_reserva)"
                  class="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 transition-colors"
                  title="Copiar código"
                >
                  {{ copiadoFeedback ? '✓ Copiado' : 'Copiar' }}
                </button>
              </div>
            </div>

            <div v-if="reservaCompletada.liquidacion" class="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <span class="text-slate-400 font-medium">Pre-Liquidación Tarifaria:</span>
              <span class="font-mono text-xs font-bold text-slate-300">
                {{ reservaCompletada.liquidacion.codigo_liquidacion }}
              </span>
            </div>

            <div class="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <span class="text-slate-400 font-medium">Escenario y Espacio:</span>
              <span class="font-bold text-white text-right">{{ reservaCompletada.escenario_nombre }} — {{ reservaCompletada.espacio }}</span>
            </div>

            <div class="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <span class="text-slate-400 font-medium">Fecha y Horario:</span>
              <span class="font-bold text-emerald-300 text-right">
                📅 {{ formatoFecha(reservaCompletada.fecha_uso) }} • {{ reservaCompletada.hora_inicio }} a {{ reservaCompletada.hora_fin }} ({{ reservaCompletada.duracion_horas }}h)
              </span>
            </div>

            <div class="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <span class="text-slate-400 font-medium">Solicitante:</span>
              <span class="font-bold text-slate-200">{{ reservaCompletada.solicitante_nombre }} (CI: {{ reservaCompletada.solicitante_ci }})</span>
            </div>

            <div v-if="reservaCompletada.liquidacion" class="flex justify-between items-center pt-1.5">
              <span class="text-slate-300 font-bold text-xs sm:text-sm">Total Oficial a Cancelar (RAG 011/2024):</span>
              <span class="font-mono font-extrabold text-base sm:text-lg text-emerald-400">
                Bs. {{ Number(reservaCompletada.liquidacion.monto_total).toFixed(2) }}
              </span>
            </div>
          </div>

          <!-- PROTOCOLO INSTITUCIONAL SEDEDE -->
          <div class="mt-5 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 space-y-1.5 leading-relaxed">
            <p class="font-bold text-blue-300 flex items-center gap-1.5">
              <span>ℹ️</span> Procedimiento del SEDEDE:
            </p>
            <p>
              1. Un funcionario responsable de la administración de escenarios verificará la solicitud en el sistema.
            </p>
            <p>
              2. Se comunicará con usted al celular <strong class="text-white underline">{{ reservaCompletada.solicitante_telefono }}</strong> para la confirmación de la reserva y coordinación del pago.
            </p>
            <p class="text-amber-200">
              3. <strong>Liberación inmediata:</strong> En caso de rechazo o no concretarse el pago, el horario quedará automáticamente liberado en el sistema para otros solicitantes.
            </p>
          </div>

          <!-- BOTONES DE ACCIÓN -->
          <div class="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              class="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-lg"
              @click="resetFormulario"
            >
              Realizar otra solicitud de reserva
            </button>
            <button
              type="button"
              class="py-3 px-4 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5"
              @click="window.print()"
            >
              <span>🖨️</span>
              <span>Imprimir Comprobante</span>
            </button>
          </div>
        </div>

        <!-- FORMULARIO EN DOS COLUMNAS -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          <!-- COLUMNA 1: ESCENARIO, FECHA Y VISUALIZADOR DE HORARIOS (7 COLUMNAS) -->
          <div class="lg:col-span-7 bg-slate-800/80 rounded-3xl border border-slate-700/80 p-6 sm:p-7 shadow-xl backdrop-blur-md space-y-5">
            <div class="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <h2 class="font-display text-lg font-bold text-white flex items-center gap-2">
                  <span class="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-mono text-xs font-extrabold">1</span>
                  Ambiente y Disponibilidad Horaria
                </h2>
                <p class="text-xs text-slate-400 mt-0.5">Consulte las franjas horarias operativas libres en tiempo real (06:00 a 22:00).</p>
              </div>
              <span class="text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                16 Franjas Diarias
              </span>
            </div>

            <!-- Selectores: Escenario y Espacio -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Escenario Deportivo
                </label>
                <select
                  v-model="selectedEscenarioNombre"
                  class="w-full text-xs rounded-xl border-slate-700 bg-slate-900/90 p-3 font-medium text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  :disabled="loadingEscenarios"
                >
                  <option v-for="nombre in escenariosUnicos" :key="nombre" :value="nombre">
                    {{ nombre }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Cancha / Espacio Específico
                </label>
                <select
                  v-model="selectedEspacio"
                  class="w-full text-xs rounded-xl border-slate-700 bg-slate-900/90 p-3 font-medium text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  :disabled="espaciosDisponibles.length <= 1"
                >
                  <option v-for="esp in espaciosDisponibles" :key="esp.id" :value="esp.espacio">
                    {{ esp.espacio }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Selector de Fecha y Filtro de Turno -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Fecha de Uso
                </label>
                <input
                  v-model="fechaUso"
                  type="date"
                  :min="fechaMinima"
                  :max="fechaMaxima"
                  class="w-full text-xs rounded-xl border-slate-700 bg-slate-900/90 p-3 font-medium text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Filtro de Turno
                </label>
                <div class="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl text-xs font-bold text-slate-400 border border-slate-700">
                  <button
                    type="button"
                    :class="['py-2 rounded-lg transition-colors', turnoFiltro === 'Ambos' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:text-white']"
                    @click="turnoFiltro = 'Ambos'"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    :class="['py-2 rounded-lg transition-colors', turnoFiltro === 'Dia' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:text-white']"
                    @click="turnoFiltro = 'Dia'"
                  >
                    ☀️ Día
                  </button>
                  <button
                    type="button"
                    :class="['py-2 rounded-lg transition-colors', turnoFiltro === 'Noche' ? 'bg-emerald-600 text-white shadow-sm' : 'hover:text-white']"
                    @click="turnoFiltro = 'Noche'"
                  >
                    🌙 Noche
                  </button>
                </div>
              </div>
            </div>

            <!-- Ficha Técnica del Espacio Seleccionado -->
            <div v-if="espacioSeleccionadoObj" class="flex flex-wrap items-center gap-3 bg-slate-900/70 p-3.5 rounded-2xl border border-slate-700/80 text-xs">
              <span class="font-bold text-slate-300">Instalación:</span>
              <span class="text-slate-400">📍 {{ espacioSeleccionadoObj.ubicacion || 'Complejo Deportivo Departamental' }}</span>
              <span v-if="espacioSeleccionadoObj.capacidad_espectadores" class="text-slate-400">
                👥 Capacidad: {{ espacioSeleccionadoObj.capacidad_espectadores }} espectadores
              </span>
              <span :class="['px-2.5 py-1 rounded-md text-[10px] font-extrabold', espacioSeleccionadoObj.tiene_iluminacion ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700']">
                {{ espacioSeleccionadoObj.tiene_iluminacion ? '💡 Con Iluminación Nocturna CESSA' : 'Sin iluminación nocturna' }}
              </span>
            </div>

            <!-- VISUALIZADOR INTERACTIVO DE FRANJAS HORARIAS -->
            <div>
              <div class="flex justify-between items-center mb-3">
                <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Disponibilidad de Franjas ({{ formatFecha(fechaUso) }})
                </span>
                <div class="flex items-center gap-3 text-[10px] font-bold">
                  <span class="flex items-center gap-1.5 text-emerald-400">
                    <span class="w-2.5 h-2.5 rounded bg-emerald-500"></span> Libre
                  </span>
                  <span class="flex items-center gap-1.5 text-rose-400">
                    <span class="w-2.5 h-2.5 rounded bg-rose-500"></span> Ocupado
                  </span>
                </div>
              </div>

              <div v-if="loadingDisponibilidad" class="py-12 text-center text-xs text-slate-400 animate-pulse">
                Consultando disponibilidad en tiempo real con la base de datos...
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
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg ring-2 ring-emerald-400/80 scale-[1.02]'
                        : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200 hover:bg-emerald-900/60 hover:border-emerald-600'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  ]"
                  @click="seleccionarFranja(franja)"
                >
                  <div class="flex justify-between items-start">
                    <span class="font-mono text-xs font-extrabold">{{ franja.hora_inicio }} - {{ franja.hora_fin }}</span>
                    <span class="text-[10px]">{{ franja.turno === 'Noche' ? '🌙' : '☀️' }}</span>
                  </div>
                  <div class="mt-1 flex justify-between items-center text-[10px]">
                    <span :class="['font-bold', form.hora_inicio === franja.hora_inicio && franja.disponible ? 'text-white' : franja.disponible ? 'text-emerald-400' : 'text-rose-400']">
                      {{ franja.disponible ? (form.hora_inicio === franja.hora_inicio ? '✓ Seleccionado' : 'Disponible') : 'Ocupado' }}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- COLUMNA 2: FORMULARIO Y COTIZACIÓN (5 COLUMNAS) -->
          <div class="lg:col-span-5 bg-slate-800/80 rounded-3xl border border-slate-700/80 p-6 sm:p-7 shadow-xl backdrop-blur-md space-y-5">
            <div class="border-b border-slate-700 pb-4">
              <h2 class="font-display text-lg font-bold text-white flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-mono text-xs font-extrabold">2</span>
                Datos del Solicitante y Cotización
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">El personal del SEDEDE usará estos datos para contactarlo y confirmar.</p>
            </div>

            <!-- Rango Horario de la Reserva -->
            <div class="grid grid-cols-2 gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700">
              <div>
                <label class="block text-[11px] font-bold text-slate-300 mb-1">Hora Inicio</label>
                <select
                  v-model="form.hora_inicio"
                  class="w-full text-xs rounded-xl border-slate-700 bg-slate-800 p-2.5 font-mono font-bold text-emerald-400 focus:border-emerald-500"
                >
                  <option v-for="h in horasDisponibles" :key="h" :value="h">{{ h }}</option>
                </select>
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-300 mb-1">Hora Fin</label>
                <select
                  v-model="form.hora_fin"
                  class="w-full text-xs rounded-xl border-slate-700 bg-slate-800 p-2.5 font-mono font-bold text-emerald-400 focus:border-emerald-500"
                >
                  <option v-for="h in ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00']" :key="h" :value="h">
                    {{ h }}
                  </option>
                </select>
              </div>
            </div>

            <!-- TARJETA DE COTIZACIÓN OFICIAL SEGÚN RAG 011/2024 -->
            <div v-if="cotizacion" class="rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900/90 border border-emerald-500/40 p-4 space-y-2.5 text-xs shadow-inner">
              <div class="flex justify-between items-center">
                <span class="font-bold text-emerald-300 uppercase tracking-wide text-[10px]">Tarifario Oficial RAG 011/2024</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {{ cotizacion.horas }} hora(s) (Turno {{ cotizacion.turno }})
                </span>
              </div>
              <div class="space-y-1 font-mono text-[11px] text-slate-300 border-t border-emerald-800/40 pt-2">
                <div class="flex justify-between">
                  <span class="text-slate-400">Valor Base Particular por Hora:</span>
                  <span class="font-bold text-white">Bs. {{ Number(cotizacion.valor_por_hora).toFixed(2) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Subtotal ({{ cotizacion.horas }} hrs):</span>
                  <span>Bs. {{ Number(cotizacion.subtotal).toFixed(2) }}</span>
                </div>
                <div v-if="cotizacion.recargo_cessa > 0" class="flex justify-between text-amber-300 font-bold">
                  <span>Recargo Iluminación CESSA:</span>
                  <span>+ Bs. {{ Number(cotizacion.recargo_cessa).toFixed(2) }}</span>
                </div>
              </div>
              <div class="flex justify-between items-center border-t border-emerald-500/40 pt-2 text-sm">
                <strong class="font-bold text-white">Total Presupuestado:</strong>
                <strong class="font-mono text-base sm:text-lg font-extrabold text-emerald-400">Bs. {{ Number(cotizacion.total).toFixed(2) }}</strong>
              </div>
            </div>

            <!-- CAMPOS DEL FORMULARIO CIUDADANO -->
            <div class="space-y-3.5 text-xs">
              <div>
                <label class="block font-bold text-slate-300 mb-1">
                  Nombre Completo del Solicitante / Responsable <span class="text-rose-400">*</span>
                </label>
                <input
                  v-model="form.solicitante_nombre"
                  type="text"
                  placeholder="Ej. Carlos Mendoza Beltrán"
                  class="w-full rounded-xl border-slate-700 bg-slate-900/90 p-3 font-medium text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-300 mb-1">
                    Cédula de Identidad (CI) <span class="text-rose-400">*</span>
                  </label>
                  <input
                    v-model="form.solicitante_ci"
                    type="text"
                    placeholder="Ej. 4567891 CH"
                    class="w-full rounded-xl border-slate-700 bg-slate-900/90 p-3 font-medium text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label class="block font-bold text-slate-300 mb-1">
                    Celular / WhatsApp <span class="text-rose-400">*</span>
                  </label>
                  <input
                    v-model="form.solicitante_telefono"
                    type="tel"
                    placeholder="Ej. 71234567"
                    class="w-full rounded-xl border-slate-700 bg-slate-900/90 p-3 font-medium text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-300 mb-1">Disciplina Deportiva</label>
                  <select
                    v-model="form.disciplina"
                    class="w-full rounded-xl border-slate-700 bg-slate-900/90 p-3 font-medium text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option v-for="d in opcionesDisciplina" :key="d" :value="d">{{ d }}</option>
                  </select>
                </div>

                <div>
                  <label class="block font-bold text-slate-300 mb-1">Motivo / Concepto</label>
                  <input
                    v-model="form.concepto"
                    type="text"
                    placeholder="Ej. Partido amistoso recreativo"
                    class="w-full rounded-xl border-slate-700 bg-slate-900/90 p-3 font-medium text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-300 mb-1">Observaciones adicionales (opcional)</label>
                <textarea
                  v-model="form.observaciones"
                  rows="2"
                  placeholder="Detalles sobre uso de vestuarios, público acompañante, etc."
                  class="w-full rounded-xl border-slate-700 bg-slate-900/90 p-3 font-medium text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs"
                ></textarea>
              </div>
            </div>

            <!-- Mensaje de error si falla validación o backend -->
            <div v-if="errorMsg" class="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-start gap-2">
              <span>⚠️</span>
              <span>{{ errorMsg }}</span>
            </div>

            <!-- BOTÓN PRINCIPAL DE ENVÍO -->
            <button
              type="button"
              class="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm tracking-wide shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="sendingReserva || duracionHoras <= 0"
              @click="enviarReserva"
            >
              <span v-if="sendingReserva" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ sendingReserva ? 'Registrando Reserva...' : '✓ Solicitar Reserva Oficial' }}</span>
            </button>
          </div>

        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- PESTAÑA 2: CONSULTAR ESTADO DE RESERVA EXISTENTE -->
      <!-- ========================================================================= -->
      <div v-else class="max-w-xl mx-auto bg-slate-800/80 rounded-3xl border border-slate-700/80 p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div class="text-center mb-6">
          <div class="w-12 h-12 bg-brand-500/20 border border-brand-500/40 text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            🔍
          </div>
          <h2 class="text-xl font-display font-extrabold text-white">Consultar Estado de su Reserva</h2>
          <p class="text-xs text-slate-400 mt-1">
            Ingrese el código que le fue asignado al realizar la solicitud (ej. RES-2026-0001).
          </p>
        </div>

        <form @submit.prevent="buscarReservaExistente" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Código de Reserva
            </label>
            <div class="flex gap-2">
              <input
                v-model="codigoConsulta"
                type="text"
                placeholder="RES-2026-0001"
                class="flex-1 rounded-xl border-slate-700 bg-slate-900/90 p-3 font-mono font-bold text-white text-sm focus:border-brand-500 uppercase"
                required
              />
              <button
                type="submit"
                :disabled="consultando || !codigoConsulta.trim()"
                class="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <span v-if="consultando" class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Buscar</span>
              </button>
            </div>
          </div>
        </form>

        <!-- ¿No recuerda el código? Búsqueda con C.I. y celular -->
        <div class="mt-6 pt-5 border-t border-slate-800">
          <p class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">¿No recuerda su código?</p>
          <p class="text-[11px] text-slate-400 mb-3">
            Búsquelo con su Cédula de Identidad y el celular que dejó al reservar. Se necesitan los dos datos.
          </p>
          <form @submit.prevent="buscarPorDatos" class="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
            <input
              v-model="consultaCi"
              type="text"
              placeholder="C.I. (ej. 4567891 CH)"
              autocomplete="off"
              class="rounded-xl border-slate-700 bg-slate-900/90 p-3 font-medium text-white text-sm focus:border-brand-500"
              required
            />
            <input
              v-model="consultaTelefono"
              type="tel"
              placeholder="Celular (ej. 71234567)"
              autocomplete="off"
              class="rounded-xl border-slate-700 bg-slate-900/90 p-3 font-medium text-white text-sm focus:border-brand-500"
              required
            />
            <button
              type="submit"
              :disabled="buscandoPorDatos"
              class="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span v-if="buscandoPorDatos" class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Buscar mis reservas</span>
            </button>
          </form>

          <div v-if="errorPorDatos" class="mt-3 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
            {{ errorPorDatos }}
          </div>

          <ul v-if="reservasPorDatos && reservasPorDatos.length" class="mt-3 space-y-2">
            <li v-for="r in reservasPorDatos" :key="r.codigo_reserva">
              <button
                type="button"
                class="w-full text-left rounded-xl border border-slate-700 bg-slate-900/90 hover:border-emerald-500 p-3 text-xs transition-colors"
                @click="abrirReservaDeLista(r.codigo_reserva)"
              >
                <span class="font-mono font-extrabold text-emerald-400">{{ r.codigo_reserva }}</span>
                <span class="text-slate-300"> · {{ r.escenario_nombre }} ({{ r.espacio }}) · {{ formatoFecha(r.fecha_uso) }} · {{ r.hora_inicio }} a {{ r.hora_fin }}</span>
                <span class="text-slate-400"> · {{ r.estado }}</span>
              </button>
            </li>
          </ul>
        </div>

        <div v-if="errorConsulta" class="mt-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
          {{ errorConsulta }}
        </div>

        <!-- RESULTADO DE LA BÚSQUEDA -->
        <div v-if="reservaEncontrada" class="mt-6 bg-slate-900/90 rounded-2xl p-5 border border-slate-700 space-y-3 text-xs animate-fade-in">
          <div class="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <span class="font-mono text-sm font-extrabold text-emerald-400">{{ reservaEncontrada.codigo_reserva }}</span>
              <p class="text-[11px] text-slate-400">{{ reservaEncontrada.solicitante_nombre }}</p>
            </div>
            <div>
              <span v-if="reservaEncontrada.estado === 'CONFIRMADA'" class="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-extrabold text-[11px]">
                ✓ CONFIRMADA POR SEDEDE
              </span>
              <span v-else-if="reservaEncontrada.estado === 'RECHAZADA'" class="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full font-extrabold text-[11px]">
                ✕ RECHAZADA (HORARIO LIBERADO)
              </span>
              <span v-else-if="reservaEncontrada.estado === 'LIQUIDADA'" class="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-full font-extrabold text-[11px]">
                ★ LIQUIDADA / PAGADA
              </span>
              <span v-else class="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-extrabold text-[11px]">
                ⏳ PENDIENTE DE REVISIÓN
              </span>
            </div>
          </div>

          <div class="space-y-2 text-slate-300 font-sans">
            <div class="flex justify-between">
              <span class="text-slate-400">Escenario:</span>
              <span class="font-bold text-white">{{ reservaEncontrada.escenario_nombre }} ({{ reservaEncontrada.espacio }})</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Fecha y Turno:</span>
              <span>📅 {{ formatoFecha(reservaEncontrada.fecha_uso) }} • Turno {{ reservaEncontrada.turno }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Horario:</span>
              <span class="font-mono font-bold text-emerald-400">{{ reservaEncontrada.hora_inicio }} a {{ reservaEncontrada.hora_fin }} ({{ reservaEncontrada.duracion_horas }}h)</span>
            </div>
            <div v-if="reservaEncontrada.liquidacion" class="flex justify-between border-t border-slate-800 pt-2 font-bold">
              <span>Monto Total:</span>
              <span class="text-emerald-400 font-mono">Bs. {{ Number(reservaEncontrada.liquidacion.monto_total).toFixed(2) }}</span>
            </div>
          </div>

          <div class="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 leading-relaxed">
            <p v-if="reservaEncontrada.estado === 'CONFIRMADA'">
              🎉 <strong>¡Reserva Aprobada!</strong> Puede presentarse a la ventanilla del SEDEDE o coordinar la liquidación para hacer uso del recinto deportivo.
            </p>
            <p v-else-if="reservaEncontrada.estado === 'RECHAZADA'">
              ℹ️ <strong>Solicitud Rechazada:</strong> La reserva no pudo concretarse y la franja horaria fue devuelta al catálogo público. Si lo desea, puede seleccionar otra fecha u horario disponible.
            </p>
            <p v-else>
              ⏳ <strong>En proceso de verificación:</strong> La Unidad de Escenarios del SEDEDE revisará la programación técnica en breve.
            </p>
          </div>
        </div>

      </div>

    </main>

    <!-- PIE DE PÁGINA SIMPLE INSTITUCIONAL -->
    <footer class="max-w-6xl mx-auto mt-14 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
      <p>© {{ new Date().getFullYear() }} SEDEDE Chuquisaca — Gobierno Autónomo Departamental de Chuquisaca. Todos los derechos reservados.</p>
    </footer>

  </div>
</template>
