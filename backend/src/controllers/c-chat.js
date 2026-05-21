import { sEnviarMensaje, sObtenerHistorial, sObtenerMisMensajes } from '../services/s-chat.js';
import { mEliminarChat } from '../models/m-chat.js'; 

export const cEnviarMensaje = async (req, res) => {
  try {
    const { receptor_id, contenido } = req.body;
    const emisor_id = req.user.id; 

    const mensaje = await sEnviarMensaje(emisor_id, receptor_id, contenido);
    res.status(201).json(mensaje);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al enviar mensaje.' });
  }
};

export const cObtenerHistorial = async (req, res) => {
  try {
    const { otroUsuarioId } = req.params;
    const miId = req.user.id;
    const historial = await sObtenerHistorial(miId, otroUsuarioId);
    res.json(historial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener chat.' });
  }
};

export const cObtenerMisMensajes = async (req, res) => {
    try {
      const miId = req.user.id;
      const mensajes = await sObtenerMisMensajes(miId);
      res.json(mensajes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener mensajes.' });
    }
};

export const cEliminarChat = async (req, res) => {
  try {
    const { otroUsuarioId } = req.params;
    const miId = req.user.id;

    await mEliminarChat(miId, otroUsuarioId);
    res.status(200).json({ message: 'Chat eliminado con éxito.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar chat.' });
  }
};