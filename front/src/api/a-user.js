import { API_URL } from './a-config';
import axios from 'axios';
import { subirImagen } from './a-storage';

/* ----------------------------------------
  BUSCAR USUARIOS
---------------------------------------- */
export const searchUsers = async (query = "") => {
  try {
    const response = await fetch(
      `${API_URL}/user/search?query=${encodeURIComponent(query)}`,
      { method: "GET" }
    );

    const data = await response.json();
    // console.log("🔎 searchUsers → respuesta backend:", data);

    return data.results || [];

  } catch (error) {
    console.error("Error en searchUsers (frontend):", error);
    return [];
  }
};


/* ----------------------------------------
  PERFIL PUBLICO BÁSICO (CORREGIDO)
---------------------------------------- */
export const getPublicUserAPI = async (idUsuario) => {
  try {
    const response = await fetch(`${API_URL}/user/public/${idUsuario}`);
    
    if (!response.ok) throw new Error("Error al obtener perfil");

    const data = await response.json();

    // --- CORRECCIÓN AQUÍ ---
    // Si el backend devuelve { usuario: {...} }, usamos eso.
    // Si devuelve {...} directo (como tu s-user.js), usamos data.
    return data.usuario || data; 
    // -----------------------

  } catch (error) {
    console.error("Error en getPublicUserAPI:", error);
    return null;
  }
};
/* ----------------------------------------
  ELIMINAR CUENTA
---------------------------------------- */
export const eliminarCuentaAPI = async (token, datosConfirmacion) => {
  // datosConfirmacion será: { password: "..." } o { username: "..." }
  try {
    // IMPORTANTE: En axios.delete, el cuerpo (body) va dentro de "data"
    const response = await axios.delete(`${API_URL}/user/eliminarUsuario`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: datosConfirmacion 
    });
    return response.data;
  } catch (error) {
    console.error("Error eliminando cuenta:", error);
    throw error; 
  }
};


/*ACTUALIZAR PERFIL*/
export const actualizarPerfilAPI = async (token, userId, datos) => {
  try {
    let fotoUrl = datos.avatar;

    if (datos.avatarFile) {
      fotoUrl = await subirImagen(datos.avatarFile, 'perfiles', userId);
      console.log('Imagen de perfil subida. URL:', fotoUrl);
    }

    const datosParaBackend = {
      nombre: datos.name,
      usuario: datos.username,
      descripcion: datos.bio,
      foto: fotoUrl
    };

    const response = await axios.put(
      `${API_URL}/user/actualizarUsuario`, 
      datosParaBackend, 
      { 
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json', // ← JSON, no FormData
        },
      }
    );
    return response.data;

  } catch (error) {
    console.error(' Error en actualizarPerfilAPI:', error);
    throw error;
  }
};

//CAMABIAR CONTRASEÑA
export const cambiarContraseñaAPI = async (token, userId, passwordData) => {
  try {
    const response = await axios.put(
      `${API_URL}/user/cambiar-contrasena`,
      {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/* ----------------------------------------
  PUBLICACIONES PUBLICAS DEL USUARIO
---------------------------------------- */
export const getPublicPostsAPI = async (idUsuario) => {
  try {
    const response = await fetch(`${API_URL}/publicaciones/public/${idUsuario}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Endpoint no encontrado, intentando con alternativa...');
        return [];
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.publicaciones || [];

  } catch (error) {
    console.error("Error en getPublicPostsAPI:", error);
    return [];
  }
};