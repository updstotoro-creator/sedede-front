import { defineStore } from 'pinia'

/**
 * Store temporal en memoria para Escuelas de Formación (Sprint 6).
 *
 * Refleja el modelo de docs/modulos/formacion/requerimientos.md:
 * formacion_escuelas, formacion_grupos, formacion_horarios,
 * formacion_participantes y formacion_inscripciones. El backend solo tiene
 * esquema y modelos; los servicios y endpoints siguen pendientes, así que las
 * reglas que el documento asigna al "servicio" (cupo, edad, tutor, choque de
 * horarios) se aplican aquí. Cuando existan los endpoints, este store se
 * reemplaza por un formacionService.js y esas reglas pasan a ser del servidor.
 */

let nextParticipanteId = 100
let nextInscripcionId = 1000

// Años cumplidos de una fecha de nacimiento a una fecha de referencia
export function edadA(fechaNacimiento, fechaReferencia = new Date()) {
  const nac = new Date(fechaNacimiento)
  const ref = new Date(fechaReferencia)
  let edad = ref.getFullYear() - nac.getFullYear()
  const m = ref.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && ref.getDate() < nac.getDate())) edad--
  return edad
}

export const esMenorDeEdad = (fechaNacimiento) => edadA(fechaNacimiento) < 18

const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// Dos franjas se superponen si son el mismo día y los intervalos se cruzan
const seSuperponen = (a, b) =>
  a.dia_semana === b.dia_semana &&
  aMinutos(a.hora_inicio) < aMinutos(b.hora_fin) &&
  aMinutos(b.hora_inicio) < aMinutos(a.hora_fin)

export const useFormacionStore = defineStore('formacion', {
  state: () => ({
    escuelas: [
      { id: 1, nombre: 'Escuela de Deportes del SEDEDE', tipo: 'sedede', disciplina: 'Multideporte', activo: true },
      { id: 2, nombre: 'Diablos de Oro', tipo: 'club', disciplina: 'Fútbol', activo: true },
      { id: 3, nombre: 'Cracks Junior', tipo: 'privada', disciplina: 'Fútbol', activo: true },
    ],

    grupos: [
      {
        id: 11, escuela_id: 1, nombre: 'Iniciación Sub-10', gestion: 2026,
        edad_minima: 6, edad_maxima: 10, cupo: 3, fecha_inicio: '2026-03-01', activo: true,
        horarios: [
          { dia_semana: 2, hora_inicio: '15:00', hora_fin: '16:30', espacio: 'Frontis del Estadio Patria' },
          { dia_semana: 4, hora_inicio: '15:00', hora_fin: '16:30', espacio: 'Frontis del Estadio Patria' },
        ],
      },
      {
        id: 12, escuela_id: 1, nombre: 'Formativo Sub-14', gestion: 2026,
        edad_minima: 11, edad_maxima: 14, cupo: 20, fecha_inicio: '2026-03-01', activo: true,
        horarios: [
          { dia_semana: 2, hora_inicio: '16:00', hora_fin: '17:30', espacio: 'Sintética pequeña' },
          { dia_semana: 5, hora_inicio: '16:00', hora_fin: '17:30', espacio: 'Sintética pequeña' },
        ],
      },
      {
        id: 21, escuela_id: 2, nombre: 'Categoría 2016', gestion: 2026,
        edad_minima: 9, edad_maxima: 11, cupo: 15, fecha_inicio: '2026-03-15', activo: true,
        horarios: [
          { dia_semana: 3, hora_inicio: '15:30', hora_fin: '17:00', espacio: 'Óvalo Jorge Revilla Aldana' },
        ],
      },
      {
        id: 31, escuela_id: 3, nombre: 'Sub-12', gestion: 2026,
        edad_minima: 10, edad_maxima: 12, cupo: null, fecha_inicio: '2026-04-01', activo: true,
        horarios: [
          { dia_semana: 1, hora_inicio: '17:00', hora_fin: '18:30', espacio: 'Coliseo Tito Alfred' },
        ],
      },
    ],

    participantes: [
      { id: 1, nombre: 'Mateo Quispe', fecha_nacimiento: '2018-05-12', documento_numero: '9876543', tutor_nombre: 'Rosa Quispe', tutor_telefono: '70012345' },
      { id: 2, nombre: 'Valeria Rojas', fecha_nacimiento: '2017-09-30', documento_numero: '9876544', tutor_nombre: 'Carlos Rojas', tutor_telefono: '70023456' },
      { id: 3, nombre: 'Diego Mamani', fecha_nacimiento: '2015-02-20', documento_numero: '9876545', tutor_nombre: 'Ana Mamani', tutor_telefono: '70034567' },
    ],

    // estado ∈ activa | suspendida | retirada | finalizada
    inscripciones: [
      { id: 1, grupo_id: 11, participante_id: 1, estado: 'activa', fecha_inscripcion: '2026-03-02', fecha_baja: null, motivo_baja: null },
      { id: 2, grupo_id: 11, participante_id: 2, estado: 'activa', fecha_inscripcion: '2026-03-02', fecha_baja: null, motivo_baja: null },
      { id: 3, grupo_id: 12, participante_id: 3, estado: 'suspendida', fecha_inscripcion: '2026-03-05', fecha_baja: null, motivo_baja: null },
    ],
  }),

  getters: {
    gruposDeEscuela: (state) => (escuelaId) =>
      state.grupos.filter((g) => g.escuela_id === Number(escuelaId)),

    getParticipante: (state) => (id) => state.participantes.find((p) => p.id === Number(id)),

    // Solo las activas ocupan cupo
    ocupados: (state) => (grupoId) =>
      state.inscripciones.filter((i) => i.grupo_id === Number(grupoId) && i.estado === 'activa').length,

    inscripcionesDeGrupo: (state) => (grupoId) =>
      state.inscripciones.filter((i) => i.grupo_id === Number(grupoId)),
  },

  actions: {
    tieneCupo(grupoId) {
      const grupo = this.grupos.find((g) => g.id === Number(grupoId))
      return grupo.cupo === null || this.ocupados(grupoId) < grupo.cupo
    },

    // La edad se mide al inicio del grupo, en años cumplidos (SP-FOR-04)
    admiteEdad(grupoId, fechaNacimiento) {
      const grupo = this.grupos.find((g) => g.id === Number(grupoId))
      const edad = edadA(fechaNacimiento, grupo.fecha_inicio)
      return edad >= grupo.edad_minima && edad <= grupo.edad_maxima
    },

    // Un participante no puede tener dos grupos a la misma hora
    choqueConOtroGrupo(participanteId, grupoId) {
      const destino = this.grupos.find((g) => g.id === Number(grupoId))
      const activos = this.inscripciones.filter(
        (i) => i.participante_id === Number(participanteId) && i.estado === 'activa' && i.grupo_id !== Number(grupoId)
      )
      for (const insc of activos) {
        const otro = this.grupos.find((g) => g.id === insc.grupo_id)
        for (const a of destino.horarios) {
          for (const b of otro.horarios) {
            if (seSuperponen(a, b)) return otro.nombre
          }
        }
      }
      return null
    },

    /**
     * Inscribe a un participante en un grupo aplicando las reglas del
     * servicio (RF-FOR-005). Devuelve { ok, errores } sin lanzar excepciones.
     */
    inscribir(grupoId, datos) {
      const errores = []
      const grupo = this.grupos.find((g) => g.id === Number(grupoId))

      if (!datos.nombre?.trim()) errores.push('El nombre del participante es obligatorio.')
      if (!datos.fecha_nacimiento) errores.push('La fecha de nacimiento es obligatoria.')
      if (errores.length) return { ok: false, errores }

      if (!this.admiteEdad(grupoId, datos.fecha_nacimiento)) {
        const edad = edadA(datos.fecha_nacimiento, grupo.fecha_inicio)
        errores.push(
          `La edad al inicio del grupo (${edad} años) está fuera del rango ${grupo.edad_minima}–${grupo.edad_maxima}.`
        )
      }

      if (esMenorDeEdad(datos.fecha_nacimiento) && !(datos.tutor_nombre?.trim() && datos.tutor_telefono?.trim())) {
        errores.push('Un menor de edad necesita nombre y teléfono del tutor.')
      }

      // Si el documento ya existe se reutiliza al participante
      let participante = datos.documento_numero
        ? this.participantes.find((p) => p.documento_numero === datos.documento_numero.trim())
        : null

      const yaInscrita = participante
        ? this.inscripciones.find((i) => i.grupo_id === grupo.id && i.participante_id === participante.id)
        : null

      if (yaInscrita && ['activa', 'suspendida'].includes(yaInscrita.estado)) {
        errores.push('Este participante ya está inscrito en el grupo.')
      }

      // Quien vuelve reactiva su inscripción, no ocupa una fila nueva
      const reactiva = yaInscrita && ['retirada', 'finalizada'].includes(yaInscrita.estado)

      if (!this.tieneCupo(grupo.id)) errores.push('El grupo no tiene cupo disponible.')

      if (participante) {
        const choque = this.choqueConOtroGrupo(participante.id, grupo.id)
        if (choque) errores.push(`El participante ya tiene un horario que se cruza con el grupo «${choque}».`)
      }

      if (errores.length) return { ok: false, errores }

      if (!participante) {
        participante = {
          id: nextParticipanteId++,
          nombre: datos.nombre.trim(),
          fecha_nacimiento: datos.fecha_nacimiento,
          documento_numero: datos.documento_numero?.trim() || null,
          tutor_nombre: datos.tutor_nombre?.trim() || null,
          tutor_telefono: datos.tutor_telefono?.trim() || null,
        }
        this.participantes.push(participante)
      }

      const hoy = new Date().toISOString().slice(0, 10)
      if (reactiva) {
        Object.assign(yaInscrita, { estado: 'activa', fecha_baja: null, motivo_baja: null })
      } else {
        this.inscripciones.push({
          id: nextInscripcionId++,
          grupo_id: grupo.id,
          participante_id: participante.id,
          estado: 'activa',
          fecha_inscripcion: hoy,
          fecha_baja: null,
          motivo_baja: null,
        })
      }
      return { ok: true, errores: [] }
    },

    // La inscripción es historia: nunca se borra, solo cambia de estado
    cambiarEstado(inscripcionId, estado) {
      const insc = this.inscripciones.find((i) => i.id === Number(inscripcionId))
      if (!insc) return { ok: false, errores: ['Inscripción no encontrada.'] }

      if (estado === 'activa') {
        if (!this.tieneCupo(insc.grupo_id) && insc.estado !== 'activa') {
          return { ok: false, errores: ['El grupo no tiene cupo para reactivar esta inscripción.'] }
        }
        const choque = this.choqueConOtroGrupo(insc.participante_id, insc.grupo_id)
        if (choque) return { ok: false, errores: [`Se cruza con el grupo «${choque}».`] }
      }
      insc.estado = estado
      return { ok: true, errores: [] }
    },

    // Un retiro exige fecha y motivo (RNF-FOR-002)
    retirar(inscripcionId, fecha, motivo) {
      const insc = this.inscripciones.find((i) => i.id === Number(inscripcionId))
      const errores = []
      if (!fecha) errores.push('La fecha de retiro es obligatoria.')
      if (!motivo?.trim()) errores.push('El motivo del retiro es obligatorio.')
      if (insc && fecha && fecha < insc.fecha_inscripcion) {
        errores.push('La fecha de retiro no puede ser anterior a la inscripción.')
      }
      if (errores.length) return { ok: false, errores }
      Object.assign(insc, { estado: 'retirada', fecha_baja: fecha, motivo_baja: motivo.trim() })
      return { ok: true, errores: [] }
    },
  },
})
