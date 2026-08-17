<script setup>
const news = [
  { img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop', title: 'Noticias y actualizaciones del deporte chuquisaqueño' },
  { img: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=600&auto=format&fit=crop', title: 'Avances en infraestructura deportiva del departamento' },
  { img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop', title: 'Resultados de la última fecha de actividades formativas' },
]
</script>

<template>
  <section id="noticias" class="bg-brand-50/60 px-6 py-20">
    <div class="mx-auto max-w-7xl">
      <h2 class="mb-10 font-display text-3xl font-bold text-brand-700">Noticias y Actualizaciones</h2>
      <div class="grid gap-6 md:grid-cols-3">
        <article v-for="item in news" :key="item.title" class="overflow-hidden rounded-lg bg-white shadow-sm">
          <img :src="item.img" :alt="item.title" class="h-40 w-full object-cover" />
          <p class="p-4 text-sm font-semibold leading-snug text-ink">{{ item.title }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
