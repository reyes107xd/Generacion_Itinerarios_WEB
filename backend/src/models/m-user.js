// src/models/m-user.js
import { supabase } from '../config/cf-con-db.js';

const User = {
  // En m-user.js - Agregar este método
  async obtenerInfoBloqueo(idUsuario) {
    const { data: bloqueo, error } = await supabase
      .from('usuario_bloqueado')
      .select('duracion, fecha_desbloqueo, motivo, fecha_bloqueo')
      .eq('id_usuario', idUsuario)
      .eq('estado', 'activo')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No hay bloqueo activo
      }
      console.error('Error al obtener info de bloqueo:', error);
      return null;
    }

    return bloqueo;
  },
  // En m-user.js - Agregar este método
  async actualizarUltimaConexion(idUsuario) {
    const { error } = await supabase
      .from('usuario')
      .update({
        ultima_conexion: new Date().toISOString()
      })
      .eq('id_usuario', idUsuario);

    if (error) {
      console.error('Error al actualizar última conexión:', error);
      throw new Error('Error al actualizar última conexión');
    }
  },

  async buscarPorCorreo(correo) {
    try {
      const { data, error } = await supabase
        .from('usuario')
        .select(`
          id_usuario,
          correo,
          contrasena,
          tipo_autenticacion,
          rol,
          estado,
          esta_verificado,
          fecha_creacion,
          perfil_usuario (
            nombre,
            ap_p,
            ap_m,
            fecha_nac,
            genero,
            telefono,
            foto,
            nombre_usuario,
            descripcion
          )
        `)
        .eq('correo', correo)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const perfil = data.perfil_usuario?.[0] || data.perfil_usuario || {};
      delete data.perfil_usuario;

      return { ...data, ...perfil };
    } catch (error) {
      console.error('Error buscando usuario por correo:', error.message);
      throw error;
    }
  },

  async buscarPorId(id_usuario) {

    try {
      const { data, error } = await supabase
        .from('usuario')
        .select(`
          id_usuario,
          correo,
          contrasena,
          tipo_autenticacion,
          rol,
          estado,
          esta_verificado,
          fecha_creacion,
          perfil_usuario (
            nombre,
            ap_p,
            ap_m,
            fecha_nac,
            genero,
            telefono,
            foto,
            nombre_usuario,
            descripcion,
            configuracion_notificaciones
          )
        `)
        .eq('id_usuario', id_usuario)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const perfil = data.perfil_usuario?.[0] || data.perfil_usuario || {};
      delete data.perfil_usuario;

      return { ...data, ...perfil };
    } catch (error) {
      console.error('Error buscando usuario por ID:', error.message);
      throw error;
    }
  },

  async actualizar(id_usuario, datos) {
    try {
      const camposUsuario = {};
      const camposPerfil = {};

      const mapaTraduccion = {
        'usuario': 'nombre_usuario',
        'username': 'nombre_usuario',
        'biografia': 'descripcion',
        'bio': 'descripcion',
        'avatar': 'foto',
      };
      
      const camposTablaUsuario = ['correo', 'rol', 'esta_verificado'];
      const camposTablaPerfil = [
        'nombre',
        'ap_p',
        'ap_m',
        'fecha_nac',
        'genero',
        'telefono',
        'foto',
        'nombre_usuario',
        'descripcion',
        'configuracion_notificaciones'
      ];

      for (const keyOriginal in datos) {
        const dbKey = mapaTraduccion[keyOriginal] || keyOriginal;
        const valor = datos[keyOriginal];
        
        // IMPORTANTE: Permitir null para limpiar campos
        if (valor === '' && (dbKey === 'ap_p' || dbKey === 'ap_m')) {
          // Convertir string vacío a null para apellidos
          camposPerfil[dbKey] = null;
        } else if (camposTablaUsuario.includes(dbKey)) {
          camposUsuario[dbKey] = valor;
        } else if (camposTablaPerfil.includes(dbKey)) {
          camposPerfil[dbKey] = valor;
        }
      }

      console.log('Campos para actualizar en perfil:', camposPerfil);
      
      // Actualizar perfil si hay campos
      if (Object.keys(camposPerfil).length > 0) {
        const { error: errorPerfil } = await supabase
          .from('perfil_usuario')
          .update(camposPerfil)
          .eq('id_usuario', id_usuario);
        if (errorPerfil) throw errorPerfil;
      }

      // Actualizar usuario si hay campos
      if (Object.keys(camposUsuario).length > 0) {
        const { error: errorUsuario } = await supabase
          .from('usuario')
          .update(camposUsuario)
          .eq('id_usuario', id_usuario);
        if (errorUsuario) throw errorUsuario;
      }

      return await this.buscarPorId(id_usuario);
    } catch (error) {
      console.error('Error actualizando usuario:', error.message);
      throw error;
    }
  },

  /** Eliminar usuario (cascada automática) */
  async eliminar(id_usuario) {
    console.log('BD Eliminando usuario con ID:', id_usuario);
    try {
      const { error } = await supabase
        .from('usuario')
        .delete()
        .eq('id_usuario', id_usuario);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error eliminando usuario:', error.message);
      throw error;
    }
  },


  async existeNombreUsuario(nombre_usuario) {
    try {
      const { data, error } = await supabase
        .from('perfil_usuario')
        .select('id_usuario')
        .eq('nombre_usuario', nombre_usuario)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Error verificando nombre de usuario:', error.message);
      throw error;
    }
  },

  /** Crear usuario local */
  async crearUsuarioLocal({ nombre, ap_p, ap_m, fecha_nac, correo, contrasena, genero, telefono, nombre_usuario }) {
    const client = supabase;
    try {
      //  Insertar en USUARIO
      const { data: usuario, error: userError } = await client
        .from('usuario')
        .insert({
          correo,
          contrasena,
          tipo_autenticacion: 'local',
          rol: 'turista',
          esta_verificado: false
        })
        .select('id_usuario, correo')
        .single();

      if (userError) throw userError;

      //  Insertar en PERFIL_USUARIO
      const { error: perfilError } = await client
        .from('perfil_usuario')
        .insert({
          id_usuario: usuario.id_usuario,
          nombre,
          ap_p,
          ap_m,
          fecha_nac,
          genero,
          telefono,
          nombre_usuario
        });

      if (perfilError) throw perfilError;

      // Insertar también en TURISTA (ya que el rol por defecto es "turista")
      const { error: turistaError } = await client
        .from('turista')
        .insert({ id_turista: usuario.id_usuario });

      if (turistaError) throw turistaError;

      return {
        id_usuario: usuario.id_usuario,
        correo,
        nombre,
        ap_p,
        ap_m,
        fecha_nac,
        genero,
        telefono
      };
    } catch (error) {
      console.error('Error creando usuario local:', error.message);
      throw error;
    }
  },

  /** Crear usuario con Google */
  async crearUsuarioGoogle({ nombre, correo, foto, tipo_autenticacion, nombre_usuario, ap_m, ap_p }) {
    const client = supabase;
    try {
      //  Insertar en USUARIO
      const { data: usuario, error: userError } = await client
        .from('usuario')
        .insert({
          correo,
          tipo_autenticacion,
          rol: 'turista',
          esta_verificado: true
        })
        .select('id_usuario, correo')
        .single();

      if (userError) throw userError;

      //  Insertar en PERFIL_USUARIO
      const { error: perfilError } = await client
        .from('perfil_usuario')
        .insert({
          id_usuario: usuario.id_usuario,
          nombre,
          foto,
          nombre_usuario,
          ap_m,
          ap_p
        });

      if (perfilError) throw perfilError;

      //  Insertar en TURISTA
      const { error: turistaError } = await client
        .from('turista')
        .insert({ id_turista: usuario.id_usuario });

      if (turistaError) throw turistaError;

      return {
        id_usuario: usuario.id_usuario,
        correo,
        nombre,
        foto,
        nombre_usuario
      };
    } catch (error) {
      console.error('Error creando usuario Google:', error.message);
      throw error;
    }
  }
};

export const verificarUsuario = async (id_usuario) => {
  const { error } = await supabase
    .from('usuario')
    .update({ esta_verificado: true })
    .eq('id_usuario', id_usuario);

  if (error) {
    console.error('Error al verificar usuario:', error);
    throw error;
  }
};

// Guarda o reemplaza el token de recuperación
export const guardarTokenRecuperacion = async (id_usuario, token, expiracion) => {
  const { error: deleteError } = await supabase
    .from('token_recuperacion')
    .delete()
    .eq('id_usuario', id_usuario);
  if (deleteError) throw deleteError;

  const { data, error: insertError } = await supabase
    .from('token_recuperacion')
    .insert({ id_usuario, token, expiracion })
    .select('*')
    .single();

  if (insertError) throw insertError;
  return data;
};

// Busca un token válido y el usuario asociado
export const buscarTokenValido = async (token) => {
  const { data, error } = await supabase
    .from('token_recuperacion')
    .select(`
      id_usuario,
      expiracion,
      usuario (correo)
    `)
    .eq('token', token)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id_usuario: data.id_usuario,
    correo: data.usuario?.correo,
    expiracion: data.expiracion
  };
};

// Actualiza contraseña
export const actualizarContrasena = async (id_usuario, contrasenaHasheada) => {
  const { error } = await supabase
    .from('usuario')
    .update({ contrasena: contrasenaHasheada })
    .eq('id_usuario', id_usuario);
  if (error) throw error;
};

// Elimina token usado
export const eliminarToken = async (token) => {
  const { error } = await supabase
    .from('token_recuperacion')
    .delete()
    .eq('token', token);
  if (error) throw error;
};

export default User;

//verifica si dos usuarios son amigos
export const verificarEstadoAmistad = async (idUsuario1, idUsuario2) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes_amistad')
      .select('id_solicitud, estado')
      .or(`and(id_emisor.eq.${idUsuario1},id_receptor.eq.${idUsuario2}),and(id_emisor.eq.${idUsuario2},id_receptor.eq.${idUsuario1})`)
      .maybeSingle();

    if (error) throw error;

    return {
      sonAmigos: data && data.estado === 'aceptada',
      solicitudPendiente: data && data.estado === 'pendiente',
      estado: data?.estado || 'none',
      id_solicitud: data?.id_solicitud
    };
  } catch (error) {
    console.error('Error en verificarEstadoAmistad:', error);
    return {
      sonAmigos: false,
      solicitudPendiente: false,
      estado: 'error'
    };
  }
};

export const contarAmigos = async (idUsuario) => {
  try {
    const { count, error } = await supabase
      .from('solicitudes_amistad')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'aceptada')
      .or(`id_emisor.eq.${idUsuario},id_receptor.eq.${idUsuario}`);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error contando amigos:', error);
    return 0;
  }
};



/* ---------------------------------------------------------
   FUNCIONES DE AMISTAD
--------------------------------------------------------- */
export const enviarSolicitudAmistad = async (idEmisor, idReceptor) => {
  try {
    // Verificar si ya existe una solicitud
    const { data: solicitudExistente, error: errorExistente } = await supabase
      .from('solicitudes_amistad')
      .select('*')
      .or(`and(id_emisor.eq.${idEmisor},id_receptor.eq.${idReceptor}),and(id_emisor.eq.${idReceptor},id_receptor.eq.${idEmisor})`)
      .single();

    if (solicitudExistente) {
      if (solicitudExistente.estado === 'pendiente') {
        throw new Error('Ya hay una solicitud pendiente entre estos usuarios');
      }
      if (solicitudExistente.estado === 'aceptada') {
        throw new Error('Ya son amigos');
      }
    }

    // Crear nueva solicitud
    const { data, error } = await supabase
      .from('solicitudes_amistad')
      .insert({
        id_emisor: idEmisor,
        id_receptor: idReceptor,
        estado: 'pendiente',
        fecha_solicitud: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error en enviarSolicitudAmistad:', error);
    throw error;
  }
};

export const obtenerSolicitudesPendientes = async (idUsuario) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes_amistad')
      .select(`
        id_solicitud,
        fecha_solicitud,
        estado,
        emisor: perfil_usuario!solicitudes_amistad_id_emisor_fkey (
          id_usuario,
          nombre,
          ap_p,
          ap_m,
          foto,
          nombre_usuario
        ),
        receptor: perfil_usuario!solicitudes_amistad_id_receptor_fkey (
          id_usuario,
          nombre,
          ap_p,
          ap_m,
          foto,
          nombre_usuario
        )
      `)
      .eq('id_receptor', idUsuario)
      .eq('estado', 'pendiente');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error en obtenerSolicitudesPendientes:', error);
    return [];
  }
};

export const responderSolicitudAmistad = async (idSolicitud, idUsuario, accion) => {
  try {
    // Verificar que la solicitud existe y está pendiente
    const { data: solicitud, error: errorSolicitud } = await supabase
      .from('solicitudes_amistad')
      .select('*')
      .eq('id_solicitud', idSolicitud)
      .eq('estado', 'pendiente')
      .single();

    if (errorSolicitud) throw new Error('Solicitud no encontrada');
    if (solicitud.id_receptor !== idUsuario) {
      throw new Error('No tienes permiso para responder esta solicitud');
    }

    // Actualizar estado
    const { data, error } = await supabase
      .from('solicitudes_amistad')
      .update({
        estado: accion,
        fecha_respuesta: new Date().toISOString()
      })
      .eq('id_solicitud', idSolicitud)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error en responderSolicitudAmistad:', error);
    throw error;
  }
};

export const eliminarAmistad = async (idUsuario1, idUsuario2) => {
  try {
    const { error } = await supabase
      .from('solicitudes_amistad')
      .delete()
      .or(`and(id_emisor.eq.${idUsuario1},id_receptor.eq.${idUsuario2}),and(id_emisor.eq.${idUsuario2},id_receptor.eq.${idUsuario1})`)
      .eq('estado', 'aceptada');

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error en eliminarAmistad:', error);
    throw error;
  }
};

export const obtenerAmigos = async (idUsuario) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes_amistad')
      .select(`
        id_solicitud,
        fecha_solicitud,
        emisor: perfil_usuario!solicitudes_amistad_id_emisor_fkey (
          id_usuario,
          nombre,
          ap_p,
          ap_m,
          foto,
          nombre_usuario,
          descripcion
        ),
        receptor: perfil_usuario!solicitudes_amistad_id_receptor_fkey (
          id_usuario,
          nombre,
          ap_p,
          ap_m,
          foto,
          nombre_usuario,
          descripcion
        )
      `)
      .or(`id_emisor.eq.${idUsuario},id_receptor.eq.${idUsuario}`)
      .eq('estado', 'aceptada');

    if (error) throw error;

    // Transformar datos para obtener solo la información del amigo
    const amigos = data.map(item => {
      const esEmisor = item.emisor.id_usuario === idUsuario;
      const amigo = esEmisor ? item.receptor : item.emisor;
      return {
        ...amigo,
        id_solicitud: item.id_solicitud,
        fecha_amistad: item.fecha_solicitud
      };
    });

    return amigos;
  } catch (error) {
    console.error('Error en obtenerAmigos:', error);
    return [];
  }
};