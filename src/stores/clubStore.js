import { defineStore } from 'pinia';
import { ref } from 'vue';
import clubService from '@/services/clubService';

export const useClubStore = defineStore('club', () => {
    const clubes = ref([]);
    const loading = ref(false);
    const error = ref(null);

    const listarClubes = async (asociacionId, filters = {}) => {
        loading.value = true;
        error.value = null;
        try {
            clubes.value = await clubService.listar(asociacionId, filters);
        } catch (err) {
            error.value = err.response?.data?.message || err.message;
        } finally {
            loading.value = false;
        }
    };

    const registrarClub = async (asociacionId, payload) => {
        try {
            await clubService.crear(asociacionId, payload);
            await listarClubes(asociacionId); // Refresca la lista automáticamente
        } catch (err) {
            throw err;
        }
    };

    const actualizarClub = async (asociacionId, clubId, payload) => {
        try {
            await clubService.actualizar(asociacionId, clubId, payload);
            await listarClubes(asociacionId);
        } catch (err) {
            throw err;
        }
    };

    const inactivarClub = async (asociacionId, clubId) => {
        try {
            await clubService.inactivar(asociacionId, clubId);
            await listarClubes(asociacionId);
        } catch (err) {
            throw err;
        }
    };

    return {
        clubes,
        loading,
        error,
        listarClubes,
        registrarClub,
        actualizarClub,
        inactivarClub
    };
});