/**
 * Datos institucionales que se repiten en el encabezado, pie de página y manuales
 * (Proyecto SEDEDE Chuquisaca - Universidad Privada Domingo Savio Sede Sucre).
 */

// Los logos de la UPDS llevan a la página oficial de la sede.
export const URL_UPDS_SUCRE = 'https://www.upds.edu.bo/sede/sucre/'

/**
 * Estudiantes desarrolladores del sistema y equipo de soporte técnico.
 * ORDENADO ESTRICTAMENTE POR CONTRIBUCIÓN AL PROYECTO (commits, entregables y desempeño en Paddock).
 */
export const AUTORES_CONTRIBUCION = [
  {
    rango: 1,
    nombres: 'Pedro Antonio',
    apellidos: 'López Chumacero',
    nombreCompleto: 'Pedro Antonio López Chumacero',
    rol: 'Líder de Proyecto / Fullstack Lead',
    telefono: '79310105',
    whatsapp: '59179310105',
    destacado: true,
  },
  {
    rango: 2,
    nombres: 'Horacio',
    apellidos: 'López Chumacero',
    nombreCompleto: 'Horacio López Chumacero',
    rol: 'Backend Lead (POA & Financiero)',
    telefono: '70316666',
    whatsapp: '59170316666',
    destacado: true,
  },
  {
    rango: 3,
    nombres: 'Freddy Cristian',
    apellidos: 'Mamani Clemente',
    nombreCompleto: 'Freddy Cristian Mamani Clemente',
    rol: 'Frontend Lead & Fullstack Contributor',
    telefono: '68664551',
    whatsapp: '59168664551',
    destacado: true,
  },
  {
    rango: 4,
    nombres: 'Néstor Alfredo',
    apellidos: 'Avila Pereira',
    nombreCompleto: 'Néstor Alfredo Avila Pereira',
    rol: 'Backend Developer (Asociaciones & Core)',
    telefono: '70326479',
    whatsapp: '59170326479',
    destacado: false,
  },
  {
    rango: 5,
    nombres: 'Lucas Sergio',
    apellidos: 'Vargas Sandoval',
    nombreCompleto: 'Lucas Sergio Vargas Sandoval',
    rol: 'Documentación Técnica & Entregables',
    telefono: '67617511',
    whatsapp: '59167617511',
    destacado: false,
  },
  {
    rango: 6,
    nombres: 'Pedro Simón',
    apellidos: 'Rodriguez Ari',
    nombreCompleto: 'Pedro Simón Rodriguez Ari',
    rol: 'Frontend Developer (Almacenes & Auth)',
    telefono: '72639417',
    whatsapp: '59172639417',
    destacado: false,
  },
  {
    rango: 7,
    nombres: 'Ignacio',
    apellidos: 'Calvimontes Acuña',
    nombreCompleto: 'Ignacio Calvimontes Acuña',
    rol: 'Backend Developer (Alertas & Eventos)',
    telefono: '63752768',
    whatsapp: '59163752768',
    destacado: false,
  },
  {
    rango: 8,
    nombres: 'Melvin Rioddy',
    apellidos: 'Chipana Peña',
    nombreCompleto: 'Melvin Rioddy Chipana Peña',
    rol: 'QA Lead / Control de Calidad',
    telefono: '72438447',
    whatsapp: '59172438447',
    destacado: false,
  },
  {
    rango: 9,
    nombres: 'Alejandro',
    apellidos: 'Jancko Olivares',
    nombreCompleto: 'Alejandro Jancko Olivares',
    rol: 'Apoyo Documental / Requerimientos',
    telefono: '67620612',
    whatsapp: '59167620612',
    destacado: false,
  },
]

/**
 * Autores ordenados por contribución para compatibilidad directa.
 */
export const AUTORES_ORDENADOS = AUTORES_CONTRIBUCION.map(
  (a) => `${a.nombreCompleto} (${a.telefono})`
)
