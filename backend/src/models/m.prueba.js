// Asegúrate de que esta importación trae el objeto 'supabase'
import { supabase } from '../config/cf-con-db.js';

export const obtenerRegistros = async () => {
    // Usar el cliente 'supabase' en lugar de 'pool'
    // Usar la sintaxis de Query Builder: .from('tabla').select('*')
    const { data: result, error } = await supabase
        .from('usuario')
        .select('*'); // Consulta SELECT * FROM usuario

    if (error) {
        console.error('Error al obtener registros de Supabase:', error);
        throw error;
    }

    // Supabase devuelve los resultados directamente en 'data' (que es un array)
    console.log(`Datos obtenidos:`, result); 
    
    // Retornar 'data' (el array de registros)
    return result; 
};