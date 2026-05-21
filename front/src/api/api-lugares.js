import axios from 'axios';
import { API_URL } from './a-config.js';

export const obtenerLugares = async (filtros = {}) => {
    try {
        const params = new URLSearchParams();

        if (filtros.estado) params.append('estado', filtros.estado);
        if (filtros.categoria) params.append('categoria', filtros.categoria);
        if (filtros.busqueda) params.append('busqueda', filtros.busqueda);
        if (filtros.limite) params.append('limite', filtros.limite);

        console.log("URL final:", `${API_URL}/lugares/listar?${params.toString()}`); // 👈 AQUI

        const response = await axios.get(`${API_URL}/lugares/listar?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener lugares:', error);
        throw error;
    }
};


export const obtenerCategorias = async () => {
    try {
        const response = await axios.get(`${API_URL}/categorias/listar`);
        return response.data; 
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        throw error;
    }
};

export const obtenerLugarPorId = async (idLugar) => {
    try {
        const response = await axios.get(`${API_URL}/lugares/listar/${idLugar}`);
        return response.data; 
    } catch (error) {
        console.error('Error al obtener lugar:', error);
        throw error;
    }
};

export const obtenerLugaresDestacados = async (limite = 10) => {
    try {
        const response = await axios.get(`${API_URL}/lugares/destacados?limite=${limite}`);
        return response.data; 
    } catch (error) {
        console.error('Error al obtener lugares destacados:', error);
        throw error;
    }
};
