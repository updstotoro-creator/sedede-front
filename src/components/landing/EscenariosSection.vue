<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { escenariosDestacados } from '../../data/escenariosPublicos'

defineProps({
  escenarios: { type: Array, default: () => escenariosDestacados },
})

// Carga automática de las fotos: src/assets/images/escenarios/<imagen>.jpg|png|webp
const modulos = import.meta.glob('../../assets/images/escenarios/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
})
const fotos = {}
for (const ruta in modulos) {
  const nombre = ruta.split('/').pop().replace(/\.[^.]+$/, '')
  fotos[nombre] = modulos[ruta]
}
const fotoDe = (e) => fotos[e.imagen] ?? null

// Carrusel
const pista = ref(null)
const alInicio = ref(true)
const alFinal = ref(false)

function actualizar() {
  const el = pista.value
  if (!el) return
  alInicio.value = el.scrollLeft <= 4
  alFinal.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
}
function mover(dir) {
  const el = pista.value
  if (!el) return
  el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
}
onMounted(() => {
  actualizar()
  window.addEventListener('resize', actualizar)
})
onBeforeUnmount(() => window.removeEventListener('resize', actualizar))
</script>

<template>
  <section id="escenarios" class="bg-paper py-16 md:py-20">
    <div class="mx-auto max-w-6xl px-6">
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-widest text-brand-600">Instalaciones</p>
          <h2 class="mt-2 font-display text-3xl font-extrabold text-ink md:text-4xl">
            Escenarios deportivos del SEDEDE
          </h2>
          <p class="mt-3 max-w-2xl text-slate-600">
            Los escenarios que el Servicio Departamental de Deportes de Chuquisaca tiene a su custodia.
          </p>
        </div>

        <div class="hidden shrink-0 gap-2 sm:flex">
          <button
            type="button"
            aria-label="Anterior"
            :disabled="alInicio"
            class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-lg text-slate-700 transition hover:border-brand-500 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            @click="mover(-1)"
          >‹</button>
          <button
            type="button"
            aria-label="Siguiente"
            :disabled="alFinal"
            class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-lg text-slate-700 transition hover:border-brand-500 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            @click="mover(1)"
          >›</button>
        </div>
      </div>

      <ul
        ref="pista"
        tabindex="0"
        aria-label="Escenarios deportivos"
        class="-mx-6 mt-10 flex scroll-pl-6 snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0 md:scroll-pl-0"
        @scroll.passive="actualizar"
      >
        <li
          v-for="e in escenarios"
          :key="e.id"
          class="w-[82%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]"
        >
          <article class="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <div class="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-brand-700 to-brand-500">
              <img
                v-if="fotoDe(e)"
                :src="fotoDe(e)"
                :alt="e.nombre"
                loading="lazy"
                class="h-full w-full object-cover"
              />
              <div v-else class="flex h-full items-end p-5">
                <p class="text-[11px] font-semibold uppercase tracking-wider text-white/70">Escenario deportivo</p>
              </div>
            </div>
            <div class="px-5 py-4">
              <h3 class="font-display text-base font-extrabold leading-snug text-ink">{{ e.nombre }}</h3>
              <p class="mt-1 text-sm leading-relaxed text-slate-500">{{ e.detalle }}</p>
            </div>
          </article>
        </li>
      </ul>
    </div>
  </section>
</template>
