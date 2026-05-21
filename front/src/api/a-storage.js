import { supabase } from './supabaseClient';

export const subirImagen = async (archivo, bucket = 'itinerarios') => {
  try {
    // Crear un nombre único para el archivo (evita sobreescribir)
    const extension = archivo.name.split('.').pop();
    const nombreArchivo = `${Date.now()}-${Math.random().toString(36).substring(2)}.${extension}`;
    
    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(nombreArchivo, archivo);

    if (error) throw error;

    // Obtener la URL Pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(nombreArchivo);

    return urlData.publicUrl;

  } catch (error) {
    console.error('Error subiendo imagen:', error);
    throw new Error('No se pudo subir la imagen');
  }
};

// Función específica para perfiles (opcional, para mantener consistencia)
export const subirImagenPerfil = async (archivo) => {
  return await subirImagen(archivo, 'perfiles');
};