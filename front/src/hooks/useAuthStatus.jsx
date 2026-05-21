// src/hooks/useAuthStatus.js
import { useState, useEffect } from 'react';

export function useAuthStatus() {
  // 1. Asume que el usuario NO está logueado al inicio.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 2. Aquí revisas el almacenamiento (localStorage, cookies, etc.)
    const userToken = localStorage.getItem('userToken'); 
    
    // **IMPORTANTE:** Debes implementar la lógica real de verificación del token
    if (userToken) {
      // Si el token existe y es válido, cambia el estado
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    
    setIsLoading(false); // Termina la carga
  }, []);

  // 3. Devuelve el estado de la sesión
  return { isAuthenticated, isLoading };
}