

export const mockAsociaciones = [
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
        deportistas: [
          { id: 1001, nombre: 'Luis Fernández', edad: 17, categoria: 'Juvenil' },
          { id: 1002, nombre: 'Ana Mamani', edad: 15, categoria: 'Formativo' },
        ],
      },
      {
        id: 102,
        nombre: 'Club Deportivo Independiente',
        entrenador: 'Rosa Quispe',
        deportistas: [
          { id: 1003, nombre: 'Carlos Rojas', edad: 19, categoria: 'Alto Rendimiento' },
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
        deportistas: [
          { id: 2001, nombre: 'María Torrez', edad: 16, categoria: 'Juvenil' },
          { id: 2002, nombre: 'Sofía Delgado', edad: 14, categoria: 'Formativo' },
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
]
