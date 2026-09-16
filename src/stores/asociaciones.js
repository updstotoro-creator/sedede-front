import { defineStore } from 'pinia'

/**
 * Store temporal en memoria para el módulo de Asociaciones/Clubes/Deportistas.
 *
 * El backend todavía no expone rutas para este módulo (confirmado con
 * `php artisan route:list` — solo existe `core`: auth, users, roles).
 * Mientras se habilita, este store simula el comportamiento de un
 * servicio real: crear, editar y activar/desactivar (nunca eliminar).
 *
 * Cuando el backend tenga las rutas, este store se reemplaza por
 * llamadas a un `asociacionService.js` (mismo patrón que userService.js),
 * y las vistas casi no cambian porque ya consumen acciones con esta forma.
 */

let nextAsociacionId = 4
let nextClubId = 301
let nextDeportistaId = 3001

export const useAsociacionesStore = defineStore('asociaciones', {
  state: () => ({
    asociaciones: [
      {
        id: 1,
        nombre: 'Asociación Departamental de Fútbol',
        disciplina: 'Fútbol',
        presidente: 'Marco Villarroel',
        activo: true,
        clubes: [
          {
            id: 101,
            nombre: 'Club Atlético Sucre',
            entrenador: 'Juan Pérez',
            activo: true,
            deportistas: [
              { id: 1001, nombre: 'Luis Fernández', edad: 17, categoria: 'Juvenil', activo: true },
              { id: 1002, nombre: 'Ana Mamani', edad: 15, categoria: 'Formativo', activo: true },
            ],
          },
          {
            id: 102,
            nombre: 'Club Deportivo Independiente',
            entrenador: 'Rosa Quispe',
            activo: true,
            deportistas: [
              { id: 1003, nombre: 'Carlos Rojas', edad: 19, categoria: 'Alto Rendimiento', activo: true },
            ],
          },
        ],
      },
      {
        id: 2,
        nombre: 'Asociación Departamental de Voleibol',
        disciplina: 'Voleibol',
        presidente: 'Elena Choque',
        activo: true,
        clubes: [
          {
            id: 201,
            nombre: 'Club Voleibol Chuquisaca',
            entrenador: 'Pedro Aramayo',
            activo: true,
            deportistas: [
              { id: 2001, nombre: 'María Torrez', edad: 16, categoria: 'Juvenil', activo: true },
              { id: 2002, nombre: 'Sofía Delgado', edad: 14, categoria: 'Formativo', activo: true },
            ],
          },
        ],
      },
      {
        id: 3,
        nombre: 'Asociación Departamental de Atletismo',
        disciplina: 'Atletismo',
        presidente: 'Ricardo Flores',
        activo: false,
        clubes: [],
      },
    ],
  }),

  getters: {
    getAsociacion: (state) => (id) => state.asociaciones.find((a) => a.id === Number(id)),
    getClub: (state) => (asociacionId, clubId) => {
      const asociacion = state.asociaciones.find((a) => a.id === Number(asociacionId))
      return asociacion?.clubes.find((c) => c.id === Number(clubId))
    },
  },

  actions: {
    // --- Asociaciones ---
    addAsociacion(payload) {
      this.asociaciones.push({
        id: nextAsociacionId++,
        nombre: payload.nombre,
        disciplina: payload.disciplina,
        presidente: payload.presidente,
        activo: true,
        clubes: [],
      })
    },
    updateAsociacion(id, payload) {
      const asociacion = this.getAsociacion(id)
      if (asociacion) Object.assign(asociacion, payload)
    },
    toggleAsociacionActivo(id) {
      const asociacion = this.getAsociacion(id)
      if (asociacion) asociacion.activo = !asociacion.activo
    },

    // --- Clubes ---
    addClub(asociacionId, payload) {
      const asociacion = this.getAsociacion(asociacionId)
      if (!asociacion) return
      asociacion.clubes.push({
        id: nextClubId++,
        nombre: payload.nombre,
        entrenador: payload.entrenador,
        activo: true,
        deportistas: [],
      })
    },
    updateClub(asociacionId, clubId, payload) {
      const club = this.getClub(asociacionId, clubId)
      if (club) Object.assign(club, payload)
    },
    toggleClubActivo(asociacionId, clubId) {
      const club = this.getClub(asociacionId, clubId)
      if (club) club.activo = !club.activo
    },

    // --- Deportistas ---
    addDeportista(asociacionId, clubId, payload) {
      const club = this.getClub(asociacionId, clubId)
      if (!club) return
      club.deportistas.push({
        id: nextDeportistaId++,
        nombre: payload.nombre,
        edad: payload.edad,
        categoria: payload.categoria,
        activo: true,
      })
    },
    updateDeportista(asociacionId, clubId, deportistaId, payload) {
      const club = this.getClub(asociacionId, clubId)
      const deportista = club?.deportistas.find((d) => d.id === Number(deportistaId))
      if (deportista) Object.assign(deportista, payload)
    },
    toggleDeportistaActivo(asociacionId, clubId, deportistaId) {
      const club = this.getClub(asociacionId, clubId)
      const deportista = club?.deportistas.find((d) => d.id === Number(deportistaId))
      if (deportista) deportista.activo = !deportista.activo
    },
  },
})
