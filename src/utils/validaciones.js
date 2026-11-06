/**
 * Reglas de validación compartidas por los formularios.
 *
 * El backend valida lo mismo y es la autoridad: esto sólo evita que el
 * usuario descubra el error después de enviar. Si se cambia un tope aquí,
 * hay que cambiarlo también en config/tramites.php del backend.
 */

/**
 * Tope por tipo de apoyo (Bs). Valores provisionales hasta que SEDEDE fije
 * los oficiales (observación 4 de la matriz del 5-11-2026).
 */
export const MONTO_MAXIMO_POR_TIPO = {
  'Apoyo Económico': 50000,
  'Premio por Logro': 50000,
  'Material Deportivo / Equipamiento': 50000,
}

/** Importe en bolivianos: entero o con hasta dos decimales, sin exponente. */
const RE_IMPORTE = /^\d+(\.\d{1,2})?$/

/**
 * Devuelve el mensaje de error del monto, o null si es válido.
 */
export function errorMonto(valor, tipoSolicitud) {
  const texto = String(valor ?? '').trim()
  if (texto === '') return 'Indique el monto solicitado.'
  if (!RE_IMPORTE.test(texto)) return 'El monto debe ser un número con hasta dos decimales (sin notación científica).'

  const monto = Number(texto)
  if (!(monto > 0)) return 'El monto debe ser mayor a cero.'

  const maximo = MONTO_MAXIMO_POR_TIPO[tipoSolicitud]
  if (maximo && monto > maximo) {
    return `El monto no puede superar Bs ${maximo.toLocaleString('es-BO', { minimumFractionDigits: 2 })} para «${tipoSolicitud}».`
  }
  return null
}

/** Teclas que un input type="number" acepta pero un importe no admite. */
export function bloquearTeclasNoImporte(evento) {
  if (['e', 'E', '+', '-'].includes(evento.key)) evento.preventDefault()
}

/**
 * C.I. boliviano: 5 a 10 dígitos, complemento opcional (-1A) y expedido
 * opcional (CH, LP, ...). No admite un número hecho sólo de ceros.
 */
const RE_CI = /^(\d{5,10})(-[0-9A-Z]{1,2})?(\s?[A-Z]{2,3})?$/

export function errorCI(valor, etiqueta = 'C.I.') {
  const texto = String(valor ?? '').trim().toUpperCase()
  if (texto === '') return `Indique el ${etiqueta}.`
  const coincide = texto.match(RE_CI)
  if (!coincide) return `El ${etiqueta} debe tener entre 5 y 10 dígitos (ej. 4512789 CH).`
  if (/^0+$/.test(coincide[1])) return `El ${etiqueta} no es válido.`
  return null
}

/** Nombre de persona: al menos dos palabras de letras. */
export function errorNombrePersona(valor, etiqueta = 'nombre') {
  const texto = String(valor ?? '').trim()
  if (texto.length < 5) return `Indique el ${etiqueta} completo.`
  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/.test(texto)) return `El ${etiqueta} sólo puede contener letras.`
  if (texto.split(/\s+/).filter(Boolean).length < 2) return `Indique nombre y apellido del ${etiqueta.replace(/^nombre (del |de la )?/, '')}.`
  return null
}

/** Edad cumplida a una fecha (por defecto, hoy). */
export function edadA(fechaNacimiento, fechaReferencia = new Date()) {
  if (!fechaNacimiento) return null
  const nac = new Date(String(fechaNacimiento).split('T')[0] + 'T00:00:00')
  if (Number.isNaN(nac.getTime())) return null
  const ref = fechaReferencia instanceof Date ? fechaReferencia : new Date(String(fechaReferencia).split('T')[0] + 'T00:00:00')
  let edad = ref.getFullYear() - nac.getFullYear()
  const m = ref.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && ref.getDate() < nac.getDate())) edad--
  return edad
}

/**
 * Límite de edad de una categoría "Sub-15", "U-15", "Sub 17"... o null si la
 * categoría no lo indica (p. ej. "Libre", "Mayores").
 */
export function limiteEdadCategoria(categoria) {
  const m = String(categoria ?? '').match(/\b(?:sub|u)\s*-?\s*(\d{1,2})\b/i)
  return m ? Number(m[1]) : null
}

/** Fecha 'YYYY-MM-DD' de hoy en hora local. */
export function hoyISO() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Parte de fecha de un valor ISO o 'YYYY-MM-DD HH:mm:ss'. */
export function soloFecha(valor) {
  return valor ? String(valor).split('T')[0].split(' ')[0] : ''
}

/**
 * Fecha legible (dd/mm/aaaa). Acepta ISO con zona ("2031-10-31T04:00:00Z"):
 * se toma la fecha calendario tal como la guardó el backend, sin convertir de
 * zona, para que una reserva del 31 no se muestre como del 30.
 */
export function formatoFecha(valor) {
  const f = soloFecha(valor)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return valor ?? ''
  const [a, m, d] = f.split('-')
  return `${d}/${m}/${a}`
}

/** Fecha y hora legibles (dd/mm/aaaa hh:mm) para marcas de tiempo ISO. */
export function formatoFechaHora(valor) {
  if (!valor) return ''
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return String(valor)
  return fecha.toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Sí / No para booleanos que llegan como true/false, 1/0 o "true"/"false". */
export function siNo(valor) {
  return valor === true || valor === 1 || valor === '1' || valor === 'true' ? 'Sí' : 'No'
}

// ---------------------------------------------------------------------------
// Contraseñas — misma política que App\Rules\PasswordSegura (backend).
// Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.
// ---------------------------------------------------------------------------

export const PASSWORD_MINIMO = 8
export const PASSWORD_MAXIMO = 100

/**
 * Requisitos de la política, en el orden en que se muestran junto al campo.
 * Cada uno dice si `valor` lo cumple.
 */
export function requisitosPassword(valor) {
  const v = String(valor ?? '')
  return [
    { clave: 'largo', texto: `Al menos ${PASSWORD_MINIMO} caracteres`, cumple: v.length >= PASSWORD_MINIMO },
    { clave: 'mayuscula', texto: 'Una letra mayúscula', cumple: /\p{Lu}/u.test(v) },
    { clave: 'minuscula', texto: 'Una letra minúscula', cumple: /\p{Ll}/u.test(v) },
    { clave: 'numero', texto: 'Un número', cumple: /\d/.test(v) },
    { clave: 'simbolo', texto: 'Un símbolo (por ejemplo ! @ # $ %)', cumple: /[^\p{L}\d\s]/u.test(v) },
  ]
}

/** Mensaje de error de la contraseña, o null si cumple la política. */
export function errorPassword(valor) {
  const v = String(valor ?? '')
  if (v.length > PASSWORD_MAXIMO) return `La contraseña no puede superar los ${PASSWORD_MAXIMO} caracteres.`
  const faltan = requisitosPassword(v).filter((r) => !r.cumple).map((r) => r.texto.charAt(0).toLowerCase() + r.texto.slice(1))
  return faltan.length ? `La contraseña debe tener ${faltan.join(', ')}.` : null
}

/** Valida contraseña y confirmación juntas. Devuelve el primer error o null. */
export function errorPasswordConConfirmacion(password, confirmacion) {
  return errorPassword(password) || (password !== confirmacion ? 'Las contraseñas ingresadas no coinciden.' : null)
}

// ---------------------------------------------------------------------------
// Disciplina y asociación — misma comparación que el backend (sin acentos ni
// mayúsculas). Una asociación sin disciplinas declaradas admite cualquiera.
// ---------------------------------------------------------------------------

export function normalizarTexto(t) {
  return String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

/** ¿La asociación atiende esa disciplina? */
export function asociacionAdmiteDisciplina(asociacion, disciplina) {
  const lista = Array.isArray(asociacion?.disciplinas) ? asociacion.disciplinas.map(normalizarTexto).filter(Boolean) : []
  if (!disciplina || lista.length === 0) return true
  return lista.includes(normalizarTexto(disciplina))
}

/**
 * Mensaje legible de un error de la API. Un 422 de Laravel trae el detalle por
 * campo en `errors`; mostrarlo evita el genérico "(and 2 more errors)" y le
 * dice al usuario qué corregir (obs. 6 de la matriz del 5-11-2026).
 */
export function mensajeDeError(err, porDefecto = 'Ocurrió un error. Intente nuevamente.') {
  const data = err?.response?.data
  const detalle = data?.errors ? [...new Set(Object.values(data.errors).flat())] : []
  if (detalle.length) return detalle.join(' ')
  return data?.error || data?.message || porDefecto
}

/** Hasta cuántos días adelante se reserva un escenario (igual que config/tramites.php del backend). */
export const RESERVA_DIAS_MAX_ANTICIPACION = 90

/** 'YYYY-MM-DD' de hoy + n días, en hora local. */
export function hoyMasDiasISO(dias) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
