<script setup>
// Guía 4 del Centro de Ayuda: Tarifario e ingresos por escenarios, desde el lado del personal.
// Solo la ve quien tiene acceso al Tarifario. La guía 2 cubre la reserva desde el lado del solicitante.

const pestanas = [
  { nombre: 'Calendario de Reservas', para: 'Ver la ocupación de cada escenario, registrar reservas y confirmarlas o liberarlas.' },
  { nombre: 'Cotizador', para: 'Calcular el monto de un uso y emitir la orden de liquidación sin pasar por una reserva.' },
  { nombre: 'Recibos', para: 'Cobrar las liquidaciones pendientes, emitir e imprimir recibos y registrar exenciones.' },
  { nombre: 'Tarifas', para: 'Consultar el catálogo oficial de tarifas por escenario, tipo de usuario y concepto.' },
]

const estadosOrden = [
  { estado: 'PENDIENTE', clase: 'bg-amber-100 text-amber-800', que: 'Calculada y emitida, todavía sin cobrar.' },
  { estado: 'PAGADO', clase: 'bg-emerald-100 text-emerald-800', que: 'Cobrada, con recibo oficial emitido.' },
  { estado: 'EXENTO', clase: 'bg-purple-100 text-purple-800', que: 'No se cobra porque una autoridad autorizó la exención.' },
]

const pasos = [
  {
    id: 'financiero-reservas',
    titulo: 'Consultar la ocupación y registrar una reserva',
    pantalla: 'Tarifario → Calendario de Reservas',
    items: [
      'Elija la disciplina y el espacio. El calendario marca cada día como Libre, Pendiente o Reservado; «Ver Horarios» muestra las franjas de 06:00 a 22:00.',
      'Pulse «+ Solicitar Reserva», o «+ Reservar» en una franja libre, y elija el tipo de solicitante: Particular (tarifa plena; pide nombre, C.I. y celular), Asociación Departamental Afiliada (tarifa formativa) o Club Deportivo Afiliado.',
      'Complete disciplina, fecha, turno (Día 06:00 a 18:00, o Noche 18:00 a 22:00 con recargo CESSA), hora de inicio entre los horarios libres, hora de fin y el concepto de uso.',
      'Revise el monto al pie y pulse «Confirmar Reserva & Liquidación»: se crea la reserva y su orden de liquidación en estado PENDIENTE.',
    ],
    nota: 'Una reserva Pendiente se confirma con «✓ Aprobar» o «✓ Confirmar», y se rechaza con «✕ Liberar» o «✕ Rechazar & Liberar». Una ya aprobada se anula con «Cancelar & Liberar». El sistema pide confirmación antes de cambiar el estado.',
  },
  {
    id: 'financiero-cotizador',
    titulo: 'Cotizar y emitir una orden de liquidación',
    pantalla: 'Tarifario → Cotizador',
    items: [
      'Elija escenario, espacio, tipo de solicitante, concepto de uso y turno, e indique la duración en horas.',
      'Si el concepto se cobra como porcentaje de la taquilla (eventos con venta de entradas), ingrese el monto de taquilla declarado.',
      'Pulse «Calcular Tarifa»: el desglose muestra el subtotal del alquiler, el recargo de iluminación nocturna y el total a cobrar.',
      'Complete el nombre o razón social del solicitante (obligatorio) y su C.I. o NIT, y pulse «Emitir Orden de Liquidación». La orden queda PENDIENTE.',
    ],
  },
  {
    id: 'financiero-cobro',
    titulo: 'Cobrar y emitir el recibo oficial',
    pantalla: 'Tarifario → Recibos → «Cobrar» en una orden PENDIENTE',
    items: [
      'Elija el medio de pago: efectivo en caja, depósito bancario (BNB/Unión) o transferencia electrónica. En los dos últimos anote el número de comprobante.',
      'Marque «Depósito verificado dentro de las 24 horas (SAFCO)» si ya comprobó que el dinero llegó a la cuenta fiscal dentro del plazo.',
      'Pulse «Confirmar Pago & Emitir Recibo». La orden pasa a PAGADO.',
      '«Ver Recibo» muestra el Recibo de Recaudación de Ingresos Propios, y «🖨️ Imprimir Recibo» lo imprime o lo guarda como PDF.',
    ],
    nota: 'Una orden que ya tiene recibo no se puede cobrar dos veces.',
  },
  {
    id: 'financiero-exencion',
    titulo: 'Registrar una exención',
    pantalla: 'Tarifario → Recibos → «Exención» en una orden PENDIENTE',
    items: [
      'Algunos usos están exentos por el artículo 12 de la RAG 011/2024, por ejemplo el fomento al deporte infanto-juvenil o un evento benéfico gubernamental sin fines de lucro.',
      'La exención la recomienda el Director del SEDEDE y la autoriza la Máxima Autoridad Ejecutiva (MAE).',
      'Escriba el motivo justificado y, en «Autorizado por», quién recomendó y quién autorizó. Pulse «Registrar Exención»: la orden pasa a EXENTO y no genera recibo.',
    ],
    nota: 'Guarde el documento de autorización en el archivo físico de la unidad: el sistema registra el motivo y la autoridad, pero todavía no permite adjuntar el respaldo.',
  },
  {
    id: 'financiero-tarifas',
    titulo: 'Leer los indicadores y consultar las tarifas',
    pantalla: 'Tarifario → indicadores superiores y pestaña Tarifas',
    items: [
      'Recaudado (En Rango): lo cobrado en el periodo elegido (Desde/Hasta, Hoy, Este Mes o Todo).',
      'Por Cobrar (Pendientes): lo que suman las órdenes que todavía no tienen recibo.',
      'Depósitos 24h (SAFCO): si los cobros se depositaron dentro del plazo de 24 horas.',
      'En Tarifas, cada recinto muestra su tarifa vigente; «+⚡CESSA» indica recargo nocturno, «🔍 Ver Matriz» muestra todas sus variantes aprobadas y «Cotizar» lo lleva al Cotizador.',
    ],
  },
]

const faq = [
  { p: '¿Por qué el turno noche cuesta más?', r: 'Desde las 18:00 el escenario usa reflectores. Al alquiler se suma el recargo de iluminación nocturna (CESSA); en el turno diurno no se cobra.' },
  { p: '¿Por qué una asociación paga menos que un particular?', r: 'La RAG 011/2024 fija una tarifa formativa subvencionada para asociaciones y clubes afiliados. El sistema aplica la tarifa del tipo de solicitante elegido.' },
  { p: 'El Cotizador dice «No se encontró una tarifa registrada para los criterios seleccionados».', r: 'Esa combinación de escenario, espacio, tipo de usuario, concepto y turno no existe en la resolución. Revise las opciones en Tarifas → «Ver Matriz».' },
  { p: 'No puedo elegir una hora en el formulario de reserva.', r: 'Solo se ofrecen los horarios libres del turno elegido. Si no hay ninguno, pruebe otro turno, otra fecha u otro espacio.' },
  { p: 'No se habilita «Emitir Orden de Liquidación».', r: 'Falta el nombre del solicitante en los datos del Cotizador.' },
  { p: '¿Qué hago si cobré en efectivo?', r: 'Elija «Efectivo en Caja». El dinero tiene que depositarse en la cuenta fiscal del SEDEDE dentro de las 24 horas; marque la casilla SAFCO cuando lo haya verificado.' },
  { p: '¿Se puede anular un recibo?', r: 'No desde esta pantalla. Una orden pagada no admite un segundo cobro ni una exención. Si hubo un error, coordínelo con el encargado contable.' },
]

const glosario = [
  ['RAG CH/N.º 011/2024', 'Resolución administrativa de la Gobernación de Chuquisaca que aprueba las tarifas de los escenarios deportivos.'],
  ['Orden de liquidación', 'Documento que fija cuánto se debe pagar por un uso, con su desglose.'],
  ['Recibo de recaudación', 'Comprobante oficial de que se cobró una orden de liquidación.'],
  ['CESSA', 'Empresa de electricidad de Sucre. El recargo CESSA cubre la iluminación nocturna.'],
  ['SAFCO', 'Ley 1178 de Administración y Control Gubernamentales. Exige depositar lo recaudado en la cuenta fiscal dentro de las 24 horas.'],
  ['MAE', 'Máxima Autoridad Ejecutiva de la entidad. Autoriza las exenciones.'],
  ['Taquilla', 'Lo recaudado por venta de entradas. Algunos conceptos se cobran como porcentaje de la taquilla.'],
]
</script>

<template>
  <section class="space-y-8">
    <!-- Resumen -->
    <div id="financiero-resumen" class="rounded-2xl border border-sky-200 bg-sky-50/70 p-6 shadow-sm space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="space-y-1">
          <span class="inline-block rounded-md bg-sky-700 text-white px-2.5 py-0.5 text-xs font-bold uppercase">
            Ingresos por escenarios
          </span>
          <h2 class="text-xl font-bold text-sky-950 font-display">
            Guía del Tarifario: reservas, liquidaciones, recibos y exenciones
          </h2>
          <p class="text-xs text-sky-900 leading-relaxed max-w-3xl">
            El SEDEDE cobra por el uso de sus escenarios según la tarifa oficial de la RAG CH/N.º 011/2024. El sistema calcula el monto de cada uso, genera la orden de liquidación, registra el cobro y emite el recibo oficial. La guía 2 explica el trámite desde el lado del solicitante; esta, lo que hace el personal del SEDEDE.
          </p>
        </div>
        <router-link
          to="/dashboard/tarifario"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white px-5 py-3 text-xs sm:text-sm font-bold transition shadow-sm shrink-0"
        >
          <span>Ir al Tarifario</span>
          <span>➔</span>
        </router-link>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div v-for="p in pestanas" :key="p.nombre" class="rounded-xl bg-white border border-sky-200 p-3">
          <p class="text-xs font-bold text-sky-950">{{ p.nombre }}</p>
          <p class="text-[11px] text-sky-800 mt-0.5 leading-relaxed">{{ p.para }}</p>
        </div>
      </div>
      <p class="text-[11px] text-sky-900">
        El resto del módulo Financiero (presupuesto, certificaciones, ejecución del gasto, pagos y rendiciones) está en etapa de definición. Por ahora el sistema cubre los ingresos por uso de escenarios.
      </p>
    </div>

    <!-- Flujo -->
    <div id="financiero-flujo" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <h3 class="font-display text-base font-bold text-slate-900 flex items-center gap-2">
        <span>🔄</span>
        <span>Flujo de un ingreso</span>
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
          <span class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold">1</span>
          <p class="font-bold text-xs text-slate-900">Reserva o cotización</p>
          <p class="text-[11px] text-slate-600">Desde el Calendario de Reservas o el Cotizador.</p>
        </div>
        <div class="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-1">
          <span class="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white text-xs font-bold">2</span>
          <p class="font-bold text-xs text-amber-950">Orden de liquidación</p>
          <p class="text-[11px] text-amber-900">Monto calculado con su desglose. Queda PENDIENTE.</p>
        </div>
        <div class="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-1">
          <span class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-white text-xs font-bold">3</span>
          <p class="font-bold text-xs text-emerald-950">Cobro y recibo</p>
          <p class="text-[11px] text-emerald-900">Se emite el recibo oficial. Pasa a PAGADO. O bien, exención autorizada: EXENTO.</p>
        </div>
        <div class="rounded-xl border border-sky-200 bg-sky-50/60 p-3 space-y-1">
          <span class="flex h-6 w-6 items-center justify-center rounded-full bg-sky-700 text-white text-xs font-bold">4</span>
          <p class="font-bold text-xs text-sky-950">Depósito en 24 horas</p>
          <p class="text-[11px] text-sky-900">Lo cobrado se deposita en la cuenta fiscal del SEDEDE (SAFCO).</p>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div v-for="e in estadosOrden" :key="e.estado" class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
          <span class="rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0" :class="e.clase">{{ e.estado }}</span>
          <span class="text-[11px] text-slate-600">{{ e.que }}</span>
        </div>
      </div>
    </div>

    <!-- Paso a paso -->
    <div id="financiero-pasos" class="space-y-6">
      <h3 class="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
        <span>📋</span>
        <span>Instrucciones paso a paso</span>
      </h3>

      <div v-for="(paso, i) in pasos" :id="paso.id" :key="paso.id" class="rounded-2xl border border-slate-200 bg-white p-6">
        <div class="flex items-start gap-4">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-700 text-white font-extrabold text-sm shadow-xs">
            {{ i + 1 }}
          </div>
          <div class="space-y-2 flex-1 min-w-0">
            <h4 class="text-sm font-bold text-slate-900">{{ paso.titulo }}</h4>
            <p class="text-[11px] font-semibold text-sky-800">{{ paso.pantalla }}</p>
            <ul class="list-disc list-inside space-y-1 text-xs text-slate-600 leading-relaxed">
              <li v-for="item in paso.items" :key="item">{{ item }}</li>
            </ul>
            <p v-if="paso.nota" class="rounded-xl bg-sky-50/70 border border-sky-100 p-3 text-xs text-sky-950 leading-relaxed">
              {{ paso.nota }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Preguntas frecuentes -->
    <div id="financiero-faq" class="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <h3 class="font-display text-base font-bold text-slate-900 flex items-center gap-2">
        <span>❓</span>
        <span>Preguntas frecuentes sobre el Tarifario</span>
      </h3>
      <div class="space-y-3 text-xs text-slate-700">
        <details v-for="f in faq" :key="f.p" class="group rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <summary class="font-bold text-slate-800 cursor-pointer flex items-center justify-between gap-3">
            <span>{{ f.p }}</span>
            <span class="group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <p class="mt-2 text-slate-600 leading-relaxed">{{ f.r }}</p>
        </details>
      </div>
    </div>

    <!-- Glosario -->
    <div id="financiero-glosario" class="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
      <h3 class="font-display text-base font-bold text-slate-900 flex items-center gap-2">
        <span>📚</span>
        <span>Glosario</span>
      </h3>
      <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <div v-for="[termino, def] in glosario" :key="termino">
          <dt class="font-bold text-slate-900">{{ termino }}</dt>
          <dd class="text-slate-600">{{ def }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>
