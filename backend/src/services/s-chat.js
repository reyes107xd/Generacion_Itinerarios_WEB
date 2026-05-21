import { mGuardarMensaje, mObtenerHistorial, mObtenerMisMensajes } from '../models/m-chat.js';
import { sendSocketNotification } from './s-notification.js';
import { supabase } from '../config/cf-con-db.js';

export const sEnviarMensaje = async (idEmisor, idReceptor, contenido) => {
  const mensajeGuardado = await mGuardarMensaje(idEmisor, idReceptor, contenido);

  // Obtener nombre del emisor para la notificación
  const { data: emisorData } = await supabase
    .from('turista')
    .select('usuario(perfil_usuario(nombre, ap_p, nombre_usuario))')
    .eq('id_turista', idEmisor)
    .single();

  const perfilEmisor = emisorData?.usuario?.perfil_usuario?.[0] || {};
  const nombreEmisor = perfilEmisor.nombre ? 
    `${perfilEmisor.nombre} ${perfilEmisor.ap_p || ''}`.trim() : 
    perfilEmisor.nombre_usuario || 'Alguien';

  const payload = {
    id: mensajeGuardado.id_mensaje,
    text: contenido,
    senderId: idEmisor,
    receiverId: idReceptor,
    senderName: nombreEmisor,
    timestamp: mensajeGuardado.fecha_envio
  };

  // Enviar al receptor
  sendSocketNotification(idReceptor, 'receive_message', payload);
  // Enviar también al emisor para evitar dependencia de UI optimista (si desea sincronizar id real)
  sendSocketNotification(idEmisor, 'receive_message', { ...payload, echo: true });

  return mensajeGuardado;
};

export const sObtenerHistorial = async (idUsuarioActual, idOtroUsuario) => {
  return await mObtenerHistorial(idUsuarioActual, idOtroUsuario);
};


export const sObtenerMisMensajes = async (idUsuario) => {
    return await mObtenerMisMensajes(idUsuario);
};