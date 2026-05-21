// backend/src/services/s-user.js
import bcrypt from 'bcryptjs';
import User from '../models/m-user.js';
import { procesarNombreCompleto } from '../utils/u-nombre.js';
import { supabase } from '../config/cf-con-db.js';
import {
  ErrorUsuarioNoEncontrado,
  ErrorActualizacionInvalida,
  CredencialesInvalidasError
} from '../utils/u-errores-dominio.js';
import {
  actualizarContrasena  // ← Importa esta función nombrada
} from '../models/m-user.js';  // MISMO archivo

/* ---------------------------------------------------------
   OBTENER POR ID
--------------------------------------------------------- */
export async function obtenerUsuarioPorIdS(id_usuario) {
  const user = await User.buscarPorId(id_usuario);
  if (!user) throw new ErrorUsuarioNoEncontrado();
  return user;
}

/* ---------------------------------------------------------
   ACTUALIZAR
--------------------------------------------------------- */
export async function actualizarUsuarioS(id_usuario, datos) {
  const user = await User.buscarPorId(id_usuario);
  if (!user) throw new ErrorUsuarioNoEncontrado();

  console.log('Datos recibidos para actualización:', datos);

  if (datos.correo || datos.tipo_autenticacion) {
    throw new ErrorActualizacionInvalida('No puedes modificar estos campos.');
  }

  // Si viene el campo "nombre" (nombre completo), procesarlo
  if (datos.nombre && typeof datos.nombre === 'string') {
    try {
      const { nombre, ap_p, ap_m } = procesarNombreCompleto(datos.nombre);
      
      console.log('Nombre procesado:', nombre);
      console.log('Apellido paterno procesado:', ap_p);
      console.log('Apellido materno procesado:', ap_m);
      
      // Agregar los campos divididos al objeto datos
      datos.nombre = nombre;
      datos.ap_p = ap_p || null;  // Siempre enviar, aunque sea null
      datos.ap_m = ap_m || null;  // Siempre enviar, aunque sea null
      
    } catch (error) {
      // Relanzar el error para que el frontend lo capture
      throw new Error(`Error en el nombre: ${error.message}`);
    }
  }

  const actualizado = await User.actualizar(id_usuario, datos);

  const { contrasena, ...userSinPassword } = actualizado;
  return userSinPassword;
}
/* ---------------------------------------------------------
   ELIMINAR
--------------------------------------------------------- */
export async function eliminarUsuarioS({ id_usuario, confirmacion }) {
  const user = await User.buscarPorId(id_usuario);
  if (!user) throw new ErrorUsuarioNoEncontrado();

  if (user.tipo_autenticacion === 'local') {
    const { password } = confirmacion;
    if (!password) throw new CredencialesInvalidasError('Contraseña requerida.');
    const coincide = await bcrypt.compare(password, user.contrasena);
    if (!coincide) throw new CredencialesInvalidasError('Contraseña incorrecta.');
  } else {
    const { username } = confirmacion;
    if (!username || username !== user.nombre_usuario) {
      throw new CredencialesInvalidasError('Confirmación inválida.');
    }
  }

  await User.eliminar(id_usuario);
  return { message: 'Cuenta eliminada correctamente.' };
}

/* ---------------------------------------------------------
   BUSCAR USUARIOS
--------------------------------------------------------- */
export async function searchUsersS(query) {
  try {
    if (!query || query.trim() === "") return [];

    const texto = `%${query}%`;

    const filtro =
      `nombre.ilike.${texto},` +
      `ap_p.ilike.${texto},` +
      `ap_m.ilike.${texto},` +
      `nombre_usuario.ilike.${texto}`;

    const { data, error } = await supabase
      .from("perfil_usuario")
      .select(`
        id_usuario,
        nombre,
        ap_p,
        ap_m,
        nombre_usuario,
        foto,
        usuario (
          esta_verificado
        )
      `)
      .or(filtro)
      .limit(15);

    if (error) throw error;

    // --- CORRECCIÓN EN EL FILTRO ---
    // Aseguramos que u.usuario exista antes de acceder a .esta_verificado
    return data.filter((u) => u.usuario && u.usuario.esta_verificado === true);
    // -------------------------------

  } catch (err) {
    console.error(" Error en searchUsersS:", err);
    return [];
  }
}

// Agregar en s-user.js, después de las otras funciones
export async function cambiarContrasenaS(id_usuario, currentPassword, newPassword) {

  try {
    // 1. Validar complejidad de la nueva contraseña

    const minLength = newPassword.length >= 8;
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (!minLength || !hasLowercase || !hasUppercase || !hasNumber || !hasSpecialChar) {
      const errorMessages = [];
      if (!minLength) errorMessages.push("al menos 8 caracteres");
      if (!hasLowercase) errorMessages.push("una letra minúscula");
      if (!hasUppercase) errorMessages.push("una letra mayúscula");
      if (!hasNumber) errorMessages.push("un número");
      if (!hasSpecialChar) errorMessages.push("un carácter especial");

      throw new Error(`La contraseña debe contener: ${errorMessages.join(", ")}`);
    }

    // 2. Obtener usuario
    const user = await User.buscarPorId(id_usuario);

    if (!user) {
      throw new ErrorUsuarioNoEncontrado();
    }

    // 3. Verificar que sea autenticación local
    if (user.tipo_autenticacion !== 'local') {
      throw new Error('Este usuario no tiene contraseña local');
    }

    // 4. Verificar contraseña actual
    if (!user.contrasena) {
      throw new Error('No hay contraseña configurada para este usuario');
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.contrasena);

    if (!passwordMatch) {
      throw new CredencialesInvalidasError('La contraseña actual es incorrecta');
    }

    // 5. Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const nuevaContrasenaHash = await bcrypt.hash(newPassword, salt);

    // 6. Actualizar en BD
    await actualizarContrasena(id_usuario, nuevaContrasenaHash);

    return {
      success: true,
      message: 'Contraseña actualizada correctamente'
    };

  } catch (error) {
    console.error(' ERROR en cambiarContrasenaS:', error.message);
    throw error;
  }
}