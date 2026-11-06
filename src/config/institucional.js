/**
 * Datos institucionales que se repiten en el encabezado y el pie de página
 * (obs. 17 de la matriz del 5-11-2026, pedido del rector).
 */

// Los logos de la UPDS llevan a la página oficial de la sede.
export const URL_UPDS_SUCRE = 'https://www.upds.edu.bo/sede/sucre/'

/**
 * Estudiantes autores del sistema. Se guardan con nombres y apellidos por
 * separado para ordenarlos por apellido; el orden en que se escriben aquí
 * no importa (ver AUTORES_ORDENADOS).
 */
const AUTORES = [
  { nombres: 'Pedro Antonio', apellidos: 'Lopez Chumacero' },
  { nombres: 'Horacio', apellidos: 'Lopez Chumacero' },
  { nombres: 'Melvin Rioddy', apellidos: 'Chipana Peña' },
  { nombres: 'Freddy Cristian', apellidos: 'Mamani Clemente' },
  { nombres: 'Lucas Sergio', apellidos: 'Vargas Sandoval' },
  { nombres: 'Pedro Simon', apellidos: 'Rodriguez Ari' },
  { nombres: 'Nestor Alfredo', apellidos: 'Avila Pereira' },
  { nombres: 'Alejandro', apellidos: 'Jancko Olivares' },
  { nombres: 'Ignacio', apellidos: 'Calvimontes Acuña' },
]

const collator = new Intl.Collator('es', { sensitivity: 'base' })

/** Autores por apellido (y, a igualdad, por nombre), listos para mostrar: «Nombres Apellidos». */
export const AUTORES_ORDENADOS = [...AUTORES]
  .sort((a, b) => collator.compare(a.apellidos, b.apellidos) || collator.compare(a.nombres, b.nombres))
  .map((a) => `${a.nombres} ${a.apellidos}`)
