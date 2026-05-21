/*
    Contexto para manejar alertas globales en la aplicación.
    Proporciona funciones para mostrar y cerrar alertas desde cualquier componente.
*/

import { createContext, useContext, useState, useEffect } from 'react';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    show: false,
    type: 'success',
    title: '',
    message: '',
    duration: 0 // ya no se usa
  });

  const showAlert = (type, title, message) => {
    setAlert({ show: true, type, title, message });
  };

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, show: false }));
  };

  // Cerrar con ESC
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        closeAlert();
      }
    };

    if (alert.show) {
      window.addEventListener('keydown', handleKey);
    }

    return () => {
      window.removeEventListener('keydown', handleKey);
    };
  }, [alert.show]);

  return (
    <AlertContext.Provider value={{ alert, showAlert, closeAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
