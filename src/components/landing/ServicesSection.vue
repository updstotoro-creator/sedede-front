<script setup>
const services = [
  {
    code: 'EXP',
    title: 'Registro de expedientes',
    description: 'Presenta y da seguimiento a solicitudes ante el SEDEDE de forma digital, sin filas.',
  },
  {
    code: 'PRG',
    title: 'Programas de desarrollo',
    description: 'Consulta convocatorias y programas vigentes de fomento productivo departamental.',
  },
  {
    code: 'DOC',
    title: 'Emisión de documentos',
    description: 'Obtén certificados y constancias oficiales validadas digitalmente.',
  },
]
</script>

<template>
  <section id="servicios" class="mx-auto max-w-7xl px-6 py-24">
    <div class="mb-14 max-w-2xl">
      <p class="font-mono text-xs uppercase tracking-widest text-teal-600">Servicios</p>
      <h2 class="mt-2 font-display text-3xl font-bold text-navy-900">
        Lo que puedes gestionar en línea
      </h2>
    </div>

    <div class="grid gap-8 md:grid-cols-3">
      <article
        v-for="service in services"
        :key="service.code"
        class="rounded-lg border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
      >
        <span class="font-mono text-xs font-semibold text-gold-600">{{ service.code }}</span>
        <h3 class="mt-3 font-display text-lg font-bold text-navy-900">{{ service.title }}</h3>
        <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ service.description }}</p>
      </article>
    </div>
  </section>
</template>
