import { useState, useEffect } from 'react';
import { X, Search, User, Globe, Map, Eye, CheckCircle, Lock, Calendar } from 'lucide-react';
import { obtenerItinerarios } from '../../api/api-itinerario';
import { useAuth } from '../../context/authContext';
import ItineraryViewerModal from './ItineraryViewerModal';

// --- HELPER AVATAR ---
const getAvatarUrl = (foto, nombre) => {
  if (foto && foto.trim() !== '') return foto;
  const nombreSafe = nombre || 'Usuario';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreSafe)}&background=1D7743&color=fff&bold=true`;
};

// Subcomponente: Tarjeta de Itinerario (Rediseñada sin portada)
const ItinerarySelectorCard = ({ itin, isMine, onSelect, onView }) => {
  // Extraer datos del autor
  let perfil = null;
  
  // Estructura flexible para encontrar el perfil
  if (itin.usuario?.perfil_usuario) {
      perfil = Array.isArray(itin.usuario.perfil_usuario) ? itin.usuario.perfil_usuario[0] : itin.usuario.perfil_usuario;
  } else if (itin.turista?.usuario?.perfil_usuario) {
      perfil = Array.isArray(itin.turista.usuario.perfil_usuario) ? itin.turista.usuario.perfil_usuario[0] : itin.turista.usuario.perfil_usuario;
  }

  let nombreAutor = isMine ? 'Yo' : `Usuario ${itin.id_turista}`;
  let fotoAutor = null;

  if (perfil) {
      const n = perfil.nombre || '';
      const a = perfil.ap_p || '';
      if (n || a) nombreAutor = `${n} ${a}`.trim();
      fotoAutor = perfil.foto;
  }
  
  const avatarUrl = getAvatarUrl(fotoAutor, nombreAutor);
  
  // Lógica de privacidad: true = privado
  const isPrivate = itin.privacidad === true || itin.id_privacidad === 1;

  return (
    <div className="min-w-[280px] w-[280px] bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col shrink-0 relative group">
      
      {/* Header: Icono y Privacidad */}
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-lg ${isPrivate ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-600'}`}>
             <Map size={20} />
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${isPrivate ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
            {isPrivate ? <Lock size={10} /> : <Globe size={10} />}
            {isPrivate ? 'Privado' : 'Público'}
        </span>
      </div>

      {/* Título */}
      <h4 className="font-bold text-gray-900 text-base mb-1 line-clamp-1" title={itin.titulo}>
        {itin.titulo}
      </h4>
      
      {/* Fecha o Descripción corta */}
      <div className="text-xs text-gray-500 flex items-center gap-1 mb-4">
         <Calendar size={12} /> 
         {itin.fecha_inicio ? new Date(itin.fecha_inicio).toLocaleDateString() : 'Sin fecha'}
      </div>

      {/* Footer: Autor y Botones */}
      <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
        
        {/* Autor */}
        <div className="flex items-center gap-2 max-w-[40%]">
            <img src={avatarUrl} className="w-6 h-6 rounded-full object-cover border border-gray-200" alt="Autor" />
            <span className="text-xs text-gray-600 truncate font-medium">{nombreAutor}</span>
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-2">
             <button 
                onClick={() => onView(itin.id_itinerario)}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Ver detalles"
            >
                <Eye size={18} />
            </button>
            <button 
                onClick={() => onSelect(itin)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
                <CheckCircle size={14} /> Elegir
            </button>
        </div>
      </div>
    </div>
  );
};

const ItinerarySelectionModal = ({ onClose, onSelectItinerary }) => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myItineraries, setMyItineraries] = useState([]);
  const [publicItineraries, setPublicItineraries] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [previewId, setPreviewId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await obtenerItinerarios();
        const lista = Array.isArray(data) ? data : (data.data || []);
        
        const myId = String(user?.id || user?.id_usuario);
        const mine = [];
        const others = [];

        lista.forEach(itin => {
            const isMine = String(itin.id_turista) === myId;
            const isPrivate = itin.privacidad === true || itin.id_privacidad === 1;

            if (isMine) {
                mine.push(itin);
            } else if (!isPrivate) {
                others.push(itin);
            }
        });

        setMyItineraries(mine);
        setPublicItineraries(others);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if(token) fetchData();
  }, [token, user]);

  const filterList = (list) => {
      if (!searchText) return list;
      return list.filter(it => it.titulo.toLowerCase().includes(searchText.toLowerCase()));
  };

  return (
    <>
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white z-10">
            <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Map className="text-emerald-600" /> Vincular Itinerario
                </h3>
                <p className="text-sm text-gray-500">Elige una ruta para compartir en tu publicación</p>
            </div>
            <button onClick={onClose} className="bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full p-2 transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Buscador */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
            <div className="relative max-w-md mx-auto">
                <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre..." 
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm shadow-sm"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
            </div>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-10 bg-gray-50">
            
            {loading ? (
                <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            ) : (
                <>
                    {/* SECCIÓN 1: MIS ITINERARIOS */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700"><User size={18} /></div>
                            <h4 className="text-base font-bold text-gray-800">Mis Itinerarios <span className="text-gray-400 text-sm font-normal">({filterList(myItineraries).length})</span></h4>
                        </div>
                        
                        {filterList(myItineraries).length > 0 ? (
                            <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar px-1">
                                {filterList(myItineraries).map(itin => (
                                    <ItinerarySelectorCard 
                                        key={itin.id_itinerario} 
                                        itin={itin} 
                                        isMine={true} 
                                        onSelect={onSelectItinerary}
                                        onView={setPreviewId}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm bg-white">
                                No tienes itinerarios creados o que coincidan con la búsqueda.
                            </div>
                        )}
                    </section>

                    {/* SECCIÓN 2: COMUNIDAD */}
                    <section>
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700"><Globe size={18} /></div>
                            <h4 className="text-base font-bold text-gray-800">Explorar Comunidad <span className="text-gray-400 text-sm font-normal">({filterList(publicItineraries).length})</span></h4>
                        </div>
                        
                        {filterList(publicItineraries).length > 0 ? (
                            <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar px-1">
                                {filterList(publicItineraries).map(itin => (
                                    <ItinerarySelectorCard 
                                        key={itin.id_itinerario} 
                                        itin={itin} 
                                        isMine={false} 
                                        onSelect={onSelectItinerary}
                                        onView={setPreviewId}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm bg-white">
                                No se encontraron itinerarios públicos.
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>

      </div>
    </div>

    {/* VISOR DE DETALLE (MODAL NIVEL 3) */}
    {previewId && (
        <ItineraryViewerModal 
            idItinerario={previewId}
            onClose={() => setPreviewId(null)}
        />
    )}
    </>
  );
};

export default ItinerarySelectionModal;