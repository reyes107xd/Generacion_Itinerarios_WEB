import { supabase } from '../config/cf-con-db.js';
export const mBuscarUsuarios = async (busqueda, idUsuarioExcluir) => {
  try {
    let query = supabase
      .from('usuario') 
      .select(`
        id_usuario,
        rol,
        perfil_usuario!inner ( 
          nombre,
          ap_p,
          ap_m,
          nombre_usuario,
          foto
        )
      `)
      .neq('id_usuario', idUsuarioExcluir)
      .not('rol', 'ilike', '%administrador%'); 

    // Si hay búsqueda, filtra por nombre en la tabla unida
    if (busqueda && busqueda.length > 0) {
      query = query.ilike('perfil_usuario.nombre', `%${busqueda}%`);
    } else {
      // Si NO hay búsqueda, trae 10 usuarios cualquiera (Sugerencias)
      query = query.limit(10);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error en mBuscarUsuarios:', error.message);
    throw error;
  }
};

export const mObtenerPendientes = async (idUsuario) => {
  const { data, error } = await supabase
    .from('solicitudes_amistad')
    .select(`
      id_solicitud,
      id_emisor,
      created_at,
      emisor:usuario!id_emisor (
        perfil_usuario (
          nombre,
          nombre_usuario,
          foto
        )
      )
    `)
    .eq('id_receptor', idUsuario) 
    .eq('estado', 'pendiente');

  if (error) throw error;
  return data;
};

export const mVerificarAmistad = async (idEmisor, idReceptor) => {
  const { data, error } = await supabase
    .from('solicitudes_amistad') 
    .select('id_solicitud, estado, id_emisor') 
    .or(`and(id_emisor.eq.${idEmisor},id_receptor.eq.${idReceptor}),and(id_emisor.eq.${idReceptor},id_receptor.eq.${idEmisor})`)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const mCrearSolicitud = async (idEmisor, idReceptor) => {
  const { data, error } = await supabase
    .from('solicitudes_amistad') 
    .insert({ id_emisor: idEmisor, id_receptor: idReceptor, estado: 'pendiente' })
    .select().single();
  if (error) throw error;
  return data;
};

export const mResponderSolicitud = async (idSolicitud, nuevoEstado) => {
  if (nuevoEstado === 'rechazada') {
    const { error } = await supabase.from('solicitudes_amistad').delete().eq('id_solicitud', idSolicitud);
    if (error) throw error;
    return { status: 'deleted' };
  } else {
    const { data, error } = await supabase.from('solicitudes_amistad').update({ estado: 'aceptada' }).eq('id_solicitud', idSolicitud).select().single();
    if (error) throw error;
    return data;
  }
};

export const mObtenerAmigosConfirmados = async (idUsuario) => {
  const { data, error } = await supabase
    .from('solicitudes_amistad')
    .select(`
      id_solicitud, id_emisor, id_receptor,
      emisor:usuario!id_emisor(perfil_usuario(nombre, nombre_usuario, foto)),
      receptor:usuario!id_receptor(perfil_usuario(nombre, nombre_usuario, foto))
    `)
    .or(`id_emisor.eq.${idUsuario},id_receptor.eq.${idUsuario}`)
    .eq('estado', 'aceptada');
  if (error) throw error;
  return data;
};

export const mEliminarAmistad = async (idUsuario, idAmigo) => {
  const { error } = await supabase.from('solicitudes_amistad').delete().or(`and(id_emisor.eq.${idUsuario},id_receptor.eq.${idAmigo}),and(id_emisor.eq.${idAmigo},id_receptor.eq.${idUsuario})`);
  if (error) throw error;
  return true;
};

export const mContarAmigos = async (idUsuario) => {
  try {
    const { count, error } = await supabase
      .from('solicitudes_amistad')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'aceptada')
      .or(`id_emisor.eq.${idUsuario},id_receptor.eq.${idUsuario}`);

    if (error) throw error;
    return count;
  } catch (error) {
    console.error('Error contando amigos:', error.message);
    return 0;
  }
};

export const mObtenerIdsMisAmigos = async (idUsuario) => {
  try {
    // Buscamos todas las relaciones ACEPTADAS donde yo soy parte
    const { data, error } = await supabase
      .from('solicitudes_amistad') 
      .select('id_emisor, id_receptor')
      .eq('estado', 'aceptada')
      .or(`id_emisor.eq.${idUsuario},id_receptor.eq.${idUsuario}`);

    if (error) throw error;

    // Procesamos la lista para sacar solo los IDs de MIS AMIGOS
    const idsAmigos = data.map(fila => {
      // Si yo soy el emisor, mi amigo es el receptor. Y viceversa.
      return (String(fila.id_emisor) === String(idUsuario)) 
        ? fila.id_receptor 
        : fila.id_emisor;
    });

    return idsAmigos; // Retorna ej: [5, 12, 40]

  } catch (error) {
    console.error('Error obteniendo IDs de amigos:', error.message);
    return []; // Si falla, asumimos que no tiene amigos para no romper el feed
  }
};

export const mEliminarSolicitudEnviada = async (idEmisor, idDestinatario) => {
    const { count, error } = await supabase
        .from('solicitudes_amistad')
        .delete({ count: 'exact' }) 
        .eq('id_emisor', idEmisor)
        .eq('id_receptor', idDestinatario)
        .eq('estado', 'pendiente');
    
    if (error) {
        console.error('Error en mEliminarSolicitudEnviada:', error.message);
        throw error;
    }
    return count; 
};