<script setup>
import { ref, onMounted } from 'vue';
import aportesService from '@/services/aportesService';

const props = defineProps({
  asociacionId: {
    type: [Number, String],
    required: true
  }
});

const aportes = ref([]);
const loading = ref(false);
const errorMsg = ref(null);

// Control de modales y errores específicos de formulario
const showCreateModal = ref(false);
const showExecuteModal = ref(false);
const aporteSeleccionado = ref(null);
const formError = ref(null);

const formCrear = ref({
  concepto: '',
  mes_anio: '',
  monto_programado: ''
});

const formEjecutar = ref({
  monto_ejecutado: '',
  comprobante_numero: ''
});

// Cargar datos
const cargarAportes = async () => {
  loading.value = true;
  errorMsg.value = null;
  try {
    aportes.value = await aportesService.listar(props.asociacionId);
  } catch (err) {
    errorMsg.value = 'No se pudieron cargar los aportes de la asociación.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Registrar Aporte Programado (POST)
const registrarAporte = async () => {
  formError.value = null;
  try {
    await aportesService.crear(props.asociacionId, formCrear.value);
    showCreateModal.value = false;
    formCrear.value = { concepto: '', mes_anio: '', monto_programado: '' };
    await cargarAportes();
  } catch (err) {
    formError.value = err.response?.data?.message || 'Error al registrar el aporte programado.';
  }
};

// Abrir modal de ejecución
const abrirModalEjecucion = (aporte) => {
  aporteSeleccionado.value = aporte;
  formEjecutar.value = {
    monto_ejecutado: aporte.monto_ejecutado || aporte.monto_programado,
    comprobante_numero: aporte.comprobante_numero || ''
  };
  formError.value = null;
  showExecuteModal.value = true;
};

// Reportar Ejecución (PUT)
const guardarEjecucion = async () => {
  if (!aporteSeleccionado.value) return;
  formError.value = null;
  try {
    await aportesService.reportarEjecucion(
      props.asociacionId,
      aporteSeleccionado.value.id,
      formEjecutar.value
    );
    showExecuteModal.value = false;
    aporteSeleccionado.value = null;
    await cargarAportes();
  } catch (err) {
    formError.value = err.response?.data?.message || 'Error al reportar la ejecución.';
  }
};

// Baja lógica (Inactivar)
const inactivarAporte = async (aporteId) => {
  if (!confirm('¿Está seguro de inactivar este aporte?')) return;
  try {
    await aportesService.inactivar(props.asociacionId, aporteId);
    await cargarAportes();
  } catch (err) {
    alert(err.response?.data?.message || 'Error al inactivar el registro.');
  }
};

onMounted(() => {
  cargarAportes();
});
</script>

<template>
  <div class="p-6 bg-white rounded-lg shadow-md">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-lg font-semibold text-gray-800">Aportes y Compromisos de la Asociación</h3>
      <button 
        @click="showCreateModal = true"
        class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow"
      >
        + Registrar Aporte Programado
      </button>
    </div>

    <!-- Estados globales de carga / error -->
    <div v-if="loading" class="text-center py-4 text-gray-500">Cargando aportes...</div>
    <div v-if="errorMsg" class="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm" role="alert">{{ errorMsg }}</div>

    <!-- Tabla de Aportes -->
    <div v-if="!loading" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mes / Año</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programado (Bs)</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ejecutado (Bs)</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="aporte in aportes" :key="aporte.id" :class="{ 'opacity-50 bg-gray-50': !aporte.activo }">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ aporte.concepto }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ aporte.mes_anio }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{{ aporte.monto_programado }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ aporte.monto_ejecutado || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="{
                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                'bg-yellow-100 text-yellow-800': aporte.status === 'Pendiente',
                'bg-green-100 text-green-800': aporte.status === 'Ejecutado' || aporte.status === 'Completado',
                'bg-red-100 text-red-800': aporte.status === 'Vencido'
              }">
                {{ aporte.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
              <button 
                @click="abrirModalEjecucion(aporte)" 
                class="text-brand-600 hover:underline"
              >
                Reportar Ejecución
              </button>
              <button 
                v-if="aporte.activo"
                @click="inactivarAporte(aporte.id)" 
                class="text-red-600 hover:underline"
              >
                Inactivar
              </button>
            </td>
          </tr>
          <tr v-if="aportes.length === 0">
            <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">No hay aportes registrados para esta asociación.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL CREAR APORTE PROGRAMADO -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h3 class="text-lg font-bold mb-4 text-gray-800">Registrar Aporte Programado</h3>
        
        <div v-if="formError" class="bg-red-100 text-red-700 p-2 rounded mb-4 text-xs" role="alert">
          {{ formError }}
        </div>

        <form @submit.prevent="registrarAporte" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
            <input v-model="formCrear.concepto" type="text" required class="input-field w-full" placeholder="Ej. Aporte gestión ordinaria" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mes / Fecha</label>
            <input v-model="formCrear.mes_anio" type="date" required class="input-field w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Monto Programado (Bs)</label>
            <input v-model="formCrear.monto_programado" type="number" step="0.01" required class="input-field w-full" />
          </div>
          <div class="flex justify-end space-x-2 pt-4">
            <button type="button" @click="showCreateModal = false" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition">Cancelar</button>
            <button type="submit" class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium transition">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL REPORTAR EJECUCIÓN -->
    <div v-if="showExecuteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h3 class="text-lg font-bold mb-4 text-gray-800">Reportar Ejecución de Aporte</h3>
        
        <div v-if="formError" class="bg-red-100 text-red-700 p-2 rounded mb-4 text-xs" role="alert">
          {{ formError }}
        </div>

        <form @submit.prevent="guardarEjecucion" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Monto Ejecutado (Bs)</label>
            <input v-model="formEjecutar.monto_ejecutado" type="number" step="0.01" required class="input-field w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Número de Comprobante</label>
            <input v-model="formEjecutar.comprobante_numero" type="text" class="input-field w-full" placeholder="Ej. COMP-2026-001" />
          </div>
          <div class="flex justify-end space-x-2 pt-4">
            <button type="button" @click="showExecuteModal = false" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition">Cancelar</button>
            <button type="submit" class="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-md text-sm font-medium transition">Actualizar Ejecución</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>