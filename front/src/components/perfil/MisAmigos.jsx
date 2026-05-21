import { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom'; 
import { obtenerAmigosAPI } from '../../api/friends'; 

const MisAmigos = ({ compactMode = false }) => { 
  const [amigos, setAmigos] = useState([]); 
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAmigos = async () => {
        try {
            const data = await obtenerAmigosAPI(token);
            setAmigos(data);
        } catch (error) {
            console.error("Error al cargar amigos:", error);
        } finally {
            setLoading(false);
        }
    };
    if(token) fetchAmigos();
  }, [token]);

  const handleOpenChat = (amigo) => {
    navigate(`/mensajes/${amigo.id}`); 
  };

  const handleImageError = (e) => {
    e.target.src ='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'; 
  };

  if (loading) return <div className="p-4 text-center text-xs text-gray-500">Cargando amigos...</div>;

  if (amigos.length === 0) {
    return (
        <div className={`text-center text-gray-400 py-4 ${compactMode ? 'text-xs' : ''}`}>
            No tienes amigos aún.
        </div>
    );
  }


  if (compactMode) {
    return (
      <div className="flex flex-col gap-2 p-1">
        {amigos.map((amigo) => (
          <div 
            key={amigo.id}
            onClick={() => handleOpenChat(amigo)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50 cursor-pointer transition border border-transparent hover:border-emerald-100 group"
          >
            <img 
              src={amigo.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
              onError={handleImageError}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
              alt={amigo.name}
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                  {amigo.name}
              </p>
              <p className="text-xs text-gray-500 truncate group-hover:text-emerald-600">
                  @{amigo.handle || 'usuario'}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }


  return (
    <div className="w-full">
        {/* Título Estandarizado H1 */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center sm:text-left">
            Mis Amigos
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-6">
        {amigos.map((amigo) => (
            <article 
                key={amigo.id} 
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden group"
            >
                <div className="mb-4 relative">
                    <img 
                        src={amigo.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
                        onError={handleImageError}
                        className="w-24 h-24 rounded-full object-cover border-4 border-emerald-50 group-hover:scale-105 transition-transform duration-300"
                        alt={amigo.name}
                    />
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-1">{amigo.name}</h3>
                <p className="text-sm text-emerald-600 font-medium mb-4">@{amigo.handle || 'usuario'}</p>
                
                <button 
                    onClick={() => handleOpenChat(amigo)} 
                    className="w-full bg-emerald-50 text-emerald-700 font-semibold py-2.5 px-4 rounded-xl hover:bg-emerald-100 transition active:scale-95 flex items-center justify-center gap-2 text-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2-2z"></path></svg>
                    Enviar Mensaje
                </button>
            </article>
        ))}
        </div>
    </div>
  );
};

export default MisAmigos;