import { mObtenerAmigosConfirmados, mEliminarAmistad } from '../models/m-amistad.js';
import { 
    sBuscarUsuarios, 
    sEnviarSolicitud, 
    sObtenerPendientes, 
    sResponderSolicitud,sContarAmigosUsuario ,sCancelarSolicitud
} from '../services/s-amistad.js';

export const cBuscarUsuarios = async (req, res) => {
  try {
    const { q } = req.query;
    const idUsuario = req.user.id; 
    const resultados = await sBuscarUsuarios(q, idUsuario);
    res.status(200).json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al buscar usuarios.' });
  }
};

export const cEnviarSolicitud = async (req, res) => {
  try {
    const { destinatario_id } = req.body; 
    const idEmisor = req.user.id; 

    const datosEmisor = {
        nombre: req.user.nombre || 'Usuario', 
        handle: req.user.nombre_usuario || 'user',
        foto: req.user.foto
    };

    const solicitud = await sEnviarSolicitud(idEmisor, destinatario_id, datosEmisor);
    res.status(201).json({ message: 'Solicitud enviada con éxito.', solicitud });

  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Error al enviar solicitud.' });
  }
};

export const cObtenerPendientes = async (req, res) => {
  try {
    const idUsuario = req.user.id; 
    const lista = await sObtenerPendientes(idUsuario);
    res.status(200).json(lista);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener solicitudes.' });
  }
};

export const cResponderSolicitud = async (req, res) => {
  try {
    const { id_solicitud, estado } = req.body;
    const idUsuario = req.user.id;

    const resultado = await sResponderSolicitud(id_solicitud, estado, idUsuario);
    res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al responder solicitud.' });
  }
};


export const cObtenerAmigos = async (req, res) => {
  try {
    const idUsuario = req.user.id;
    const rawData = await mObtenerAmigosConfirmados(idUsuario);

    const amigos = rawData.map(rel => {
      const soyEmisor = rel.id_emisor === idUsuario;
      const datosAmigo = soyEmisor ? rel.receptor?.perfil_usuario[0] : rel.emisor?.perfil_usuario[0];
      const idAmigo = soyEmisor ? rel.id_receptor : rel.id_emisor;

      return {
        id: idAmigo,
        id_solicitud: rel.id_solicitud, 
        name: datosAmigo?.nombre || 'Usuario',
        handle: datosAmigo?.nombre_usuario,
        avatar: datosAmigo?.foto
      };
    });

    res.json(amigos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener amigos.' });
  }
};

export const cEliminarAmigo = async (req, res) => {
    try {
        const { idAmigo } = req.params;
        await mEliminarAmistad(req.user.id, idAmigo);
        res.json({ message: 'Amigo eliminado con éxito.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar amigo.' });
    }
};

export const cContarAmigosUsuario = async (req, res) => {
  try {
    const { id } = req.params; 
    const resultado = await sContarAmigosUsuario(id);
    res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ cantidad: 0 });
  }
};

export const cCancelarSolicitud = async (req, res) => {
    try {
        const idDestinatario = req.params.idAmigo; 
        const idEmisor = req.user.id;
        
        await sCancelarSolicitud(idEmisor, idDestinatario); 
        
        res.status(200).json({ message: 'Solicitud cancelada con éxito.' });
    } catch (error) {
        console.error('Error al cancelar solicitud:', error);
        res.status(500).json({ message: 'Error al cancelar la solicitud.' });
    }
};