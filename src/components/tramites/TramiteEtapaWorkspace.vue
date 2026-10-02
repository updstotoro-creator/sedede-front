<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { tramiteService } from '../../services/tramiteService'

const props = defineProps({
  tramite: {
    type: Object,
    required: true,
  },
  isDeportista: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['updated', 'close', 'back'])

// Etapas oficiales del procedimiento
const ETAPAS_PROCEDIMIENTO = [
  { numero: 1, nombre: 'Registro Solicitud', rol: 'Deportista / Tutor', icon: '📝', unidad: 'Solicitante' },
  { numero: 2, nombre: 'Recepción y Registro Institucional', rol: 'Secretaría / Ventanilla', icon: '📥', unidad: 'Secretaría / Recepción' },
  { numero: 3, nombre: 'Derivación a Coordinación', rol: 'Dirección SEDEDE', icon: '↗️', unidad: 'Dirección SEDEDE' },
  { numero: 4, nombre: 'Revisión Técnica Documental', rol: 'Deporte Competitivo', icon: '🔍', unidad: 'Coordinación Deportiva' },
  { numero: 5, nombre: 'Subsanación de Observaciones', rol: 'Deportista / Solicitante', icon: '⚠️', unidad: 'Deportista / Solicitante' },
  { numero: 6, nombre: 'Informe Técnico Digital', rol: 'Deporte Competitivo', icon: '📋', unidad: 'Deporte Competitivo' },
  { numero: 7, nombre: 'Visto Bueno de Dirección', rol: 'Dirección SEDEDE', icon: '✔️', unidad: 'Dirección SEDEDE' },
  { numero: 8, nombre: 'Dictamen e Informe Jurídico', rol: 'Asesoría Jurídica', icon: '⚖️', unidad: 'Asesoría Jurídica' },
  { numero: 9, nombre: 'Evaluación Comisión Técnica', rol: 'Comisión Técnica / Almacenes', icon: '🏛️', unidad: 'Comisión Técnica' },
  { numero: 10, nombre: 'Resolución Departamental de Apoyo', rol: 'Dirección SEDEDE', icon: '📜', unidad: 'Dirección SEDEDE' },
  { numero: 11, nombre: 'Certificación Presupuestaria', rol: 'Presupuestos / DAF', icon: '💰', unidad: 'DAF - Presupuestos' },
  { numero: 12, nombre: 'Orden de Servicio / Compra', rol: 'Administración', icon: '📄', unidad: 'Administración' },
  { numero: 13, nombre: 'Revisión y Devengado Contable', rol: 'Contabilidad', icon: '📊', unidad: 'Contabilidad' },
  { numero: 14, nombre: 'Aprobación y Firma C-31', rol: 'Dirección / DAF', icon: '✍️', unidad: 'Dirección / DAF' },
  { numero: 15, nombre: 'Priorización en Tesorería', rol: 'Tesorería Deptal.', icon: '🏦', unidad: 'Tesorería' },
  { numero: 16, nombre: 'Desembolso y Pago Efectivo', rol: 'Tesorería (Abono SIGEP)', icon: '💵', unidad: 'Tesorería' },
  { numero: 17, nombre: 'Cierre y Archivo Permanente', rol: 'Archivo Digital SEDEDE', icon: '🗄️', unidad: 'Archivo Central' },
]

// Etapa visualizada actualmente (por defecto la etapa actual del trámite)
const viewingEtapa = ref(props.tramite.etapa_actual || 2)

// Datos persistidos en el trámite
const datosEtapas = computed(() => props.tramite.datos_etapas || {})

// Formularios reactivos para cada etapa específica (Etapa 2 a 17)
const forms = reactive({
  etapa2: {
    hoja_ruta: '',
    fecha_recepcion: new Date().toISOString().split('T')[0],
    hora_recepcion: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    funcionario_receptor: 'Ventanilla Única SEDEDE',
    folios_verificados: 8,
    proveido_inicial: 'Pase a Despacho de Dirección con antecedentes para conocimiento y derivación a Coordinación Deportiva.',
  },
  etapa3: {
    cite_proveido: '',
    prioridad: 'Normal',
    plazo_dias: 3,
    funcionario_asignado: 'Coordinador Deportivo Departamental',
    instrucciones: 'Para su conocimiento, revisión técnica documental de méritos deportivos y emisión de informe conforme a la Ley N° 804.',
  },
  etapa4: {
    decision_tecnica: 'Aprobar', // 'Aprobar', 'Observar', 'Rechazar'
    observaciones_generales: '',
    cumple_criterios_deportivos: true,
  },
  etapa5: {
    observaciones_deportista: '',
  },
  etapa6: {
    cite_informe: '',
    fecha_informe: new Date().toISOString().split('T')[0],
    tecnico_responsable: 'Lic. Responsable de Deporte Competitivo',
    antecedentes: '',
    justificacion_tecnica: '',
    monto_pasajes: 0,
    monto_viaticos: 0,
    monto_inscripcion: 0,
    monto_indumentaria: 0,
    monto_total_recomendado: 0,
    conclusion: 'Se concluye que la postulación cumple a cabalidad con los méritos de representatividad departamental y se recomienda proceder con la asignación presupuestaria.',
  },
  etapa7: {
    cite_vobo: '',
    director_nombre: 'Director Departamental de Deportes SEDEDE',
    decision: 'Aprobado',
    instruccion_juridica: 'Visto Bueno otorgado. Pase a conocimiento de Asesoría Jurídica para análisis normativo de procedencia y emisión de dictamen legal.',
  },
  etapa8: {
    cite_legal: '',
    fecha_dictamen: new Date().toISOString().split('T')[0],
    asesor_nombre: 'Asesor Jurídico SEDEDE',
    normativa_aplicable: 'Ley Nacional del Deporte N° 804 (Art. 34 y 45), Ley Departamental del Deporte y Reglamento Departamental de Apoyo a Deportistas Destacados.',
    analisis_legal: 'Revisados los antecedentes y el Informe Técnico favorable, se constata que no existe impedimento legal, duplicidad de percepción económica en la presente gestión, encontrándose el trámite encuadrado a derecho.',
    conclusion_juridica: 'PROCEDENTE Y JURÍDICAMENTE VIABLE',
  },
  etapa9: {
    acta_numero: '',
    fecha_comision: new Date().toISOString().split('T')[0],
    miembros_comision: 'Comisión Técnica Interdisciplinaria SEDEDE',
    verificacion_almacenes: 'Se verificó en almacenes la no disponibilidad previa del material solicitado, justificándose la adquisición / desembolso.',
    dictamen_comision: 'RATIFICADO FAVORABLEMENTE',
    observacion: 'La Comisión aprueba la viabilidad integral de la solicitud.',
  },
  etapa10: {
    resolucion_numero: '',
    fecha_resolucion: new Date().toISOString().split('T')[0],
    objeto_resolucion: '',
    monto_autorizado: 0,
    resuelve: 'AUTORIZAR la asignación de recursos a favor del atleta para su participación en el evento oficial programado.',
    instruccion_daf: 'Instruir a la Dirección Administrativa Financiera proceder con la certificación presupuestaria y fase de ejecución.',
  },
  etapa11: {
    preventivo_sigep: '',
    fecha_certificacion: new Date().toISOString().split('T')[0],
    partida_presupuestaria: '26990 - Otros Servicios No Personales (Pasajes/Viáticos)',
    fuente_financiamiento: '20 - Recursos Específicos',
    organismo_financiador: '119 - Coparticipación Tributaria',
    monto_certificado: 0,
    saldo_disponible_partida: 125000.00,
    certificador_nombre: 'Jefatura de Presupuestos / DAF',
    dictamen_presupuestario: 'Existe disponibilidad presupuestaria suficiente en la partida para asumir el compromiso económico.',
  },
  etapa12: {
    tipo_orden: 'Orden de Servicio', // 'Orden de Servicio', 'Orden de Compra'
    numero_orden: '',
    fecha_orden: new Date().toISOString().split('T')[0],
    beneficiario_proveedor: '',
    concepto_servicio: '',
    monto_comprometido: 0,
    plazo_entrega: 'Inmediato antes del viaje',
  },
  etapa13: {
    comprobante_devengado: '',
    fecha_devengado: new Date().toISOString().split('T')[0],
    contador_responsable: 'Unidad de Contabilidad SEDEDE',
    control_previo_conforme: true,
    registro_preventivo_confirmado: true,
    dictamen_contable: 'CONFORME PARA PAGO - Registro de devengado presupuestario y patrimonial verificado.',
  },
  etapa14: {
    comprobante_c31: '',
    fecha_firma: new Date().toISOString().split('T')[0],
    monto_c31: 0,
    firmante_daf: 'Director Administrativo Financiero SEDEDE',
    firmante_direccion: 'Director Departamental SEDEDE',
    tipo_firma: 'Firma Digital Autorizada con Validez Jurídica',
    estado_c31: 'APROBADO C-31',
  },
  etapa15: {
    lote_tesoreria: '',
    fecha_programada: new Date().toISOString().split('T')[0],
    cuenta_banco: 'Banco Unión S.A. - Cuenta Fiscal Única',
    cuenta_sigep_beneficiario: '',
    responsable_tesoreria: 'Encargado de Tesorería Departamental',
    estado_priorizacion: 'PAGO PRIORIZADO EN LOTE SIGEP',
  },
  etapa16: {
    numero_transferencia: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    monto_pagado: 0,
    banco_origen: 'Banco Unión S.A.',
    cuenta_destino_sigep: '',
    archivo_comprobante: null,
    archivo_comprobante_nombre: '',
    glosa_pago: 'Abono efectivo mediante SIGEP por concepto de apoyo deportivo oficial.',
  },
  etapa17: {
    codigo_archivo: '',
    total_fojas: 18,
    ubicacion_fisica: 'Estante 4 - Archivador 2026 - Tomo Apoyos Deportivos',
    rendicion_pendiente: true,
    plazo_rendicion_dias: 15,
    responsable_archivo: 'Responsable de Archivo Central e Histórico SEDEDE',
    sello_inmutable: 'EXPEDIENTE CERRADO Y ARCHIVADO DEFINITIVAMENTE',
  },
})

// Inicializar datos con información del trámite o valores previos guardados
function initFormsData() {
  const t = props.tramite
  const d = t.datos_etapas || {}
  const deportistaNombre = t.deportista ? `${t.deportista.nombres} ${t.deportista.apellidos}` : 'Deportista Solicitante'
  const eventoNombre = t.evento_nombre || 'Evento Deportivo'
  const montoSol = Number(t.monto_solicitado) || 0
  const montoAprob = Number(t.monto_aprobado) || montoSol

  // Etapa 2
  forms.etapa2.hoja_ruta = d.etapa_2?.hoja_ruta || `HR-SEDEDE-${t.codigo_tramite}`
  if (d.etapa_2) Object.assign(forms.etapa2, d.etapa_2)

  // Etapa 3
  forms.etapa3.cite_proveido = d.etapa_3?.cite_proveido || `SEDEDE-DIR-PROV-${t.id}/2026`
  if (d.etapa_3) Object.assign(forms.etapa3, d.etapa_3)

  // Etapa 4
  if (d.etapa_4) Object.assign(forms.etapa4, d.etapa_4)

  // Etapa 6
  forms.etapa6.cite_informe = d.etapa_6?.cite_informe || `SEDEDE-DDC-IT-${t.id}/2026`
  forms.etapa6.antecedentes = d.etapa_6?.antecedentes || `El deportista ${deportistaNombre} cuenta con destacada trayectoria en la disciplina correspondiente y certificación oficial.`
  forms.etapa6.justificacion_tecnica = d.etapa_6?.justificacion_tecnica || `Se justifica el apoyo para su participación en ${eventoNombre} en representación del Departamento de Chuquisaca.`
  forms.etapa6.monto_viaticos = d.etapa_6?.monto_viaticos || Math.round(montoSol * 0.4)
  forms.etapa6.monto_pasajes = d.etapa_6?.monto_pasajes || Math.round(montoSol * 0.4)
  forms.etapa6.monto_inscripcion = d.etapa_6?.monto_inscripcion || Math.round(montoSol * 0.2)
  forms.etapa6.monto_total_recomendado = d.etapa_6?.monto_total_recomendado || montoSol
  if (d.etapa_6) Object.assign(forms.etapa6, d.etapa_6)

  // Etapa 7
  forms.etapa7.cite_vobo = d.etapa_7?.cite_vobo || `VOBO-DIR-${t.codigo_tramite}`
  if (d.etapa_7) Object.assign(forms.etapa7, d.etapa_7)

  // Etapa 8
  forms.etapa8.cite_legal = d.etapa_8?.cite_legal || `SEDEDE-AJ-IL-${t.id}/2026`
  if (d.etapa_8) Object.assign(forms.etapa8, d.etapa_8)

  // Etapa 9
  forms.etapa9.acta_numero = d.etapa_9?.acta_numero || `ACTA-CT-${t.id}/2026`
  if (d.etapa_9) Object.assign(forms.etapa9, d.etapa_9)

  // Etapa 10
  forms.etapa10.resolucion_numero = d.etapa_10?.resolucion_numero || `RA-SEDEDE-N° ${String(t.id).padStart(3, '0')}/2026`
  forms.etapa10.objeto_resolucion = d.etapa_10?.objeto_resolucion || `Autorización de apoyo económico para ${deportistaNombre} en ${eventoNombre}`
  forms.etapa10.monto_autorizado = d.etapa_10?.monto_autorizado || montoAprob
  if (d.etapa_10) Object.assign(forms.etapa10, d.etapa_10)

  // Etapa 11
  forms.etapa11.preventivo_sigep = d.etapa_11?.preventivo_sigep || `PREV-SIGEP-2026-${String(t.id).padStart(5, '0')}`
  forms.etapa11.monto_certificado = d.etapa_11?.monto_certificado || montoAprob
  if (d.etapa_11) Object.assign(forms.etapa11, d.etapa_11)

  // Etapa 12
  forms.etapa12.numero_orden = d.etapa_12?.numero_orden || `OS-SEDEDE-2026-${String(t.id).padStart(4, '0')}`
  forms.etapa12.beneficiario_proveedor = d.etapa_12?.beneficiario_proveedor || deportistaNombre
  forms.etapa12.concepto_servicio = d.etapa_12?.concepto_servicio || `Apoyo institucional para participación en ${eventoNombre}`
  forms.etapa12.monto_comprometido = d.etapa_12?.monto_comprometido || montoAprob
  if (d.etapa_12) Object.assign(forms.etapa12, d.etapa_12)

  // Etapa 13
  forms.etapa13.comprobante_devengado = d.etapa_13?.comprobante_devengado || `DEV-2026-${String(t.id).padStart(5, '0')}`
  if (d.etapa_13) Object.assign(forms.etapa13, d.etapa_13)

  // Etapa 14
  forms.etapa14.comprobante_c31 = d.etapa_14?.comprobante_c31 || `C31-DEV-2026-${String(t.id).padStart(6, '0')}`
  forms.etapa14.monto_c31 = d.etapa_14?.monto_c31 || montoAprob
  if (d.etapa_14) Object.assign(forms.etapa14, d.etapa_14)

  // Etapa 15
  forms.etapa15.lote_tesoreria = d.etapa_15?.lote_tesoreria || `LOTE-TES-2026-${new Date().getMonth() + 1}`
  forms.etapa15.cuenta_sigep_beneficiario = d.etapa_15?.cuenta_sigep_beneficiario || (t.cuenta_sigep || 'SIGEP-BO-001')
  if (d.etapa_15) Object.assign(forms.etapa15, d.etapa_15)

  // Etapa 16
  forms.etapa16.numero_transferencia = d.etapa_16?.numero_transferencia || `TRX-BUN-2026-${Math.floor(100000 + Math.random() * 900000)}`
  forms.etapa16.monto_pagado = d.etapa_16?.monto_pagado || montoAprob
  forms.etapa16.cuenta_destino_sigep = d.etapa_16?.cuenta_destino_sigep || (t.cuenta_sigep || 'SIGEP-BO-001')
  if (d.etapa_16) Object.assign(forms.etapa16, d.etapa_16)

  // Etapa 17
  forms.etapa17.codigo_archivo = d.etapa_17?.codigo_archivo || `ARCH-SEDEDE-2026-${String(t.id).padStart(4, '0')}`
  if (d.etapa_17) Object.assign(forms.etapa17, d.etapa_17)
}

watch(() => props.tramite, () => {
  viewingEtapa.value = props.tramite.etapa_actual || 2
  initFormsData()
}, { immediate: true })

// Recalcular monto total en Etapa 6
function recalcularTotalEtapa6() {
  forms.etapa6.monto_total_recomendado = (
    Number(forms.etapa6.monto_pasajes || 0) +
    Number(forms.etapa6.monto_viaticos || 0) +
    Number(forms.etapa6.monto_inscripcion || 0) +
    Number(forms.etapa6.monto_indumentaria || 0)
  )
}

const isSaving = ref(false)
const saveSuccess = ref('')
const saveError = ref('')

// Guardar borrador de la etapa actual sin avanzar de etapa
async function guardarBorradorEtapa(numEtapa) {
  isSaving.value = true
  saveSuccess.value = ''
  saveError.value = ''

  try {
    const key = `etapa${numEtapa}`
    const datos = { ...forms[key] }
    await tramiteService.guardarDatosEtapa(props.tramite.id, {
      etapa: numEtapa,
      datos,
    })
    saveSuccess.value = `✓ Datos de la Etapa ${numEtapa} guardados correctamente.`
    emit('updated')
  } catch (err) {
    saveError.value = err.response?.data?.error || 'Error al guardar los datos de la etapa.'
  } finally {
    isSaving.value = false
    setTimeout(() => { saveSuccess.value = '' }, 3500)
  }
}

// Ejecutar la acción oficial y avanzar al paso siguiente (o destino correspondiente)
async function completarEtapa(numEtapa, options = {}) {
  isSaving.value = true
  saveSuccess.value = ''
  saveError.value = ''

  try {
    const key = `etapa${numEtapa}`
    const datosEtapa = { ...forms[key] }
    let etapaDestino = options.etapaDestino || (numEtapa + 1)
    let unidadDestino = options.unidadDestino || getUnidadDestinoDefault(etapaDestino)
    let accion = options.accion || `Conclusión y Aprobación de Etapa ${numEtapa}`
    let montoAprobado = options.montoAprobado || props.tramite.monto_aprobado

    // Lógicas especiales por etapa
    if (numEtapa === 4) {
      if (forms.etapa4.decision_tecnica === 'Observar') {
        etapaDestino = 5
        unidadDestino = 'Deportista / Solicitante'
        accion = 'Observación de Documentación (Subsanación Requerida)'
      } else if (forms.etapa4.decision_tecnica === 'Rechazar') {
        etapaDestino = 4
        accion = 'Rechazo Técnico Definitivo'
      } else {
        etapaDestino = 6
        unidadDestino = 'Deporte Competitivo'
        accion = 'Aprobación Documental - Pase a Elaboración de Informe Técnico'
      }
    } else if (numEtapa === 5) {
      // Subsanación regresa a Etapa 4
      etapaDestino = 4
      unidadDestino = 'Coordinación Deportiva'
      accion = 'Presentación de Subsanación Documental'
    } else if (numEtapa === 6) {
      montoAprobado = forms.etapa6.monto_total_recomendado
      accion = `Emisión de Informe Técnico ${forms.etapa6.cite_informe}`
    } else if (numEtapa === 10) {
      montoAprobado = forms.etapa10.monto_autorizado
      accion = `Promulgación de Resolución Departamental ${forms.etapa10.resolucion_numero}`
    } else if (numEtapa === 11) {
      accion = `Certificación Presupuestaria Emitida (${forms.etapa11.preventivo_sigep})`
    } else if (numEtapa === 14) {
      accion = `Aprobación y Firma Comprobante C-31 (${forms.etapa14.comprobante_c31})`
    } else if (numEtapa === 16) {
      accion = `Desembolso y Pago Efectivo SIGEP Realizado (${forms.etapa16.numero_transferencia})`
    } else if (numEtapa === 17) {
      etapaDestino = 17
      accion = `Expediente Concluido y Custodiado en Archivo Central (${forms.etapa17.codigo_archivo})`
    }

    const payload = {
      etapa_destino: etapaDestino,
      unidad_destino: unidadDestino,
      accion,
      usuario_nombre: options.usuarioNombre || 'Funcionario SEDEDE',
      observaciones: options.observaciones || `Proceso completado en Etapa ${numEtapa} conforme a normativa institucional.`,
      monto_aprobado: montoAprobado,
      datos_etapa: datosEtapa,
    }

    await tramiteService.derivar(props.tramite.id, payload)
    saveSuccess.value = `✓ Etapa ${numEtapa} completada con éxito. El trámite avanzó a la Etapa ${etapaDestino}.`
    viewingEtapa.value = etapaDestino
    emit('updated')
  } catch (err) {
    saveError.value = err.response?.data?.error || 'Error al completar la etapa.'
  } finally {
    isSaving.value = false
    setTimeout(() => { saveSuccess.value = '' }, 4000)
  }
}

function getUnidadDestinoDefault(etapa) {
  const item = ETAPAS_PROCEDIMIENTO.find(e => e.numero === etapa)
  return item ? item.unidad : 'Unidad Institucional SEDEDE'
}

function handleComprobanteUpload(event) {
  const file = event.target.files[0]
  if (file) {
    forms.etapa16.archivo_comprobante = file
    forms.etapa16.archivo_comprobante_nombre = file.name
  }
}

// ==============================================================
// GESTIÓN DE NAVEGACIÓN Y DEVOLUCIÓN DE ETAPAS CON OBSERVACIÓN
// ==============================================================
const showModalDevolver = ref(false)
const observacionDevolucion = ref('')
const etapaDestinoDevolucion = ref(null)

function abrirModalDevolucion() {
  observacionDevolucion.value = ''
  // Si está en etapa 4 y se observa al atleta, destino es 5
  if (props.tramite.etapa_actual === 4) {
    etapaDestinoDevolucion.value = 5
  } else if (props.tramite.etapa_actual === 6) {
    etapaDestinoDevolucion.value = 4
  } else if (props.tramite.etapa_actual > 1) {
    etapaDestinoDevolucion.value = props.tramite.etapa_actual - 1
  } else {
    etapaDestinoDevolucion.value = 1
  }
  showModalDevolver.value = true
}

async function ejecutarDevolucion() {
  if (!observacionDevolucion.value.trim()) {
    saveError.value = 'Debe ingresar una observación o justificación para devolver el trámite.'
    return
  }
  isSaving.value = true
  saveError.value = ''
  try {
    const destino = Number(etapaDestinoDevolucion.value)
    const itemDestino = ETAPAS_PROCEDIMIENTO.find(e => e.numero === destino)
    const unidadDestino = itemDestino ? itemDestino.unidad : 'Unidad SEDEDE'
    const accion = destino === 5
      ? 'Devolución por Observación Documental (Subsanación Atleta 48h)'
      : `Devolución a Etapa ${destino} por Observación Técnica/Administrativa`

    await tramiteService.derivar(props.tramite.id, {
      etapa_destino: destino,
      unidad_destino: unidadDestino,
      accion,
      observaciones: observacionDevolucion.value,
      usuario_nombre: 'Funcionario SEDEDE',
    })
    showModalDevolver.value = false
    saveSuccess.value = `✓ Trámite devuelto a la Etapa ${destino} con observación registrada.`
    viewingEtapa.value = destino
    emit('updated')
  } catch (err) {
    saveError.value = err.response?.data?.error || 'Error al devolver el trámite.'
  } finally {
    isSaving.value = false
  }
}

async function ejecutarSiguienteEtapa() {
  if (viewingEtapa.value !== props.tramite.etapa_actual) {
    viewingEtapa.value = props.tramite.etapa_actual
    return
  }

  if (viewingEtapa.value === 1) {
    await completarEtapa(1, { etapaDestino: 2, unidadDestino: 'Secretaría / Recepción', accion: 'Pase a Recepción y Verificación en Ventanilla' })
    return
  }

  await completarEtapa(viewingEtapa.value)
}

async function subirArchivoSubsanacion(event, reqId) {
  const file = event.target.files[0]
  if (!file) return
  isSaving.value = true
  saveSuccess.value = ''
  saveError.value = ''
  try {
    await tramiteService.subirDocumento(props.tramite.id, reqId, file)
    saveSuccess.value = '✓ Documento corregido subido exitosamente.'
    emit('updated')
  } catch (err) {
    saveError.value = err.response?.data?.error || 'Error al subir documento corregido.'
  } finally {
    isSaving.value = false
    setTimeout(() => { saveSuccess.value = '' }, 3500)
  }
}

const puedeEditarEtapa = computed(() => {
  if (props.isDeportista) {
    return viewingEtapa.value === 5 && props.tramite.etapa_actual === 5
  }
  return viewingEtapa.value === props.tramite.etapa_actual && viewingEtapa.value !== 1 && viewingEtapa.value !== 5
})

const puedeDevolverEtapa = computed(() => {
  if (props.isDeportista) return false
  return props.tramite.etapa_actual > 1 && viewingEtapa.value === props.tramite.etapa_actual && viewingEtapa.value !== 5
})

const puedeAvanzarEtapa = computed(() => {
  if (props.isDeportista) {
    return viewingEtapa.value === 5 && props.tramite.etapa_actual === 5
  }
  return viewingEtapa.value === props.tramite.etapa_actual && viewingEtapa.value !== 5
})
</script>

<template>
  <div class="space-y-5">
    <!-- BARRA SELECTORA DE ETAPAS (1 - 17) -->
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <span class="rounded bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-800">
            Workflow Digital de 17 Pasos
          </span>
          <h3 class="text-sm font-display font-bold text-slate-900 mt-1">
            Espacio de Trabajo por Etapas Institucionales
          </h3>
          <p class="text-xs text-slate-500">
            Navega entre las vistas de cada etapa o procesa la etapa activa (<strong class="text-slate-800">Paso {{ tramite.etapa_actual }}</strong>).
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-500">Viendo vista del:</span>
          <select v-model.number="viewingEtapa" class="input-field text-xs font-bold py-1 w-64">
            <option v-for="e in ETAPAS_PROCEDIMIENTO" :key="e.numero" :value="e.numero">
              Paso {{ e.numero }}: {{ e.nombre }}
            </option>
          </select>
        </div>
      </div>

      <!-- Barra horizontal interactiva de navegación de etapas -->
      <div class="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          v-for="et in ETAPAS_PROCEDIMIENTO"
          :key="et.numero"
          type="button"
          @click="viewingEtapa = et.numero"
          class="shrink-0 w-32 rounded-xl border p-2 text-left transition-all flex flex-col justify-between"
          :class="{
            'ring-2 ring-brand-600 border-brand-500 bg-brand-50/50 shadow-sm': viewingEtapa === et.numero,
            'bg-emerald-50/70 border-emerald-300 text-emerald-900': et.numero < tramite.etapa_actual,
            'bg-amber-50/80 border-amber-400 text-amber-900 font-bold': et.numero === tramite.etapa_actual,
            'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100': et.numero > tramite.etapa_actual && viewingEtapa !== et.numero
          }"
        >
          <div class="flex items-center justify-between">
            <span
              class="font-mono text-[9px] font-extrabold px-1.5 py-0.2 rounded"
              :class="{
                'bg-amber-500 text-white': et.numero === tramite.etapa_actual,
                'bg-emerald-600 text-white': et.numero < tramite.etapa_actual,
                'bg-slate-200 text-slate-600': et.numero > tramite.etapa_actual
              }"
            >
              Paso {{ et.numero }}
            </span>
            <span class="text-xs">{{ et.icon }}</span>
          </div>
          <p class="font-bold text-[11px] mt-1 leading-tight line-clamp-2" :class="viewingEtapa === et.numero ? 'text-brand-900' : 'text-slate-700'">
            {{ et.nombre }}
          </p>
          <span class="text-[9px] text-slate-400 mt-1 truncate">
            {{ et.rol }}
          </span>
        </button>
      </div>
    </div>

    <!-- NOTIFICACIONES Y ALERTAS DE ACCIÓN -->
    <div v-if="saveSuccess" role="alert" class="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center justify-between shadow-sm">
      <span>{{ saveSuccess }}</span>
      <span class="text-emerald-600">✓ Actualizado</span>
    </div>
    <div v-if="saveError" role="alert" class="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-800 shadow-sm">
      {{ saveError }}
    </div>

    <!-- ======================================================== -->
    <!-- CONTENIDO ESPECÍFICO DE CADA ETAPA (VISTAS OFICIALES)    -->
    <!-- ======================================================== -->

    <!-- VISTA EXCLUSIVA PARA EL DEPORTISTA EN ETAPAS INTERNAS DEL SEDEDE (2-4, 6-17) -->
    <div v-if="isDeportista && viewingEtapa !== 1 && viewingEtapa !== 5" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-800">
            Paso {{ viewingEtapa }} de 17 · Trámite Interno SEDEDE
          </span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">
            {{ ETAPAS_PROCEDIMIENTO.find(e => e.numero === viewingEtapa)?.nombre }}
          </h4>
          <p class="text-xs text-slate-500">
            Unidad Institucional a cargo: <strong class="text-slate-800">{{ ETAPAS_PROCEDIMIENTO.find(e => e.numero === viewingEtapa)?.unidad }}</strong>
          </p>
        </div>
        <span
          class="rounded-full px-3 py-1 text-xs font-bold"
          :class="{
            'bg-emerald-100 text-emerald-800': viewingEtapa < tramite.etapa_actual,
            'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold': viewingEtapa === tramite.etapa_actual,
            'bg-slate-100 text-slate-500': viewingEtapa > tramite.etapa_actual
          }"
        >
          {{ viewingEtapa < tramite.etapa_actual ? '✓ Concluido' : (viewingEtapa === tramite.etapa_actual ? '⚡ En Proceso Actual' : 'Pendiente') }}
        </span>
      </div>

      <div class="rounded-xl border p-4 text-xs" :class="viewingEtapa === tramite.etapa_actual ? 'bg-amber-50/60 border-amber-200 text-amber-950' : 'bg-slate-50 border-slate-200 text-slate-700'">
        <div class="flex items-start gap-3">
          <span class="text-2xl">{{ ETAPAS_PROCEDIMIENTO.find(e => e.numero === viewingEtapa)?.icon }}</span>
          <div>
            <p class="font-bold text-sm" v-if="viewingEtapa === tramite.etapa_actual">
              Tu solicitud está siendo procesada en esta etapa por el personal del SEDEDE.
            </p>
            <p class="font-bold text-sm" v-else-if="viewingEtapa < tramite.etapa_actual">
              Esta etapa ya fue completada y aprobada favorablemente.
            </p>
            <p class="font-bold text-sm text-slate-500" v-else>
              Etapa futura en espera de la culminación de fases previas.
            </p>
            <p class="text-xs mt-1 opacity-90">
              Responsable de evaluación: {{ ETAPAS_PROCEDIMIENTO.find(e => e.numero === viewingEtapa)?.rol }}.
            </p>
          </div>
        </div>
      </div>

      <div v-if="datosEtapas['etapa_' + viewingEtapa]" class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
        <h5 class="text-xs font-bold uppercase tracking-wider text-slate-600">Registro Oficial Emitido:</h5>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div v-for="(val, key) in datosEtapas['etapa_' + viewingEtapa]" :key="key" class="p-2 bg-white rounded border border-slate-200">
            <span class="text-slate-400 block uppercase text-[10px] font-bold">{{ String(key).replace(/_/g, ' ') }}</span>
            <span class="font-semibold text-slate-800">{{ typeof val === 'object' ? JSON.stringify(val) : val }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- VISTA ETAPA 1: REGISTRO SOLICITUD (DEPORTISTA) -->
    <div v-else-if="viewingEtapa === 1" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">Etapa 1 Oficial</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Registro de Solicitud Inicial (Portal del Atleta)</h4>
          <p class="text-xs text-slate-500">Presentada con 15 días de anticipación con carga de documentación y requisitos digitales.</p>
        </div>
        <span class="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">✓ Completado</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <span class="text-slate-400 block font-medium">Deportista:</span>
          <strong class="text-slate-800 text-sm">{{ tramite.deportista?.nombres }} {{ tramite.deportista?.apellidos }}</strong>
          <span class="block text-[11px] text-slate-500">CI: {{ tramite.deportista?.ci }}</span>
        </div>
        <div>
          <span class="text-slate-400 block font-medium">Evento Oficial Aprobado:</span>
          <strong class="text-slate-800 text-sm">{{ tramite.evento_nombre }}</strong>
          <span class="block text-[11px] text-slate-500">Fecha: {{ tramite.fecha_evento }}</span>
        </div>
        <div>
          <span class="text-slate-400 block font-medium">Monto Solicitado:</span>
          <strong class="text-brand-700 font-mono text-base">Bs {{ Number(tramite.monto_solicitado).toLocaleString('es-BO', {minimumFractionDigits: 2}) }}</strong>
          <span class="block text-[11px] text-slate-500">SIGEP: {{ tramite.cuenta_sigep || 'Activa' }}</span>
        </div>
      </div>
      <p class="text-xs text-slate-500 italic">
        * Esta etapa fue completada mediante el formulario inicial del Portal del Atleta con la subida de los 6 a 8 requisitos reglamentarios.
      </p>
    </div>

    <!-- VISTA ETAPA 2: RECEPCIÓN Y REGISTRO INSTITUCIONAL (SECRETARÍA/VENTANILLA) -->
    <div v-else-if="viewingEtapa === 2" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">Etapa 2 · Ventanilla Única</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Recepción y Registro Institucional del Expediente</h4>
          <p class="text-xs text-slate-500">Recepción formal en el buzón institucional, asignación de Hoja de Ruta oficial y carátula.</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="tramite.etapa_actual > 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'">
          {{ tramite.etapa_actual > 2 ? '✓ Recepcionado' : 'Pendiente de Recepción' }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Código de Hoja de Ruta / CITE de Recepción *</label>
          <input v-model="forms.etapa2.hoja_ruta" type="text" class="input-field text-xs font-mono font-bold" placeholder="Ej. HR-SEDEDE-2026-00412" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Fecha de Recepción *</label>
            <input v-model="forms.etapa2.fecha_recepcion" type="date" class="input-field text-xs font-medium" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Hora Oficial</label>
            <input v-model="forms.etapa2.hora_recepcion" type="text" class="input-field text-xs font-medium" />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Funcionario Receptor / Ventanilla</label>
          <input v-model="forms.etapa2.funcionario_receptor" type="text" class="input-field text-xs" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Folios / Requisitos Adjuntos Verificados</label>
          <input v-model.number="forms.etapa2.folios_verificados" type="number" class="input-field text-xs font-mono" />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Proveído Inicial de Secretaría</label>
        <textarea v-model="forms.etapa2.proveido_inicial" rows="2" class="input-field text-xs" placeholder="Proveído inicial institucional..."></textarea>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" class="btn-secondary text-xs" :disabled="isSaving" @click="guardarBorradorEtapa(2)">
          Guardar Borrador
        </button>
        <button type="button" class="btn-primary text-xs font-bold" :disabled="isSaving" @click="completarEtapa(2, { etapaDestino: 3, accion: 'Recepción Oficial y Asignación de Hoja de Ruta' })">
          Confirmar Recepción y Pasar a Dirección (Paso 3) →
        </button>
      </div>
    </div>

    <!-- VISTA ETAPA 3: DERIVACIÓN A COORDINACIÓN (DIRECCIÓN SEDEDE) -->
    <div v-else-if="viewingEtapa === 3" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">Etapa 3 · Despacho Dirección</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Derivación Electrónica a Coordinación Deportiva</h4>
          <p class="text-xs text-slate-500">Instrucción y proveído oficial del Director del SEDEDE para el análisis técnico.</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="tramite.etapa_actual > 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'">
          {{ tramite.etapa_actual > 3 ? '✓ Derivado' : 'En Despacho' }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">CITE Proveído de Despacho *</label>
          <input v-model="forms.etapa3.cite_proveido" type="text" class="input-field text-xs font-mono font-bold" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Prioridad de Atención</label>
          <select v-model="forms.etapa3.prioridad" class="input-field text-xs font-semibold">
            <option value="Normal">Normal (Flujo Ordinario)</option>
            <option value="Urgente">Urgente (Evento Próximo)</option>
            <option value="Prioritaria">Prioritaria (Élite Internacional)</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Plazo de Atención (Días hábiles)</label>
          <input v-model.number="forms.etapa3.plazo_dias" type="number" class="input-field text-xs font-mono" />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Funcionario / Área Asignada</label>
        <input v-model="forms.etapa3.funcionario_asignado" type="text" class="input-field text-xs" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Instrucciones Específicas del Director SEDEDE</label>
        <textarea v-model="forms.etapa3.instrucciones" rows="2" class="input-field text-xs"></textarea>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" class="btn-secondary text-xs" :disabled="isSaving" @click="guardarBorradorEtapa(3)">
          Guardar Borrador
        </button>
        <button type="button" class="btn-primary text-xs font-bold" :disabled="isSaving" @click="completarEtapa(3, { etapaDestino: 4, accion: 'Derivación Oficial a Coordinación Deportiva' })">
          Emitir Proveído y Enviar a Deporte Competitivo (Paso 4) →
        </button>
      </div>
    </div>

    <!-- VISTA ETAPA 4: REVISIÓN TÉCNICA DOCUMENTAL (DEPORTE COMPETITIVO) -->
    <div v-else-if="viewingEtapa === 4" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">Etapa 4 · Coordinación Deportiva</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Revisión Técnica y Validación Documental</h4>
          <p class="text-xs text-slate-500">Evaluación exhaustiva de los requisitos presentados, certificaciones y méritos deportivos.</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="tramite.etapa_actual > 4 ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'">
          {{ tramite.etapa_actual > 4 ? '✓ Evaluado' : 'En Evaluación Técnica' }}
        </span>
      </div>

      <!-- Resumen de Requisitos del Expediente -->
      <div class="space-y-2">
        <h5 class="text-xs font-bold uppercase tracking-wider text-slate-600">Checklist de Requisitos Normativos Adjuntos</h5>
        <div class="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50 p-2 max-h-60 overflow-y-auto">
          <div v-for="req in tramite.requisitos" :key="req.id" class="p-2 flex items-center justify-between text-xs">
            <div>
              <span class="font-bold text-slate-800">{{ req.requisito_nombre }}</span>
              <a v-if="req.archivo_path" :href="req.archivo_path" target="_blank" class="ml-2 text-brand-600 underline font-medium text-[11px]">
                📄 Ver Archivo
              </a>
              <span v-else class="ml-2 text-red-500 text-[11px] font-medium">⚠️ No adjuntado</span>
            </div>
            <span
              class="px-2 py-0.5 rounded text-[10px] font-bold"
              :class="{
                'bg-emerald-100 text-emerald-800': req.estado_validacion === 'Valido',
                'bg-amber-100 text-amber-800': req.estado_validacion === 'Observado',
                'bg-slate-200 text-slate-700': req.estado_validacion === 'Pendiente'
              }"
            >
              {{ req.estado_validacion }}
            </span>
          </div>
        </div>
      </div>

      <!-- Decisión Técnica -->
      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <label class="block text-xs font-bold text-slate-800">Dictamen de Revisión Técnica *</label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label class="flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all" :class="forms.etapa4.decision_tecnica === 'Aprobar' ? 'border-emerald-500 bg-emerald-50/80 font-bold text-emerald-900' : 'bg-white border-slate-200 text-slate-700'">
            <input type="radio" v-model="forms.etapa4.decision_tecnica" value="Aprobar" />
            <span>A. Documentación Conforme (Pasa a Informe Técnico)</span>
          </label>
          <label class="flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all" :class="forms.etapa4.decision_tecnica === 'Observar' ? 'border-amber-500 bg-amber-50/80 font-bold text-amber-900' : 'bg-white border-slate-200 text-slate-700'">
            <input type="radio" v-model="forms.etapa4.decision_tecnica" value="Observar" />
            <span>B. Observar y Solicitar Subsanación (Paso 5)</span>
          </label>
          <label class="flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all" :class="forms.etapa4.decision_tecnica === 'Rechazar' ? 'border-red-500 bg-red-50/80 font-bold text-red-900' : 'bg-white border-slate-200 text-slate-700'">
            <input type="radio" v-model="forms.etapa4.decision_tecnica" value="Rechazar" />
            <span>C. Solicitud No Procedente</span>
          </label>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Fundamentación de la Evaluación Técnica</label>
          <textarea v-model="forms.etapa4.observaciones_generales" rows="2" class="input-field text-xs bg-white" placeholder="Detalle técnico de la evaluación realizada..."></textarea>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" class="btn-secondary text-xs" :disabled="isSaving" @click="guardarBorradorEtapa(4)">
          Guardar Borrador
        </button>
        <button
          type="button"
          class="btn-primary text-xs font-bold"
          :class="forms.etapa4.decision_tecnica === 'Observar' ? 'bg-amber-600 hover:bg-amber-700' : ''"
          :disabled="isSaving"
          @click="completarEtapa(4)"
        >
          {{ forms.etapa4.decision_tecnica === 'Observar' ? 'Derivar a Subsanación (Paso 5) →' : 'Aprobar Revisión y Proceder a Informe Técnico (Paso 6) →' }}
        </button>
      </div>
    </div>

    <!-- VISTA ETAPA 5: SUBSANACIÓN DE DOCUMENTACIÓN -->
    <div v-else-if="viewingEtapa === 5" class="rounded-2xl border border-amber-300 bg-amber-50/40 p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-amber-200 pb-3">
        <div>
          <span class="rounded bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
            {{ isDeportista ? 'Etapa 5 · Portal del Atleta' : 'Etapa 5 · Subsanación Atleta' }}
          </span>
          <h4 class="text-base font-display font-bold text-amber-950 mt-1">
            {{ isDeportista ? 'Subsanación de Documentación Observada (Plazo: 48 horas)' : 'En Espera de Subsanación por el Deportista (Plazo: 48 horas)' }}
          </h4>
          <p class="text-xs text-amber-800">
            {{ isDeportista ? 'El deportista o tutor debe corregir o re-adjuntar los requisitos observados por la Comisión Técnica.' : 'El deportista debe subsanar desde su portal los requisitos observados para reingresar a Revisión Técnica.' }}
          </p>
        </div>
        <span class="rounded-full bg-amber-200 text-amber-900 px-3 py-1 text-xs font-bold">
          {{ isDeportista ? '⚠️ Acción Requerida' : '⏳ Esperando Atleta' }}
        </span>
      </div>

      <div class="bg-white p-4 rounded-xl border border-amber-200 space-y-3">
        <h5 class="text-xs font-bold text-slate-800">Requisitos Observados a Corregir</h5>
        <div class="space-y-2">
          <div
            v-for="req in tramite.requisitos?.filter(r => r.estado_validacion === 'Observado') || []"
            :key="req.id"
            class="p-3 rounded-lg border border-amber-300 bg-amber-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div>
              <p class="font-bold text-xs text-amber-900">{{ req.requisito_nombre }}</p>
              <p class="text-[11px] text-amber-800 italic mt-0.5">Motivo: "{{ req.observacion || 'Documento no visible o incompleto' }}"</p>
            </div>
            <label v-if="isDeportista" class="btn-primary bg-amber-700 hover:bg-amber-800 text-[11px] py-1 px-3 cursor-pointer shrink-0">
              <span>📎 Subir Corrección</span>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" class="hidden" @change="subirArchivoSubsanacion($event, req.id)" />
            </label>
          </div>
          <div v-if="!tramite.requisitos?.some(r => r.estado_validacion === 'Observado')" class="p-3 text-xs text-slate-500 italic bg-slate-50 rounded">
            Observación general: {{ tramite.observaciones || 'No existen requisitos marcados individualmente como observados.' }}
          </div>
        </div>
      </div>

      <div v-if="isDeportista">
        <label class="block text-xs font-semibold text-slate-700 mb-1">Descargo / Aclaración del Deportista</label>
        <textarea v-model="forms.etapa5.observaciones_deportista" rows="2" class="input-field text-xs bg-white" placeholder="Explique las correcciones realizadas o documentación actualizada adjunta..."></textarea>
      </div>
      <div v-else class="rounded-xl border border-amber-200 bg-amber-100/60 p-3 text-xs text-amber-900 font-medium">
        ℹ️ Esta etapa le corresponde exclusivamente al deportista. Cuando suba sus correcciones, el expediente avanzará automáticamente a la <strong>Etapa 4 (Revisión Técnica)</strong> de su bandeja.
      </div>

      <div v-if="isDeportista" class="flex items-center justify-end gap-3 pt-3 border-t border-amber-200">
        <button type="button" class="btn-primary bg-amber-700 hover:bg-amber-800 text-xs font-bold" :disabled="isSaving" @click="completarEtapa(5, { etapaDestino: 4, unidadDestino: 'Coordinación Deportiva', accion: 'Subsanación Presentada por el Deportista' })">
          ✓ Enviar Subsanación a Nueva Revisión Técnica (Paso 4) →
        </button>
      </div>
    </div>

    <!-- VISTA ETAPA 6: INFORME TÉCNICO DIGITAL (DEPORTE COMPETITIVO) -->
    <div v-else-if="viewingEtapa === 6" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">Etapa 6 · Deporte Competitivo</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Emisión de Informe Técnico Digital de Viabilidad</h4>
          <p class="text-xs text-slate-500">Dictamen formal con justificación técnica deportiva y desglose del monto recomendado.</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="tramite.etapa_actual > 6 ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'">
          {{ tramite.etapa_actual > 6 ? '✓ Emitido' : 'Pendiente de Emisión' }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">CITE Informe Técnico *</label>
          <input v-model="forms.etapa6.cite_informe" type="text" class="input-field text-xs font-mono font-bold" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Fecha de Emisión</label>
          <input v-model="forms.etapa6.fecha_informe" type="date" class="input-field text-xs" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Técnico Evaluador</label>
          <input v-model="forms.etapa6.tecnico_responsable" type="text" class="input-field text-xs" />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">I. Antecedentes del Deportista</label>
        <textarea v-model="forms.etapa6.antecedentes" rows="2" class="input-field text-xs"></textarea>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">II. Justificación Técnica de la Representación</label>
        <textarea v-model="forms.etapa6.justificacion_tecnica" rows="2" class="input-field text-xs"></textarea>
      </div>

      <!-- Desglose de Presupuesto Recomendado -->
      <div class="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4 space-y-3">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
            III. Desglose Presupuestario Técnico Recomendado (Bs)
          </label>
          <span class="text-xs font-bold text-brand-800 font-mono">
            Total: Bs {{ Number(forms.etapa6.monto_total_recomendado).toLocaleString('es-BO', {minimumFractionDigits: 2}) }}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-1">Pasajes / Transporte</label>
            <input v-model.number="forms.etapa6.monto_pasajes" type="number" step="10" @input="recalcularTotalEtapa6" class="input-field text-xs font-mono bg-white" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-1">Viáticos / Alimentación</label>
            <input v-model.number="forms.etapa6.monto_viaticos" type="number" step="10" @input="recalcularTotalEtapa6" class="input-field text-xs font-mono bg-white" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-1">Inscripción / Licencia</label>
            <input v-model.number="forms.etapa6.monto_inscripcion" type="number" step="10" @input="recalcularTotalEtapa6" class="input-field text-xs font-mono bg-white" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-1">Material / Indumentaria</label>
            <input v-model.number="forms.etapa6.monto_indumentaria" type="number" step="10" @input="recalcularTotalEtapa6" class="input-field text-xs font-mono bg-white" />
          </div>
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">IV. Conclusión y Recomendación Favorable</label>
        <textarea v-model="forms.etapa6.conclusion" rows="2" class="input-field text-xs"></textarea>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" class="btn-secondary text-xs" :disabled="isSaving" @click="guardarBorradorEtapa(6)">
          Guardar Borrador
        </button>
        <button type="button" class="btn-primary text-xs font-bold" :disabled="isSaving" @click="completarEtapa(6, { etapaDestino: 7, unidadDestino: 'Dirección SEDEDE', accion: `Emisión de Informe Técnico ${forms.etapa6.cite_informe}` })">
          Emitir Informe Técnico y Elevar a Dirección (Paso 7) →
        </button>
      </div>
    </div>

    <!-- VISTA ETAPA 7: VISTO BUENO DE DIRECCIÓN -->
    <div v-else-if="viewingEtapa === 7" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">Etapa 7 · Despacho Dirección</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Revisión y Visto Bueno (Vo.Bo.) de Dirección</h4>
          <p class="text-xs text-slate-500">Conformidad de la Máxima Autoridad y proveído oficial a Asesoría Jurídica.</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="tramite.etapa_actual > 7 ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'">
          {{ tramite.etapa_actual > 7 ? '✓ Vo.Bo. Otorgado' : 'Pendiente de Vo.Bo.' }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">CITE Visto Bueno / Proveído *</label>
          <input v-model="forms.etapa7.cite_vobo" type="text" class="input-field text-xs font-mono font-bold" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Director del SEDEDE</label>
          <input v-model="forms.etapa7.director_nombre" type="text" class="input-field text-xs font-medium" />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Proveído e Instrucción a Asesoría Jurídica</label>
        <textarea v-model="forms.etapa7.instruccion_juridica" rows="3" class="input-field text-xs"></textarea>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" class="btn-secondary text-xs" :disabled="isSaving" @click="guardarBorradorEtapa(7)">
          Guardar Borrador
        </button>
        <button type="button" class="btn-primary text-xs font-bold" :disabled="isSaving" @click="completarEtapa(7, { etapaDestino: 8, unidadDestino: 'Asesoría Jurídica', accion: 'Visto Bueno Otorgado por Dirección' })">
          Aprobar Vo.Bo. y Remitir a Asesoría Jurídica (Paso 8) →
        </button>
      </div>
    </div>

    <!-- VISTA ETAPA 8: DICTAMEN E INFORME JURÍDICO (ASESORÍA JURÍDICA) -->
    <div v-else-if="viewingEtapa === 8" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">Etapa 8 · Asesoría Jurídica</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Dictamen e Informe Legal de Viabilidad</h4>
          <p class="text-xs text-slate-500">Análisis normativo en el marco de la Ley N° 804 y reglamentación departamental.</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="tramite.etapa_actual > 8 ? 'bg-emerald-100 text-emerald-800' : 'bg-violet-100 text-violet-800'">
          {{ tramite.etapa_actual > 8 ? '✓ Dictamen Emitido' : 'En Análisis Legal' }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">CITE Informe Legal *</label>
          <input v-model="forms.etapa8.cite_legal" type="text" class="input-field text-xs font-mono font-bold" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Fecha de Dictamen</label>
          <input v-model="forms.etapa8.fecha_dictamen" type="date" class="input-field text-xs" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Asesor Jurídico Responsable</label>
          <input v-model="forms.etapa8.asesor_nombre" type="text" class="input-field text-xs" />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Marco Normativo Aplicable</label>
        <input v-model="forms.etapa8.normativa_aplicable" type="text" class="input-field text-xs" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Análisis de Legalidad y Procedencia</label>
        <textarea v-model="forms.etapa8.analisis_legal" rows="3" class="input-field text-xs"></textarea>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Conclusión Jurídica</label>
        <select v-model="forms.etapa8.conclusion_juridica" class="input-field text-xs font-bold">
          <option value="PROCEDENTE Y JURÍDICAMENTE VIABLE">PROCEDENTE Y JURÍDICAMENTE VIABLE</option>
          <option value="PROCEDENTE CON OBSERVACIONES MENORES">PROCEDENTE CON OBSERVACIONES MENORES</option>
          <option value="IMPROCEDENTE">IMPROCEDENTE</option>
        </select>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" class="btn-secondary text-xs" :disabled="isSaving" @click="guardarBorradorEtapa(8)">
          Guardar Borrador
        </button>
        <button type="button" class="btn-primary text-xs font-bold" :disabled="isSaving" @click="completarEtapa(8, { etapaDestino: 9, unidadDestino: 'Comisión Técnica', accion: `Dictamen Jurídico Emitido (${forms.etapa8.cite_legal})` })">
          Firmar Dictamen Jurídico y Remitir a Comisión (Paso 9) →
        </button>
      </div>
    </div>

    <!-- VISTA ETAPA 9: EVALUACIÓN COMISIÓN TÉCNICA / ALMACENES -->
    <div v-else-if="viewingEtapa === 9" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">Etapa 9 · Comisión Interdisciplinaria</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Evaluación de Comisión Técnica y Constancia de Almacenes</h4>
          <p class="text-xs text-slate-500">Evaluación integral colegiada y verificación de stock para entrega o compra.</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="tramite.etapa_actual > 9 ? 'bg-emerald-100 text-emerald-800' : 'bg-violet-100 text-violet-800'">
          {{ tramite.etapa_actual > 9 ? '✓ Ratificado' : 'En Comisión' }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">N° de Acta de Comisión Técnica *</label>
          <input v-model="forms.etapa9.acta_numero" type="text" class="input-field text-xs font-mono font-bold" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Fecha de Sesión de Comisión</label>
          <input v-model="forms.etapa9.fecha_comision" type="date" class="input-field text-xs" />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Miembros de la Comisión Técnica</label>
        <input v-model="forms.etapa9.miembros_comision" type="text" class="input-field text-xs" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Constancia de Almacén / Equipamiento</label>
        <textarea v-model="forms.etapa9.verificacion_almacenes" rows="2" class="input-field text-xs"></textarea>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" class="btn-secondary text-xs" :disabled="isSaving" @click="guardarBorradorEtapa(9)">
          Guardar Borrador
        </button>
        <button type="button" class="btn-primary text-xs font-bold" :disabled="isSaving" @click="completarEtapa(9, { etapaDestino: 10, unidadDestino: 'Dirección SEDEDE', accion: `Acta de Comisión Técnica N° ${forms.etapa9.acta_numero}` })">
          Aprobar Acta de Comisión y Elevar a Dirección (Paso 10) →
        </button>
      </div>
    </div>

    <!-- VISTA ETAPA 10: SOLICITUD DE INICIO / RESOLUCIÓN ADMINISTRATIVA (DIRECCIÓN) -->
    <div v-else-if="viewingEtapa === 10" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">Etapa 10 · Despacho Dirección</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Emisión de Resolución Departamental de Apoyo Económico</h4>
          <p class="text-xs text-slate-500">Acto administrativo de autorización formal para el inicio del proceso de gasto en la DAF.</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="tramite.etapa_actual > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-violet-100 text-violet-800'">
          {{ tramite.etapa_actual > 10 ? '✓ Promulgada' : 'Pendiente Resolución' }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">N° de Resolución Administrativa *</label>
          <input v-model="forms.etapa10.resolucion_numero" type="text" class="input-field text-xs font-mono font-bold" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Fecha de Promulgación</label>
          <input v-model="forms.etapa10.fecha_resolucion" type="date" class="input-field text-xs" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Monto Oficial Autorizado (Bs) *</label>
          <input v-model.number="forms.etapa10.monto_autorizado" type="number" step="0.5" class="input-field text-xs font-mono font-bold text-brand-700" />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Objeto de la Resolución</label>
        <input v-model="forms.etapa10.objeto_resolucion" type="text" class="input-field text-xs" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Por Tanto: Resuelve</label>
        <textarea v-model="forms.etapa10.resuelve" rows="2" class="input-field text-xs"></textarea>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" class="btn-secondary text-xs" :disabled="isSaving" @click="guardarBorradorEtapa(10)">
          Guardar Borrador
        </button>
        <button type="button" class="btn-primary text-xs font-bold" :disabled="isSaving" @click="completarEtapa(10, { etapaDestino: 11, unidadDestino: 'DAF - Presupuestos', montoAprobado: forms.etapa10.monto_autorizado, accion: `Resolución Promulgada ${forms.etapa10.resolucion_numero}` })">
          Promulgar Resolución y Remitir a Presupuestos / DAF (Paso 11) →
        </button>
      </div>
    </div>

    <!-- VISTA ETAPA 11: CERTIFICACIÓN PRESUPUESTARIA (DAF / PRESUPUESTOS) -->
    <div v-else-if="viewingEtapa === 11" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Etapa 11 · Presupuestos / DAF</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Certificación Presupuestaria y Preventivo SIGEP</h4>
          <p class="text-xs text-slate-500">Afectación preventiva en el presupuesto departamental asegurando saldo disponible.</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="tramite.etapa_actual > 11 ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-100 text-emerald-800'">
          {{ tramite.etapa_actual > 11 ? '✓ Certificado' : 'En Presupuesto' }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">N° Certificado Preventivo SIGEP *</label>
          <input v-model="forms.etapa11.preventivo_sigep" type="text" class="input-field text-xs font-mono font-bold" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Monto Certificado (Bs) *</label>
          <input v-model.number="forms.etapa11.monto_certificado" type="number" step="0.5" class="input-field text-xs font-mono font-bold text-emerald-700" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Saldo Disponible en Partida (Bs)</label>
          <input v-model.number="forms.etapa11.saldo_disponible_partida" type="number" class="input-field text-xs font-mono bg-slate-50" readonly />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Partida Presupuestaria *</label>
          <select v-model="forms.etapa11.partida_presupuestaria" class="input-field text-xs font-medium">
            <option value="26990 - Otros Servicios No Personales (Pasajes/Viáticos)">26990 - Otros Servicios No Personales (Pasajes/Viáticos)</option>
            <option value="71100 - Transferencias al Sector Privado (Premios/Becas)">71100 - Transferencias al Sector Privado (Premios/Becas)</option>
            <option value="39990 - Otros Materiales y Suministros (Indumentaria)">39990 - Otros Materiales y Suministros (Indumentaria)</option>
            <option value="34100 - Combustibles y Lubricantes">34100 - Combustibles y Lubricantes</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Fuente de Financiamiento</label>
          <select v-model="forms.etapa11.fuente_financiamiento" class="input-field text-xs font-medium">
            <option value="20 - Recursos Específicos">20 - Recursos Específicos</option>
            <option value="11 - T.G.N.">11 - T.G.N.</option>
            <option value="41 - Transferencias TGN">41 - Transferencias TGN</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Organismo Financiador</label>
          <select v-model="forms.etapa11.organismo_financiador" class="input-field text-xs font-medium">
            <option value="119 - Coparticipación Tributaria">119 - Coparticipación Tributaria</option>
            <option value="111 - Tesoro General de la Nación">111 - Tesoro General de la Nación</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Certificación de Disponibilidad</label>
        <textarea v-model="forms.etapa11.dictamen_presupuestario" rows="2" class="input-field text-xs"></textarea>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" class="btn-secondary text-xs" :disabled="isSaving" @click="guardarBorradorEtapa(11)">
          Guardar Borrador
        </button>
        <button type="button" class="btn-primary text-xs font-bold" :disabled="isSaving" @click="completarEtapa(11, { etapaDestino: 12, unidadDestino: 'Administración', accion: `Certificación Presupuestaria Emitida (${forms.etapa11.preventivo_sigep})` })">
          Emitir Certificación y Pasar a Orden de Servicio (Paso 12) →
        </button>
      </div>
    </div>

    <!-- VISTA ETAPA 12: ORDEN DE SERVICIO / COMPRA (ADMINISTRACIÓN) -->
    <div v-else-if="viewingEtapa === 12" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Etapa 12 · Adquisiciones / Admin</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Generación de Orden de Servicio / Orden de Compra</h4>
          <p class="text-xs text-slate-500">Documento contractual y de compromiso oficial del servicio o material deportivo.</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="tramite.etapa_actual > 12 ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-100 text-emerald-800'">
          {{ tramite.etapa_actual > 12 ? '✓ Generada' : 'Pendiente Orden' }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Tipo de Orden</label>
          <select v-model="forms.etapa12.tipo_orden" class="input-field text-xs font-bold">
            <option value="Orden de Servicio">Orden de Servicio (Apoyo/Pasajes/Viáticos)</option>
            <option value="Orden de Compra">Orden de Compra (Material/Indumentaria)</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">N° de Orden Institucional *</label>
          <input v-model="forms.etapa12.numero_orden" type="text" class="input-field text-xs font-mono font-bold" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Monto Comprometido (Bs)</label>
          <input v-model.number="forms.etapa12.monto_comprometido" type="number" step="0.5" class="input-field text-xs font-mono font-bold text-emerald-700" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Beneficiario / Proveedor Oficial</label>
          <input v-model="forms.etapa12.beneficiario_proveedor" type="text" class="input-field text-xs" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Plazo de Ejecución</label>
          <input v-model="forms.etapa12.plazo_entrega" type="text" class="input-field text-xs" />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Concepto Detallado de la Orden</label>
        <textarea v-model="forms.etapa12.concepto_servicio" rows="2" class="input-field text-xs"></textarea>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" class="btn-secondary text-xs" :disabled="isSaving" @click="guardarBorradorEtapa(12)">
          Guardar Borrador
        </button>
        <button type="button" class="btn-primary text-xs font-bold" :disabled="isSaving" @click="completarEtapa(12, { etapaDestino: 13, unidadDestino: 'Contabilidad', accion: `Orden Generada (${forms.etapa12.numero_orden})` })">
          Registrar Orden y Remitir a Contabilidad (Paso 13) →
        </button>
      </div>
    </div>

    <!-- VISTA ETAPA 13: REVISIÓN Y DEVENGADO CONTABLE (CONTABILIDAD) -->
    <div v-else-if="viewingEtapa === 13" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Etapa 13 · Contabilidad</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Control Previo y Registro de Devengado Contable</h4>
          <p class="text-xs text-slate-500">Verificación contable, afectación de la obligación patrimonial y comprobante de diario.</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="tramite.etapa_actual > 13 ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-100 text-emerald-800'">
          {{ tramite.etapa_actual > 13 ? '✓ Devengado Aprobado' : 'En Contabilidad' }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">N° de Comprobante de Devengado / Diario *</label>
          <input v-model="forms.etapa13.comprobante_devengado" type="text" class="input-field text-xs font-mono font-bold" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Fecha de Registro Contable</label>
          <input v-model="forms.etapa13.fecha_devengado" type="date" class="input-field text-xs" />
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
        <label class="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
          <input type="checkbox" v-model="forms.etapa13.control_previo_conforme" class="rounded text-brand-600" />
          <span>✓ Control Previo Conforme (Documentación de respaldo completa y sin observaciones)</span>
        </label>
        <label class="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
          <input type="checkbox" v-model="forms.etapa13.registro_preventivo_confirmado" class="rounded text-brand-600" />
          <span>✓ Registro Preventivo enlazado correctamente al devengado contable</span>
        </label>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Dictamen de Conformidad Contable</label>
        <textarea v-model="forms.etapa13.dictamen_contable" rows="2" class="input-field text-xs"></textarea>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" class="btn-secondary text-xs" :disabled="isSaving" @click="guardarBorradorEtapa(13)">
          Guardar Borrador
        </button>
        <button type="button" class="btn-primary text-xs font-bold" :disabled="isSaving" @click="completarEtapa(13, { etapaDestino: 14, unidadDestino: 'Dirección / DAF', accion: `Devengado Contable Aprobado (${forms.etapa13.comprobante_devengado})` })">
          Aprobar Devengado y Remitir para Firma C-31 (Paso 14) →
        </button>
      </div>
    </div>

    <!-- VISTA ETAPA 14: APROBACIÓN Y FIRMA C-31 (DIRECCIÓN / DAF) -->
    <div v-else-if="viewingEtapa === 14" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Etapa 14 · Firma Ejecutiva</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Aprobación y Firma Digital del Comprobante C-31</h4>
          <p class="text-xs text-slate-500">Autorización final de gasto del C-31 de ejecución de recursos.</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="tramite.etapa_actual > 14 ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-100 text-emerald-800'">
          {{ tramite.etapa_actual > 14 ? '✓ Firmado C-31' : 'Pendiente de Firma' }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">N° Comprobante C-31 SIGEP *</label>
          <input v-model="forms.etapa14.comprobante_c31" type="text" class="input-field text-xs font-mono font-bold text-emerald-800" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Monto de Ejecución C-31 (Bs) *</label>
          <input v-model.number="forms.etapa14.monto_c31" type="number" step="0.5" class="input-field text-xs font-mono font-bold" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Firmante DAF</label>
          <input v-model="forms.etapa14.firmante_daf" type="text" class="input-field text-xs font-medium" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Firmante Dirección SEDEDE</label>
          <input v-model="forms.etapa14.firmante_direccion" type="text" class="input-field text-xs font-medium" />
        </div>
      </div>

      <div class="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-lg">✍️</span>
          <div>
            <p class="font-bold text-xs text-emerald-950">{{ forms.etapa14.tipo_firma }}</p>
            <p class="text-[11px] text-emerald-800">Con validez jurídica conforme a la normativa institucional y gubernamental.</p>
          </div>
        </div>
        <span class="rounded bg-emerald-600 text-white px-2.5 py-1 text-xs font-bold font-mono">
          {{ forms.etapa14.estado_c31 }}
        </span>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" class="btn-secondary text-xs" :disabled="isSaving" @click="guardarBorradorEtapa(14)">
          Guardar Borrador
        </button>
        <button type="button" class="btn-primary text-xs font-bold" :disabled="isSaving" @click="completarEtapa(14, { etapaDestino: 15, unidadDestino: 'Tesorería', accion: `Firma y Aprobación Comprobante C-31 (${forms.etapa14.comprobante_c31})` })">
          Firmar C-31 y Derivar a Tesorería (Paso 15) →
        </button>
      </div>
    </div>

    <!-- VISTA ETAPA 15: PRIORIZACIÓN EN TESORERÍA -->
    <div v-else-if="viewingEtapa === 15" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">Etapa 15 · Tesorería Departamental</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Priorización y Programación de Pago en SIGEP</h4>
          <p class="text-xs text-slate-500">Inclusión del desembolso en el lote de pago programado y verificación de cuenta fiscal.</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="tramite.etapa_actual > 15 ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'">
          {{ tramite.etapa_actual > 15 ? '✓ Pago Priorizado' : 'En Tesorería' }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">N° de Lote de Tesorería SIGEP *</label>
          <input v-model="forms.etapa15.lote_tesoreria" type="text" class="input-field text-xs font-mono font-bold" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Fecha Programada de Abono</label>
          <input v-model="forms.etapa15.fecha_programada" type="date" class="input-field text-xs" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Cuenta Banco Origen</label>
          <input v-model="forms.etapa15.cuenta_banco" type="text" class="input-field text-xs bg-slate-50" readonly />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Cuenta SIGEP / Banco del Beneficiario</label>
          <input v-model="forms.etapa15.cuenta_sigep_beneficiario" type="text" class="input-field text-xs font-mono font-bold" />
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" class="btn-secondary text-xs" :disabled="isSaving" @click="guardarBorradorEtapa(15)">
          Guardar Borrador
        </button>
        <button type="button" class="btn-primary text-xs font-bold bg-teal-700 hover:bg-teal-800" :disabled="isSaving" @click="completarEtapa(15, { etapaDestino: 16, unidadDestino: 'Tesorería', accion: `Priorización de Pago en Lote ${forms.etapa15.lote_tesoreria}` })">
          Confirmar Priorización y Pasar a Ejecución de Pago (Paso 16) →
        </button>
      </div>
    </div>

    <!-- VISTA ETAPA 16: PAGO Y DESEMBOLSO EFECTIVO (TESORERÍA) -->
    <div v-else-if="viewingEtapa === 16" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">Etapa 16 · Desembolso</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Registro de Desembolso y Pago Efectivo (Abono Bancario)</h4>
          <p class="text-xs text-slate-500">Constancia de transferencia bancaria SIGEP y notificación de desembolso al beneficiario.</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="tramite.etapa_actual >= 16 ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'">
          {{ tramite.etapa_actual >= 16 ? '✓ Pagado / Desembolsado' : 'Pendiente de Pago' }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">N° Transacción SIGEP / Banco *</label>
          <input v-model="forms.etapa16.numero_transferencia" type="text" class="input-field text-xs font-mono font-bold text-teal-900" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Fecha Efectiva de Abono *</label>
          <input v-model="forms.etapa16.fecha_pago" type="date" class="input-field text-xs font-medium" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Monto Pagado Efectivo (Bs) *</label>
          <input v-model.number="forms.etapa16.monto_pagado" type="number" step="0.5" class="input-field text-xs font-mono font-bold text-emerald-700" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Cuenta Destino SIGEP / Atleta</label>
          <input v-model="forms.etapa16.cuenta_destino_sigep" type="text" class="input-field text-xs font-mono" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Comprobante de Transferencia Bancaria (PDF/Imagen)</label>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" @change="handleComprobanteUpload" class="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Glosa Oficial de Pago</label>
        <textarea v-model="forms.etapa16.glosa_pago" rows="2" class="input-field text-xs"></textarea>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" class="btn-secondary text-xs" :disabled="isSaving" @click="guardarBorradorEtapa(16)">
          Guardar Borrador
        </button>
        <button type="button" class="btn-primary text-xs font-bold bg-emerald-700 hover:bg-emerald-800" :disabled="isSaving" @click="completarEtapa(16, { etapaDestino: 17, unidadDestino: 'Archivo Central', accion: `Desembolso Efectivo Realizado (${forms.etapa16.numero_transferencia})` })">
          Confirmar Pago y Enviar a Archivo Digital (Paso 17) →
        </button>
      </div>
    </div>

    <!-- VISTA ETAPA 17: CIERRE Y ARCHIVO PERMANENTE (ARCHIVO CENTRAL) -->
    <div v-else-if="viewingEtapa === 17" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span class="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-800">Etapa 17 · Archivo Central</span>
          <h4 class="text-base font-display font-bold text-slate-900 mt-1">Cierre de Expediente y Custodia en Archivo Digital Permanente</h4>
          <p class="text-xs text-slate-500">Foliación inmutable, registro de custodia física y digital, y control de rendición de cuentas.</p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="tramite.etapa_actual >= 17 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'">
          {{ tramite.etapa_actual >= 17 ? '✓ Concluido y Archivado' : 'Pendiente Archivo' }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Código de Archivo Institucional *</label>
          <input v-model="forms.etapa17.codigo_archivo" type="text" class="input-field text-xs font-mono font-bold" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Total de Fojas / Folios Acumulados *</label>
          <input v-model.number="forms.etapa17.total_fojas" type="number" class="input-field text-xs font-mono font-bold" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Ubicación Física en Archivo Central</label>
          <input v-model="forms.etapa17.ubicacion_fisica" type="text" class="input-field text-xs font-medium" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Responsable de Archivo y Custodia</label>
          <input v-model="forms.etapa17.responsable_archivo" type="text" class="input-field text-xs font-medium" />
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
        <label class="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
          <input type="checkbox" v-model="forms.etapa17.rendicion_pendiente" class="rounded text-brand-600" />
          <span>Requiere presentación de informe deportivo y rendición de pasajes usados (Plazo: 15 días posteriores al torneo)</span>
        </label>
      </div>

      <div class="rounded-xl border border-slate-300 bg-slate-100 p-4 text-center">
        <span class="inline-block px-3 py-1 rounded bg-slate-800 text-white font-mono text-xs font-extrabold tracking-widest uppercase">
          {{ forms.etapa17.sello_inmutable }}
        </span>
        <p class="text-[11px] text-slate-500 mt-1">
          La documentación e historial de trazabilidad quedan blindados e inmutables para fines de auditoría gubernamental.
        </p>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" class="btn-secondary text-xs" :disabled="isSaving" @click="guardarBorradorEtapa(17)">
          Guardar Borrador
        </button>
        <button type="button" class="btn-primary text-xs font-bold bg-slate-900 hover:bg-black text-white" :disabled="isSaving" @click="completarEtapa(17, { etapaDestino: 17, unidadDestino: 'Archivo Central', accion: `Cierre y Archivo Definitivo del Expediente (${forms.etapa17.codigo_archivo})` })">
          🗄️ Concluir Trámite y Sellar Archivo Permanente
        </button>
      </div>
    </div>

    <!-- ============================================================== -->
    <!-- BARRA INFERIOR DE ACCIÓN Y NAVEGACIÓN ESTANDARIZADA DEL FLUJO -->
    <!-- ============================================================== -->
    <div class="sticky bottom-0 z-30 -mx-6 -mb-6 mt-8 rounded-b-2xl border-t border-slate-200 bg-white/95 backdrop-blur-md px-6 py-3.5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
      <!-- Botón 1: Volver a la lista -->
      <button
        type="button"
        class="btn-secondary text-xs flex items-center gap-1.5 font-bold shadow-sm"
        @click="emit('back')"
      >
        <span>←</span>
        <span>Volver a la Lista</span>
      </button>

      <!-- Indicador si el usuario está visualizando una etapa histórica o futura -->
      <div v-if="viewingEtapa !== tramite.etapa_actual" class="text-xs text-slate-500 flex items-center gap-2">
        <span class="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-700 text-[11px]">
          Viendo Paso {{ viewingEtapa }} (Consulta)
        </span>
        <button
          type="button"
          class="font-bold text-brand-600 hover:underline text-xs flex items-center gap-1"
          @click="viewingEtapa = tramite.etapa_actual"
        >
          <span>Ir a la etapa en curso (Paso {{ tramite.etapa_actual }}) →</span>
        </button>
      </div>

      <div class="flex items-center gap-2">
        <!-- Guardar borrador discreto si corresponde -->
        <button
          v-if="puedeEditarEtapa"
          type="button"
          class="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          :disabled="isSaving"
          @click="guardarBorradorEtapa(viewingEtapa)"
        >
          💾 Guardar Borrador
        </button>

        <!-- Botón 2: Devolver a etapa previa (solo en caso de haber alguna observación) -->
        <button
          v-if="puedeDevolverEtapa"
          type="button"
          class="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 flex items-center gap-1.5 transition-all shadow-sm"
          :disabled="isSaving"
          @click="abrirModalDevolucion"
          title="Devolver trámite con observación técnica o documental"
        >
          <span>⚠️</span>
          <span>Devolver a Etapa Previa (con Observación)</span>
        </button>

        <!-- Botón 3: Siguiente etapa o fin del proceso -->
        <button
          v-if="puedeAvanzarEtapa"
          type="button"
          class="btn-primary text-xs font-bold flex items-center gap-1.5 shadow-sm"
          :class="{
            'bg-slate-900 hover:bg-black text-white': viewingEtapa === 17,
            'bg-amber-600 hover:bg-amber-700 text-white': viewingEtapa === 5 || (viewingEtapa === 4 && forms.etapa4.decision_tecnica === 'Observar'),
            'bg-brand-600 hover:bg-brand-700 text-white': viewingEtapa !== 17 && viewingEtapa !== 5 && (viewingEtapa !== 4 || forms.etapa4.decision_tecnica !== 'Observar')
          }"
          :disabled="isSaving"
          @click="ejecutarSiguienteEtapa"
        >
          <span v-if="viewingEtapa === 17">🗄️ Fin del Proceso (Sellar y Archivar)</span>
          <span v-else-if="viewingEtapa === 5">✓ Enviar Subsanación (Paso 4) →</span>
          <span v-else-if="viewingEtapa === 4 && forms.etapa4.decision_tecnica === 'Observar'">⚠️ Derivar a Subsanación (Paso 5) →</span>
          <span v-else>➔ Siguiente Etapa (Paso {{ viewingEtapa + 1 }})</span>
        </button>
      </div>
    </div>

    <!-- MODAL DE DEVOLUCIÓN A ETAPA PREVIA CON OBSERVACIÓN -->
    <div v-if="showModalDevolver" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2 text-amber-700">
            <span class="text-xl">⚠️</span>
            <h3 class="font-display text-base font-bold text-slate-900">
              Devolver Trámite a Etapa Previa
            </h3>
          </div>
          <button class="text-slate-400 hover:text-slate-600 text-lg font-bold" @click="showModalDevolver = false">✕</button>
        </div>

        <p class="text-xs text-slate-600">
          Esta acción devolverá formalmente el trámite a la etapa anterior para subsanación o corrección técnica, quedando registrado en el historial oficial de trazabilidad.
        </p>

        <div class="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-slate-500 font-medium">Etapa de Retorno:</span>
            <span class="font-bold text-slate-800">
              Paso {{ etapaDestinoDevolucion }}: {{ ETAPAS_PROCEDIMIENTO.find(e => e.numero === etapaDestinoDevolucion)?.nombre }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500 font-medium">Unidad Responsable:</span>
            <span class="font-semibold text-slate-700">
              {{ ETAPAS_PROCEDIMIENTO.find(e => e.numero === etapaDestinoDevolucion)?.unidad }}
            </span>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-800 mb-1">
            Motivo / Observación Técnica Obligatoria *
          </label>
          <textarea
            v-model="observacionDevolucion"
            rows="3"
            class="input-field text-xs"
            placeholder="Describa de manera clara y detallada la observación o el requisito faltante..."
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button type="button" class="btn-secondary text-xs" @click="showModalDevolver = false">
            Cancelar
          </button>
          <button
            type="button"
            class="btn-primary bg-amber-600 hover:bg-amber-700 text-xs font-bold flex items-center gap-1.5 text-white"
            :disabled="isSaving || !observacionDevolucion.trim()"
            @click="ejecutarDevolucion"
          >
            <span>Confirmar Devolución con Observación</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
