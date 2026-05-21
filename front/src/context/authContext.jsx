/* authContext.jsx
  Contexto para manejar la autenticación del usuario en la aplicación y sesiones.
  Proporciona funciones para login, logout y manejo del estado del usuario.
*/

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getFullName, generateAvatarUrl } from '../utils/userHelpers'; 

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para cerrar sesión
  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    setUser(null);
    setToken(null);
  }, []);

  // Función para obtener el avatar consistente
  const getAvatarUrl = useCallback(() => {
    if (!user) return generateAvatarUrl(null, 'Usuario');
    
    const fullName = getFullName(user);
    return generateAvatarUrl(user.foto, fullName);
  }, [user]);

  // Función de login con opción "recordarme"
  const login = (userData, jwt, rememberMe = true) => {
    console.log('Token recibido en login:', jwt);
    console.log('🔍 USERDATA recibido en login:', userData);
    console.log('📋 Propiedades de userData:', Object.keys(userData));
    // Generar avatar consistente antes de guardar
    const userWithAvatar = {
      ...userData,
      avatarUrl: generateAvatarUrl(userData.foto, getFullName(userData))
    };

    if (rememberMe) {
      localStorage.setItem('user', JSON.stringify(userWithAvatar));
      localStorage.setItem('token', jwt);
    } else {
      sessionStorage.setItem('user', JSON.stringify(userWithAvatar));
      sessionStorage.setItem('token', jwt);
    }
    
    setUser(userWithAvatar);
    setToken(jwt);

    console.log('Usuario logueado:', userWithAvatar);
    
    // Configurar auto-logout basado en expiración del token
    try {
      const decoded = jwtDecode(jwt);
      const expiresAt = decoded.exp * 1000;
      const timeout = expiresAt - Date.now();
      if (timeout > 0) {
        setTimeout(() => logout(), timeout);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Token inválido', err);
      logout();
    }
  };

  // Cargar user y token al iniciar la app
  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        if (decoded.exp * 1000 > Date.now()) {
          const userData = JSON.parse(storedUser);
          
          // Asegurar que el avatar esté actualizado
          const userWithAvatar = {
            ...userData,
            avatarUrl: generateAvatarUrl(userData.foto, getFullName(userData))
          };
          
          setUser(userWithAvatar);
          setToken(storedToken);

          // Auto-logout según expiración
          const timeout = decoded.exp * 1000 - Date.now();
          setTimeout(() => logout(), timeout);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Token inválido', err);
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  const updateUser = (nuevosDatos) => {
    setUser(prevUser => {
      const updatedUser = {
        ...prevUser,
        ...nuevosDatos
      };
      
      // Actualizar el avatar cuando se actualizan los datos del usuario
      if (nuevosDatos.foto || nuevosDatos.nombre || nuevosDatos.ap_p) {
        updatedUser.avatarUrl = generateAvatarUrl(
          nuevosDatos.foto || prevUser.foto, 
          getFullName(updatedUser)
        );
      }
      
      // Actualizar en localStorage/sessionStorage
      const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        updateUser,
        getAvatarUrl // ← Nueva función para obtener avatar consistente
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}