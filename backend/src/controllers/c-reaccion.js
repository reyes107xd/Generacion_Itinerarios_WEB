import { sDarLike, sQuitarLike,sObtenerMisLikes,sObtenerFavoritosCompletos } from '../services/s-reaccion.js';
import { ValidacionError } from '../utils/u-errores-dominio.js';

const ERROR_MAP = { [ValidacionError.name]: 400 };

export const cToggleLike = async (req, res) => {
  try {
    const idTurista = req.user.id; 
    const { id_publicacion, accion } = req.body; 

    let resultado;
    if (accion === 'dar') {
      // Obtener nombre del usuario que da like
      const nombreUsuario = req.user.nombre ? 
        `${req.user.nombre} ${req.user.ap_p || ''}`.trim() : 
        req.user.nombre_usuario || 'Un usuario';
      
      resultado = await sDarLike(id_publicacion, idTurista, nombreUsuario);
    } else if (accion === 'quitar') {
      resultado = await sQuitarLike(id_publicacion, idTurista);
    } else {
      return res.status(400).json({ message: 'Acción inválida.' });
    }

    res.status(200).json(resultado);

  } catch (error) {
    console.error('Error en cToggleLike:', error);
    const statusCode = ERROR_MAP[error.name] || 500;
    res.status(statusCode).json({ message: error.message || 'Error en el servidor.' });
  }
};

export const cObtenerMisLikes = async (req, res) => {
  try {
    const idTurista = req.user.id;
    const listaIds = await sObtenerMisLikes(idTurista);
    res.status(200).json(listaIds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener likes' });
  }
};

export const cObtenerFavoritos = async (req, res) => {
  try {
    const idTurista = req.user.id;
    const favoritos = await sObtenerFavoritosCompletos(idTurista);
    res.status(200).json(favoritos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al cargar favoritos' });
  }
};