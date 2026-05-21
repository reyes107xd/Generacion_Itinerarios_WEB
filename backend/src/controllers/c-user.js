import {
  obtenerUsuarioPorIdS,
  actualizarUsuarioS,
  eliminarUsuarioS,
  searchUsersS,
  cambiarContrasenaS
} from '../services/s-user.js';
import { verificarEstadoAmistad, contarAmigos } from '../models/m-user.js';

import {
  ErrorUsuarioNoEncontrado,
  ErrorActualizacionInvalida,
  ErrorOperacionNoPermitida,
  CredencialesInvalidasError
} from '../utils/u-errores-dominio.js';

const ERROR_MAP = {
  [ErrorUsuarioNoEncontrado.name]: { status: 404, message: 'Usuario no encontrado.' },
  [ErrorActualizacionInvalida.name]: { status: 400, message: 'Datos de actualización inválidos.' },
  [ErrorOperacionNoPermitida.name]: { status: 403, message: 'Operación no permitida.' },
  [CredencialesInvalidasError.name]: { status: 401, message: 'Credenciales inválidas.' }
};

export async function obtenerPerfil(req, res) {
  try {
    const id_usuario = req.user?.id;
    const usuario = await obtenerUsuarioPorIdS(id_usuario);

    const usuarioFrontend = {
      ...usuario,
      username: usuario.nombre_usuario || `user${usuario.id_usuario}`,
      bio: usuario.descripcion || '',
      avatar: usuario.foto || '',
      name: usuario.nombre || usuario.nombre_usuario || 'Usuario' 
    };

    // Estandarizado: Perfil obtenido con éxito.
    res.status(200).json({ message: 'Perfil obtenido con éxito.', usuarioFrontend });
  } catch (error) {
    const { status, message } = ERROR_MAP[error.constructor.name] || { status: 500, message: 'Error en el servidor.' };
    res.status(status).json({
      message: 'Error al obtener perfil.',
      error: message
    });
  }
}

export async function obtenerPerfilPublico(req, res) {
  try {
    const { id } = req.params;
    const idUsuarioAutenticado = req.user?.id;

    const usuario = await obtenerUsuarioPorIdS(id);
    if (!usuario) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado." });
    }

    const { contrasena, correo, ...publicUser } = usuario;
    const numAmigos = await contarAmigos(id);

    let estadoAmistad = {
      sonAmigos: false,
      solicitudPendiente: false,
      estado: 'none'
    };

    if (idUsuarioAutenticado && idUsuarioAutenticado !== usuario.id_usuario) {
      estadoAmistad = await verificarEstadoAmistad(idUsuarioAutenticado, usuario.id_usuario);
    }

    const esPropioPerfil = idUsuarioAutenticado && idUsuarioAutenticado === usuario.id_usuario;

    return res.status(200).json({
      ok: true,
      usuario: {
        ...publicUser,
        num_amigos: numAmigos,
        es_amigo: estadoAmistad.sonAmigos,
        solicitud_enviada: estadoAmistad.solicitudPendiente,
        estado_amistad: estadoAmistad.estado,
        es_propio_perfil: esPropioPerfil
      }
    });

  } catch (error) {
    console.error("Error en obtenerPerfilPublico:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener perfil."
    });
  }
}

export async function actualizarUsuario(req, res) {
  try {
    if (req.body === undefined) {
      return res.status(400).json({
        message: 'Error al procesar solicitud.',
        error: 'Datos no recibidos.'
      });
    }

    const id_usuario = req.user?.id;
    let datos = {};

    if (req.body.nombre) datos.nombre = req.body.nombre;
    if (req.body.usuario) datos.nombre_usuario = req.body.usuario;
    if (req.body.descripcion) datos.descripcion = req.body.descripcion;
    if (req.body.foto) datos.foto = req.body.foto;

    if (Object.keys(datos).length === 0) {
      return res.status(400).json({
        message: 'Acción inválida.',
        error: 'Campos de actualización vacíos.'
      });
    }

    const usuarioActualizado = await actualizarUsuarioS(id_usuario, datos);

    res.status(200).json({
      message: 'Usuario actualizado con éxito.',
      usuario: usuarioActualizado
    });

  } catch (error) {
    console.error('Error en actualizarUsuario:', error);
    const { status, message } = ERROR_MAP[error.constructor.name] || { status: 500, message: 'Error en el servidor.' };
    res.status(status).json({
      message: 'Error al actualizar usuario.',
      error: message
    });
  }
}

export async function eliminarUsuario(req, res) {
  try {
    const id_usuario = req.user?.id;
    const { password, username } = req.body;

    if (!password && !username) {
      return res.status(400).json({
        message: 'Formulario incompleto',
        error: 'Credenciales no proporcionadas.'
      });
    }

    const confirmacion = { password, username };
    await eliminarUsuarioS({ id_usuario, confirmacion });

    res.json({ message: 'Usuario eliminado con éxito.' });
  } catch (error) {
    console.error('Error en el controlador eliminarUsuario:', error);
    const { status, message } =
      ERROR_MAP[error.constructor.name] || {
        status: 500,
        message: 'Error en el servidor.'
      };
    res.status(status).json({
      message: 'Error al eliminar usuario.',
      error: message
    });
  }
}

export async function searchUsers(req, res) {
  try {
    const { query } = req.query;
    const usuarios = await searchUsersS(query || "");

    return res.status(200).json({
      ok: true,
      results: usuarios
    });

  } catch (error) {
    console.error("Error en searchUsers:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al buscar usuarios."
    });
  }
}

export async function cambiarContrasena(req, res) {
  try {
    const id_usuario = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!id_usuario) {
      return res.status(401).json({
        message: 'Usuario no autenticado.',
        error: 'Sesión expirada.'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Formulario incompleto.',
        error: 'Formulario incompleto.'
      });
    }

    const resultado = await cambiarContrasenaS(id_usuario, currentPassword, newPassword);
    res.status(200).json(resultado);

  } catch (error) {
    console.error('Error en cambiarContrasena:', error);

    if (error.message.startsWith('La contraseña debe contener:')) {
      return res.status(400).json({
        message: 'Contraseña inválida.',
        error: error.message
      });
    }

    const { status, message } = ERROR_MAP[error.constructor.name] || {
      status: 500,
      message: 'Error en el servidor.'
    };

    res.status(status).json({
      message: 'Error al cambiar la contraseña.',
      error: message
    });
  }
}