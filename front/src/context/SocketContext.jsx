import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client'; 
import { useAuth } from './authContext';
import { BACKEND_URL } from '../api/a-config';


const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useAuth(); 

  // INICIALIZAR LA CONEXIÓN
  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'], 
        withCredentials: true,
        autoConnect: true,
        reconnection: true,        // Aseguramos reintentos
        reconnectionAttempts: 10,  // Intentar varias veces
        reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Limpieza al desmontar la app
    return () => newSocket.disconnect();
  }, []); // Array vacío = solo al montar el componente


  // 2. GESTIÓN DE SALAS Y RECONEXIÓN 
  useEffect(() => {
    // Normalizamos el ID
    const userId = user?.id || user?.id_usuario;

    if (!socket || !isAuthenticated || !userId) return;

    // Definimos la función de registro para poder reusarla
    const registerUser = () => {
        console.log(`🔄 [SocketContext] (Re)Conectado. Registrando usuario: ${userId}`);
        socket.emit('register_turista', userId);
    };

    // A) Si ya estamos conectados al montar este efecto, registramos de una vez
    if (socket.connected) {
        registerUser();
    }

    // B) Escuchamos el evento 'connect'. 
    // Esto es VITAL: si se cae la red y vuelve, socket.io lanza 'connect' de nuevo.
    // Sin esto, el servidor te olvida tras una reconexión.
    socket.on('connect', registerUser);

    // Debugging de eventos
    socket.on('disconnect', () => console.warn("Socket desconectado temporalmente"));
    socket.on('connect_error', (err) => console.error("Error socket:", err.message));

    // Limpieza de listeners cuando el usuario cambia o se desmonta
    return () => {
        socket.off('connect', registerUser);
        socket.off('disconnect');
        socket.off('connect_error');
    };
  }, [socket, isAuthenticated, user]); // Se re-ejecuta si cambia el usuario o el objeto socket

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};