<script setup>
import { ref, onMounted } from 'vue';
import clubesService from '@/services/clubesService';

const props = defineProps({
  asociacionId: {
    type: [Number, String],
    required: true
  }
});

const clubes = ref([]);
const loading = ref(false);
const errorMsg = ref(null);

// Control de modales y formulario
const showModal = ref(false);
const editMode = ref(false);
const clubSeleccionadoId = ref(null);
const formError = ref(null);

const form = ref({
  nombre: '',
  presidente: '',
  telefono: '',
  email: ''
});

// Cargar listado
const cargarClubes = async () => {
  loading.value = true;
  errorMsg.value = null;
  try {
    clubes.value = await clubesService.listar(props.asociacionId);
  } catch (err) {
    errorMsg.value = 'No se pudieron cargar los clubes afiliados.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Abrir modal para crear
const abrirModalCrear = () => {
  editMode.value = false;
  clubSeleccionadoId.value = null;
  form.value = { nombre: '', presidente: '', telefono: '', email: '' };
  formError.value = null;
  showModal.value = true;
};

// Abrir modal para editar
const abrirModalEditar = (club) => {
  editMode.value = true;
  clubSeleccionadoId.value = club.id;
  form.value = {
    nombre: club.nombre,
    presidente: club.presidente || '',
    telefono: club.telefono || '',
    email: club.email || ''
  };
  formError.value = null;
  showModal.value = true;
};

// Guardar (Crear o Actualizar)
const guardarClub = async () => {
  formError.value = null;
  try {
    if (editMode.value) {
      await clubesService.actualizar(props.asociacionId, clubSeleccionadoId.value, form.value);
    } else {
      await clubesService.crear(props.asociacionId, form.value);
    }
    showModal.value = false;
    await cargarClubes();
  } catch (err) {
    formError.value = err.response?.data?.message || 'Error al guardar el club.';
  }
};

// Baja lógica (Inactivar)
const inactivarClub = async (clubId) => {
  if (!confirm('¿Está seguro de inactivar este club?')) return;
  try {
    await clubesService.inactivar(props.asociacionId, clubId);
    await cargarClubes();
  } catch (err) {
    alert(err.response?.data?.message || 'Error al inactivar el club.');
  }
};

// Reactivar
const reactivarClub = async (clubId) => {
  try {
    await clubesService.reactivar(props.asociacionId, clubId);
    await cargarClubes();
  } catch (err) {
    alert(err.response?.data?.message || 'Error al reactivar el club.');
  }
};

onMounted(() => {
  cargarClubes();
});
</script>

<template>
  <div class="p-6 bg-white rounded-lg shadow-md">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-lg font-semibold text-gray-800">Clubes Afiliados</h3>
      <button 
        @click="abrirModalCrear"
        class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow"
      >
        + Registrar Club
      </button>
    </div>

    <!-- Estados globales -->
    <div v-if="loading" class="text-center py-4 text-gray-500">Cargando clubes...</div>
    <div v-if="errorMsg" class="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm" role="alert">{{ errorMsg }}</div>

    <!-- Tabla -->
    <div v-if="!loading" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Club</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presidente</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="club in clubes" :key="club.id" :class="{ 'opacity-50 bg-gray-50': !club.activo }">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ club.nombre }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ club.presidente || 'No registrado' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ club.telefono || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="{
                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                'bg-green-100 text-green-800': club.activo,
                'bg-red-100 text-red-800': !club.activo
              }">
                {{ club.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
              <button 
                @click="abrirModalEditar(club)" 
                class="text-brand-600 hover:underline"
              >
                Editar
              </button>
              <button 
                v-if="club.activo"
                @click="inactivarClub(club.id)" 
                class="text-red-600 hover:underline"
              >
                Inactivar
              </button>
              <button 
                v-else
                @click="reactivarClub(club.id)" 
                class="text-green-600 hover:underline"
              >
                Reactivar
              </button>
            </td>
          </tr>
          <tr v-if="clubes.length === 0">
            <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">No hay clubes afiliados registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL CREAR / EDITAR CLUB -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h3 class="text-lg font-bold mb-4 text-gray-800">
          {{ editMode ? 'Editar Club Afiliado' : 'Registrar Nuevo Club' }}
        </h3>
        
        <div v-if="formError" class="bg-red-100 text-red-700 p-2 rounded mb-4 text-xs" role="alert">
          {{ formError }}
        </div>

        <form @submit.prevent="guardarClub" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Club</label>
            <input v-model="form.nombre" type="text" required class="input-field w-full" placeholder="Ej. Club Deportivo Sucre" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Presidente / Representante</label>
            <input v-model="form.presidente" type="text" class="input-field w-full" placeholder="Nombre completo" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono de Contacto</label>
            <input v-model="form.telefono" type="text" class="input-field w-full" placeholder="Ej. 70123456" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input v-model="form.email" type="email" class="input-field w-full" placeholder="club@correo.com" />
          </div>
          <div class="flex justify-end space-x-2 pt-4">
            <button type="button" @click="showModal = false" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition">Cancelar</button>
            <button type="submit" class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium transition">
              {{ editMode ? 'Actualizar' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>