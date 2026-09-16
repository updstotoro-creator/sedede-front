<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAsociacionesStore } from '../stores/asociaciones'

const route = useRoute()
const store = useAsociacionesStore()

const asociacion = computed(() => store.getAsociacion(route.params.asociacionId))
const club = computed(() => store.getClub(route.params.asociacionId, route.params.clubId))

// Modal editar datos del club
const showClubModal = ref(false)
const clubForm = reactive({ nombre: '', entrenador: '' })

function openEditClub() {
  clubForm.nombre = club.value.nombre
  clubForm.entrenador = club.value.entrenador
  showClubModal.value = true
}
function submitClubForm() {
  store.updateClub(asociacion.value.id, club.value.id, { ...clubForm })
  showClubModal.value = false
}

// Modal crear/editar deportista
const showDeportistaModal = ref(false)
const editingDeportista = ref(null)
const deportistaForm = reactive({ nombre: '', edad: '', categoria: '' })

function openCreateDeportista() {
  editingDeportista.value = null
  deportistaForm.nombre = ''
  deportistaForm.edad = ''
  deportistaForm.categoria = ''
  showDeportistaModal.value = true
}
function openEditDeportista(deportista) {
  editingDeportista.value = deportista
  deportistaForm.nombre = deportista.nombre
  deportistaForm.edad = deportista.edad
  deportistaForm.categoria = deportista.categoria
  showDeportistaModal.value = true
}
function closeDeportistaModal() {
  showDeportistaModal.value = false
  editingDeportista.value = null
}
function submitDeportistaForm() {
  const payload = { ...deportistaForm, edad: Number(deportistaForm.edad) }
  if (editingDeportista.value) {
    store.updateDeportista(asociacion.value.id, club.value.id, editingDeportista.value.id, payload)
  } else {
    store.addDeportista(asociacion.value.id, club.value.id, payload)
  }
  closeDeportistaModal()
}
</script>

<template>
  <section v-if="asociacion && club">
    <nav class="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
      <router-link to="/dashboard/asociaciones" class="hover:text-brand-600 hover:underline">Asociaciones</router-link>
      <span>/</span>
      <router-link :to="`/dashboard/asociaciones/${asociacion.id}`" class="hover:text-brand-600 hover:underline">{{ asociacion.nombre }}</router-link>
      <span>/</span>
      <span class="font-semibold text-ink">{{ club.nombre }}</span>
    </nav>

    <div class="mb-6 flex items-start justify-between rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-brand-600">Club</p>
        <h2 class="mt-1 font-display text-lg font-bold text-ink">{{ club.nombre }}</h2>
        <p class="mt-1 text-sm text-slate-500">Entrenador: {{ club.entrenador }}</p>
        <span class="mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold" :class="club.activo ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'">
          {{ club.activo ? 'Activo' : 'Inactivo' }}
        </span>
      </div>
      <div class="flex shrink-0 gap-3">
        <button class="text-xs font-semibold text-slate-500 hover:underline" @click="openEditClub">Editar</button>
        <button
          class="text-xs font-semibold hover:underline"
          :class="club.activo ? 'text-red-600' : 'text-teal-700'"
          @click="store.toggleClubActivo(asociacion.id, club.id)"
        >
          {{ club.activo ? 'Inactivar' : 'Activar' }}
        </button>
      </div>
    </div>

    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Deportistas registrados</h3>
      <button class="btn-primary" @click="openCreateDeportista">+ Nuevo deportista</button>
    </div>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Nombre</th>
            <th class="px-4 py-3">Edad</th>
            <th class="px-4 py-3">Categoría</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="deportista in club.deportistas" :key="deportista.id">
            <td class="px-4 py-3 font-medium text-ink">{{ deportista.nombre }}</td>
            <td class="px-4 py-3 text-slate-600">{{ deportista.edad }}</td>
            <td class="px-4 py-3 text-slate-600">{{ deportista.categoria }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="deportista.activo ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'">
                {{ deportista.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button class="mr-3 text-xs font-semibold text-slate-500 hover:underline" @click="openEditDeportista(deportista)">Editar</button>
              <button
                class="text-xs font-semibold hover:underline"
                :class="deportista.activo ? 'text-red-600' : 'text-teal-700'"
                @click="store.toggleDeportistaActivo(asociacion.id, club.id, deportista.id)"
              >
                {{ deportista.activo ? 'Inactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
          <tr v-if="!club.deportistas.length">
            <td colspan="5" class="px-4 py-8 text-center text-slate-400">Este club aún no tiene deportistas registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal editar club -->
    <div v-if="showClubModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">Editar club</h3>
        <form novalidate class="space-y-4" @submit.prevent="submitClubForm">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre del club</label>
            <input v-model="clubForm.nombre" type="text" class="input-field" required />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Entrenador</label>
            <input v-model="clubForm.entrenador" type="text" class="input-field" required />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500" @click="showClubModal = false">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal crear/editar deportista -->
    <div v-if="showDeportistaModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">{{ editingDeportista ? 'Editar deportista' : 'Nuevo deportista' }}</h3>
        <form novalidate class="space-y-4" @submit.prevent="submitDeportistaForm">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre</label>
            <input v-model="deportistaForm.nombre" type="text" class="input-field" required />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Edad</label>
            <input v-model="deportistaForm.edad" type="number" min="1" class="input-field" required />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Categoría</label>
            <input v-model="deportistaForm.categoria" type="text" placeholder="Formativo, Juvenil, Alto Rendimiento…" class="input-field" required />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500" @click="closeDeportistaModal">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </section>

  <p v-else class="text-sm text-slate-500">Club no encontrado.</p>
</template>

