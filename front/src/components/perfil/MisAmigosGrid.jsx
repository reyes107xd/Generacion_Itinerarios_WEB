import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, UserX } from 'lucide-react';
import { useAlert } from '../../context/alertContext';
import { useAuth } from '../../context/authContext';
import { useNavigate } from 'react-router-dom'; 
import { obtenerAmigosAPI, eliminarAmigoAPI } from '../../api/friends'; 
import ModalConfirmacion from '../modalConfirm'; // Ajusta la ruta

const MisAmigosGrid = () => { 
  const [amigos, setAmigos] = useState([]); 
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();
  const { token } = useAuth();
  const navigate = useNavigate();

  // Estados para el modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [amigoAEliminar, setAmigoAEliminar] = useState(null);
  const [datosAmigo, setDatosAmigo] = useState({ id: null, nombre: '' });

  // CARGAR AMIGOS
  useEffect(() => {
    const fetchAmigos = async () => {
        try {
            const data = await obtenerAmigosAPI(token);
            setAmigos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    if(token) fetchAmigos();
  }, [token]);

  // ABRIR MODAL PARA ELIMINAR
  const abrirModalEliminar = (id, nombre) => {
    setDatosAmigo({ id, nombre });
    setModalAbierto(true);
  };

  // CERRAR MODAL
  const cerrarModal = () => {
    setModalAbierto(false);
    setAmigoAEliminar(null);
  };

  // CONFIRMAR ELIMINACIÓN
  const confirmarEliminacion = async () => {
    if (!datosAmigo.id) return;
    
    try {
        await eliminarAmigoAPI(token, datosAmigo.id); 
        setAmigos(prev => prev.filter(a => a.id !== datosAmigo.id)); 
        showAlert('success', '¡Amigo eliminado con éxito!', `${datosAmigo.nombre} ha sido eliminado de tus amigos.`);
    } catch (error) {
        console.error(error);
        showAlert('error', 'Error al eliminar al amigo', 'No se pudo eliminar al amigo. Inténtalo de nuevo mas tarde.');
    } finally {
        cerrarModal();
    }
  };

  // NAVEGAR AL CHAT
  const handleOpenChat = (amigo) => {
    navigate(`/mensajes/${amigo.id}`); 
  };

  if (loading) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div></div>;

  if (amigos.length === 0) {
    return (
        <div className="col-span-full py-10 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p>No tienes amigos en tu lista aún.</p>
        </div>
    );
  }

  return (
    <>
      {/* Grid de amigos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
        {amigos.map((amigo) => (
          <article 
            key={amigo.id}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group relative overflow-hidden"
          >
            {/* Barra decorativa superior*/}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

            {/* Imagen con protección */}
            <div className="relative mb-4">
                <img 
                  src={amigo.avatar || amigo.foto || 'https://i.pravatar.cc/150?u=default'} 
                  onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = 'https://i.pravatar.cc/150?img=12'; 
                  }}
                  alt={amigo.name} 
                  className="w-20 h-20 rounded-full object-cover border-4 border-emerald-50 group-hover:border-emerald-100 transition-colors shadow-sm"
                />
            </div>
            
            <div className="mb-6 w-full">
                <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
                    {amigo.name || amigo.nombre}
                </h3>
                <p className="text-emerald-600 text-sm font-medium bg-emerald-50 inline-block px-3 py-0.5 rounded-full truncate max-w-full">
                    @{amigo.handle || amigo.nombre_usuario}
                </p>
            </div>

            <div className="flex w-full gap-3 mt-auto">
              {/* Botón MENSAJE */}
              <button
                onClick={() => handleOpenChat(amigo)} 
                className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-green-200 text-emerald-700 rounded-lg font-medium text-sm hover:bg-green-300 transition-colors"
              >
                <MessageCircle size={18} strokeWidth={2.5} /> 
              </button>
              
              {/* Botón ELIMINAR */}
              <button 
                onClick={() => abrirModalEliminar(amigo.id, amigo.name || amigo.nombre)}
                className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-gray-50 text-gray-500 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-200 hover:text-gray-500 hover:border-gray-200 transition"
                title="Eliminar de mis amigos"
              >
                <UserX size={18} strokeWidth={2.5} /> 
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Modal de confirmación usando Portal */}
      {modalAbierto && createPortal(
        <ModalConfirmacion
          isOpen={modalAbierto}
          onClose={cerrarModal}
          onConfirm={confirmarEliminacion}
          titulo="Eliminar amigo"
          mensaje={`¿Estás seguro de que quieres eliminar a ${datosAmigo.nombre} de tus amigos? Esta acción no se puede deshacer.`}
          textoConfirmar="Eliminar"
          textoCancelar="Cancelar"
          tipo="eliminar"
        />,
        document.body
      )}
    </>
  );
};

export default MisAmigosGrid;