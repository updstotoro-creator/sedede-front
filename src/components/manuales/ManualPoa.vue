<script setup>
// Guía 3 del Centro de Ayuda: Plan Operativo Anual. Solo la ve el personal con acceso al POA.

const niveles = [
  { nombre: 'Programa', que: 'Línea de trabajo de la gestión', ejemplo: '23-02 Deporte competitivo y alto rendimiento' },
  { nombre: 'Proyecto', que: 'Agrupa actividades de un programa', ejemplo: 'Juegos departamentales' },
  { nombre: 'Actividad', que: 'Lo que se va a hacer', ejemplo: '23-02-01 Preparación de deportistas en el Centro de Alto Rendimiento' },
  { nombre: 'Indicador', que: 'Cómo se mide la actividad', ejemplo: 'I-01 Deportistas con plan de preparación individual' },
]

const roles = [
  { rol: 'Coordinador POA', puede: 'Todo: crear planes, formular la estructura, aprobar el plan, registrar techos y avances.' },
  { rol: 'Funcionario técnico SEDEDE', puede: 'Lo mismo que el coordinador POA.' },
  { rol: 'Encargado contable', puede: 'Consultar todas las pantallas. No ve botones de creación ni de edición.' },
]

const flujo = [
  { titulo: 'Crear el plan', donde: 'Planes POA', estado: 'Borrador' },
  { titulo: 'Formular la estructura', donde: 'Estructura POA', estado: 'Borrador' },
  { titulo: 'Definir metas', donde: 'Detalle de actividad', estado: 'Borrador' },
  { titulo: 'Registrar techos', donde: 'Detalle de actividad', estado: 'Borrador' },
  { titulo: 'Aprobar con resolución', donde: 'Planes POA', estado: 'Aprobado' },
  { titulo: 'Registrar avances', donde: 'Detalle de actividad', estado: 'Aprobado' },
  { titulo: 'Dar seguimiento', donde: 'Seguimiento y Dashboard', estado: 'Aprobado' },
  { titulo: 'Reformular si hace falta', donde: 'Detalle de actividad', estado: 'Aprobado' },
]

const estados = [
  { estado: 'Borrador', que: 'En formulación', puede: 'Editar el plan, crear y corregir la estructura, las metas y los techos.' },
  { estado: 'Aprobado', que: 'Vigente, con resolución', puede: 'Registrar avances y techos, y reformular metas con motivo. La estructura ya no admite actividades ni indicadores nuevos.' },
  { estado: 'Cerrado', que: 'Gestión terminada', puede: 'Solo consulta. No admite techos.' },
]

const pasos = [
  {
    titulo: 'Crear el plan',
    pantalla: 'Planes POA → «+ Nuevo plan»',
    items: [
      'Denominación: el nombre del plan, por ejemplo «POA 2027».',
      'Gestión (año): el año que cubre el plan.',
      'Unidad ejecutora: la unidad responsable del plan.',
      'Periodicidad: mensual (12 periodos), trimestral (4) o semestral (2). Define en cuántas partes se reparte cada meta.',
      'Origen: «Formulado en el sistema» si lo arma aquí, o «Importado» si viene de otro registro.',
    ],
    nota: 'El plan queda en Borrador. Solo puede haber un plan por gestión y unidad ejecutora.',
  },
  {
    titulo: 'Formular la estructura',
    pantalla: 'Estructura POA (o «Abrir estructura» en la tarjeta del plan)',
    items: [
      'Pulse «+ Nuevo programa» y complete el código (por ejemplo 23-02), la denominación y el objetivo PTDI al que responde.',
      'En cada fila del árbol aparece el botón del nivel siguiente: «+ Proyecto» en un programa, «+ Actividad» en un proyecto y «+ Indicador» en una actividad.',
      'Para una actividad indique la unidad responsable y el producto esperado.',
      'Para un indicador indique la unidad de medida (eventos, deportistas, porcentaje…), el tipo (proceso, producto o resultado) y, si corresponde, la fórmula de cálculo.',
    ],
    nota: 'La flecha de cada fila abre o cierra sus niveles. No se puede eliminar un elemento que tenga otros colgando de él: primero elimine los de abajo.',
  },
  {
    titulo: 'Definir la meta y su programación',
    pantalla: 'Estructura POA → «Ver» en la actividad',
    items: [
      'En cada indicador pulse «Definir meta» e ingrese la línea base y la meta anual.',
      'En la programación, reparta la meta anual entre los periodos o pulse «Repartir en partes iguales».',
      'La suma de los periodos tiene que ser igual a la meta anual: el sistema muestra «cuadra» o la diferencia que falta.',
    ],
    nota: 'Mientras el plan está en Borrador puede usar «Corregir meta» las veces que necesite.',
  },
  {
    titulo: 'Registrar el techo presupuestario',
    pantalla: 'Detalle de actividad → recuadro «Techo solicitado»',
    items: [
      'Pulse «Registrar techo» e ingrese el monto en bolivianos.',
      'Si la actividad ya tenía techo, el botón dice «Registrar nueva versión»: el monto nuevo se guarda como otra versión y la justificación es obligatoria.',
      'La pantalla «Techos Presupuestarios» lista el techo vigente de cada actividad y el total solicitado del plan.',
    ],
    nota: 'El techo es el monto que se solicita. El monto asignado lo registrará el módulo Financiero.',
  },
  {
    titulo: 'Aprobar el plan',
    pantalla: 'Planes POA → «Aprobar» en la tarjeta del plan',
    items: [
      'Ingrese la resolución de aprobación (por ejemplo RA-001/2026) y la fecha de aprobación, que se propone con el día de hoy y no puede ser posterior.',
      'Pulse «Aprobar POA». El sistema revisa que cada indicador tenga su meta programada y que la programación cuadre.',
      'Si algo falta, muestra la lista de indicadores con problemas y no aprueba. Corríjalos y vuelva a intentarlo.',
    ],
    nota: 'Al aprobar, las actividades pasan a vigentes y la línea base queda congelada: desde ahí las metas solo cambian con una nueva versión y su motivo.',
  },
  {
    titulo: 'Registrar el avance',
    pantalla: 'Detalle de actividad → «+ Registrar avance» en el indicador',
    items: [
      'Elija el periodo (T1, T2…), ingrese el valor ejecutado en la unidad del indicador y escriba qué se hizo y, si hay rezago, por qué.',
      'Adjunte el medio de verificación: actas, planillas, fotografías. PDF, imagen, Excel o Word, hasta 10 MB cada archivo y 5 por avance.',
      'Sin al menos un archivo el avance no se guarda. Solo se registran avances en un plan Aprobado.',
      'Para corregir, registre de nuevo el mismo periodo: se guarda como versión nueva con el motivo de la corrección y la anterior queda como «(reemplazada)».',
    ],
    nota: 'Cada archivo guarda una huella digital (SHA-256). «verificar» comprueba que no se modificó después de subirlo: ✓ íntegro o ✗ alterado.',
  },
  {
    titulo: 'Dar seguimiento',
    pantalla: 'Seguimiento POA y Dashboard POA',
    items: [
      'Seguimiento compara lo ejecutado con lo programado hasta el último periodo cerrado.',
      'Cada programa se abre y se cierra con su cabecera, y cada actividad muestra por indicador lo programado y lo ejecutado en cada periodo.',
      'Pulse un color del recuadro «Actividades» (por ejemplo «1 rezagada») para ver solo esas; púlselo otra vez para quitar el filtro.',
      'El Dashboard resume el plan elegido: programas, proyectos, actividades, indicadores, presupuesto solicitado y cumplimiento a la fecha.',
    ],
    semaforo: true,
  },
  {
    titulo: 'Reformular una meta',
    pantalla: 'Detalle de actividad → «Reformular meta (nueva versión)»',
    items: [
      'Con el plan Aprobado, una meta no se edita: se reformula con la meta nueva y el motivo (por ejemplo «modificación presupuestaria MP-03/2026»).',
      'Ajuste la programación de la nueva versión para que cuadre.',
      'La versión anterior se conserva en «Versiones de la meta» y el cambio queda en la Bitácora.',
    ],
    nota: 'La Bitácora POA registra la creación, aprobación, reformulación y anulación de cada meta, con quién y cuándo. Se filtra por plan, evento o indicador, y no se puede editar ni borrar.',
  },
]

const semaforo = [
  { color: 'En meta', clase: 'bg-emerald-100 text-emerald-700', regla: 'Ejecutó el 90 % o más de lo programado a la fecha.' },
  { color: 'En riesgo', clase: 'bg-amber-100 text-amber-800', regla: 'Entre el 70 % y el 90 %.' },
  { color: 'Rezagada', clase: 'bg-red-100 text-red-700', regla: 'Menos del 70 %.' },
  { color: 'Sin dato', clase: 'bg-slate-100 text-slate-600', regla: 'Todavía no hay avances que medir.' },
]

const faq = [
  { p: 'No veo «+ Nuevo plan», «Editar» ni «Registrar avance».', r: 'Su rol solo tiene permiso de consulta (por ejemplo, Encargado contable). Si necesita formular o registrar avances, pida al administrador que revise su rol.' },
  { p: 'El sistema no me deja aprobar el plan.', r: 'Lea la lista del formulario: indica qué indicadores no tienen meta, no tienen programación o no suman la meta anual. Corrija cada uno en el detalle de su actividad. La resolución también es obligatoria.' },
  { p: 'Me equivoqué en una meta y el plan ya está aprobado.', r: 'Use «Reformular meta (nueva versión)» con su motivo. La meta original no se cambia: así queda la constancia de lo que se aprobó.' },
  { p: 'Me equivoqué en el valor de un avance.', r: 'Registre de nuevo el avance del mismo periodo con el valor correcto y el motivo. El seguimiento usa la última versión.' },
  { p: '¿Por qué el avance me pide un archivo?', r: 'El avance tiene que estar respaldado por un medio de verificación (acta, planilla, fotografía, informe). Es lo que se revisa en una auditoría.' },
  { p: 'Registré un avance del T4 pero no cuenta en el cumplimiento.', r: 'El cumplimiento a la fecha solo mide los periodos ya cerrados. El T4 cuenta cuando termina el año; en la tabla de la actividad el valor sí aparece.' },
  { p: '¿Puedo agregar una actividad o un indicador con el plan aprobado?', r: 'No. La estructura de un plan aprobado está cerrada. Consulte a Planificación sobre una reformulación formal.' },
  { p: '¿El techo es el presupuesto asignado?', r: 'No. Es el monto solicitado para la actividad. La asignación y la ejecución del gasto corresponden al módulo Financiero.' },
  { p: '¿Qué pasa con una actividad anulada?', r: 'No admite avances y no cuenta para el cumplimiento del plan. Se sigue viendo, con un aviso en rojo, para que quede la constancia.' },
]

const glosario = [
  ['POA', 'Plan Operativo Anual. Programa el trabajo y el presupuesto de una gestión.'],
  ['Gestión', 'El año fiscal que cubre el plan.'],
  ['PTDI', 'Plan Territorial de Desarrollo Integral del departamento. Cada programa responde a uno de sus objetivos.'],
  ['Línea base', 'El valor del indicador al empezar la gestión.'],
  ['Meta anual', 'El valor que se compromete a alcanzar en la gestión.'],
  ['Programación', 'Cómo se reparte la meta anual entre los periodos.'],
  ['Techo presupuestario', 'El monto en bolivianos que se solicita para una actividad.'],
  ['Medio de verificación', 'El documento que respalda un avance.'],
  ['Reformulación', 'Cambio de una meta ya aprobada, registrado como nueva versión con su motivo.'],
]
</script>

<template>
  <section class="space-y-8">
    <!-- Resumen -->
    <div id="poa-resumen" class="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-6 shadow-sm space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="space-y-1">
          <span class="inline-block rounded-md bg-indigo-600 text-white px-2.5 py-0.5 text-xs font-bold uppercase">
            Plan Operativo Anual
          </span>
          <h2 class="text-xl font-bold text-indigo-950 font-display">
            Guía para formular, aprobar y dar seguimiento al POA
          </h2>
          <p class="text-xs text-indigo-900 leading-relaxed max-w-3xl">
            El POA es el compromiso de trabajo del SEDEDE para una gestión: qué actividades se harán, cuánto se espera lograr en cada una y cuánto presupuesto se solicita. El sistema controla que el plan esté completo antes de aprobarlo y, durante el año, compara lo ejecutado con lo programado.
          </p>
        </div>
        <router-link
          to="/dashboard/poa/dashboard"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-3 text-xs sm:text-sm font-bold transition shadow-sm shrink-0"
        >
          <span>Ir al POA</span>
          <span>➔</span>
        </router-link>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div v-for="(n, i) in niveles" :key="n.nombre" class="rounded-xl bg-white border border-indigo-200 p-3">
          <p class="text-xs font-bold text-indigo-950">{{ i + 1 }}. {{ n.nombre }}</p>
          <p class="text-[11px] text-indigo-800 mt-0.5">{{ n.que }}</p>
          <p class="text-[11px] text-slate-500 mt-1 italic">{{ n.ejemplo }}</p>
        </div>
      </div>
      <p class="text-xs text-indigo-900 leading-relaxed">
        Cada indicador tiene una <strong>meta anual</strong>, una <strong>línea base</strong> (de dónde se parte) y una <strong>programación</strong> que reparte la meta entre los periodos del año.
      </p>
    </div>

    <!-- Roles -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
      <h3 class="font-display text-base font-bold text-slate-900 flex items-center gap-2">
        <span>👥</span>
        <span>Quién usa este módulo</span>
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div v-for="r in roles" :key="r.rol" class="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <p class="text-xs font-bold text-slate-900">{{ r.rol }}</p>
          <p class="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{{ r.puede }}</p>
        </div>
      </div>
      <p class="text-[11px] text-slate-500">Si una pantalla no muestra un botón que esta guía menciona, su cuenta no tiene ese permiso.</p>
    </div>

    <!-- Flujo -->
    <div id="poa-flujo" class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <h3 class="font-display text-base font-bold text-slate-900 flex items-center gap-2">
        <span>🔄</span>
        <span>Flujo del POA en la gestión</span>
      </h3>
      <ol class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <li
          v-for="(f, i) in flujo"
          :key="f.titulo"
          class="rounded-xl border p-3 space-y-1"
          :class="f.estado === 'Borrador' ? 'border-slate-200 bg-slate-50' : 'border-indigo-200 bg-indigo-50/60'"
        >
          <span class="flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold" :class="f.estado === 'Borrador' ? 'bg-slate-900' : 'bg-indigo-700'">{{ i + 1 }}</span>
          <p class="font-bold text-xs text-slate-900">{{ f.titulo }}</p>
          <p class="text-[11px] text-slate-600">{{ f.donde }}</p>
          <span class="inline-block rounded px-2 py-0.5 text-[10px] font-bold" :class="f.estado === 'Borrador' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'">
            Plan: {{ f.estado }}
          </span>
        </li>
      </ol>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[480px] text-xs">
          <thead>
            <tr class="text-left text-slate-500">
              <th class="py-1.5 pr-3 font-semibold">Estado del plan</th>
              <th class="py-1.5 pr-3 font-semibold">Qué significa</th>
              <th class="py-1.5 font-semibold">Qué se puede hacer</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr v-for="e in estados" :key="e.estado">
              <td class="py-2 pr-3 font-bold text-slate-900">{{ e.estado }}</td>
              <td class="py-2 pr-3">{{ e.que }}</td>
              <td class="py-2">{{ e.puede }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Paso a paso -->
    <div id="poa-pasos" class="space-y-6">
      <h3 class="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
        <span>📋</span>
        <span>Instrucciones paso a paso</span>
      </h3>

      <div v-for="(paso, i) in pasos" :key="paso.titulo" class="rounded-2xl border border-slate-200 bg-white p-6">
        <div class="flex items-start gap-4">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-extrabold text-sm shadow-xs">
            {{ i + 1 }}
          </div>
          <div class="space-y-2 flex-1 min-w-0">
            <h4 class="text-sm font-bold text-slate-900">{{ paso.titulo }}</h4>
            <p class="text-[11px] font-semibold text-indigo-700">{{ paso.pantalla }}</p>
            <ul class="list-disc list-inside space-y-1 text-xs text-slate-600 leading-relaxed">
              <li v-for="item in paso.items" :key="item">{{ item }}</li>
            </ul>
            <div v-if="paso.semaforo" class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div v-for="s in semaforo" :key="s.color" class="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0" :class="s.clase">{{ s.color }}</span>
                <span class="text-[11px] text-slate-600">{{ s.regla }}</span>
              </div>
              <p class="sm:col-span-2 text-[11px] text-slate-500">Para promediar, cada indicador cuenta como máximo 100 %: uno que se pasó de su meta no tapa a otro atrasado.</p>
            </div>
            <p v-if="paso.nota" class="rounded-xl bg-indigo-50/60 border border-indigo-100 p-3 text-xs text-indigo-950 leading-relaxed">
              {{ paso.nota }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Preguntas frecuentes -->
    <div id="poa-faq" class="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <h3 class="font-display text-base font-bold text-slate-900 flex items-center gap-2">
        <span>❓</span>
        <span>Preguntas frecuentes sobre el POA</span>
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
    <div id="poa-glosario" class="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
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
