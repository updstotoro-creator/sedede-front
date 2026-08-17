<script setup>
const areas = [
  {
    title: 'Deporte Formativo',
    description: 'Programas para niños y jóvenes que inician su formación deportiva en el departamento.',
  },
  {
    title: 'Alto Rendimiento',
    description: 'Acompañamiento a deportistas de alto nivel que representan a Chuquisaca.',
  },
  {
    title: 'Infraestructura Deportiva',
    description: 'Mantenimiento y habilitación de espacios deportivos para toda la comunidad.',
  },
]
</script>

<template>
  <section id="areas" class="bg-brand-50/60 px-6 py-20">
    <div class="mx-auto max-w-7xl">
      <h2 class="mb-10 font-display text-3xl font-bold text-brand-700">Áreas de Enfoque</h2>
      <div class="grid gap-6 md:grid-cols-3">
        <article
          v-for="area in areas"
          :key="area.title"
          class="rounded-lg border border-brand-100 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <h3 class="font-display text-lg font-bold text-ink">{{ area.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ area.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
