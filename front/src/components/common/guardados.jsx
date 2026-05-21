import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, addDoc, deleteDoc, onSnapshot, collection, query, setLogLevel } from 'firebase/firestore';


// --- Configuración de Firebase ---
// Las variables globales son proporcionadas por el entorno de Canvas
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Inicialización de la aplicación
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Establecer el nivel de log a Debug para ver mensajes de Firebase en la consola
setLogLevel('Debug');

// --- Componente Principal ---
const App = () => {
    const [itineraries, setItineraries] = useState([]);
    const [name, setName] = useState('');
    const [details, setDetails] = useState('');
    const [userId, setUserId] = useState(null);
    const [statusMessage, setStatusMessage] = useState('Inicializando...');
    const [isAuthReady, setIsAuthReady] = useState(false);

    /**
     * Formatea un timestamp UNIX a una cadena de fecha y hora legible.
     */
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Fecha desconocida';
        const date = new Date(timestamp);
        return date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    // 1. Lógica de Autenticación
    useEffect(() => {
        const authenticate = async () => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } 
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                // Fallback si la autenticación falla o es anónima
                const tempId = crypto.randomUUID();
                setUserId(tempId);
            }
            setIsAuthReady(true);
        });

        authenticate();
        return () => unsubscribe(); // Cleanup the listener
    }, []);

    // 2. Lógica para cargar y escuchar itinerarios en tiempo real
    useEffect(() => {
        // Añadida la verificación de 'db' para evitar errores si la inicialización falló (aunque es poco probable)
        if (!isAuthReady || !userId || !db) { 
            console.log("Esperando autenticación o DB...");
            return; 
        }

        const collectionPath = `artifacts/${appId}/users/${userId}/itineraries`;
        
        // Log para confirmar la ruta que se está intentando consultar
        console.log(`Intentando suscribirse a la colección: ${collectionPath}`);
        
        const q = query(collection(db, collectionPath));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setItineraries([]);
                return;
            }

            const loadedItineraries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Ordenar por fecha de creación descendente (los más nuevos primero)
            loadedItineraries.sort((a, b) => b.createdAt - a.createdAt);
            setItineraries(loadedItineraries);
            
        }, (error) => {
            console.error("Error al obtener datos en tiempo real:", error);
            setStatusMessage(`Error de carga (Permisos): ${error.message}`);
        });

        return () => unsubscribe(); // Cleanup the listener
    }, [userId, isAuthReady]); // Depende de que la autenticación esté lista y el userId esté disponible

    // 3. Función para Guardar Itinerario
    const saveItinerary = useCallback(async () => {
        if (!name.trim()) {
            setStatusMessage("Error: Por favor, introduce un nombre para el itinerario.");
            return;
        }
        if (!userId) {
            setStatusMessage("Error: ID de usuario no disponible. Inténtalo de nuevo.");
            return;
        }

        const collectionPath = `artifacts/${appId}/users/${userId}/itineraries`;
        const itinerariesCollection = collection(db, collectionPath);
        
        try {
            const newItinerary = {
                name: name.trim(),
                details: details.trim(), // Contenido/publicaciones
                createdAt: Date.now()
            };

            await addDoc(itinerariesCollection, newItinerary);
            setName(''); // Limpiar el input del nombre
            setDetails(''); // Limpiar el input de los detalles
            setStatusMessage(`Itinerario "${name.trim()}" guardado con éxito.`);
        } catch (error) {
            console.error("Error al guardar el itinerario:", error);
            setStatusMessage(`Error al guardar: ${error.message}.`);
        }
    }, [name, details, userId]);

    // 4. Función para Eliminar Itinerario
    const deleteItinerary = useCallback(async (docId) => {
        if (!userId) return;

        const collectionPath = `artifacts/${appId}/users/${userId}/itineraries`;
        const docRef = doc(db, collectionPath, docId);

        try {
            await deleteDoc(docRef);
            setStatusMessage("Itinerario eliminado con éxito.");
        } catch (error) {
            console.error("Error al eliminar el itinerario:", error);
            setStatusMessage(`Error al eliminar: ${error.message}.`);
        }
    }, [userId]);

    // --- Componente de Tarjeta de Itinerario ---
    const ItineraryCard = ({ itinerary }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const MAX_LENGTH = 300;
        const needsTruncation = itinerary.details && itinerary.details.length > MAX_LENGTH;
        const displayDetails = needsTruncation && !isExpanded 
            ? itinerary.details.substring(0, MAX_LENGTH) + '...'
            : itinerary.details;

        return (
            <li className="flex flex-col bg-white p-4 rounded-xl shadow-lg mb-4 transition duration-200 ease-in-out hover:shadow-xl border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <span className="text-gray-800 font-bold text-xl block">
                            {itinerary.name}
                        </span>
                        <span className="text-gray-500 text-xs mt-1 block">
                            Guardado el: {formatTimestamp(itinerario.createdAt)}
                        </span>
                    </div>
                    <button 
                        onClick={() => deleteItinerary(itinerario.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-1 px-3 rounded-lg shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 flex-shrink-0 ml-4"
                        disabled={!userId}
                    >
                        Eliminar
                    </button>
                </div>

                {itinerary.details ? (
                    <>
                        <p className="text-gray-600 whitespace-pre-wrap mt-2 text-sm border-t pt-3 border-gray-100">
                            {displayDetails}
                        </p>
                        {needsTruncation && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-blue-600 hover:text-blue-800 text-xs mt-1 self-start block font-medium"
                            >
                                {isExpanded ? 'Ver menos' : 'Ver más'}
                            </button>
                        )}
                    </>
                ) : (
                    <p className="text-gray-400 italic text-sm mt-1 border-t pt-3 border-gray-100">
                        Sin publicaciones/detalles.
                    </p>
                )}
            </li>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">✈️ itinerarios </h1>
                <p id="status-message" className="text-sm font-medium" style={{ color: statusMessage.startsWith('Error') ? 'red' : '#3b82f6' }}>
                    {statusMessage}
                </p>
                {userId && (
                    <p className="text-xs text-gray-500 mt-1">
                        ID de Usuario: {userId}
                    </p>
                )}
            </header>

            {/* Sección de Guardado */}
            <div className="bg-white p-6 rounded-2xl shadow-xl mb-10 border border-gray-100">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Guardar Nuevo Itinerario</h2>
                <div className="flex flex-col gap-4">
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="1. Escribe el nombre del itinerario (Ej: Viaje a Roma 2024)"
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                    />
                    <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        rows="5"
                        placeholder="2. Ingresa los detalles/publicaciones (Ej: Día 1: Visita al Coliseo. Día 2: Museo del Vaticano.)"
                        className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 resize-none"
                    ></textarea>
                    <button 
                        onClick={saveItinerary}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-150 ease-in-out transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 w-full disabled:bg-gray-400"
                        disabled={!isAuthReady || !name.trim()}
                    >
                        Guardar Itinerario
                    </button>
                </div>
            </div>

            {/* Lista de Itinerarios */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Mis Itinerarios Guardados</h2>
                <ul className="space-y-3">
                    {!isAuthReady && (
                        <li className="p-4 bg-gray-100 rounded-xl text-center text-gray-600">
                            Conectando con la base de datos...
                        </li>
                    )}
                    {isAuthReady && itineraries.length === 0 && (
                        <li className="p-4 bg-gray-100 rounded-xl text-center text-gray-600 italic">
                            No tienes itinerarios guardados. ¡Empieza a añadir uno!
                        </li>
                    )}
                    {itineraries.map(itinerario => (
                        <ItineraryCard key={itinerario.id} itinerary={itinerario} />
                    ))}
                </ul>
            </section>
        </div>
    );
};

export default App;
