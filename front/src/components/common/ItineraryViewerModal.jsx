import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Clock, Map as MapIcon, Navigation, User, Bookmark, Copy } from 'lucide-react';
import { obtenerItinerarioPorId, crearItinerario } from '../../api/api-itinerario';
import { toggleGuardadoAPI, obtenerIdsGuardadosAPI } from '../../api/a-guardado';
import { useAuth } from '../../context/authContext';
import { useAlert } from '../../context/alertContext';
import Mapa from '../Itinerarios/Mapa';
import traductorFrontend from '../../utils/traductor';
import { getPlaceImage } from '../../utils/placeImages';

const calcularDuracion = (inicio, fin) => {
  if (!inicio || !fin) return 1;
  const diff = new Date(fin) - new Date(inicio);
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
};

const formatearCategoria = (cat) => {
  if (!cat) return '';
  const traducciones = {
    'tourist_attraction': 'Atracción turística',
    'museum': 'Museo',
    'park': 'Parque',
    'zoo': 'Zoológico',
    'amusement_park': 'Parque de diversiones',
    'place_of_worship': 'Lugar de culto',
    'church': 'Iglesia',
    'cathedral': 'Catedral',
    'art_gallery': 'Galería de arte',
    'point_of_interest': 'Punto de interés',
    'establishment': 'Establecimiento'
  };
  if (traducciones[cat]) return traducciones[cat];
  return cat.split('_').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)).join(' ');
};

const coloresDias = ['#B22222', '#6A0DAD', '#1E6091', '#2F6F4E', '#B89B00', '#9932CC', '#3A7968'];
const getColorDia = (diaNum) => coloresDias[(diaNum - 1) % coloresDias.length];

// --- VISOR DE MAPA ---

const MapaDiaViewer = ({ lugares, onClose, dia = null, titulo }) => {
  let lugaresParaMapa = {};
  let lugaresParaLista = [];

  if (dia) {
    lugaresParaMapa = { [dia]: lugares };
    lugaresParaLista = lugares;
  } else {
    lugaresParaMapa = lugares;
    lugaresParaLista = Object.values(lugares).flat();
  }

  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  const mapaModal =(
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
      onClick={onClose} // Opcional: Cerrar si clickeas el fondo oscuro
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        // Agregamos onClick={(e) => e.stopPropagation()} para evitar cierre al hacer clic dentro del mapa
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{titulo}</h3>
            <p className="text-gray-500 text-sm">{dia ? `Día ${dia}` : 'Vista general'} • {lugaresParaLista.length} lugares</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={24} className="text-gray-600" /></button>
        </div>
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          <div className="flex-1 relative"><Mapa lugaresPorDia={lugaresParaMapa} zoom={dia ? 13 : 11} /></div>
          <div className="w-full md:w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto p-4 shrink-0 custom-scrollbar">
            <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">{dia ? 'Secuencia de visita' : 'Lugares del viaje'}</h4>
            <div className="space-y-3">
              {lugaresParaLista.map((lugar, idx) => {
                const diaReal = lugar.dia || dia || 1;
                return (
                  <div key={idx} className="flex gap-3 items-start bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                    <div className="w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ backgroundColor: getColorDia(diaReal) }}>{dia ? idx + 1 : `D${diaReal}`}</div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 leading-tight">{lugar.nombre}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{lugar.ubicacion}</p>
                      {lugar.categoria && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded border border-gray-200">
                          {formatearCategoria(lugar.categoria)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
  return createPortal(mapaModal, document.body);
};

// --- COMPONENTE PRINCIPAL ---
const ItineraryViewerModal = ({ idItinerario, onClose }) => {
  const { token, user } = useAuth();
  const { showAlert } = useAlert();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(null);

  const [isCloning, setIsCloning] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingBookmark, setSavingBookmark] = useState(false);

  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [datosMapa, setDatosMapa] = useState(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const data = await obtenerItinerarioPorId(idItinerario, token);

        if (user && data.creador && String(data.creador.id) === String(user.id || user.id_usuario)) {
          setIsCreator(true);
        } else {
          setIsCreator(false);
        }

        if (token) {
          const idsGuardados = await obtenerIdsGuardadosAPI(token);
          const idStr = String(idItinerario);
          const estaGuardado = Array.isArray(idsGuardados) && idsGuardados.some(id => String(id) === idStr);
          if (estaGuardado) setIsSaved(true);
        }

        const grouped = {};
        let totalLugares = 0;
        if (data.lugares && Array.isArray(data.lugares)) {
          data.lugares.forEach(l => {
            const dia = l.dia || 1;
            if (!grouped[dia]) grouped[dia] = [];
            const datosLugar = l.lugar || l;
            const estadoLugar = l.estado || (l.lugar ? l.lugar.estado : null) || 'CDMX';
            const nombreTraducido = traductorFrontend.traducirTexto(datosLugar.nombre);

            grouped[dia].push({
              ...datosLugar,
              nombre: nombreTraducido,
              nombreOriginal: datosLugar.nombre,
              dia: dia,
              foto: datosLugar.foto,
              ubicacion: datosLugar.ubicacion || '',
              estado: estadoLugar,
              id: datosLugar.id || datosLugar.id_lugar
            });
            totalLugares++;
          });
        }

        const dailyPlan = Object.keys(grouped).sort((a, b) => a - b).map(dia => ({ day: parseInt(dia), lugares: grouped[dia] }));

        setItinerary({
          id: data.id,
          name: data.titulo,
          description: data.descripcion,
          startDate: data.fecha_inicio,
          endDate: data.fecha_termino,
          duration: calcularDuracion(data.fecha_inicio, data.fecha_termino),
          totalLugares,
          dailyPlan,
          lugaresAgrupados: grouped,
          creador: data.creador
        });

        if (dailyPlan.length > 0) setActiveDay(dailyPlan[0].day);

      } catch (error) {
        console.error("Error al obtener itinerario:", error);
      } finally {
        setLoading(false);
      }
    };

    if (idItinerario && token) fetchItinerary();
  }, [idItinerario, token, user]);

  const handleCloneItinerary = async () => {
    if (!itinerary || !token || !user) return;
    setIsCloning(true);
    try {
      const dias = Object.entries(itinerary.lugaresAgrupados).map(([diaNum, lugaresDia]) => {
        let estadoDelDia = lugaresDia.length > 0 ? (lugaresDia[0].estado || 'CDMX') : 'CDMX';
        const lugaresFormateados = lugaresDia.map((lugar, index) => ({ id_lugar: lugar.id || lugar.id_lugar, orden: lugar.orden || index + 1 }));
        return { dia: parseInt(diaNum), estado: estadoDelDia, lugares: lugaresFormateados };
      });
      dias.sort((a, b) => a.dia - b.dia);

      const payload = {
        titulo: `${itinerary.name} (Copia)`,
        descripcion: itinerary.description || `Copia de ${itinerary.name}`,
        privacidad: true,
        fecha_inicio: itinerary.startDate,
        fecha_termino: itinerary.endDate,
        dias: dias
      };

      await crearItinerario(payload, token);
      setIsCloning(false);
      showAlert('success', '¡Copia creada con éxito!', 'Se ha añadido a "Mis Itinerarios".');
    } catch (error) {
      console.error("Error clonando:", error);
      setIsCloning(false);
      showAlert('error', 'Error al copiar itinerario', 'No se pudo copiar el itinerario.');
    }
  };

  const handleToggleBookmark = async () => {
    setSavingBookmark(true);
    const accion = isSaved ? 'quitar' : 'guardar';
    try {
      await toggleGuardadoAPI(token, idItinerario, accion, 'itinerario');
      setIsSaved(!isSaved);

      if (isSaved) {
        showAlert('success', '¡Itinerario eliminado con exito!', 'Ya no aparecerá en tu sección de guardados.');
      } else {
        showAlert('success', '¡Itinerario guardado con éxito!', 'Consultalo en la sección de guardados');
      }

    } catch (error) {
      console.error(error);
      showAlert('error', 'Error al actualizar guardados', 'No se pudo actualizar.');
    } finally {
      setSavingBookmark(false);
    }
  };

  const abrirMapaGlobal = () => { setDatosMapa({ lugares: itinerary.lugaresAgrupados, dia: null, titulo: `Mapa Completo: ${itinerary.name}` }); setMapaAbierto(true); };
  const abrirMapaDia = (e, dia, lugares) => { e.stopPropagation(); setDatosMapa({ lugares: lugares, dia: dia, titulo: `Ruta del Día ${dia}` }); setMapaAbierto(true); };

  if (!idItinerario) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition"><X size={20} /></button>
        {loading ? (
          <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>
        ) : !itinerary ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">No encontrado.</div>
        ) : (
          <>
            <div className="bg-emerald-700 p-8 text-white shrink-0">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold">{itinerary.name}</h2>
                    {itinerary.description && (
                      <div className="max-w-3xl mt-2"><p className="text-emerald-100 text-md leading-relaxed">{itinerary.description}</p></div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                  <div className="flex flex-wrap gap-3 items-center">
                    <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm backdrop-blur-sm"><Calendar size={14} /> {itinerary.startDate} - {itinerary.endDate}</span>
                    <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm backdrop-blur-sm"><Clock size={14} /> {itinerary.duration} días</span>
                    <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm backdrop-blur-sm"><MapPin size={14} /> {itinerary.totalLugares} lugares</span>
                    {itinerary.creador && (<span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm backdrop-blur-sm"><User size={14} /> Por: {itinerary.creador.nombre}</span>)}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={abrirMapaGlobal} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"><MapIcon size={16} /> Mapa</button>
                    {!isCreator && user && (
                      <>
                        <button
                          onClick={handleToggleBookmark}
                          disabled={savingBookmark}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${isSaved ? 'bg-white text-emerald-800' : 'bg-emerald-800/50 hover:bg-emerald-800 text-white'}`}
                        >
                          <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
                          {isSaved ? 'Guardado' : 'Guardar'}
                        </button>
                        <button
                          onClick={handleCloneItinerary}
                          disabled={isCloning}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap bg-white text-emerald-700 hover:bg-emerald-50 shadow-sm"
                        >
                          {isCloning ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div> : <Copy size={16} />}
                          Agregar a mis itinerarios
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
              <div className="space-y-4">
                {itinerary.dailyPlan.map((day) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: day.day * 0.1 }}
                    key={day.day}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div onClick={() => setActiveDay(activeDay === day.day ? null : day.day)} className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-sm" style={{ backgroundColor: getColorDia(day.day) }}>D{day.day}</div>
                        <div><h4 className="font-bold text-gray-800 text-lg">Día {day.day}</h4><p className="text-xs text-gray-500">{day.lugares.length} lugares</p></div>
                      </div>
                      <button onClick={(e) => abrirMapaDia(e, day.day, day.lugares)} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-bold border border-emerald-100 whitespace-nowrap"><Navigation size={14} /> Ver Ruta</button>
                    </div>
                    <AnimatePresence>
                      {activeDay === day.day && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-100 bg-gray-50/30 overflow-hidden"
                        >
                          <div className="p-4 space-y-3">
                            {day.lugares.map((lugar, idx) => (
                              <div key={idx} className="flex gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                <img src={getPlaceImage(lugar)} alt={lugar.nombre} className="w-20 h-20 object-cover rounded-md bg-gray-200 border border-gray-100" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <h5 className="font-bold text-gray-900 text-sm truncate pr-2">{lugar.nombre}</h5>
                                    <span className="text-[10px] text-white px-2 py-0.5 rounded-full font-bold shrink-0" style={{ backgroundColor: getColorDia(day.day) }}>#{idx + 1}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{lugar.ubicacion}</p>
                                  {lugar.categoria && (
                                    <span className="inline-block mt-2 text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">{formatearCategoria(lugar.categoria)}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
        <AnimatePresence>
          {mapaAbierto && datosMapa && (
            <MapaDiaViewer lugares={datosMapa.lugares} dia={datosMapa.dia} titulo={datosMapa.titulo} onClose={() => setMapaAbierto(false)} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ItineraryViewerModal;