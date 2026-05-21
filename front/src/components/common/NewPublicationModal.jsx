import { useState, useRef, useEffect } from 'react'; 
import { Images, Plus, X, Users, Globe, Map, Search, Trash2 } from 'lucide-react'; 
import { createPortal } from 'react-dom';
import { subirImagen } from '../../api/a-storage';
import { useAuth } from '../../context/authContext';
import SweetAlert from '../../pages/login/SweetAlert';
import '../../Extras/SweetAlert.css';

// IMPORTAR EL NUEVO SELECTOR VISUAL
import ItinerarySelectionModal from './ItinerarySelectionModal';

const getAvatarUrl = (foto, nombre) => {
  if (foto && foto.trim() !== '') return foto;
  const nombreSafe = nombre || 'Usuario';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreSafe)}&background=1D7743&color=fff&bold=true`;
};

const getFullName = (u) => {
  if (!u) return 'Usuario';
  return u.ap_p ? `${u.nombre} ${u.ap_p}`.trim() : u.nombre;
};

const STYLES = {
  header: "text-base md:text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200",
  label: "text-xs md:text-sm font-semibold text-gray-700 mb-2 block",
  input: "w-full p-2.5 md:p-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-all",
  error: "text-red-600 text-xs mt-1",
  button: {
    primary: "bg-green-200 text-emerald-700 py-2.5 px-6 rounded-lg hover:bg-green-300 transition-colors text-sm font-bold flex-1 sm:flex-none justify-center flex items-center shadow-sm",
    secondary: "flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors py-2 px-2 rounded-lg hover:bg-gray-100 w-full sm:w-auto"
  }
};

const NewPublicationModal = ({ onClose, onAddPost, showToast }) => {
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('friends');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({ title: "", description: "" });
  const [alertConfig, setAlertConfig] = useState({ show: false, type: 'error', title: '', message: '' });

  const fileInputRef = useRef(null);

  // Itinerario (se mantiene aunque imágenes sean obligatorias)
  const [showItinerarySelector, setShowItinerarySelector] = useState(false);
  const [selectedItinerary, setSelectedItinerary] = useState(null);

  const showAlert = (type, title, message) => {
    setAlertConfig({ show: true, type, title, message });
  };
  const closeAlert = () => { setAlertConfig((prev) => ({ ...prev, show: false })); };

  const handleSelectItinerary = (itinerary) => {
    setSelectedItinerary(itinerary);
    setShowItinerarySelector(false);
  };

  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

  // ------------------------------------------------------------
  //                VALIDACIONES PRINCIPALES
  // ------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isTitleValid = title.trim().length > 0;
    const isDescValid = description.trim().length > 0;

    setErrors({
      title: isTitleValid ? "" : "El título es obligatorio",
      description: isDescValid ? "" : "La descripción es obligatoria"
    });

    if (!isTitleValid || !isDescValid) return;

    // ❗ OPCIÓN A — SIEMPRE exigir imágenes
    if (selectedFiles.length === 0) {
      showAlert("error", "Faltan imágenes", "Es necesario adjuntar al menos una imagen para publicar.");
      return;
    }

    // Validación privacidad si hay itinerario
    if (selectedItinerary) {
      const isPrivate = selectedItinerary.privacidad === true || selectedItinerary.id_privacidad === 1;
      if (isPrivate && (privacy === 'public' || privacy === 'friends')) {
        showAlert('error', 'Error al compartir itinerario', 'No puedes compartir un itinerario PRIVADO de forma Pública.');
        return;
      }
    }

    setLoading(true);

    // SUBIR IMÁGENES
    let urlsSubidas = [];
    try {
      const promesas = selectedFiles.map(file => subirImagen(file, 'publicaciones'));
      urlsSubidas = await Promise.all(promesas);
    } catch (error) {
      showAlert('error', 'Error al subir imágenes', 'Hubo un problema al subir las imágenes. Inténtalo de nuevo más tarde.');
      setLoading(false);
      return;
    }

    const newPost = {
      titulo: title.trim(),
      description: description.trim(),
      tipo_publicacion: selectedItinerary ? 'itinerario' : 'foto',
      privacidad: privacy,
      fotos: urlsSubidas,
      id_itinerario: selectedItinerary ? selectedItinerary.id_itinerario : null
    };

    await onAddPost(newPost);

    // Reset
    setTitle('');
    setDescription('');
    setPrivacy('friends');
    setSelectedFiles([]);
    setPreviews([]);
    setSelectedItinerary(null);
    setLoading(false);
    onClose();
  };

  // ------------------------------------------------------------
  //                   IMÁGENES
  // ------------------------------------------------------------
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 3) {
      showAlert('error', 'Error al subir imágenes', 'Sube máximo 3 imágenes.');
      return;
    }

    const newFiles = [...selectedFiles, ...files].slice(0, 3);
    setSelectedFiles(newFiles);

    previews.forEach(url => URL.revokeObjectURL(url));
    setPreviews(newFiles.map(f => URL.createObjectURL(f)));
  };

  const handleRemoveImage = (i) => {
    URL.revokeObjectURL(previews[i]);
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleImageButtonClick = () => fileInputRef.current.click();

  const myFullName = getFullName(user);
  const avatarUrl = getAvatarUrl(user?.foto, myFullName);

  const modalContent = (
    <>
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">

      <SweetAlert show={alertConfig.show} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={closeAlert} duration={4000} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col">

        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h4 className="text-lg font-bold text-gray-900">Nueva Publicación</h4>
          <button onClick={onClose} className="bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full p-2 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar">

          <div className="flex gap-3 md:gap-5">
            
            <img src={avatarUrl} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border border-gray-200" />

            <form onSubmit={handleSubmit} className="flex-1 space-y-4">

              {/* TÍTULO */}
              <div>
                <input 
                  type="text" 
                  placeholder="Título..." 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className={STYLES.input} 
                  disabled={loading} 
                />
                {errors.title && <p className={STYLES.error}>{errors.title}</p>}
              </div>

              {/* DESCRIPCIÓN */}
              <div>
                <textarea
                  placeholder="¿Qué quieres compartir hoy?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className={`${STYLES.input} resize-none`}
                  disabled={loading}
                />
                {errors.description && <p className={STYLES.error}>{errors.description}</p>}
              </div>

              {/* ITINERARIO (OPCIONAL) */}
              <div className="space-y-2">
                <label className={STYLES.label}>Vincular Itinerario (Opcional)</label>

                {!selectedItinerary ? (
                  <button 
                    type="button"
                    onClick={() => setShowItinerarySelector(true)}
                    className="w-full py-3 border-2 border-dashed border-sky-200 bg-sky-50 rounded-xl text-sky-600 font-semibold text-sm hover:bg-sky-100 hover:border-sky-300 transition-all flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    <Map size={18} /> Seleccionar un itinerario
                  </button>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between animate-fade-in shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-emerald-200 rounded-lg flex items-center justify-center text-emerald-700 shrink-0 border border-emerald-200">
                        <Map size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{selectedItinerary.titulo}</p>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setSelectedItinerary(null)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-full transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* PRIVACIDAD */}
              <div>
                <label className={STYLES.label}>Visibilidad</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "public", label: "Público", icon: <Globe size={14} /> },
                    { id: "friends", label: "Amigos", icon: <Users size={14} /> }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPrivacy(opt.id)}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                        privacy === opt.id
                          ? "bg-green-100 text-emerald-700 border border-emerald-200"
                          : "bg-gray-50 text-gray-600 border border-transparent hover:bg-gray-100"
                      }`}
                      disabled={loading}
                    >
                      {opt.icon} <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PREVIEW IMÁGENES */}
              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group aspect-video">
                      <img src={src} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 transition-colors backdrop-blur-sm"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* BOTONES */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3 pt-2 mt-2 border-t border-gray-100">
                
                <button
                  type="button"
                  className={STYLES.button.secondary}
                  onClick={handleImageButtonClick}
                  disabled={loading}
                >
                  <Images size={18} className="text-emerald-600" />
                  Añadir Fotos (max 3)
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className={`${STYLES.button.primary} ${loading ? 'opacity-70 cursor-not-allowed' : ''} w-full sm:w-auto`}
                >
                  {loading ? "Publicando..." : "Publicar"}
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />

            </form>
          </div>
        </div>
      </div>
    </div>

    {showItinerarySelector && (
      <ItinerarySelectionModal
        onClose={() => setShowItinerarySelector(false)}
        onSelectItinerary={handleSelectItinerary}
      />
    )}
    </>
  );
  return createPortal(modalContent, document.body);
};

export default NewPublicationModal;
