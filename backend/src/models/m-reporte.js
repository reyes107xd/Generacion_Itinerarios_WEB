import { supabase } from '../config/cf-con-db.js';

export const mCrearReporte = async (datosReporte) => {
  try {
    const { data, error } = await supabase
      .from('reporte') 
      .insert(datosReporte)
      .select()
      .single();

    if (error) throw error;
    return data;

  } catch (error) {
    console.error('Error en mCrearReporte:', error.message);
    throw error;
  }
};

export const mObtenerIdsReportadosPorTurista = async (idTurista) => {
  try {
    const { data, error } = await supabase
      .from('reporte')
      .select('id_publicacion_reportada, id_comentario_reportado') // Traemos ambos
      .eq('id_turista_reporta', idTurista);

    if (error) throw error;
    
    // Devolvemos un objeto separado
    return {
        publicaciones: data.map(r => r.id_publicacion_reportada).filter(id => id !== null),
        comentarios: data.map(r => r.id_comentario_reportado).filter(id => id !== null)
    };
  } catch (error) {
    console.error('Error obteniendo historial reportes:', error.message);
    return { publicaciones: [], comentarios: [] };
  }
};