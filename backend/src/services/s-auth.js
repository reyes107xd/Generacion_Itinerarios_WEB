/* 
  LOGICA INICIO DE SESION/REGISTRO/RECUPERAR_CONTRASENA
*/
import { CorreoYaRegistradoError, CredencialesInvalidasError, ValidacionError } from '../utils/u-errores-dominio.js';
import { generarNombreUsuario } from '../utils/u-generar-nombre-usuario.js';
import googleClient from '../config/cf-google.js';
import jwt from 'jsonwebtoken';
import User from '../models/m-user.js';
import {
    guardarTokenRecuperacion,
    buscarTokenValido,
    eliminarToken,
    verificarUsuario,
    actualizarContrasena
} from '../models/m-user.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { transporter } from '../utils/u-mailer.js';
import { hashPassword, comparePassword } from '../utils/u-bcrypt.js';


const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;



export async function autenticarConGoogle(idToken) {
  // Verificar token de Google
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID
  });

  // Carga util (objeto)
  const payload = ticket.getPayload();
  const { email, name, picture } = payload;

  let user = await User.buscarPorCorreo(email);

  if (!user) {
    console.log('Usuario nuevo detectado, creando...');
    console.log('Datos a insertar en BD:', { name, email, picture });

    const nombre_usuario = await generarNombreUsuario(
      name,
      User.existeNombreUsuario 
    );

    // Dividir el nombre completo en partes
    const nombreParts = name.trim().split(/\s+/);

    let nombre = '';
    let ap_p = '';
    let ap_m = '';

    switch (nombreParts.length) {
        case 1:
            // Solo un nombre, sin apellidos
            nombre = nombreParts[0];
            break;
        case 2:
            // Dos partes: nombre y apellido paterno
            nombre = nombreParts[0];
            ap_p = nombreParts[1];
            break;
        case 3:
            // Tres partes: nombre, apellido paterno, apellido materno
            nombre = nombreParts[0];
            ap_p = nombreParts[1];
            ap_m = nombreParts[2];
            break;
        default:
            // Cuatro o más partes: dos primeros como nombre, luego apellidos
            nombre = `${nombreParts[0]} ${nombreParts[1]}`;
            ap_p = nombreParts[2];
            ap_m = nombreParts[3] || ''; // si hay más de 4, ignoramos el resto
            break;
    }

    user = await User.crearUsuarioGoogle({ 
      nombre, 
      correo: email, 
      foto: picture, 
      tipo_autenticacion: 'google' ,
      nombre_usuario,
      ap_m,
      ap_p
    });
  } else {
    console.log('Usuario existente:', user);
    
    // Verificar si el usuario está bloqueado
    if (user.estado === 'bloqueado') {
      // Obtener información del bloqueo
      const bloqueoInfo = await User.obtenerInfoBloqueo(user.id_usuario);
      
      let mensajeBloqueo = 'Tu cuenta ha sido bloqueada.';
      
      if (bloqueoInfo) {
        if (bloqueoInfo.duracion === 'permanente') {
          mensajeBloqueo += ' El bloqueo es permanente. Contacta al administrador.';
        } else if (bloqueoInfo.fecha_desbloqueo) {
          const fechaDesbloqueo = new Date(bloqueoInfo.fecha_desbloqueo);
          const ahora = new Date();
          const diasRestantes = Math.ceil((fechaDesbloqueo - ahora) / (1000 * 60 * 60 * 24)) - 1;
          
          if (diasRestantes > 0) {
            mensajeBloqueo += ` Serás desbloqueado automáticamente en ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}.`;
          } else {
            mensajeBloqueo += ' El bloqueo ha expirado. Intenta iniciar sesión nuevamente.';
          }
        }
      }
      
      throw new CredencialesInvalidasError(mensajeBloqueo);
    }

    // Actualizar última conexión para usuarios existentes
    await User.actualizarUltimaConexion(user.id_usuario);
  }

  // Generar token JWT propio
  const appToken = jwt.sign(
    { userId: user.id_usuario, correo: user.correo, rol: user.rol },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  const { 
      contrasena, 
      fecha_creacion, 
      nombre, 
      ...usuarioPublico 
  } = user;

  return { 
      user: { 
          ...usuarioPublico,
          nombre
      },
      appToken 
  };
}

export async function autInicioSesion({correo, password}) {
  const user = await User.buscarPorCorreo(correo);

  // Si el usuario no existe, lanza un error de dominio.
  if (!user) {
    throw new CredencialesInvalidasError('Usuario no encontrado. Registrate primero.'); 
  }

  // Verificar si el usuario está bloqueado
    // Verificar si el usuario está bloqueado
  if (user.estado === 'bloqueado') {
    const bloqueoInfo = await User.obtenerInfoBloqueo(user.id_usuario);
    
    const partesMensaje = ['Tu cuenta ha sido bloqueada.'];
    
    if (bloqueoInfo) {
      // Motivo
      if (bloqueoInfo.motivo) {
        partesMensaje.push(`Motivo: ${bloqueoInfo.motivo}`);
      }
      
      // Duración
      if (bloqueoInfo.duracion === 'permanente') {
        partesMensaje.push('El bloqueo es permanente. Contacta al administrador.');
      } else if (bloqueoInfo.fecha_desbloqueo) {
        const fechaDesbloqueo = new Date(bloqueoInfo.fecha_desbloqueo);
        const ahora = new Date();
        const diasRestantes = Math.ceil((fechaDesbloqueo - ahora) / (1000 * 60 * 60 * 24)) - 1;
        
        if (diasRestantes > 0) {
          partesMensaje.push(`Serás desbloqueado automáticamente en ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}.`);
        } else {
          partesMensaje.push('El bloqueo ha expirado. Intenta iniciar sesión nuevamente.');
        }
      }
      
      // Fecha de bloqueo (opcional)
      if (bloqueoInfo.fecha_bloqueo) {
        const fechaBloqueo = new Date(bloqueoInfo.fecha_bloqueo).toLocaleDateString();
        partesMensaje.push(`Fecha de bloqueo: ${fechaBloqueo}`);
      }
    } else {
      partesMensaje.push('No hay información adicional disponible. Contacta al administrador.');
    }
    
    const mensajeBloqueo = partesMensaje.join(' ');
    throw new CredencialesInvalidasError(mensajeBloqueo);
  }

  if(user.tipo_autenticacion !== 'local') {
    throw new CredencialesInvalidasError(`Por favor, inicia sesión usando ${user.tipo_autenticacion}.`);
  }

  //Verificar la cuenta
  if (!user.esta_verificado) {
    throw new CredencialesInvalidasError('Tu cuenta no ha sido verificada. Por favor, revisa tu correo.');
  }

  const isMatch = await bcrypt.compare(password, user.contrasena);

  // Si la contraseña no coincide, lanza el mismo error de dominio.
  if (!isMatch) {
    throw new CredencialesInvalidasError('Contraseña incorrecta.');
  }

  // Actualizar última conexión
  await User.actualizarUltimaConexion(user.id_usuario);

  const appToken = jwt.sign(
    { userId: user.id_usuario, correo: user.correo, rol: user.rol },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  // Retornar usuario sin contraseña
  const { contrasena, ...userSinPassword } = user;
  return { user: userSinPassword, appToken };
}


export async function autRegistro({ nombre, ap_p, ap_m, fecha_nac, correo, password, genero, telefono, host }) {

  
  const existingUser = await User.buscarPorCorreo(correo);
  if (existingUser && existingUser.esta_verificado) {
     
      throw new CorreoYaRegistradoError('El correo ya está registrado');
  }

  let user;

  if (existingUser && !existingUser.esta_verificado) {
      
      console.log(`Reutilizando registro no verificado para: ${correo}`);
      user = existingUser;
  } else {
      
      const hash = await bcrypt.hash(password, 10);
      const nombreCompleto = `${nombre} ${ap_p || ''} ${ap_m || ''}`.trim();

      const nombre_usuario = await generarNombreUsuario(
        nombreCompleto,
        User.existeNombreUsuario
      );

      user = await User.crearUsuarioLocal({
        nombre, ap_p, ap_m, fecha_nac, correo,
        contrasena: hash,
        genero, telefono, nombre_usuario
      });
  }


  const token = crypto.randomBytes(32).toString('hex');
  const expiracion = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

  await guardarTokenRecuperacion(user.id_usuario, token, expiracion);

  const urlVerificacion = `http://${host}/api/auth/verificar/${token}`; 
  const mailOptions = { 
    from: process.env.MAIL_FROM,
    to: correo,
    subject: 'Verifica tu cuenta para Tlamatini Itinerarios',
    html: `
    <div style="background-color:#f3f4f6; padding:30px 0; font-family:Arial, Helvetica, sans-serif;">
      <div style="max-width:500px; margin:0 auto; background-color:#ffffff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); overflow:hidden;">
        
        <!-- Encabezado -->
        <div style="background-color:#15803d; padding:20px; text-align:center;">
          <h2 style="color:#ffffff; margin:0; font-size:20px;">Verificación de Cuenta</h2>
        </div>

        <!-- Contenido -->
        <div style="padding:25px 30px; text-align:center;">
          <p style="color:#4a5568; font-size:15px; line-height:1.6;">
            ¡Gracias por registrarte en <strong>Tlamatini Itinerarios</strong>!
          </p>

          <p style="color:#4a5568; font-size:15px; line-height:1.6;">
            Antes de comenzar, necesitamos confirmar tu cuenta.  
          </p>

          <!-- Botón -->
          <a href="${urlVerificacion}" 
            style="display:inline-block; background-color:#15803d; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; margin-top:15px; font-weight:bold; font-size:16px;">
            Verificar cuenta
          </a>

          <!-- Enlace alternativo -->
          <p style="color:#718096; font-size:13px; margin-top:20px;">
            Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
          </p>
          <p style="color:#15803d; font-size:13px; word-wrap:break-word;">
            <a href="${urlVerificacion}" style="color:#15803d; text-decoration:none;">
              ${urlVerificacion}
            </a>
          </p>
        </div>

        <!-- Pie -->
        <div style="background-color:#f1f5f9; text-align:center; padding:15px; font-size:13px; color:#718096;">
          © ${new Date().getFullYear()} Tlamatini Itinerarios. Todos los derechos reservados.
        </div>
      </div>
    </div>
    `,
      // Headers importantes
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high'
    },
    // Categorías para servicios de email
    categories: ['account-verification']
  };


  try {

      const info = await transporter.sendMail(mailOptions);

        console.log(' Email enviado:', {
          messageId: info.messageId,
          accepted: info.accepted, // Destinatarios que aceptaron
          rejected: info.rejected, // Destinatarios rechazados
          response: info.response
        });
  } catch (mailError) {
      console.error("ERROR DE ENVIO");
      console.error("El registro del usuario falló al intentar ENVIAR EL CORREO.");
      console.error("Revisa tus variables .env: MAIL_USER, MAIL_PASS, MAIL_HOST");
      console.error(mailError);
      
      throw new Error(`Error en el servidor. de correo: ${mailError.message}. El registro no pudo completarse.`);
  }


  
  return { message: 'Registro exitoso. Por favor, revisa tu correo para verificar tu cuenta.' };
}


export const solicitarRecuperacion = async (email, host) => {
    try {
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            throw new ValidacionError('El formato del correo electrónico es incorrecto');
        }

        // Buscar usuario
        const usuario = await User.buscarPorCorreo(email); 
        if (!usuario) {
            // Log para auditoría pero no revelamos que el email no existe
            console.log(`Intento de recuperación para correo no registrado: ${email}`);
            // Retornamos éxito igual por seguridad
            return { 
                success: true, 
                message: 'Si el email está registrado, recibirás un enlace de recuperación' 
            };
        }

        // Verificar tipo de autenticación
        if (usuario.tipo_autenticacion === 'google') {
            throw new CredencialesInvalidasError('Tu cuenta utiliza inicio de sesión con Google. Por favor, inicia sesión con Google para acceder.');
        }

        // Generar Token
        const token = crypto.randomBytes(32).toString('hex');
        const expiracion = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
        
        // Guardar Token en DB
        await guardarTokenRecuperacion(usuario.id_usuario, token, expiracion);


        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
        const urlRecuperacion = `${FRONTEND_URL}/reset-password/${token}`;

        // Configurar correo
        const mailOptions = {
            from: {
                name: 'Tlamatini Itinerarios',
                address: process.env.MAIL_FROM
            },
            to: usuario.correo,
            subject: 'Recuperación de Contraseña - Tlamatini Itinerarios',
            html: `
            <div style="background-color:#f3f4f6; padding:30px 0; font-family:Arial, Helvetica, sans-serif;">
                <div style="max-width:500px; margin:0 auto; background-color:#ffffff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); overflow:hidden;">
                    
                    <!-- Encabezado -->
                    <div style="background-color:#15803d; padding:20px; text-align:center;">
                        <h2 style="color:#ffffff; margin:0; font-size:20px;">Recuperar Contraseña</h2>
                    </div>

                    <!-- Contenido -->
                    <div style="padding:25px 30px; text-align:center;">
                        <p style="color:#4a5568; font-size:15px; line-height:1.6;">
                            Recibimos una solicitud para restablecer tu contraseña de 
                            <strong>Tlamatini Itinerarios</strong>.
                        </p>

                        <p style="color:#4a5568; font-size:15px; line-height:1.6;">
                            Para continuar, haz clic en el siguiente botón.  
                            Este enlace es válido por <strong>1 hora</strong>.
                        </p>

                        <!-- BOTÓN -->
                        <a href="${urlRecuperacion}"
                            style="display:inline-block; background-color:#15803d; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; margin-top:15px; font-weight:bold; font-size:16px;">
                            Restablecer contraseña
                        </a>

                        <!-- Enlace alternativo -->
                        <p style="color:#718096; font-size:13px; margin-top:20px;">
                            Si el botón no funciona, copia y pega este enlace en tu navegador:
                        </p>
                        <p style="color:#15803d; font-size:13px; word-wrap:break-word;">
                            <a href="${urlRecuperacion}" style="color:#15803d; text-decoration:none;">
                                ${urlRecuperacion}
                            </a>
                        </p>

                        <!-- Advertencia de seguridad -->
                        <div style="background-color:#fef3cd; border:1px solid #fde68a; border-radius:6px; padding:12px; margin-top:20px;">
                            <p style="color:#92400e; font-size:12px; margin:0;">
                                <strong>Seguridad:</strong> Si no solicitaste este cambio, 
                                por favor ignora este mensaje y verifica la seguridad de tu cuenta.
                            </p>
                        </div>
                    </div>

                    <!-- Pie -->
                    <div style="background-color:#f1f5f9; text-align:center; padding:15px; font-size:13px; color:#718096;">
                        © ${new Date().getFullYear()} Tlamatini Itinerarios. Todos los derechos reservados.
                    </div>
                </div>
            </div>
            `,
            headers: {
                'X-Priority': '1',
                'X-MSMail-Priority': 'High',
                'Importance': 'high'
            },
            category: 'password-reset'
        };

        // Enviar correo con manejo de errores específico
        let info;
        try {
            info = await transporter.sendMail(mailOptions);
            
            console.log('Email de recuperación enviado:', {
                messageId: info.messageId,
                accepted: info.accepted,
                rejected: info.rejected,
                response: info.response,
                usuario: usuario.id_usuario,
                timestamp: new Date().toISOString()
            });

        } catch (emailError) {
            
            console.error('❌ Error enviando email de recuperación:', {
                error: emailError.message,
                code: emailError.code,
                usuario: usuario.id_usuario,
                timestamp: new Date().toISOString()
            });

            // No exponer detalles internos al cliente
            throw new Error('No pudimos enviar el email de recuperación. Por favor, Inténtalo de nuevo mas tarde..');
        }

        return { 
            success: true, 
            message: 'Si el email está registrado, recibirás un enlace de recuperación shortly.',
            messageId: info.messageId 
        };

    } catch (error) {
        console.error(' Error en solicitarRecuperacion:', {
            error: error.message,
            email: email,
            timestamp: new Date().toISOString(),
            stack: error.stack
        });

        // Si ya es un error de dominio, lo propagamos
        if (error instanceof ValidacionError || error instanceof CredencialesInvalidasError) {
            throw error;
        }

        // Para otros errores, no revelamos detalles internos
        throw new Error('No pudimos procesar tu solicitud. Por favor, Inténtalo de nuevo mas tarde..');
    }
};

export const verificarCorreo = async (token) => {
  // 1. Verificar Token
  const tokenData = await buscarTokenValido(token);
  if (!tokenData) {
    throw new CredencialesInvalidasError('El enlace de verificación no es válido');
  }

  // 2. Verificar Expiración
  if (new Date() > tokenData.expiracion) {
    await eliminarToken(token);
    throw new CredencialesInvalidasError('El enlace de verificación ha expirado.');
  }

  // 3. ¡Verificar al usuario!
  await verificarUsuario(tokenData.id_usuario);
  
  // 4. Invalidar Token
  await eliminarToken(token);
};



export const restablecerContrasena = async (token, nuevaPassword, confirmarPassword) => {

    console.log("Iniciando restablecimiento de contraseña para token:", token);
    console.log("Contraseña nueva recibida:", nuevaPassword, confirmarPassword);


    // Verificar Token (Usando el Modelo m-user.js)
    console.log("TOKEN EN SERVICE:", token);
    const tokenData = await buscarTokenValido(token);
    if (!tokenData) {
        throw new CredencialesInvalidasError('El enlace de recuperación no es válido');
    }

    // Verificar Expiración
    if (new Date() > tokenData.expiracion) {
        await eliminarToken(token); // Limpiar token expirado
        throw new CredencialesInvalidasError('El enlace de recuperación ha expirado.');
    }

    // Actualizar Contraseña (Usando Modelo m-user.js y u-bcrypt.js)
    const contrasenaHasheada = await hashPassword(nuevaPassword);
    await actualizarContrasena(tokenData.id_usuario, contrasenaHasheada);
    
    // Invalidar Token
    await eliminarToken(token);

};