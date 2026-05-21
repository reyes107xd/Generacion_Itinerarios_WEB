import { autenticarConGoogle, autInicioSesion, autRegistro, solicitarRecuperacion,restablecerContrasena,
    verificarCorreo} from '../services/s-auth.js';
import { CredencialesInvalidasError, CorreoYaRegistradoError,RecursoNoEncontradoError,ValidacionError} from '../utils/u-errores-dominio.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ERROR_MAP = {
  [CredencialesInvalidasError.name]: 401,   
  [CorreoYaRegistradoError.name]: 409,     
  [RecursoNoEncontradoError.name]: 404,   
  [ValidacionError.name]: 400             
};

export const loginWithGoogle = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split(' ')[1];

    if (!idToken)
      return res.status(401).json({ message: 'Token no proporcionado.' });

    const { user, appToken } = await autenticarConGoogle(idToken);

    res.status(200).json({
      message: 'Autenticación realizada con éxito.',
      user,
      appToken
    });
  } catch (error) {
    console.error('\x1b[31mError al autenticar con Google:\x1b[0m', error);

    const statusCode = ERROR_MAP[error.name] || 500; 

    if (statusCode >= 400 && statusCode < 500) {
      return res.status(statusCode).json({
        message: error.message,
        error: error.message 
      });
    }

    res.status(500).json({
      message: 'Error al autenticar.',
      error: error.message
    });
  }
};


export const loginUsuario = async (req, res) => {
  try {
    const { correo, password } = req.body;
    const { user, appToken } = await autInicioSesion({ correo, password });

    res.status(200).json({
      message: 'Autenticación realizada con éxito.',
      user,
      appToken
    });

  } catch (error) {
    console.error('\x1b[31mError al autenticar de manera local:\x1b[0m', error);

    const statusCode = ERROR_MAP[error.name] || 500; 

    if (statusCode >= 400 && statusCode < 500) {
      return res.status(statusCode).json({
        message: 'Error al solicitar autenticación.',
        error: error.message 
      });
    }

    res.status(500).json({
      message: 'Error al procesar solicitud.',
      error: error.message 
    });
  }
};

export const registrarUsuario = async (req, res) => {
  try {
    const { nombre, ap_p, ap_m, fecha_nac, telefono, correo, password, genero } = req.body;

    const servicioResponse = await autRegistro({
      nombre, ap_p, ap_m, fecha_nac, telefono, correo, password, genero,
      host: req.headers.host
    });

    res.status(200).json(servicioResponse);

  } catch (error) {
    console.error('Error al autenticar de manera local:', error);

    const statusCode = ERROR_MAP[error.name] || 500;

    if (statusCode >= 400 && statusCode < 500) {
      return res.status(statusCode).json({
        message: 'Error al solicitar autenticación.',
        error: error.message
      });
    }

    res.status(500).json({
      message: 'Error al procesar solicitud.',
      error: error.message
    });
  }
};


export const handleVerificarCorreo = async (req, res) => {
  try {
    const { token } = req.params;
    await verificarCorreo(token); 

    res.redirect(`${FRONTEND_URL}/login?verificado=true`); 

  } catch (error) {
    console.error('Error al verificar correo:', error);
    const statusCode = ERROR_MAP[error.name] || 500;
    res.status(statusCode).json({ error: error.message || 'Error al verificar correo.' });
  }
};


export const handleSolicitarRecuperacion = async (req, res) => {
    try {
        const { email } = req.body;
        await solicitarRecuperacion(email, req.headers.host); 
        res.status(200).json({ 
            message: 'Enlace de recuperación enviado con éxito. Revise su bandeja de spam.' 
        });

    } catch (error) {
        console.error('Error al solicitar recuperación:', error);
        const statusCode = ERROR_MAP[error.name] || 500;
        res.status(statusCode).json({ error: error.message || 'Error al procesar solicitud.' });
    }
};

export const handleRestablecerContrasena = async (req, res) => {
    try {
        const { token } = req.params;
        const { nuevaPassword, confirmarPassword } = req.body;

        await restablecerContrasena(token, nuevaPassword, confirmarPassword);
        res.status(200).json({ message: 'Contraseña actualizada con éxito.' });

    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        const statusCode = ERROR_MAP[error.name] || 500;
        res.status(statusCode).json({ error: error.message || 'Error al procesar solicitud.' });
    }
};