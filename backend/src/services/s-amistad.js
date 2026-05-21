import { 
    mBuscarUsuarios, 
    mCrearSolicitud, 
    mVerificarAmistad, 
    mObtenerPendientes, 
    mResponderSolicitud, 
    mContarAmigos,
    mObtenerAmigosConfirmados,
    mEliminarSolicitudEnviada
} from '../models/m-amistad.js';
import { sendSocketNotification } from './s-notification.js'; 


export const sBuscarUsuarios = async (query, idUsuarioAutenticado) => {
  const usuariosRaw = await mBuscarUsuarios(query, idUsuarioAutenticado);
  
  // Obtener lista de amigos confirmados
  const misAmigosRaw = await mObtenerAmigosConfirmados(idUsuarioAutenticado);
  
  // Creamos un Set con los IDs de mis amigos para búsqueda rápida
  const idsMisAmigos = new Set();

  misAmigosRaw.forEach(r => {
      if (String(r.id_emisor) === String(idUsuarioAutenticado)) {
          // Si yo envié la solicitud, mi amigo es el receptor
          idsMisAmigos.add(r.id_receptor);
      } else {
          // Si yo recibí la solicitud, mi amigo es el emisor
          idsMisAmigos.add(r.id_emisor);
      }
  });

  // 3. Mapear resultados indicando si ya son amigos
  return usuariosRaw.map(u => {
    // Extraer perfil (maneja si viene como array u objeto)
    const perfil = Array.isArray(u.perfil_usuario) ? u.perfil_usuario[0] : u.perfil_usuario;
    
    if (!perfil) return null; 

    return {
      id: u.id_usuario,
      nombre: `${perfil.nombre || 'Usuario'} ${perfil.ap_p || ''}`.trim(),
      nombre_usuario: perfil.nombre_usuario,
      foto: perfil.foto, 
      // Aquí verificamos si el ID está en el Set de amigos
      estado_amistad: idsMisAmigos.has(u.id_usuario) ? 'friends' : 'none'
    };
  }).filter(u => u !== null);
};

export const sEnviarSolicitud = async (idEmisor, idReceptor, datosEmisor) => {
  const relacionExistente = await mVerificarAmistad(idEmisor, idReceptor);

  if (relacionExistente) {
    if (relacionExistente.estado === 'aceptada') {
      throw new Error('Ya son amigos.');
    }
    const esSolicitudInversa = relacionExistente.estado === 'pendiente' && relacionExistente.id_emisor === idReceptor;

    if (esSolicitudInversa) {
        const resultadoAceptacion = await mResponderSolicitud(relacionExistente.id_solicitud, 'aceptada');
        const { createNotification } = await import('./s-notification.js');
        await createNotification(idReceptor, {
            tipo: 'friend_accepted',
            titulo: '¡Amistad confirmada!',
            mensaje: `${datosEmisor.nombre} aceptó tu solicitud.`,
            enlace: '/comunidad/amigos'
        });
        return { message: 'Amistad establecida automáticamente', solicitud: resultadoAceptacion };
    }

    throw new Error('Ya existe una solicitud pendiente enviada.');
  }

 const nuevaSolicitud = await mCrearSolicitud(idEmisor, idReceptor);
  const { createNotification } = await import('./s-notification.js');
  await createNotification(idReceptor, {
    tipo: 'friend_request',
    titulo: 'Nueva solicitud de amistad',
    mensaje: `${datosEmisor.nombre} quiere ser tu amigo`,
    enlace: '/comunidad/solicitudes'
  });

  return nuevaSolicitud;
};

export const sObtenerPendientes = async (idUsuario) => {
  const solicitudes = await mObtenerPendientes(idUsuario);

  return solicitudes.map(sol => {
    const perfil = Array.isArray(sol.emisor?.perfil_usuario) 
        ? sol.emisor.perfil_usuario[0] 
        : sol.emisor?.perfil_usuario;

    return {
      id_solicitud: sol.id_solicitud, 
      id: sol.id_emisor,             
      name: perfil ? `${perfil.nombre} ${perfil.ap_p || ''}`.trim() : 'Usuario',
      handle: perfil?.nombre_usuario || 'anonimo',
      avatar: perfil?.foto, 
      fecha: sol.created_at
    };
  });
};

export const sResponderSolicitud = async (idSolicitud, accion, idUsuarioAutenticado) => {
  const estadoDB = accion === 'accept' ? 'aceptada' : 'rechazada';
  return await mResponderSolicitud(idSolicitud, estadoDB);
};

export const sContarAmigosUsuario = async (idUsuario) => {
  const cantidad = await mContarAmigos(idUsuario);
  return { cantidad };
};

export const sCancelarSolicitud = async (idEmisor, idDestinatario) => {
    const resultado = await mEliminarSolicitudEnviada(idEmisor, idDestinatario);
    
    if (resultado === 0) {
        throw new Error('No se encontró una solicitud pendiente para cancelar.');
    }
    return resultado;
};