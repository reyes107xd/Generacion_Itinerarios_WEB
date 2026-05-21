import { API_URL } from './a-config.js';

/**
 * Registro de usuario tradicional
 */
export async function registrarUsuario(payload) {
    const response = await fetch(`${API_URL}/auth/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const mensajeReal = data.error || data.message || 'Error al registrar usuario';
        throw new Error(mensajeReal);
    }

    return response.json();
}

/**
 * Login local
 */
export async function loginUsuario(payload) {

    console.log('Iniciando login con :', API_URL);
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        // Maneja errores de 401 (contraseña incorrecta) o 403/409/otros
        const errorMsg = data.error || data.message || 'Error al iniciar sesión';
        throw new Error(errorMsg);
    }

    return data; // contiene { user, appToken, message }
}

/**
 * Autenticación con Google
 */
export async function autenticarConGoogle(idToken) {
    const res = await fetch(`${API_URL}/auth/google-login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
    });
    console.log('Respuesta de Google login:', res);

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al autenticar con Google');
    }

    return res.json(); // { user, appToken }
}


/** 
 * Solicitar recuperación de contraseña 
 */
export async function solicitarRecuperacion(email) {
  const response = await fetch(`${API_URL}/auth/recuperar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const mensajeReal = data.error || data.message || 'No se pudo enviar el enlace de recuperación';
    throw new Error(mensajeReal);
  }

  return data; // normalmente contendrá { message: '...' }
}

export async function resetPassword(token, nuevaPassword) {
  const response = await fetch(`${API_URL}/auth/restablecer/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nuevaPassword })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al restablecer la contraseña');
  }

  return response.json();
}
