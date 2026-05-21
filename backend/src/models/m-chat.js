import { supabase } from '../config/cf-con-db.js';

export const mGuardarMensaje = async (idEmisor, idReceptor, contenido) => {
  try {
    //Aseguramos que sean números enteros
    const emisorInt = parseInt(idEmisor, 10);
    const receptorInt = parseInt(idReceptor, 10);

    // Validación básica antes de llamar a la BD
    if (isNaN(emisorInt) || isNaN(receptorInt)) {
        throw new Error(`IDs inválidos: Emisor(${idEmisor}), Receptor(${idReceptor})`);
    }

    const { data, error } = await supabase
      .from('mensajes') 
      .insert({
        id_emisor: emisorInt,
        id_receptor: receptorInt,
        contenido: contenido
      })
      .select()
      .single();

    if (error) throw error;
    return data;

  } catch (error) {
    console.error("Error CRÍTICO en mGuardarMensaje:", error.message);
    throw error; // Lanzamos el error para que el controlador responda 500
  }
};

// Obtener historial 
export const mObtenerHistorial = async (userA, userB) => {
  const idA = parseInt(userA, 10);
  const idB = parseInt(userB, 10);

  if (isNaN(idA) || isNaN(idB)) {
      console.error("🔴 IDs inválidos para historial:", userA, userB);
      return [];
  }

  // Consulta simplificada
  const { data, error } = await supabase
    .from('mensajes')
    .select('*')
    .or(`and(id_emisor.eq.${idA},id_receptor.eq.${idB}),and(id_emisor.eq.${idB},id_receptor.eq.${idA})`)
    .order('fecha_envio', { ascending: true }); 

  if (error) {
      console.error("🔴 Error al leer historial:", error.message);
      throw error;
  }
  return data;
};

// Obtener Inbox
export const mObtenerMisMensajes = async (idUsuario) => {
    const { data, error } = await supabase
      .from('mensajes')
      .select(`
        *,
        emisor:usuario!fk_mensajes_emisor (
          id_usuario,
          perfil_usuario ( nombre, foto )
        ),
        receptor:usuario!fk_mensajes_receptor (
          id_usuario,
          perfil_usuario ( nombre, foto )
        )
      `)
      .or(`id_emisor.eq.${idUsuario},id_receptor.eq.${idUsuario}`)
      .order('fecha_envio', { ascending: false });
  
    if (error) throw error;
    return data;
};

// Eliminar conversación completa entre dos usuarios
export const mEliminarChat = async (idUsuario1, idUsuario2) => {
  const id1 = parseInt(idUsuario1, 10);
  const id2 = parseInt(idUsuario2, 10);

  // Borrar donde: (Emisor=A y Receptor=B) O (Emisor=B y Receptor=A)
  const { error } = await supabase
    .from('mensajes')
    .delete()
    .or(`and(id_emisor.eq.${id1},id_receptor.eq.${id2}),and(id_emisor.eq.${id2},id_receptor.eq.${id1})`);

  if (error) {
      console.error("Error borrando chat:", error.message);
      throw error;
  }
  return true;
};