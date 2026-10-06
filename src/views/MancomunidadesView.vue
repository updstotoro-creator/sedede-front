<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { mancomunidadService } from '../services/mancomunidadService'
import { escenarioService } from '../services/escenarioService'

const auth = useAuthStore()

// Detección de roles
const isSedede = computed(() => ['admin', 'sedede'].includes(auth.user?.role?.nombre))
const isComunidad = computed(() => ['comunidades', 'representante_mancomunidad'].includes(auth.user?.role?.nombre))

// Pestañas activas:
// Para Comunidad: 'mi_comunidad' | 'solicitudes'
// Para SEDEDE: 'mancomunidades' | 'solicitudes' | 'recursos' | 'municipios'
const activeTab = ref('mancomunidades')
const isLoading = ref(false)
const notification = ref(null)

// Datos principales
const mancomunidades = ref([])
const solicitudes = ref([])
const recursos = ref([])
const municipios = ref([])
const escenarios = ref([])

// Comunidad asignada para usuario rol comunidad
const miComunidad = computed(() => {
  if (isComunidad.value) {
    return mancomunidades.value[0] || null
  }
  return null
})

// Filtros y búsquedas
const searchMancomunidad = ref('')
const filterEstadoLegal = ref('TODOS')
const searchSolicitud = ref('')
const filterEstadoSolicitud = ref('TODOS')
const filterTipoSolicitud = ref('TODOS')

// Modales
const showMancomunidadModal = ref(false)
const isEditingMancomunidad = ref(false)
const selectedMancomunidad = ref(null)

// Modal de Credenciales generadas (para entrega a la comunidad)
const showCredencialesModal = ref(false)
const credencialesGeneradas = ref(null)

// Modal de asignación de usuario para comunidad existente
const showUsuarioModal = ref(false)
const selectedComunidadForUser = ref(null)
const usuariosComunidadesDisponibles = ref([])
const usuarioForm = reactive({
  tipo_usuario: 'existente', // 'existente' | 'nuevo'
  usuario_id_seleccionado: '',
  name: '',
  email: '',
  password: 'Comunidad2026*',
})

const showExpedienteModal = ref(false)
const expedienteDocs = ref([])
const expedienteRequisitos = ref(null)
const uploadingDoc = ref(false)
const newDocType = ref('convenio_constitucion')
const newDocFile = ref(null)

const showMiembrosModal = ref(false)
const miembrosList = ref([])
const nuevoMiembro = reactive({
  municipio_id: '',
  cargo: 'alcalde',
})

const showSolicitudModal = ref(false)
const solicitudForm = reactive({
  tipo: 'recursos',
  solicitante_id: '',
  solicitante_tipo: 'mancomunidad',
  titulo: '',
  descripcion: '',
  recursos: [{ recurso_id: '', cantidad_solicitada: 1 }],
  espacio_id: '',
  actividad: '',
  fecha_uso: '',
  hora_inicio: '08:00',
  hora_fin: '12:00',
  numero_personas: 50,
})

const showRecursoModal = ref(false)
const recursoForm = reactive({
  id: null,
  codigo: '',
  nombre: '',
  categoria: 'implemento',
  unidad: 'unidad',
  descripcion: '',
  cantidad_disponible: 10,
})

const showMunicipioModal = ref(false)
const municipioForm = reactive({
  codigo: '',
  nombre: '',
  provincia: 'Oropeza',
})

const showTransicionModal = ref(false)
const transicionData = reactive({
  solicitudId: null,
  accion: '',
  decision: 'aprobar',
  motivo: '',
  titulo: '',
})

const mancomunidadForm = reactive({
  id: null,
  nombre: '',
  sigla: '',
  nit: '',
  fecha_constitucion: '',
  direccion: '',
  telefono: '',
  correo: '',
  crear_usuario: true,
  tipo_usuario: 'existente', // 'existente' | 'nuevo' | 'ninguno'
  usuario_id_seleccionado: '',
  usuario_nombre: '',
  usuario_email: '',
  usuario_password: 'Comunidad2026*',
})

// Tipos fijos de documentos legales
const tiposDocumentos = [
  { value: 'convenio_constitucion', label: 'Convenio de Constitución Intermunicipal' },
  { value: 'estatutos', label: 'Estatutos Orgánicos y Reglamentos' },
  { value: 'acta_fundacion', label: 'Acta de Fundación Comunitaria' },
  { value: 'nit', label: 'Número de Identificación Tributaria (NIT / Código)' },
  { value: 'certificado_alcaldes', label: 'Certificado de Autoridades / Alcaldes' },
]

function showNotice(msg, type = 'success') {
  notification.value = { msg, type }
  setTimeout(() => {
    notification.value = null
  }, 4500)
}

// Carga inicial y actualización de datos
async function loadAll() {
  isLoading.value = true
  try {
    const [mancomRes, solRes, recRes, munRes, escRes] = await Promise.allSettled([
      mancomunidadService.listMancomunidades(),
      mancomunidadService.listSolicitudes(),
      mancomunidadService.listRecursos(),
      mancomunidadService.listMunicipios(),
      escenarioService.listEscenarios(),
    ])

    if (mancomRes.status === 'fulfilled') mancomunidades.value = mancomRes.value.data || []
    if (solRes.status === 'fulfilled') solicitudes.value = solRes.value.data || []
    if (recRes.status === 'fulfilled') recursos.value = recRes.value.data || []
    if (munRes.status === 'fulfilled') municipios.value = munRes.value || []
    if (escRes.status === 'fulfilled') escenarios.value = escRes.value || []

    // Si es usuario comunidad, establecer pestaña inicial y cargar su expediente
    if (isComunidad.value) {
      if (activeTab.value !== 'solicitudes') {
        activeTab.value = 'mi_comunidad'
      }
      if (mancomunidades.value.length > 0) {
        await loadExpedienteComunidad(mancomunidades.value[0].id)
      }
    } else if (isSedede.value) {
      mancomunidadService.listUsuariosDisponibles().then((users) => {
        usuariosComunidadesDisponibles.value = users || []
      }).catch(() => {})
    }
  } catch (err) {
    console.error('Error cargando módulo mancomunidades:', err)
  } finally {
    isLoading.value = false
  }
}

async function loadExpedienteComunidad(comunidadId) {
  try {
    const [docs, reqs] = await Promise.allSettled([
      mancomunidadService.getDocumentos(comunidadId),
      mancomunidadService.getRequisitos(comunidadId),
    ])
    if (docs.status === 'fulfilled') expedienteDocs.value = docs.value || []
    if (reqs.status === 'fulfilled') expedienteRequisitos.value = reqs.value || null
  } catch (e) {
    console.error('Error cargando expediente de comunidad:', e)
  }
}

onMounted(() => {
  if (isComunidad.value) {
    activeTab.value = 'mi_comunidad'
  }
  loadAll()
})

// Métricas
const stats = computed(() => {
  const totalManc = mancomunidades.value.length
  const vigentes = mancomunidades.value.filter((m) => m.estado_legal === 'Vigente').length
  const solActivas = solicitudes.value.filter((s) => !['Completada', 'Rechazada', 'Anulada'].includes(s.estado)).length
  const totalStock = recursos.value.reduce((acc, r) => acc + (r.cantidad_disponible || 0), 0)
  return { totalManc, vigentes, solActivas, totalStock }
})

// Filtrados
const filteredMancomunidades = computed(() => {
  return mancomunidades.value.filter((m) => {
    if (filterEstadoLegal.value !== 'TODOS' && m.estado_legal !== filterEstadoLegal.value) return false
    if (searchMancomunidad.value.trim() !== '') {
      const q = searchMancomunidad.value.toLowerCase().trim()
      const matchN = m.nombre?.toLowerCase().includes(q)
      const matchS = m.sigla?.toLowerCase().includes(q)
      const matchNit = m.nit?.toLowerCase().includes(q)
      if (!matchN && !matchS && !matchNit) return false
    }
    return true
  })
})

const filteredSolicitudes = computed(() => {
  return solicitudes.value.filter((s) => {
    if (filterEstadoSolicitud.value !== 'TODOS' && s.estado !== filterEstadoSolicitud.value) return false
    if (filterTipoSolicitud.value !== 'TODOS' && s.tipo !== filterTipoSolicitud.value) return false
    if (searchSolicitud.value.trim() !== '') {
      const q = searchSolicitud.value.toLowerCase().trim()
      const matchCod = s.codigo?.toLowerCase().includes(q)
      const matchTit = s.titulo?.toLowerCase().includes(q)
      if (!matchCod && !matchTit) return false
    }
    return true
  })
})

// --- ACCIONES MANCOMUNIDAD POR SEDEDE ---
function selectComunidadCuentaPrincipal() {
  mancomunidadForm.tipo_usuario = 'existente'
  mancomunidadForm.crear_usuario = true
  const found = usuariosComunidadesDisponibles.value.find((u) => u.email === 'comunidades@sedede.gob.bo')
  if (found) {
    mancomunidadForm.usuario_id_seleccionado = found.id
    mancomunidadForm.usuario_email = found.email
    mancomunidadForm.usuario_nombre = found.name
  } else {
    mancomunidadForm.usuario_email = 'comunidades@sedede.gob.bo'
    mancomunidadForm.usuario_nombre = 'Representante Mancomunidades Chuquisaca'
  }
}

function onSelectUsuarioExistente(e) {
  const userId = e.target.value
  const found = usuariosComunidadesDisponibles.value.find((u) => String(u.id) === String(userId))
  if (found) {
    mancomunidadForm.usuario_email = found.email
    mancomunidadForm.usuario_nombre = found.name
  }
}

function selectComunidadCuentaPrincipalEnModal() {
  usuarioForm.tipo_usuario = 'existente'
  const found = usuariosComunidadesDisponibles.value.find((u) => u.email === 'comunidades@sedede.gob.bo')
  if (found) {
    usuarioForm.usuario_id_seleccionado = found.id
    usuarioForm.name = found.name
    usuarioForm.email = found.email
  } else {
    usuarioForm.name = 'Representante Mancomunidades Chuquisaca'
    usuarioForm.email = 'comunidades@sedede.gob.bo'
  }
}

function onSelectUsuarioExistenteEnModal(e) {
  const userId = e.target.value
  const found = usuariosComunidadesDisponibles.value.find((u) => String(u.id) === String(userId))
  if (found) {
    usuarioForm.name = found.name
    usuarioForm.email = found.email
  }
}

// --- ACCIONES MANCOMUNIDAD POR SEDEDE ---
function openCreateMancomunidad() {
  isEditingMancomunidad.value = false
  Object.assign(mancomunidadForm, {
    id: null,
    nombre: '',
    sigla: '',
    nit: '',
    fecha_constitucion: new Date().toISOString().split('T')[0],
    direccion: '',
    telefono: '',
    correo: '',
    crear_usuario: true,
    tipo_usuario: 'existente',
    usuario_id_seleccionado: '',
    usuario_nombre: '',
    usuario_email: '',
    usuario_password: 'Comunidad2026*',
  })

  // Pre-vincular cuenta principal comunidades@sedede.gob.bo por defecto para agilizar
  selectComunidadCuentaPrincipal()
  showMancomunidadModal.value = true
}

function openEditMancomunidad(m) {
  isEditingMancomunidad.value = true
  Object.assign(mancomunidadForm, {
    id: m.id,
    nombre: m.nombre,
    sigla: m.sigla || '',
    nit: m.nit,
    fecha_constitucion: m.fecha_constitucion ? m.fecha_constitucion.substring(0, 10) : '',
    direccion: m.direccion || '',
    telefono: m.telefono || '',
    correo: m.correo || '',
    crear_usuario: false,
    tipo_usuario: 'ninguno',
    usuario_id_seleccionado: '',
    usuario_nombre: '',
    usuario_email: '',
    usuario_password: '',
  })
  showMancomunidadModal.value = true
}

async function saveMancomunidad() {
  try {
    if (isEditingMancomunidad.value) {
      await mancomunidadService.updateMancomunidad(mancomunidadForm.id, mancomunidadForm)
      showNotice('Comunidad actualizada correctamente')
      showMancomunidadModal.value = false
    } else {
      const payload = { ...mancomunidadForm }
      if (!mancomunidadForm.crear_usuario || mancomunidadForm.tipo_usuario === 'ninguno') {
        delete payload.usuario_nombre
        delete payload.usuario_email
        delete payload.usuario_password
      }
      delete payload.tipo_usuario
      delete payload.usuario_id_seleccionado

      const res = await mancomunidadService.createMancomunidad(payload)
      showNotice('Comunidad registrada exitosamente en el sistema')
      showMancomunidadModal.value = false

      if (res.usuario) {
        credencialesGeneradas.value = {
          comunidad: mancomunidadForm.nombre,
          nombre: res.usuario.name,
          email: res.usuario.email,
          password: res.usuario.password_inicial || mancomunidadForm.usuario_password,
          vinculado: res.usuario.vinculado ?? false,
        }
        showCredencialesModal.value = true
      }
    }
    loadAll()
  } catch (err) {
    if (err.response?.data?.errors) {
      const msgs = Object.values(err.response.data.errors).flat().join('. ')
      showNotice(`Error de validación: ${msgs}`, 'error')
    } else {
      showNotice(err.response?.data?.message || err.response?.data?.error || 'Error al guardar comunidad', 'error')
    }
  }
}

// Gestión de usuario para comunidad existente por SEDEDE
function openGestionarUsuario(m) {
  selectedComunidadForUser.value = m
  const existingUser = m.users?.[0]
  if (existingUser) {
    usuarioForm.tipo_usuario = 'nuevo'
    usuarioForm.usuario_id_seleccionado = ''
    usuarioForm.name = existingUser.name
    usuarioForm.email = existingUser.email
    usuarioForm.password = 'Comunidad2026*'
  } else {
    usuarioForm.tipo_usuario = 'existente'
    selectComunidadCuentaPrincipalEnModal()
    usuarioForm.password = 'Comunidad2026*'
  }
  showUsuarioModal.value = true
}

async function saveUsuarioComunidad() {
  if (!selectedComunidadForUser.value) return
  try {
    const res = await mancomunidadService.crearUsuarioMancomunidad(selectedComunidadForUser.value.id, {
      name: usuarioForm.name,
      email: usuarioForm.email,
      password: usuarioForm.password,
    })
    showNotice('Credenciales de acceso asignadas exitosamente a la comunidad')
    credencialesGeneradas.value = {
      comunidad: selectedComunidadForUser.value.nombre,
      nombre: usuarioForm.name,
      email: usuarioForm.email,
      password: usuarioForm.password,
      vinculado: true,
    }
    showUsuarioModal.value = false
    showCredencialesModal.value = true
    loadAll()
  } catch (err) {
    if (err.response?.data?.errors) {
      const msgs = Object.values(err.response.data.errors).flat().join('. ')
      showNotice(`Error de validación: ${msgs}`, 'error')
    } else {
      showNotice(err.response?.data?.message || err.response?.data?.error || 'Error al asignar usuario', 'error')
    }
  }
}

async function suspenderMancomunidad(id) {
  if (!confirm('¿Confirma que desea suspender legalmente esta comunidad? Sus solicitudes en curso quedarán congeladas.')) return
  try {
    await mancomunidadService.suspenderMancomunidad(id)
    showNotice('Comunidad suspendida')
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al suspender', 'error')
  }
}

async function reactivarMancomunidad(id) {
  try {
    await mancomunidadService.reactivarMancomunidad(id)
    showNotice('Comunidad reactivada (Estado: Pendiente de expediente)')
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al reactivar', 'error')
  }
}

// --- EXPEDIENTE DOCUMENTAL (SEDEDE & COMUNIDAD) ---
async function openExpediente(m) {
  selectedMancomunidad.value = m
  newDocType.value = 'convenio_constitucion'
  newDocFile.value = null
  await loadExpedienteComunidad(m.id)
  showExpedienteModal.value = true
}

function handleFileSelect(e) {
  newDocFile.value = e.target.files?.[0] || null
}

async function uploadDocumento() {
  const targetId = isComunidad.value ? miComunidad.value?.id : selectedMancomunidad.value?.id
  if (!targetId || !newDocFile.value) {
    showNotice('Debe seleccionar un archivo válido', 'error')
    return
  }

  const formData = new FormData()
  formData.append('tipo', newDocType.value)
  formData.append('archivo', newDocFile.value)

  uploadingDoc.value = true
  try {
    await mancomunidadService.uploadDocumento(targetId, formData)
    showNotice('Documento cargado correctamente')
    newDocFile.value = null
    await loadExpedienteComunidad(targetId)
    await loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al subir documento', 'error')
  } finally {
    uploadingDoc.value = false
  }
}

async function uploadDirectoComunidad(tipo, event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!miComunidad.value) return

  const formData = new FormData()
  formData.append('tipo', tipo)
  formData.append('archivo', file)

  uploadingDoc.value = true
  try {
    await mancomunidadService.uploadDocumento(miComunidad.value.id, formData)
    showNotice(`Documento cargado con éxito para revisión por SEDEDE`)
    await loadExpedienteComunidad(miComunidad.value.id)
    await loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al subir documento', 'error')
  } finally {
    uploadingDoc.value = false
    event.target.value = ''
  }
}

async function aprobarDoc(doc) {
  const targetId = selectedMancomunidad.value?.id || miComunidad.value?.id
  try {
    await mancomunidadService.aprobarDocumento(targetId, doc.id)
    showNotice('Documento aprobado oficialmente')
    await loadExpedienteComunidad(targetId)
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al aprobar documento', 'error')
  }
}

async function rechazarDoc(doc) {
  const targetId = selectedMancomunidad.value?.id || miComunidad.value?.id
  const obs = prompt('Ingrese el motivo u observación de rechazo para la comunidad:', doc.observaciones || '')
  if (obs === null) return
  try {
    await mancomunidadService.rechazarDocumento(targetId, doc.id, obs)
    showNotice('Documento marcado como Rechazado con observaciones')
    await loadExpedienteComunidad(targetId)
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al rechazar documento', 'error')
  }
}

async function verificarYOficializarExpediente() {
  const targetId = selectedMancomunidad.value?.id || miComunidad.value?.id
  try {
    await mancomunidadService.verificarExpediente(targetId)
    showNotice('¡Expediente verificado y aprobado! La comunidad ahora está Vigente.')
    showExpedienteModal.value = false
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'No se puede oficializar: faltan documentos aprobados', 'error')
  }
}

function descargarDoc(doc) {
  if (!doc?.id) return
  const targetId = doc.mancomunidad_id || selectedMancomunidad.value?.id || miComunidad.value?.id
  const url = `${import.meta.env.VITE_API_BASE_URL || '/sedede/api'}/v1/mancomunidades/${targetId}/documentos/${doc.id}/descargar`
  window.open(url, '_blank')
}

// --- MIEMBROS ---
async function openMiembros(m) {
  selectedMancomunidad.value = m
  nuevoMiembro.municipio_id = ''
  nuevoMiembro.cargo = 'alcalde'
  try {
    miembrosList.value = await mancomunidadService.getMiembros(m.id)
    showMiembrosModal.value = true
  } catch (err) {
    showNotice('Error cargando miembros', 'error')
  }
}

async function addMiembroToMancomunidad() {
  if (!nuevoMiembro.municipio_id) return
  try {
    await mancomunidadService.addMiembro(selectedMancomunidad.value.id, nuevoMiembro)
    showNotice('Municipio afiliado exitosamente')
    miembrosList.value = await mancomunidadService.getMiembros(selectedMancomunidad.value.id)
    nuevoMiembro.municipio_id = ''
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al afiliar municipio', 'error')
  }
}

async function deleteMiembroFromMancomunidad(miembroId) {
  if (!confirm('¿Desafiliar este municipio?')) return
  try {
    await mancomunidadService.deleteMiembro(selectedMancomunidad.value.id, miembroId)
    showNotice('Municipio desafiliado')
    miembrosList.value = await mancomunidadService.getMiembros(selectedMancomunidad.value.id)
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al desafiliar', 'error')
  }
}

// --- SOLICITUDES DE APOYO ---
function openNewSolicitud() {
  // Verificación para usuario de comunidad
  if (isComunidad.value) {
    if (!miComunidad.value) {
      showNotice('No se encontró su registro de comunidad', 'error')
      return
    }
    if (miComunidad.value.estado_legal !== 'Vigente') {
      showNotice(
        `Su comunidad aún no cuenta con aprobación legal del SEDEDE (Estado: ${miComunidad.value.estado_legal}). Debe subir sus documentos en la pestaña 'Mi Registro' y esperar la aprobación.`,
        'error'
      )
      return
    }
  }

  // Prellenar solicitante
  const preSelectedId = isComunidad.value
    ? miComunidad.value.id
    : (mancomunidades.value[0]?.id || '')

  Object.assign(solicitudForm, {
    tipo: 'recursos',
    solicitante_id: preSelectedId,
    solicitante_tipo: 'mancomunidad',
    titulo: '',
    descripcion: '',
    recursos: [{ recurso_id: recursos.value[0]?.id || '', cantidad_solicitada: 1 }],
    espacio_id: escenarios.value[0]?.id || '',
    actividad: '',
    fecha_uso: new Date().toISOString().split('T')[0],
    hora_inicio: '08:00',
    hora_fin: '12:00',
    numero_personas: 50,
  })

  showSolicitudModal.value = true
}

function addRenglonRecurso() {
  solicitudForm.recursos.push({ recurso_id: recursos.value[0]?.id || '', cantidad_solicitada: 1 })
}

function removeRenglonRecurso(idx) {
  if (solicitudForm.recursos.length > 1) {
    solicitudForm.recursos.splice(idx, 1)
  }
}

async function saveSolicitud() {
  try {
    const payload = {
      tipo: solicitudForm.tipo,
      solicitante_id: parseInt(solicitudForm.solicitante_id, 10),
      solicitante_tipo: 'mancomunidad',
      titulo: solicitudForm.titulo,
      descripcion: solicitudForm.descripcion,
    }

    if (solicitudForm.tipo === 'recursos') {
      payload.recursos = solicitudForm.recursos.map((r) => ({
        recurso_id: parseInt(r.recurso_id, 10),
        cantidad_solicitada: parseInt(r.cantidad_solicitada, 10),
      }))
    } else {
      payload.espacio_id = parseInt(solicitudForm.espacio_id, 10)
      payload.actividad = solicitudForm.actividad
      payload.fecha_uso = solicitudForm.fecha_uso
      payload.hora_inicio = solicitudForm.hora_inicio
      payload.hora_fin = solicitudForm.hora_fin
      payload.numero_personas = parseInt(solicitudForm.numero_personas, 10)
    }

    await mancomunidadService.createSolicitud(payload)
    showNotice('Solicitud de apoyo registrada exitosamente en borrador')
    showSolicitudModal.value = false
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || err.response?.data?.error || 'Error al registrar solicitud', 'error')
  }
}

// Transiciones de Solicitud
async function enviarSol(sol) {
  try {
    await mancomunidadService.enviarSolicitud(sol.id)
    showNotice('Solicitud enviada a revisión técnica del SEDEDE')
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al enviar solicitud', 'error')
  }
}

async function pasarRevisionSol(sol) {
  try {
    await mancomunidadService.revisarSolicitud(sol.id)
    showNotice('Solicitud puesta En Revisión por la unidad técnica')
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al poner en revisión', 'error')
  }
}

function openResolverModal(sol, accion) {
  transicionData.solicitudId = sol.id
  transicionData.accion = accion
  transicionData.decision = 'aprobar'
  transicionData.motivo = ''
  transicionData.titulo = accion === 'resolver' ? 'Resolver Solicitud (Aprobar / Rechazar)' : 'Anular Solicitud'
  showTransicionModal.value = true
}

async function executeTransicion() {
  try {
    if (transicionData.accion === 'resolver') {
      await mancomunidadService.resolverSolicitud(
        transicionData.solicitudId,
        transicionData.decision,
        transicionData.decision === 'rechazar' ? transicionData.motivo : null
      )
      showNotice(`Solicitud ${transicionData.decision === 'aprobar' ? 'Aprobada' : 'Rechazada'} con éxito`)
    } else if (transicionData.accion === 'anular') {
      if (!transicionData.motivo.trim()) {
        alert('Debe especificar el motivo de anulación')
        return
      }
      await mancomunidadService.anularSolicitud(transicionData.solicitudId, transicionData.motivo)
      showNotice('Solicitud Anulada correctamente')
    }
    showTransicionModal.value = false
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al ejecutar transición', 'error')
  }
}

async function asignarStockSol(sol) {
  try {
    await mancomunidadService.asignarSolicitud(sol.id)
    showNotice('Recursos asignados y reservados en el almacén')
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al asignar recursos', 'error')
  }
}

async function completarSol(sol) {
  try {
    await mancomunidadService.completarSolicitud(sol.id)
    showNotice('Solicitud completada exitosamente')
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al completar', 'error')
  }
}

// --- RECURSOS (SEDEDE) ---
function openCreateRecurso() {
  Object.assign(recursoForm, {
    id: null,
    codigo: 'REC-' + Math.floor(100 + Math.random() * 900),
    nombre: '',
    categoria: 'implemento',
    unidad: 'unidad',
    descripcion: '',
    cantidad_disponible: 20,
  })
  showRecursoModal.value = true
}

async function saveRecurso() {
  try {
    if (recursoForm.id) {
      await mancomunidadService.updateRecurso(recursoForm.id, recursoForm)
      showNotice('Recurso actualizado')
    } else {
      await mancomunidadService.createRecurso(recursoForm)
      showNotice('Recurso creado en catálogo')
    }
    showRecursoModal.value = false
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al guardar recurso', 'error')
  }
}

// --- MUNICIPIOS (SEDEDE) ---
function openCreateMunicipio() {
  municipioForm.codigo = '0' + Math.floor(100 + Math.random() * 900)
  municipioForm.nombre = ''
  municipioForm.provincia = 'Oropeza'
  showMunicipioModal.value = true
}

async function saveMunicipio() {
  try {
    await mancomunidadService.createMunicipio(municipioForm)
    showNotice('Municipio registrado')
    showMunicipioModal.value = false
    loadAll()
  } catch (err) {
    showNotice(err.response?.data?.message || 'Error al guardar municipio', 'error')
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotice('Copiado al portapapeles')
  })
}

const getEstadoBadgeClass = (estado) => {
  switch (estado) {
    case 'Vigente':
    case 'Aprobada':
    case 'Aprobado':
    case 'Completada':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Pendiente':
    case 'Borrador':
    case 'EnRevision':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'Enviada':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Asignada':
      return 'bg-indigo-50 text-navyflag border-indigo-200'
    case 'Suspendido':
    case 'Rechazada':
    case 'Rechazado':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'Cancelado':
    case 'Anulada':
      return 'bg-slate-100 text-slate-600 border-slate-300'
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Notificación emergente -->
    <div
      v-if="notification"
      :class="[
        'fixed top-6 right-6 z-50 rounded-xl p-4 shadow-lg border transition-all text-sm font-semibold flex items-center gap-3',
        notification.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      ]"
    >
      <span>{{ notification.msg }}</span>
    </div>

    <!-- Encabezado de Sección -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-100 px-3 py-0.5 text-xs font-bold text-brand-700 mb-1">
          {{ isComunidad ? 'Portal de Comunidades y Mancomunidades Rurales' : 'Unidad de Coordinación Intermunicipal SEDEDE' }}
        </div>
        <h1 class="font-display text-2xl font-bold text-ink sm:text-3xl">
          {{ isComunidad ? 'Gestión Comunitaria y Solicitudes de Apoyo' : 'Apoyo a Mancomunidades y Comunidades Rurales' }}
        </h1>
        <p class="text-sm text-slate-500">
          {{
            isComunidad
              ? 'Consulte su registro legal, cargue su documentación de acreditación y gestione sus solicitudes de apoyo deportivo.'
              : 'Padrón de comunidades, asignación de credenciales, verificación de expedientes y aprobación de solicitudes de apoyo.'
          }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <!-- Botón para SEDEDE: Nueva Mancomunidad con Usuario -->
        <button
          v-if="isSedede && activeTab === 'mancomunidades'"
          type="button"
          @click="openCreateMancomunidad"
          class="btn-primary flex items-center gap-2"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Comunidad con Usuario
        </button>

        <!-- Botón Nueva Solicitud de Apoyo (Para SEDEDE o Comunidad aprobada) -->
        <button
          v-if="activeTab === 'solicitudes'"
          type="button"
          @click="openNewSolicitud"
          class="btn-primary flex items-center gap-2"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ isSedede ? 'Registrar Solicitud (Por SEDEDE)' : 'Nueva Solicitud de Apoyo' }}
        </button>

        <button
          v-if="isSedede && activeTab === 'recursos'"
          type="button"
          @click="openCreateRecurso"
          class="btn-primary flex items-center gap-2"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Recurso
        </button>

        <button
          v-if="isSedede && activeTab === 'municipios'"
          type="button"
          @click="openCreateMunicipio"
          class="btn-primary flex items-center gap-2"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Municipio
        </button>
      </div>
    </div>

    <!-- Indicadores Numéricos (Para SEDEDE) -->
    <div v-if="isSedede" class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p class="text-xs font-semibold text-slate-500 uppercase">Comunidades</p>
        <p class="font-display text-2xl font-bold text-ink mt-1">{{ stats.totalManc }}</p>
      </div>
      <div class="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-xs">
        <p class="text-xs font-semibold text-emerald-800 uppercase">Expediente Vigente</p>
        <p class="font-display text-2xl font-bold text-emerald-900 mt-1">{{ stats.vigentes }}</p>
      </div>
      <div class="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-xs">
        <p class="text-xs font-semibold text-navyflag uppercase">Solicitudes en Curso</p>
        <p class="font-display text-2xl font-bold text-navyflag mt-1">{{ stats.solActivas }}</p>
      </div>
      <div class="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-xs">
        <p class="text-xs font-semibold text-amber-800 uppercase">Stock Comunitario</p>
        <p class="font-display text-2xl font-bold text-amber-900 mt-1">{{ stats.totalStock }} <span class="text-xs font-normal">unid.</span></p>
      </div>
    </div>

    <!-- Pestañas de Navegación -->
    <div class="border-b border-slate-200">
      <nav class="-mb-px flex space-x-6">
        <!-- VISTA DE COMUNIDAD: Pestaña 1 (Mi Registro) -->
        <button
          v-if="isComunidad"
          type="button"
          :class="[
            'pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2',
            activeTab === 'mi_comunidad'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
          ]"
          @click="activeTab = 'mi_comunidad'"
        >
          🏛️ Mi Registro y Documentación Legal
        </button>

        <!-- VISTA DE SEDEDE: Pestaña 1 (Padrón de Mancomunidades) -->
        <button
          v-if="isSedede"
          type="button"
          :class="[
            'pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2',
            activeTab === 'mancomunidades'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
          ]"
          @click="activeTab = 'mancomunidades'"
        >
          🏛️ Padrón de Comunidades / Mancomunidades
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{{ mancomunidades.length }}</span>
        </button>

        <!-- Pestaña Solicitudes (Visible para ambos) -->
        <button
          type="button"
          :class="[
            'pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2',
            activeTab === 'solicitudes'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
          ]"
          @click="activeTab = 'solicitudes'"
        >
          📋 Solicitudes de Apoyo Deportivo
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{{ solicitudes.length }}</span>
        </button>

        <!-- Pestañas EXCLUSIVAS de SEDEDE: Recursos y Municipios -->
        <button
          v-if="isSedede"
          type="button"
          :class="[
            'pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2',
            activeTab === 'recursos'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
          ]"
          @click="activeTab = 'recursos'"
        >
          📦 Catálogo de Recursos Prestables
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{{ recursos.length }}</span>
        </button>

        <button
          v-if="isSedede"
          type="button"
          :class="[
            'pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2',
            activeTab === 'municipios'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
          ]"
          @click="activeTab = 'municipios'"
        >
          🗺️ Municipios Integrantes
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{{ municipios.length }}</span>
        </button>
      </nav>
    </div>

    <!-- ================================================================= -->
    <!-- 1. VISTA DE COMUNIDAD: MI REGISTRO Y DOCUMENTACIÓN LEGAL          -->
    <!-- ================================================================= -->
    <div v-if="isComunidad && activeTab === 'mi_comunidad'" class="space-y-6">
      <div v-if="!miComunidad" class="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        No se encontró ninguna comunidad vinculada a su usuario. Por favor comuníquese con el SEDEDE.
      </div>

      <div v-else class="space-y-6">
        <!-- Banner de Estado de Aprobación Legal -->
        <div
          :class="[
            'rounded-2xl p-6 border shadow-xs',
            miComunidad.estado_legal === 'Vigente'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : miComunidad.estado_legal === 'Pendiente'
              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          ]"
        >
          <div class="flex items-start gap-4">
            <span class="text-3xl">
              {{ miComunidad.estado_legal === 'Vigente' ? '✅' : miComunidad.estado_legal === 'Pendiente' ? '⏳' : '⚠️' }}
            </span>
            <div class="flex-1">
              <div class="flex items-center gap-3 flex-wrap">
                <h3 class="font-display text-lg font-bold">
                  Estado de Registro: {{ miComunidad.estado_legal === 'Vigente' ? 'APROBADO Y VIGENTE' : miComunidad.estado_legal === 'Pendiente' ? 'PENDIENTE DE APROBACIÓN POR SEDEDE' : miComunidad.estado_legal }}
                </h3>
                <span :class="['rounded-full px-3 py-0.5 text-xs font-bold border', getEstadoBadgeClass(miComunidad.estado_legal)]">
                  {{ miComunidad.estado_legal }}
                </span>
              </div>

              <p class="mt-2 text-sm leading-relaxed" v-if="miComunidad.estado_legal === 'Pendiente'">
                Su comunidad fue registrada por el SEDEDE. Para que su usuario y comunidad sean <strong>aprobados</strong>, debe cargar los 5 documentos reglamentarios que figuran a continuación. Una vez que el equipo de SEDEDE los verifique y apruebe, su estado pasará a <strong>Vigente</strong> y podrá realizar <strong>Solicitudes de Apoyo Deportivo</strong>.
              </p>
              <p class="mt-2 text-sm leading-relaxed" v-else-if="miComunidad.estado_legal === 'Vigente'">
                ¡Su expediente legal ha sido verificado y aprobado satisfactoriamente por el SEDEDE! Su comunidad está plenamente habilitada para solicitar implementos, kits deportivos, equipamiento y el uso de escenarios. Puede gestionar sus solicitudes en la pestaña <strong>Solicitudes de Apoyo Deportivo</strong>.
              </p>
              <p class="mt-2 text-sm leading-relaxed" v-else>
                Su comunidad se encuentra en estado {{ miComunidad.estado_legal }}. Para mayor información comuníquese con la Unidad de Coordinación del SEDEDE.
              </p>
            </div>
          </div>
        </div>

        <!-- Ficha de Datos Institucionales de la Comunidad -->
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-4 gap-2">
            <div>
              <h2 class="font-display text-xl font-bold text-ink">{{ miComunidad.nombre }}</h2>
              <p class="text-xs text-slate-500 font-mono">Sigla: {{ miComunidad.sigla || 'S/S' }} | NIT / Código: {{ miComunidad.nit }}</p>
            </div>
            <div class="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 border">
              <div>👤 <strong>Usuario:</strong> {{ auth.user?.name }} ({{ auth.user?.email }})</div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div>
              <span class="block text-slate-400 font-semibold mb-0.5">Dirección / Sede:</span>
              <p class="font-medium text-ink">{{ miComunidad.direccion || 'No especificada' }}</p>
            </div>
            <div>
              <span class="block text-slate-400 font-semibold mb-0.5">Teléfono de Contacto:</span>
              <p class="font-medium text-ink">{{ miComunidad.telefono || 'No registrado' }}</p>
            </div>
            <div>
              <span class="block text-slate-400 font-semibold mb-0.5">Correo Electrónico:</span>
              <p class="font-medium text-ink">{{ miComunidad.correo || 'No registrado' }}</p>
            </div>
          </div>
        </div>

        <!-- Documentación Legal Requerida para Aprobación -->
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <div>
              <h3 class="font-display text-base font-bold text-ink">
                Documentación del Expediente Legal
              </h3>
              <p class="text-xs text-slate-500">
                Suba cada uno de los requisitos legales requeridos en formato PDF o imagen legible.
              </p>
            </div>
            <div class="text-xs font-semibold text-slate-600">
              Cargados: {{ expedienteDocs.length }} / 5
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="tipo in tiposDocumentos"
              :key="tipo.value"
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-colors bg-slate-50/50 hover:bg-slate-50"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm text-slate-800">{{ tipo.label }}</span>
                  <span
                    v-if="expedienteDocs.find(d => d.tipo === tipo.value)"
                    :class="['rounded px-2 py-0.5 text-[11px] font-bold border', getEstadoBadgeClass(expedienteDocs.find(d => d.tipo === tipo.value).estado_verificacion)]"
                  >
                    {{ expedienteDocs.find(d => d.tipo === tipo.value).estado_verificacion }}
                  </span>
                  <span v-else class="rounded px-2 py-0.5 text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    Faltante
                  </span>
                </div>

                <div v-if="expedienteDocs.find(d => d.tipo === tipo.value)" class="text-xs text-slate-500 mt-1 font-mono">
                  Archivo: {{ expedienteDocs.find(d => d.tipo === tipo.value).nombre_archivo }}
                </div>

                <!-- Observaciones de Rechazo por SEDEDE -->
                <div
                  v-if="expedienteDocs.find(d => d.tipo === tipo.value && d.estado_verificacion === 'Rechazado' && d.observaciones)"
                  class="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800"
                >
                  <strong>Observación del SEDEDE:</strong> {{ expedienteDocs.find(d => d.tipo === tipo.value).observaciones }}
                </div>
              </div>

              <!-- Acciones de Subida y Descarga -->
              <div class="flex items-center gap-2">
                <button
                  v-if="expedienteDocs.find(d => d.tipo === tipo.value)"
                  type="button"
                  @click="descargarDoc(expedienteDocs.find(d => d.tipo === tipo.value))"
                  class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  📥 Ver Archivo
                </button>

                <label class="cursor-pointer rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 flex items-center gap-1.5 shadow-xs">
                  <span>{{ expedienteDocs.find(d => d.tipo === tipo.value) ? '🔄 Reemplazar' : '📤 Subir Documento' }}</span>
                  <input
                    type="file"
                    class="hidden"
                    accept=".pdf,image/*"
                    :disabled="uploadingDoc"
                    @change="uploadDirectoComunidad(tipo.value, $event)"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- 2. VISTA DE SEDEDE: PADRÓN DE MANCOMUNIDADES                      -->
    <!-- ================================================================= -->
    <div v-if="isSedede && activeTab === 'mancomunidades'" class="space-y-4">
      <!-- Filtros -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div class="flex-1 max-w-md relative">
          <input
            v-model="searchMancomunidad"
            type="text"
            placeholder="Buscar por nombre, sigla o NIT..."
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none"
          />
        </div>

        <div class="flex items-center gap-3">
          <label class="text-xs font-semibold text-slate-500">Estado Legal:</label>
          <select
            v-model="filterEstadoLegal"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-brand-600 focus:outline-none"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="Pendiente">Pendiente de Expediente</option>
            <option value="Vigente">Vigente (Acreditada)</option>
            <option value="Suspendido">Suspendido</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      <!-- Tabla Mancomunidades -->
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3">Comunidad / Mancomunidad</th>
              <th class="px-5 py-3">NIT & Constitución</th>
              <th class="px-5 py-3">Estado Legal</th>
              <th class="px-5 py-3">Usuario de Acceso</th>
              <th class="px-5 py-3 text-right">Expediente y Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredMancomunidades.length === 0">
              <td colspan="5" class="px-5 py-8 text-center text-slate-500">
                No hay comunidades registradas o no coinciden con los filtros.
              </td>
            </tr>
            <tr v-for="m in filteredMancomunidades" :key="m.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="px-5 py-4">
                <div class="font-bold text-ink">{{ m.nombre }}</div>
                <div class="text-xs text-slate-500 font-mono">Sigla: {{ m.sigla || 'S/S' }}</div>
              </td>
              <td class="px-5 py-4">
                <div class="font-mono text-xs text-slate-700 font-semibold">{{ m.nit }}</div>
                <div class="text-xs text-slate-500">{{ m.fecha_constitucion ? m.fecha_constitucion.substring(0, 10) : 'Sin fecha' }}</div>
              </td>
              <td class="px-5 py-4">
                <span :class="['inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', getEstadoBadgeClass(m.estado_legal)]">
                  {{ m.estado_legal }}
                </span>
              </td>
              <!-- Usuario de Acceso -->
              <td class="px-5 py-4 text-xs">
                <div v-if="m.users && m.users.length > 0">
                  <div class="font-semibold text-slate-800">👤 {{ m.users[0].email }}</div>
                  <div class="text-slate-500">{{ m.users[0].name }}</div>
                  <button
                    type="button"
                    @click="openGestionarUsuario(m)"
                    class="text-[11px] font-bold text-brand-600 hover:text-brand-800 mt-1"
                  >
                    🔑 Modificar Credenciales
                  </button>
                </div>
                <div v-else>
                  <span class="text-slate-400 italic">Sin usuario asignado</span>
                  <div>
                    <button
                      type="button"
                      @click="openGestionarUsuario(m)"
                      class="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline mt-0.5"
                    >
                      + Crear Usuario de Acceso
                    </button>
                  </div>
                </div>
              </td>
              <!-- Acciones SEDEDE -->
              <td class="px-5 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5 flex-wrap">
                  <button
                    type="button"
                    @click="openExpediente(m)"
                    class="rounded-md border border-brand-200 bg-brand-50/60 px-2.5 py-1 text-xs font-bold text-brand-700 hover:bg-brand-100"
                    title="Ver expediente documental y aprobar legalidad"
                  >
                    📁 Expediente Legal
                  </button>
                  <button
                    type="button"
                    @click="openMiembros(m)"
                    class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    title="Ver municipios miembros"
                  >
                    👥 Miembros
                  </button>
                  <button
                    type="button"
                    @click="openEditMancomunidad(m)"
                    class="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                    title="Editar datos"
                  >
                    ✏️
                  </button>
                  <button
                    v-if="m.estado_legal === 'Vigente'"
                    type="button"
                    @click="suspenderMancomunidad(m.id)"
                    class="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    title="Suspender comunidad"
                  >
                    ⏸️
                  </button>
                  <button
                    v-if="m.estado_legal === 'Suspendido'"
                    type="button"
                    @click="reactivarMancomunidad(m.id)"
                    class="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                    title="Reactivar comunidad"
                  >
                    ▶️ Reactivar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- 3. PESTAÑA: SOLICITUDES Y APOYO DEPORTIVO (AMBOS)                -->
    <!-- ================================================================= -->
    <div v-if="activeTab === 'solicitudes'" class="space-y-4">
      <!-- Aviso para Comunidad si no está Vigente -->
      <div
        v-if="isComunidad && miComunidad && miComunidad.estado_legal !== 'Vigente'"
        class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <span class="text-lg">⚠️</span>
          <span>
            Su comunidad aún está en estado <strong>{{ miComunidad.estado_legal }}</strong>. Debe contar con la aprobación legal del SEDEDE para poder enviar solicitudes de apoyo deportivo.
          </span>
        </div>
        <button
          type="button"
          @click="activeTab = 'mi_comunidad'"
          class="rounded-lg bg-amber-600 px-3 py-1 font-bold text-white hover:bg-amber-700"
        >
          Ir a Mi Expediente
        </button>
      </div>

      <!-- Filtros -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div class="flex-1 max-w-md relative">
          <input
            v-model="searchSolicitud"
            type="text"
            placeholder="Buscar por código (SOL-2026-...) o título..."
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none"
          />
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <select
            v-model="filterTipoSolicitud"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-brand-600 focus:outline-none"
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="recursos">Recursos / Implementos</option>
            <option value="espacio">Uso de Escenario / Espacio</option>
          </select>

          <select
            v-model="filterEstadoSolicitud"
            class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-brand-600 focus:outline-none"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="Borrador">Borrador</option>
            <option value="Enviada">Enviada</option>
            <option value="EnRevision">En Revisión</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Asignada">Asignada (Stock reservado)</option>
            <option value="Completada">Completada</option>
            <option value="Rechazada">Rechazada</option>
            <option value="Anulada">Anulada</option>
          </select>
        </div>
      </div>

      <!-- Tabla de Solicitudes -->
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3">Código</th>
              <th class="px-5 py-3">Título & Tipo</th>
              <th class="px-5 py-3">Detalle del Pedido</th>
              <th class="px-5 py-3">Estado</th>
              <th class="px-5 py-3 text-right">Flujo y Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredSolicitudes.length === 0">
              <td colspan="5" class="px-5 py-8 text-center text-slate-500">
                No hay solicitudes de apoyo deportivo registradas.
              </td>
            </tr>
            <tr v-for="sol in filteredSolicitudes" :key="sol.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="px-5 py-4 font-mono font-bold text-xs text-brand-700">
                {{ sol.codigo }}
              </td>
              <td class="px-5 py-4">
                <div class="font-bold text-ink">{{ sol.titulo }}</div>
                <div class="text-xs text-slate-500">
                  Tipo:
                  <span class="font-semibold uppercase text-slate-700">{{ sol.tipo === 'recursos' ? 'Materiales / Implementos' : 'Escenario' }}</span>
                </div>
              </td>
              <td class="px-5 py-4 text-xs text-slate-600">
                <div v-if="sol.tipo === 'recursos'">
                  <span class="font-semibold">Implementos deportivos solicitados</span>
                  <div class="text-[11px] text-slate-500 mt-0.5">{{ sol.descripcion || 'Sin descripción adicional' }}</div>
                </div>
                <div v-else>
                  <div>🏟️ {{ sol.espacio?.nombre || 'Escenario Municipal' }}</div>
                  <div>📅 {{ sol.fecha_uso }} ({{ sol.hora_inicio }} - {{ sol.hora_fin }})</div>
                </div>
                <div v-if="sol.motivo_rechazo" class="text-rose-600 mt-1 font-semibold">
                  Motivo Rechazo: {{ sol.motivo_rechazo }}
                </div>
                <div v-if="sol.motivo_anulacion" class="text-slate-500 mt-1 italic">
                  Anulada: {{ sol.motivo_anulacion }}
                </div>
              </td>
              <td class="px-5 py-4">
                <span :class="['inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', getEstadoBadgeClass(sol.estado)]">
                  {{ sol.estado }}
                </span>
              </td>
              <td class="px-5 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5 flex-wrap">
                  <!-- Botón Enviar (solo Borrador) - Disponible para Comunidad y SEDEDE -->
                  <button
                    v-if="sol.estado === 'Borrador'"
                    type="button"
                    @click="enviarSol(sol)"
                    class="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Enviar a SEDEDE
                  </button>

                  <!-- Botones exclusivos para evaluadores SEDEDE -->
                  <template v-if="isSedede">
                    <button
                      v-if="sol.estado === 'Enviada'"
                      type="button"
                      @click="pasarRevisionSol(sol)"
                      class="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-600"
                    >
                      Poner En Revisión
                    </button>

                    <button
                      v-if="sol.estado === 'EnRevision'"
                      type="button"
                      @click="openResolverModal(sol, 'resolver')"
                      class="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Resolver (Aprobar/Rechazar)
                    </button>

                    <button
                      v-if="sol.estado === 'Aprobada' && sol.tipo === 'recursos'"
                      type="button"
                      @click="asignarStockSol(sol)"
                      class="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Asignar Stock
                    </button>

                    <button
                      v-if="['Asignada', 'Aprobada'].includes(sol.estado)"
                      type="button"
                      @click="completarSol(sol)"
                      class="rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800"
                    >
                      Completar Entrega
                    </button>

                    <button
                      v-if="!['Completada', 'Rechazada', 'Anulada'].includes(sol.estado)"
                      type="button"
                      @click="openResolverModal(sol, 'anular')"
                      class="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                      title="Anular solicitud con motivo"
                    >
                      Anular
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- 4. PESTAÑA: RECURSOS PRESTABLES (EXCLUSIVA SEDEDE)                -->
    <!-- ================================================================= -->
    <div v-if="isSedede && activeTab === 'recursos'" class="space-y-4">
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3">Código</th>
              <th class="px-5 py-3">Nombre del Recurso</th>
              <th class="px-5 py-3">Categoría</th>
              <th class="px-5 py-3">Unidad</th>
              <th class="px-5 py-3">Stock Disponible</th>
              <th class="px-5 py-3 text-right">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="rec in recursos" :key="rec.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="px-5 py-4 font-mono font-bold text-xs text-brand-700">{{ rec.codigo }}</td>
              <td class="px-5 py-4 font-bold text-ink">{{ rec.nombre }}</td>
              <td class="px-5 py-4 text-xs">
                <span class="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 uppercase">
                  {{ rec.categoria }}
                </span>
              </td>
              <td class="px-5 py-4 text-xs text-slate-500">{{ rec.unidad }}</td>
              <td class="px-5 py-4 font-mono font-bold text-base text-ink">
                {{ rec.cantidad_disponible }}
              </td>
              <td class="px-5 py-4 text-right">
                <span class="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Habilitado
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- 5. PESTAÑA: MUNICIPIOS (EXCLUSIVA SEDEDE)                        -->
    <!-- ================================================================= -->
    <div v-if="isSedede && activeTab === 'municipios'" class="space-y-4">
      <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead class="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th class="px-5 py-3">Código INE</th>
              <th class="px-5 py-3">Nombre del Municipio</th>
              <th class="px-5 py-3">Provincia</th>
              <th class="px-5 py-3 text-right">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="mun in municipios" :key="mun.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="px-5 py-4 font-mono font-bold text-xs text-brand-700">{{ mun.codigo }}</td>
              <td class="px-5 py-4 font-bold text-ink">{{ mun.nombre }}</td>
              <td class="px-5 py-4 text-xs text-slate-600">{{ mun.provincia }}</td>
              <td class="px-5 py-4 text-right">
                <span class="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Activo
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- MODALES                                                           -->
    <!-- ================================================================= -->

    <!-- MODAL NUEVA MANCOMUNIDAD CON USUARIO (SEDEDE) -->
    <div v-if="showMancomunidadModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 class="font-display text-lg font-bold text-ink mb-1">
          {{ isEditingMancomunidad ? 'Editar Comunidad / Mancomunidad' : 'Registrar Nueva Comunidad con Acceso' }}
        </h3>
        <p class="text-xs text-slate-500 mb-4">
          Registre los datos institucionales de la comunidad rural y genere sus credenciales de acceso para entregárselas a sus autoridades.
        </p>

        <form @submit.prevent="saveMancomunidad" class="space-y-3.5 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nombre Oficial de la Comunidad / Mancomunidad *</label>
              <input v-model="mancomunidadForm.nombre" required type="text" placeholder="Ej: Comunidad Rural San Lucas" class="w-full rounded-lg border p-2 text-sm text-ink focus:border-brand-600 focus:outline-none" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Sigla o Identificador Corto</label>
              <input v-model="mancomunidadForm.sigla" type="text" placeholder="Ej: CRSL" class="w-full rounded-lg border p-2 text-sm text-ink focus:border-brand-600 focus:outline-none" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">NIT o Código Comunal *</label>
              <input v-model="mancomunidadForm.nit" required type="text" placeholder="Ej: 9876543210" class="w-full rounded-lg border p-2 text-sm text-ink focus:border-brand-600 focus:outline-none font-mono" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Fecha de Constitución</label>
              <input v-model="mancomunidadForm.fecha_constitucion" type="date" class="w-full rounded-lg border p-2 text-sm text-ink focus:border-brand-600 focus:outline-none" />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Dirección / Sede Comunal</label>
            <input v-model="mancomunidadForm.direccion" type="text" placeholder="Ej: Plaza Principal San Lucas s/n" class="w-full rounded-lg border p-2 text-sm text-ink" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Teléfono de Contacto</label>
              <input v-model="mancomunidadForm.telefono" type="text" placeholder="Ej: +591 71234567" class="w-full rounded-lg border p-2 text-sm text-ink" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Correo Electrónico Institucional</label>
              <input v-model="mancomunidadForm.correo" type="email" placeholder="Ej: contacto@sanlucas.gob.bo" class="w-full rounded-lg border p-2 text-sm text-ink" />
            </div>
          </div>

          <!-- SECCIÓN DE ASIGNACIÓN / CREACIÓN DE USUARIO DE ACCESO (Solo en creación) -->
          <div v-if="!isEditingMancomunidad" class="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3.5 mt-4">
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer font-bold text-navyflag text-sm">
                <input type="checkbox" v-model="mancomunidadForm.crear_usuario" class="rounded text-brand-600 focus:ring-brand-500" />
                <span>Asignar Usuario de Acceso a esta Comunidad</span>
              </label>
              <span class="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-navyflag uppercase">Para el Representante</span>
            </div>

            <p class="text-slate-600 text-[11px]">
              El usuario asignado podrá ingresar al sistema con su rol de <strong>Comunidad</strong> para subir su documentación legal y realizar solicitudes de apoyo deportivo.
            </p>

            <div v-if="mancomunidadForm.crear_usuario" class="space-y-3 pt-2 border-t border-indigo-100">
              <!-- Selector de Modo de Usuario -->
              <div class="grid grid-cols-2 gap-2 text-xs">
                <label :class="['flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors', mancomunidadForm.tipo_usuario === 'existente' ? 'bg-white border-brand-500 font-bold text-brand-700 shadow-xs' : 'bg-white/60 border-slate-200 text-slate-700']">
                  <input type="radio" value="existente" v-model="mancomunidadForm.tipo_usuario" class="text-brand-600 focus:ring-brand-500" />
                  <span>Vincular Usuario Existente</span>
                </label>
                <label :class="['flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors', mancomunidadForm.tipo_usuario === 'nuevo' ? 'bg-white border-brand-500 font-bold text-brand-700 shadow-xs' : 'bg-white/60 border-slate-200 text-slate-700']">
                  <input type="radio" value="nuevo" v-model="mancomunidadForm.tipo_usuario" class="text-brand-600 focus:ring-brand-500" />
                  <span>Crear Nuevo Usuario</span>
                </label>
              </div>

              <!-- MODO: VINCULAR USUARIO EXISTENTE -->
              <div v-if="mancomunidadForm.tipo_usuario === 'existente'" class="space-y-2.5 bg-white p-3 rounded-xl border border-indigo-100">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-semibold text-slate-600">Usuarios comunitarios disponibles:</span>
                  <button
                    type="button"
                    @click="selectComunidadCuentaPrincipal"
                    class="rounded-md bg-brand-50 border border-brand-200 px-2 py-1 text-[11px] font-bold text-brand-700 hover:bg-brand-100"
                  >
                    ⚡ Seleccionar comunidades@sedede.gob.bo
                  </button>
                </div>

                <div v-if="usuariosComunidadesDisponibles.length > 0">
                  <select
                    v-model="mancomunidadForm.usuario_id_seleccionado"
                    @change="onSelectUsuarioExistente"
                    class="w-full rounded-lg border p-2 text-xs bg-slate-50 text-ink focus:border-brand-600 focus:outline-none"
                  >
                    <option value="">-- Seleccionar de la lista de usuarios --</option>
                    <option
                      v-for="u in usuariosComunidadesDisponibles"
                      :key="u.id"
                      :value="u.id"
                    >
                      {{ u.name }} ({{ u.email }}) {{ u.mancomunidad ? `— Actual: ${u.mancomunidad.nombre}` : '— Sin comunidad asignada' }}
                    </option>
                  </select>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label class="block font-semibold text-slate-700 mb-0.5 text-[11px]">Correo de Usuario a Vincular *</label>
                    <input v-model="mancomunidadForm.usuario_email" required type="email" placeholder="comunidades@sedede.gob.bo" class="w-full rounded-lg border p-2 text-xs bg-white text-ink font-mono font-semibold" />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-0.5 text-[11px]">Nombre de Representación *</label>
                    <input v-model="mancomunidadForm.usuario_nombre" required type="text" placeholder="Representante Mancomunidades" class="w-full rounded-lg border p-2 text-xs bg-white text-ink" />
                  </div>
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-0.5 text-[11px]">Contraseña (opcional para cuenta existente)</label>
                  <input v-model="mancomunidadForm.usuario_password" type="text" placeholder="Dejar en blanco para mantener contraseña actual" class="w-full rounded-lg border p-2 text-xs bg-white text-ink font-mono" />
                </div>
              </div>

              <!-- MODO: CREAR NUEVO USUARIO -->
              <div v-if="mancomunidadForm.tipo_usuario === 'nuevo'" class="space-y-2.5 bg-white p-3 rounded-xl border border-indigo-100">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Nombre Completo del Representante *</label>
                  <input v-model="mancomunidadForm.usuario_nombre" required type="text" placeholder="Ej: Don Esteban Quispe Flores" class="w-full rounded-lg border p-2 text-xs bg-white text-ink" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Correo Electrónico Nuevo *</label>
                    <input v-model="mancomunidadForm.usuario_email" required type="email" placeholder="Ej: sanlucas@sedede.gob.bo" class="w-full rounded-lg border p-2 text-xs bg-white text-ink font-mono" />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Contraseña Inicial *</label>
                    <input v-model="mancomunidadForm.usuario_password" required type="text" class="w-full rounded-lg border p-2 text-xs bg-white text-ink font-mono font-bold" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3 pt-3 border-t">
            <button type="button" @click="showMancomunidadModal = false" class="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
              Cancelar
            </button>
            <button type="submit" class="btn-primary">
              {{ isEditingMancomunidad ? 'Guardar Cambios' : 'Registrar Comunidad y Asignar Usuario' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL CONFIRMACIÓN DE CREDENCIALES CREADAS -->
    <div v-if="showCredencialesModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center space-y-4">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
          🎉
        </div>
        <h3 class="font-display text-lg font-bold text-ink">
          {{ credencialesGeneradas?.vinculado ? '¡Usuario Asignado con Éxito!' : '¡Credenciales Generadas con Éxito!' }}
        </h3>
        <p class="text-xs text-slate-600">
          {{ credencialesGeneradas?.vinculado
            ? `Se vinculó exitosamente el usuario a la comunidad "${credencialesGeneradas?.comunidad}". Las autoridades ya pueden operar con su cuenta institucional:`
            : `Entregue los siguientes datos de acceso a las autoridades de la comunidad "${credencialesGeneradas?.comunidad}" para que inicien sesión:`
          }}
        </p>

        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2 text-xs font-mono">
          <div>
            <span class="text-slate-400 block text-[11px] uppercase">Nombre:</span>
            <span class="font-bold text-ink">{{ credencialesGeneradas?.nombre }}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px] uppercase">Usuario / Email:</span>
            <span class="font-bold text-brand-700">{{ credencialesGeneradas?.email }}</span>
          </div>
          <div>
            <span class="text-slate-400 block text-[11px] uppercase">Contraseña:</span>
            <span class="font-bold text-indigo-700">{{ credencialesGeneradas?.password }}</span>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            type="button"
            @click="copyToClipboard(`Usuario: ${credencialesGeneradas?.email}\nContraseña: ${credencialesGeneradas?.password}`)"
            class="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            📋 Copiar Datos de Acceso
          </button>
          <button
            type="button"
            @click="showCredencialesModal = false"
            class="flex-1 btn-primary text-xs py-2"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL GESTIONAR / ASIGNAR USUARIO A COMUNIDAD EXISTENTE -->
    <div v-if="showUsuarioModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4 text-xs">
        <h3 class="font-display text-base font-bold text-ink">
          Usuario de Acceso: {{ selectedComunidadForUser?.nombre }}
        </h3>
        <p class="text-slate-500">
          Asigne o restablezca las credenciales para que la comunidad pueda ingresar y subir su documentación. Puede seleccionar una cuenta institucional existente o crear credenciales específicas.
        </p>

        <form @submit.prevent="saveUsuarioComunidad" class="space-y-3">
          <!-- Selector de Modo de Asignación -->
          <div class="flex items-center justify-between pb-1 border-b">
            <span class="font-semibold text-slate-700">Acceso rápido:</span>
            <button
              type="button"
              @click="selectComunidadCuentaPrincipalEnModal"
              class="rounded-md bg-brand-50 border border-brand-200 px-2 py-1 text-[11px] font-bold text-brand-700 hover:bg-brand-100"
            >
              ⚡ Asignar comunidades@sedede.gob.bo
            </button>
          </div>

          <div v-if="usuariosComunidadesDisponibles.length > 0">
            <label class="block font-semibold text-slate-700 mb-1">O seleccionar de los usuarios registrados:</label>
            <select
              v-model="usuarioForm.usuario_id_seleccionado"
              @change="onSelectUsuarioExistenteEnModal"
              class="w-full rounded-lg border p-2 text-xs bg-slate-50 text-ink focus:border-brand-600 focus:outline-none"
            >
              <option value="">-- Seleccionar usuario registrado --</option>
              <option
                v-for="u in usuariosComunidadesDisponibles"
                :key="u.id"
                :value="u.id"
              >
                {{ u.name }} ({{ u.email }})
              </option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Nombre del Representante *</label>
            <input v-model="usuarioForm.name" required type="text" class="w-full rounded-lg border p-2 bg-white text-ink" />
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Email de Acceso *</label>
            <input v-model="usuarioForm.email" required type="email" class="w-full rounded-lg border p-2 bg-white text-ink font-mono font-semibold" />
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Contraseña (Nueva o Actual) *</label>
            <input v-model="usuarioForm.password" required type="text" class="w-full rounded-lg border p-2 bg-white text-ink font-mono font-bold" />
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t">
            <button type="button" @click="showUsuarioModal = false" class="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
              Cancelar
            </button>
            <button type="submit" class="btn-primary">
              Guardar y Asignar Credenciales
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL EXPEDIENTE DOCUMENTAL (SEDEDE) -->
    <div v-if="showExpedienteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b pb-3 mb-4">
          <div>
            <h3 class="font-display text-lg font-bold text-ink">
              Expediente Legal: {{ selectedMancomunidad?.nombre }}
            </h3>
            <p class="text-xs text-slate-500">
              Estado legal actual: <span class="font-bold uppercase text-brand-700">{{ selectedMancomunidad?.estado_legal }}</span>
            </p>
          </div>
          <button type="button" @click="showExpedienteModal = false" class="text-slate-400 hover:text-slate-600 text-lg">✕</button>
        </div>

        <!-- Checklist de los 5 Requisitos Obligatorios -->
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-5">
          <h4 class="text-xs font-bold uppercase text-slate-700 mb-2">Checklist de Requisitos para Aprobación</h4>
          <div class="grid grid-cols-1 divide-y divide-slate-200">
            <div
              v-for="tipo in tiposDocumentos"
              :key="tipo.value"
              class="flex items-center justify-between p-2.5 text-xs"
            >
              <div class="flex items-center gap-2">
                <span v-if="expedienteDocs.some(d => d.tipo === tipo.value && d.estado_verificacion === 'Aprobado')" class="text-emerald-600 font-bold text-base">✓</span>
                <span v-else-if="expedienteDocs.some(d => d.tipo === tipo.value && d.estado_verificacion === 'Pendiente')" class="text-amber-500 font-bold text-base">⏳</span>
                <span v-else class="text-rose-500 font-bold text-base">✗</span>
                <span class="font-medium text-slate-800">{{ tipo.label }}</span>
              </div>

              <div>
                <span
                  v-if="expedienteDocs.find(d => d.tipo === tipo.value)"
                  :class="['rounded px-2 py-0.5 text-[11px] font-bold border', getEstadoBadgeClass(expedienteDocs.find(d => d.tipo === tipo.value).estado_verificacion)]"
                >
                  {{ expedienteDocs.find(d => d.tipo === tipo.value).estado_verificacion }}
                </span>
                <span v-else class="text-[11px] font-semibold text-slate-400">Falta subir</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Subir Documento por SEDEDE en ventanilla -->
        <div class="rounded-xl border border-brand-200 bg-brand-50/30 p-4 mb-6">
          <h4 class="text-xs font-bold text-brand-900 mb-1">Cargar Documento a nombre de la Comunidad</h4>
          <p class="text-[11px] text-slate-500 mb-2">Use esta opción si las autoridades comunales entregaron sus documentos impresos en el SEDEDE.</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div class="text-xs">
              <label class="block font-semibold text-slate-700 mb-1">Tipo de Documento</label>
              <select v-model="newDocType" class="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white">
                <option v-for="t in tiposDocumentos" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div class="text-xs">
              <label class="block font-semibold text-slate-700 mb-1">Archivo (PDF o Imagen)</label>
              <input type="file" @change="handleFileSelect" class="w-full text-xs text-slate-600 file:rounded-md file:border-0 file:bg-brand-600 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white" />
            </div>
            <div>
              <button
                type="button"
                :disabled="uploadingDoc || !newDocFile"
                @click="uploadDocumento"
                class="w-full btn-primary text-xs py-2 disabled:opacity-50"
              >
                {{ uploadingDoc ? 'Subiendo...' : 'Subir Archivo' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Tabla de Documentos Subidos con Aprobación/Rechazo de SEDEDE -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold uppercase text-slate-700">Archivos Digitales Registrados</h4>
          <table class="w-full text-xs text-left divide-y divide-slate-200 border rounded-lg overflow-hidden">
            <thead class="bg-slate-50 text-slate-500 font-semibold uppercase">
              <tr>
                <th class="p-2.5">Documento</th>
                <th class="p-2.5">Archivo</th>
                <th class="p-2.5">Estado</th>
                <th class="p-2.5 text-right">Revisión SEDEDE</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="expedienteDocs.length === 0">
                <td colspan="4" class="p-4 text-center text-slate-400">Aún no se han cargado documentos en este expediente.</td>
              </tr>
              <tr v-for="d in expedienteDocs" :key="d.id" class="hover:bg-slate-50">
                <td class="p-2.5 font-bold text-slate-800">{{ d.tipo }}</td>
                <td class="p-2.5 font-mono text-[11px] text-slate-500">
                  <a href="#" @click.prevent="descargarDoc(d)" class="text-brand-600 underline">
                    {{ d.nombre_archivo }}
                  </a>
                </td>
                <td class="p-2.5">
                  <span :class="['rounded px-2 py-0.5 text-[10px] font-bold border', getEstadoBadgeClass(d.estado_verificacion)]">
                    {{ d.estado_verificacion }}
                  </span>
                </td>
                <td class="p-2.5 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      v-if="d.estado_verificacion !== 'Aprobado'"
                      type="button"
                      @click="aprobarDoc(d)"
                      class="rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    >
                      ✓ Aprobar
                    </button>
                    <button
                      v-if="d.estado_verificacion !== 'Rechazado'"
                      type="button"
                      @click="rechazarDoc(d)"
                      class="rounded bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 border border-rose-200"
                    >
                      ✗ Rechazar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-6 flex justify-between items-center border-t pt-4">
          <button
            type="button"
            @click="verificarYOficializarExpediente"
            class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs"
          >
            🛡️ Oficializar y Aprobar Comunidad (Pasar a Vigente)
          </button>
          <button type="button" @click="showExpedienteModal = false" class="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL MIEMBROS -->
    <div v-if="showMiembrosModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 class="font-display text-lg font-bold text-ink mb-1">
          Municipios Miembros: {{ selectedMancomunidad?.nombre }}
        </h3>
        <p class="text-xs text-slate-500 mb-4">Padrón de municipios integrados y sus autoridades designadas.</p>

        <div class="rounded-xl border bg-slate-50 p-3 mb-4 space-y-2 text-xs">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Municipio</label>
              <select v-model="nuevoMiembro.municipio_id" class="w-full rounded-md border p-1.5 bg-white">
                <option value="">Seleccione municipio</option>
                <option v-for="m in municipios" :key="m.id" :value="m.id">{{ m.nombre }} ({{ m.provincia }})</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Cargo</label>
              <select v-model="nuevoMiembro.cargo" class="w-full rounded-md border p-1.5 bg-white">
                <option value="alcalde">Alcalde Municipal</option>
                <option value="presidente">Presidente</option>
                <option value="secretario">Secretario</option>
              </select>
            </div>
          </div>
          <button type="button" @click="addMiembroToMancomunidad" class="w-full btn-primary text-xs py-1.5">
            + Afiliar Municipio
          </button>
        </div>

        <div class="divide-y divide-slate-100 max-h-60 overflow-y-auto">
          <div v-for="mb in miembrosList" :key="mb.id" class="py-2 flex items-center justify-between text-xs">
            <div>
              <p class="font-bold text-slate-800">{{ mb.municipio?.nombre }}</p>
              <p class="text-[11px] text-slate-500 uppercase">{{ mb.cargo }}</p>
            </div>
            <button
              type="button"
              @click="deleteMiembroFromMancomunidad(mb.id)"
              class="text-xs text-red-600 hover:text-red-800"
            >
              Desafiliar
            </button>
          </div>
        </div>

        <div class="mt-4 flex justify-end border-t pt-3">
          <button type="button" @click="showMiembrosModal = false" class="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL NUEVA SOLICITUD DE APOYO -->
    <div v-if="showSolicitudModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 class="font-display text-lg font-bold text-ink mb-1">
          Nueva Solicitud de Apoyo Comunitario
        </h3>
        <p class="text-xs text-slate-500 mb-4">
          {{ isSedede ? 'Registro institucional de solicitud a nombre de comunidad rural.' : 'Complete los requerimientos para el apoyo deportivo de su comunidad.' }}
        </p>

        <form @submit.prevent="saveSolicitud" class="space-y-3.5 text-xs">
          <!-- Comunidad Solicitante -->
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Comunidad Solicitante</label>
            <!-- Si es SEDEDE, puede elegir cualquier comunidad del dropdown -->
            <select
              v-if="isSedede"
              v-model="solicitudForm.solicitante_id"
              required
              class="w-full rounded-lg border p-2 text-sm bg-white"
            >
              <option v-for="m in mancomunidades" :key="m.id" :value="m.id">
                {{ m.nombre }} ({{ m.sigla || m.nit }}) - {{ m.estado_legal }}
              </option>
            </select>
            <!-- Si es Comunidad, bloqueado con su comunidad -->
            <input
              v-else
              type="text"
              :value="miComunidad?.nombre"
              disabled
              class="w-full rounded-lg border p-2 text-sm bg-slate-100 font-bold text-slate-800"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Tipo de Apoyo</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                :class="[
                  'rounded-lg border p-2.5 font-bold transition-colors text-center',
                  solicitudForm.tipo === 'recursos' ? 'bg-brand-50 border-brand-600 text-brand-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                ]"
                @click="solicitudForm.tipo = 'recursos'"
              >
                📦 Implementos / Materiales
              </button>
              <button
                type="button"
                :class="[
                  'rounded-lg border p-2.5 font-bold transition-colors text-center',
                  solicitudForm.tipo === 'espacio' ? 'bg-brand-50 border-brand-600 text-brand-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                ]"
                @click="solicitudForm.tipo = 'espacio'"
              >
                🏟️ Escenario Deportivo SEDEDE
              </button>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Título de la Solicitud / Proyecto *</label>
            <input v-model="solicitudForm.titulo" required type="text" placeholder="Ej: Material para Campeonato Intercomunal de Futsal Sub-16" class="w-full rounded-lg border p-2 text-sm text-ink focus:border-brand-600 focus:outline-none" />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Justificación / Descripción de Beneficiarios</label>
            <textarea v-model="solicitudForm.descripcion" rows="2" placeholder="Describa el objetivo social o deportivo y las comunidades beneficiadas..." class="w-full rounded-lg border p-2 text-sm text-ink focus:border-brand-600 focus:outline-none"></textarea>
          </div>

          <!-- Campos específicos: Recursos -->
          <div v-if="solicitudForm.tipo === 'recursos'" class="space-y-2 border-t pt-3">
            <div class="flex items-center justify-between">
              <label class="font-bold text-slate-800">Renglones de Materiales Solicitados</label>
              <button type="button" @click="addRenglonRecurso" class="text-xs font-semibold text-brand-600 hover:text-brand-800">
                + Añadir Ítem
              </button>
            </div>

            <div v-for="(item, idx) in solicitudForm.recursos" :key="idx" class="flex items-center gap-2">
              <select v-model="item.recurso_id" required class="flex-1 rounded-md border p-1.5 text-xs bg-white">
                <option v-for="r in recursos" :key="r.id" :value="r.id">
                  {{ r.nombre }} (Stock: {{ r.cantidad_disponible }} {{ r.unidad }})
                </option>
              </select>
              <input v-model.number="item.cantidad_solicitada" min="1" type="number" class="w-20 rounded-md border p-1.5 text-xs font-bold" />
              <button type="button" @click="removeRenglonRecurso(idx)" class="text-red-500 font-bold px-1">✕</button>
            </div>
          </div>

          <!-- Campos específicos: Espacio -->
          <div v-else class="space-y-3 border-t pt-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Escenario / Cancha Solicitada</label>
              <select v-model="solicitudForm.espacio_id" required class="w-full rounded-lg border p-2 text-xs bg-white">
                <option v-for="esc in escenarios" :key="esc.id" :value="esc.id">
                  {{ esc.nombre }} - {{ esc.espacio }}
                </option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Actividad</label>
              <input v-model="solicitudForm.actividad" required type="text" placeholder="Ej: Inauguración de Juegos Deportivos Rurales" class="w-full rounded-lg border p-2 text-xs text-ink" />
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Fecha</label>
                <input v-model="solicitudForm.fecha_uso" required type="date" class="w-full rounded-lg border p-1.5 text-xs" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Hora Inicio</label>
                <input v-model="solicitudForm.hora_inicio" required type="time" class="w-full rounded-lg border p-1.5 text-xs" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Hora Fin</label>
                <input v-model="solicitudForm.hora_fin" required type="time" class="w-full rounded-lg border p-1.5 text-xs" />
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3 pt-3 border-t">
            <button type="button" @click="showSolicitudModal = false" class="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
              Cancelar
            </button>
            <button type="submit" class="btn-primary">
              Guardar en Borrador
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL RESOLVER / ANULAR TRANSICIÓN (SEDEDE) -->
    <div v-if="showTransicionModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-xs space-y-4">
        <h3 class="font-display text-base font-bold text-ink">
          {{ transicionData.titulo }}
        </h3>

        <div v-if="transicionData.accion === 'resolver'">
          <label class="block font-semibold text-slate-700 mb-1">Decisión Técnica</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              :class="[
                'p-2.5 rounded-lg border font-bold text-center',
                transicionData.decision === 'aprobar' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 text-slate-600'
              ]"
              @click="transicionData.decision = 'aprobar'"
            >
              ✓ Aprobar Solicitud
            </button>
            <button
              type="button"
              :class="[
                'p-2.5 rounded-lg border font-bold text-center',
                transicionData.decision === 'rechazar' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-slate-50 text-slate-600'
              ]"
              @click="transicionData.decision = 'rechazar'"
            >
              ✗ Rechazar Solicitud
            </button>
          </div>
        </div>

        <div v-if="transicionData.decision === 'rechazar' || transicionData.accion === 'anular'">
          <label class="block font-semibold text-slate-700 mb-1">
            Motivo Obligatorio
          </label>
          <textarea
            v-model="transicionData.motivo"
            rows="3"
            required
            placeholder="Especifique las razones técnicas o presupuestarias..."
            class="w-full rounded-lg border p-2 text-xs focus:border-brand-600 focus:outline-none"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 border-t pt-3">
          <button type="button" @click="showTransicionModal = false" class="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
            Cancelar
          </button>
          <button type="button" @click="executeTransicion" class="btn-primary">
            Confirmar Decisión
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL RECURSO (SEDEDE) -->
    <div v-if="showRecursoModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-xs space-y-3">
        <h3 class="font-display text-base font-bold text-ink">
          Registrar Recurso de Apoyo Comunitario
        </h3>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Código</label>
          <input v-model="recursoForm.codigo" required type="text" class="w-full rounded-lg border p-2 font-mono" />
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Nombre</label>
          <input v-model="recursoForm.nombre" required type="text" placeholder="Ej: Balones oficiales de fútbol y futsal" class="w-full rounded-lg border p-2" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Categoría</label>
            <select v-model="recursoForm.categoria" class="w-full rounded-lg border p-2 bg-white">
              <option value="implemento">Implemento</option>
              <option value="equipamiento">Equipamiento</option>
              <option value="indumentaria">Indumentaria</option>
              <option value="senalizacion">Señalización</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Unidad</label>
            <input v-model="recursoForm.unidad" required type="text" placeholder="unidad, kit, juego" class="w-full rounded-lg border p-2" />
          </div>
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Cantidad Inicial Disponible</label>
          <input v-model.number="recursoForm.cantidad_disponible" min="0" required type="number" class="w-full rounded-lg border p-2 font-bold" />
        </div>
        <div class="flex justify-end gap-2 border-t pt-3">
          <button type="button" @click="showRecursoModal = false" class="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
            Cancelar
          </button>
          <button type="button" @click="saveRecurso" class="btn-primary">
            Guardar Recurso
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL MUNICIPIO (SEDEDE) -->
    <div v-if="showMunicipioModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-xs space-y-3">
        <h3 class="font-display text-base font-bold text-ink">
          Registrar Municipio de Chuquisaca
        </h3>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Código INE</label>
          <input v-model="municipioForm.codigo" required type="text" placeholder="Ej: 0101" class="w-full rounded-lg border p-2 font-mono" />
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Nombre</label>
          <input v-model="municipioForm.nombre" required type="text" placeholder="Ej: Tarabuco, Camargo, Monteagudo..." class="w-full rounded-lg border p-2" />
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Provincia</label>
          <input v-model="municipioForm.provincia" required type="text" placeholder="Ej: Yamparáez, Nor Cinti, Hernando Siles..." class="w-full rounded-lg border p-2" />
        </div>
        <div class="flex justify-end gap-2 border-t pt-3">
          <button type="button" @click="showMunicipioModal = false" class="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
            Cancelar
          </button>
          <button type="submit" @click="saveMunicipio" class="btn-primary">
            Guardar Municipio
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
