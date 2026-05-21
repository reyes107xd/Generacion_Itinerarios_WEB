export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
export const API_URL = `${BACKEND_URL}/api`;
export const CONFIG = {
    API_TIMEOUT: 10000,
    MAX_LUGARES_POR_DIA: 3,
    MIN_VOTACIONES_DESTACADOS: 50,
};

// Configuración por defecto para axios (opcional)
export const AXIOS_CONFIG = {
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
};

// Estados disponibles para filtros
export const ESTADOS_MEXICO = [
    'cdmx',
    'edomex',
    'hidalgo',
    'queretaro',
    'morelos',
    'puebla',
];