<script setup>
const events = [
  { date: '20 Mar 2026', title: 'Torneo Departamental de Atletismo Formativo', location: 'Estadio Patria, Sucre' },
  { date: '02 Abr 2026', title: 'Copa Chuquisaca de Voleibol Juvenil', location: 'Coliseo Cerrado, Sucre' },
  { date: '29 Abr 2026', title: 'Encuentro Deportivo Intercolegial', location: 'Complejo Deportivo Municipal' },
]
</script>

<template>
  <section id="eventos" class="mx-auto max-w-7xl px-6 py-20">
    <h2 class="mb-10 font-display text-3xl font-bold text-brand-700">Calendario de Eventos Destacados</h2>
    <ul class="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      <li v-for="event in events" :key="event.title" class="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:gap-6">
        <span class="w-32 shrink-0 font-mono text-xs font-semibold text-brand-600">{{ event.date }}</span>
        <div>
          <p class="font-semibold text-ink">{{ event.title }}</p>
          <p class="text-sm text-slate-500">{{ event.location }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>
