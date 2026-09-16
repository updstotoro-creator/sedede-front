<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAsociacionesStore } from '../stores/asociaciones'

const route = useRoute()
const router = useRouter()
const store = useAsociacionesStore()

const asociacion = computed(() => store.getAsociacion(route.params.asociacionId))

// Modal editar datos de la asociación
const showAsociacionModal = ref(false)
const asociacionForm = reactive({ nombre: '', disciplina: '', presidente: '' })

function openEditAsociacion() {
  asociacionForm.nombre = asociacion.value.nombre
  asociacionForm.disciplina = asociacion.value.disciplina
  asociacionForm.presidente = asociacion.value.presidente
  showAsociacionModal.value = true
}
function submitAsociacionForm() {
  store.updateAsociacion(asociacion.value.id, { ...asociacionForm })
  showAsociacionModal.value = false
}

// Modal crear/editar club
const showClubModal = ref(false)
const editingClub = ref(null)
const clubForm = reactive({ nombre: '', entrenador: '' })

function openCreateClub() {
  editingClub.value = null
  clubForm.nombre = ''
  clubForm.entrenador = ''
  showClubModal.value = true
}
function openEditClub(club) {
  editingClub.value = club
  clubForm.nombre = club.nombre
  clubForm.entrenador = club.entrenador
  showClubModal.value = true
}
function closeClubModal() {
  showClubModal.value = false
  editingClub.value = null
}
function submitClubForm() {
  if (editingClub.value) {
    store.updateClub(asociacion.value.id, editingClub.value.id, { ...clubForm })
  } else {
    store.addClub(asociacion.value.id, { ...clubForm })
  }
  closeClubModal()
}

function verDeportistas(club) {
  router.push(`/dashboard/asociaciones/${asociacion.value.id}/clubes/${club.id}`)
}
</script>

<template>
  <section v-if="asociacion">
    <nav class="mb-4 flex items-center gap-2 text-sm text-slate-500">
      <router-link to="/dashboard/asociaciones" class="hover:text-brand-600 hover:underline">Asociaciones</router-link>
      <span>/</span>
      <span class="font-semibold text-ink">{{ asociacion.nombre }}</span>
    </nav>

    <div class="mb-6 flex items-start justify-between rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-brand-600">{{ asociacion.disciplina }}</p>
        <h2 class="mt-1 font-display text-lg font-bold text-ink">{{ asociacion.nombre }}</h2>
        <p class="mt-1 text-sm text-slate-500">Presidente: {{ asociacion.presidente }}</p>
        <span class="mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold" :class="asociacion.activo ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'">
          {{ asociacion.activo ? 'Activa' : 'Inactiva' }}
        </span>
      </div>
      <div class="flex shrink-0 gap-3">
        <button class="text-xs font-semibold text-slate-500 hover:underline" @click="openEditAsociacion">Editar</button>
        <button
          class="text-xs font-semibold hover:underline"
          :class="asociacion.activo ? 'text-red-600' : 'text-teal-700'"
          @click="store.toggleAsociacionActivo(asociacion.id)"
        >
          {{ asociacion.activo ? 'Inactivar' : 'Activar' }}
        </button>
      </div>
    </div>

    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Clubes afiliados</h3>
      <button class="btn-primary" @click="openCreateClub">+ Nuevo club</button>
    </div>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Club</th>
            <th class="px-4 py-3">Entrenador</th>
            <th class="px-4 py-3">Deportistas</th>
            <th class="px-4 py-3">Estado</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="club in asociacion.clubes" :key="club.id">
            <td class="px-4 py-3 font-medium text-ink">{{ club.nombre }}</td>
            <td class="px-4 py-3 text-slate-600">{{ club.entrenador }}</td>
            <td class="px-4 py-3 text-slate-600">{{ club.deportistas.length }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="club.activo ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'">
                {{ club.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button class="mr-3 text-xs font-semibold text-brand-600 hover:underline" @click="verDeportistas(club)">Ver deportistas</button>
              <button class="mr-3 text-xs font-semibold text-slate-500 hover:underline" @click="openEditClub(club)">Editar</button>
              <button
                class="text-xs font-semibold hover:underline"
                :class="club.activo ? 'text-red-600' : 'text-teal-700'"
                @click="store.toggleClubActivo(asociacion.id, club.id)"
              >
                {{ club.activo ? 'Inactivar' : 'Activar' }}
              </button>
            </td>
          </tr>
          <tr v-if="!asociacion.clubes.length">
            <td colspan="5" class="px-4 py-8 text-center text-slate-400">Esta asociación aún no tiene clubes registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal editar asociación -->
    <div v-if="showAsociacionModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">Editar asociación</h3>
        <form novalidate class="space-y-4" @submit.prevent="submitAsociacionForm">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Nombre</label>
            <input v-model="asociacionForm.nombre" type="text" class="input-field" required />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Disciplina</label>
            <input v-model="asociacionForm.disciplina" type="text" class="input-field" required />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-600">Presidente</label>
            <input v-model="asociacionForm.presidente" type="text" class="input-field" required />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500" @click="showAsociacionModal = false">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal crear/editar club -->
    <div v-if="showClubModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 font-display text-lg font-bold text-ink">{{ editingClub ? 'Editar club' : 'Nuevo club' }}</h3>
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
            <button type="button" class="px-4 py-2 text-sm font-semibold text-slate-500" @click="closeClubModal">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </section>

  <p v-else class="text-sm text-slate-500">Asociación no encontrada.</p>
</template>
