import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { obtenerItinerariosUsuario, obtenerItinerarioPorId, eliminarItinerario } from '../../api/api-itinerario';
import { useAuth } from '../../context/authContext';
import { useAlert } from '../../context/alertContext';
import { Pencil, Trash2, Globe, Lock, Calendar, MapPin, ArrowLeft, Printer, Clock, ChevronDown, ChevronUp, Navigation, Plane, Hotel, Map, Star, Users, Compass, MapPinCheck } from 'lucide-react';
import Mapa from '../../components/Itinerarios/Mapa'; // Cambié "Map" por "Mapa" para evitar conflicto
import traductorFrontend from '../../utils/traductor';
import { getPlaceImage } from '../../utils/placeImages';
import { useExport } from '../../context/ExportContext'; // <-- IMPORT DEL EXPORTADOR

const ModalConfirmacion = ({
  isOpen,
  onClose,
  onConfirm,
  titulo = "Confirmar eliminación",
  mensaje = "¿Estás seguro de que quieres eliminar este itinerario?",
  itinerarioNombre = ""
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 w-full max-w-lg shadow-2xl text-center relative">

        {/* Botón cerrar (X) */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-500 hover:text-red-700 hover:bg-red-200/40 transition px-2 py-1 rounded-full"
        >
          ✕
        </button>

        {/* Icono grande */}
        <div className="mx-auto mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center">
          <Trash2 size={32} className="sm:w-10 sm:h-10 text-red-600" />
        </div>

        {/* Título */}
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 mb-2 sm:mb-3">
          {titulo}
        </h2>

        {/* Mensaje */}
        <p className="text-gray-700 text-sm sm:text-base lg:text-lg mb-3 sm:mb-4">
          {mensaje}
        </p>

        {/* Nombre del itinerario */}
        {itinerarioNombre && (
          <p className="text-red-700 font-semibold text-base sm:text-lg lg:text-xl mb-3 sm:mb-4">
            "{itinerarioNombre}"
          </p>
        )}

        {/* Advertencia */}
        <p className="text-xs sm:text-sm text-red-500 mb-6 sm:mb-8">
          Esta acción no se puede deshacer.
        </p>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Mapa de traducción de categorías (inglés -> español)
const traducirCategoria = (categoriaIngles) => {
  if (!categoriaIngles) return 'Sin categoría';

  const mapaTraduccion = {
    // --- Cultura y Turismo ---
    'museum': 'Museo',
    'park': 'Parque',
    'tourist_attraction': 'Atracción Turística',
    'zoo': 'Zoológico',
  };

  const key = categoriaIngles.toLowerCase().trim();

  if (mapaTraduccion[key]) {
    return mapaTraduccion[key];
  }

  // Si no está en el mapa, reemplazar guiones bajos por espacios y capitalizar
  return categoriaIngles.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

function calcularDuracion(inicio, fin) {
  try {
    if (!inicio || !fin) return 1;

    // Asegurarnos de que las fechas sean en formato Date
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    // Validar fechas
    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      console.warn('Fechas inválidas:', inicio, fin);
      return 1;
    }

    // Ajustar ambas fechas a medianoche para cálculo preciso
    const inicioAjustado = new Date(fechaInicio);
    inicioAjustado.setHours(0, 0, 0, 0);

    const finAjustado = new Date(fechaFin);
    finAjustado.setHours(0, 0, 0, 0);

    // Calcular diferencia en milisegundos y convertir a días
    const diferenciaMs = finAjustado - inicioAjustado;
    const diferenciaDias = diferenciaMs / (1000 * 60 * 60 * 24);

    // La duración es la diferencia + 1 (porque ambos días cuentan)
    const duracion = Math.max(1, Math.floor(diferenciaDias) + 1);

    console.log(` Cálculo duración: ${inicio} a ${fin} = ${duracion} días`);

    return duracion;
  } catch (error) {
    console.error('Error calculando duración:', error);
    return 1;
  }
}


function obtenerUbicacionDelDia(lugares) {
  if (!lugares || !Array.isArray(lugares) || lugares.length === 0) {
    return '';
  }

  // Tomar el primer lugar como referencia
  const primerLugar = lugares[0];
  if (!primerLugar.ubicacion) return '';

  const partes = primerLugar.ubicacion.split(',').map(parte => parte.trim());

  // Simplemente tomar la última parte no vacía
  for (let i = partes.length - 1; i >= 0; i--) {
    if (partes[i] && partes[i].length > 2) {
      return `en ${partes[i]}`;
    }
  }

  return '';
}

// Nota: handlePrint se mantiene por compatibilidad si en algún lado lo reutilizas
const handlePrint = () => {
  window.print();
};

// Componente MapaDia mejorado con layout horizontal
const MapaDia = ({ lugares, onClose, dia = null, titulo = "Mapa del día" }) => {
  // Convertir los lugares al formato correcto
  let lugaresParaMapa = {};
  let lugaresParaLista = [];

  if (dia) {
    // Mapa por día - lugares es un array
    lugaresParaMapa = { [dia]: lugares };
    lugaresParaLista = lugares;
  } else {
    // Mapa completo - lugares es un objeto {dia: [lugares]}
    lugaresParaMapa = lugares;
    // Aplanar todos los lugares para la lista
    lugaresParaLista = Object.values(lugares).flat();
  }

  // Colores para cada día
  const coloresDias = [
    '#B22222', // Día 1 - Rojo oscuro
    '#6A0DAD', // Día 2 - Morado oscuro
    '#1E6091', // Día 3 - Azul oscuro
    '#2F6F4E', // Día 4 - Verde oscuro
    '#B89B00', // Día 5 - Amarillo oscuro
    '#9932CC', // Día 6 - Ciruela oscuro
    '#3A7968', // Día 7 - Verde menta oscuro
  ];

  const getColorDia = (diaNum) => {
    return coloresDias[(diaNum - 1) % coloresDias.length];
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
        {/* Header del modal - FIJADO */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{titulo}</h3>
            <p className="text-gray-600 text-sm mt-1">
              {dia ? `Día ${dia} - ${lugaresParaLista.length} lugares` : `Mapa completo - ${lugaresParaLista.length} lugares en total`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100/80 rounded-xl transition-all duration-200 backdrop-blur-sm"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Contenido principal - LAYOUT HORIZONTAL */}
        <div className="flex-1 flex min-h-0">
          {/* Mapa - LADO IZQUIERDO */}
          <div className="flex-1 p-6 border-r border-gray-200/60">
            <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
              <Mapa
                lugaresPorDia={lugaresParaMapa}
                zoom={dia ? 13 : 11}
              />
            </div>
          </div>

          {/* Información - LADO DERECHO CON SCROLL */}
          <div className="w-96 shrink-0 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-200/60">
                <h4 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-base sm:text-lg flex items-center gap-2">
                  <MapPinCheck size={20} className="text-emerald-600" />
                  Leyenda del Mapa
                </h4>

                {dia ? (
                  // Acotaciones para mapa por día
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-gray-200/60 shadow-sm">
                      <div
                        className="w-5 h-5 sm:w-6 sm:h-6 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0"
                        style={{ backgroundColor: getColorDia(dia) }}
                      >
                        D{dia}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">Día {dia}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Todos los marcadores de este color corresponden al día {dia}</p>
                      </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <h5 className="font-medium text-gray-700 text-xs sm:text-sm">Lugares en orden de visita:</h5>
                      {lugaresParaLista.map((lugar, index) => {
                        const lugarTraducido = traductorFrontend.traducirLugar(lugar);
                        return (
                          <div key={lugar.id_lugar} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/80 rounded-lg border border-gray-200/60">
                            <div
                              className="w-6 h-6 sm:w-8 sm:h-8 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 shadow-md"
                              style={{ backgroundColor: getColorDia(dia) }}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">{lugarTraducido.nombreEspanol}</p>
                              <p className="text-xs text-gray-600 truncate">{lugar.ubicacion || 'Dirección no disponible'}</p>
                              <p className="text-xs text-emerald-600 font-semibold mt-0.5 sm:mt-1">Orden {index + 1}</p>
                            </div>
                            {lugar.puntaje && (
                              <div className="flex items-center gap-1 bg-yellow-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shrink-0 border border-yellow-200">
                                <span className="text-yellow-700 text-xs font-bold">★ {lugar.puntaje.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // Acotaciones para mapa completo
                  <div className="space-y-3 sm:space-y-4">
                    <p className="text-gray-700 text-xs sm:text-sm">
                      Cada color representa un día diferente de tu itinerario.
                    </p>

                    <div className="space-y-2 sm:space-y-3">
                      <h5 className="font-medium text-gray-700 text-xs sm:text-sm">Leyenda por días:</h5>
                      {Object.keys(lugaresParaMapa).map((diaKey, index) => (
                        <div key={diaKey} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/80 rounded-lg border border-gray-200/60">
                          <div
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-sm shrink-0"
                            style={{ backgroundColor: getColorDia(parseInt(diaKey)) }}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-xs sm:text-sm">{diaKey === 'day' ? 'Día' : 'Día'} {diaKey}</p>
                            <p className="text-xs text-gray-600">{lugaresParaMapa[diaKey].length} lugares</p>
                          </div>
                          <div
                            className="w-5 h-5 sm:w-6 sm:h-6 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ backgroundColor: getColorDia(parseInt(diaKey)) }}
                          >
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>


                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente MapaOrden mejorado con layout horizontal
const MapaOrden = ({ lugares, onClose, titulo = "Ruta de visita" }) => {
  // Para el mapa de orden, necesitamos un formato especial
  const lugaresParaMapa = { 1: lugares }; // Agrupamos todos en "día 1" para usar un solo color
  const lugaresParaLista = lugares;

  // Color para el mapa de orden 
  const colorOrden = '#2F6F4E'; // Verde oscuro

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
        {/* Header del modal - FIJADO */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{titulo}</h3>
            <p className="text-gray-600 text-sm mt-1">
              Ruta optimizada - {lugaresParaLista.length} lugares en orden de visita
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100/80 rounded-xl transition-all duration-200 backdrop-blur-sm"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Contenido principal - LAYOUT HORIZONTAL */}
        <div className="flex-1 flex min-h-0">
          {/* Mapa - LADO IZQUIERDO */}
          <div className="flex-1 p-6 border-r border-gray-200/60">
            <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
              <Mapa
                lugaresPorDia={lugaresParaMapa}
                zoom={12}
                mostrarNumeroOrden={true}
              />
            </div>
          </div>

          {/* Información - LADO DERECHO CON SCROLL */}
          <div className="w-full lg:w-96 shrink-0 overflow-y-auto p-3 sm:p-4 lg:p-6 border-t lg:border-t-0 border-gray-200/60">
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-br from-emerald-50 to-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-emerald-200/60">
                <h4 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-base sm:text-lg flex items-center gap-2">
                  <Navigation size={20} className="text-emerald-600" />
                  Orden de Visita
                </h4>

                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg border border-gray-200/60 shadow-sm">
                    <div
                      className="w-5 h-5 sm:w-6 sm:h-6 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0"
                      style={{ backgroundColor: colorOrden }}
                    >
                      R
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Ruta Optimizada</p>
                      <p className="text-xs sm:text-sm text-gray-600">Sigue el orden numérico para mejor experiencia</p>
                    </div>
                  </div>

                  <h5 className="font-medium text-gray-700 text-xs sm:text-sm mt-3 sm:mt-4">Secuencia de lugares:</h5>
                  {lugaresParaLista.map((lugar, index) => {
                    const lugarTraducido = traductorFrontend.traducirLugar(lugar);
                    return (
                      <div key={lugar.id_lugar} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/80 rounded-lg border border-gray-200/60 shadow-sm">
                        <div className="relative shrink-0">
                          <div
                            className="w-8 h-8 sm:w-10 sm:h-10 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg"
                            style={{ backgroundColor: colorOrden }}
                          >
                            {index + 1}
                          </div>
                          {index < lugaresParaLista.length - 1 && (
                            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                              <div className="w-0.5 h-3" style={{ backgroundColor: colorOrden }}></div>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm mb-0.5 sm:mb-1 truncate">{lugarTraducido.nombreEspanol}</p>
                          <p className="text-xs text-gray-600 mb-1 sm:mb-2 truncate">{lugar.ubicacion || 'Dirección no disponible'}</p>

                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="text-xs font-medium text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0"
                              style={{ backgroundColor: colorOrden }}
                            >
                              Parada {index + 1}
                            </span>
                            {lugar.puntaje && (
                              <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full border border-yellow-200">
                                <span className="text-yellow-700 text-xs font-bold">★ {lugar.puntaje.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2 sm:p-3 bg-blue-50/80 rounded-lg border border-blue-200/60">
                  <p className="text-xs text-blue-800">
                    <strong>Tip:</strong> Sigue el orden numérico para una ruta optimizada que minimiza los tiempos de desplazamiento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de línea de ruta con avioncito animado
const RutaConectada = ({ lugares, dia }) => {
  const [avionActivo, setAvionActivo] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAvionActivo(prev => (prev + 1) % lugares.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [lugares.length]);

  return (
    <div className="relative py-6 sm:py-8">
      {/* Línea punteada de la ruta */}
      <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 gradient-to-b from-emerald-300 to-blue-300 border-l-2 border-dashed border-emerald-200"></div>

      {/* Puntos de la ruta */}
      {lugares.map((lugar, index) => {
        // Traducir solo el nombre del lugar
        const lugarTraducido = traductorFrontend.traducirLugar(lugar);

        return (
          <div key={lugar.id_lugar} className="relative flex items-start gap-3 sm:gap-4 mb-6 sm:mb-8 last:mb-0">
            {/* Punto en la línea */}
            <div className={`relative z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 sm:border-4 border-white shadow-lg ${index <= avionActivo ? 'bg-emerald-500' : 'bg-gray-300'
              }`}>
              {/* Avioncito animado */}
              {index === avionActivo && (
                <div className="absolute -top-5 sm:-top-6 -left-1.5 sm:-left-2 animate-bounce">
                  <Plane size={16} className="text-green-800 rotate-45" />
                </div>
              )}
            </div>

            {/* Contenido del lugar - MANTENER IMAGEN Y ESTRUCTURA */}
            <div className={`flex-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-l-2 sm:border-l-4 transition-all duration-500 ${index <= avionActivo
                ? 'gradient-to-r from-emerald-50 to-white border-emerald-400 shadow-md'
                : 'bg-gray-50 border-gray-300'
              }`}>
              <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                {/* Imagen del lugar - SE MANTIENE IGUAL */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                  <img
                    src={getPlaceImage(lugar)}
                    alt={lugarTraducido.nombreEspanol}
                    className="w-full h-full object-cover rounded-lg shadow-md"
                    onError={(e) => {
                      e.target.src = '/img/lugares/categoria-default.jpg';
                    }}
                  />
                </div>

                {/* Información del lugar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1 sm:mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                        {/* CAMBIAR SOLO ESTA LÍNEA: lugar.nombre → lugarTraducido.nombreEspanol */}
                        <h4 className="font-bold text-sm sm:text-base text-gray-900 truncate">{lugarTraducido.nombreEspanol}</h4>
                      </div>

                      <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-gray-600">
                        {lugar.ubicacion && (
                          <p className="flex items-center gap-2">
                            <MapPin size={14} />
                            {lugar.ubicacion}
                          </p>
                        )}
                      </div>

                      {lugar.categoria && (
                        <p className="text-xs sm:text-sm text-gray-700 mt-1 sm:mt-2 bg-white/50 p-1.5 sm:p-2 rounded-lg">
                          {traducirCategoria(lugar.categoria)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-white border-2 border-emerald-500 text-green-800 rounded-full font-bold text-xs sm:text-sm ml-2 sm:ml-4 flex-shrink-0">
                      {index + 1}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Tarjeta de estadísticas con diseño moderno
const StatsCard = ({ icon: Icon, label, value, color = 'emerald' }) => (
  <div className={`bg-${color}-50 p-4 rounded-2xl shadow-sm`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 bg-${color}-100 rounded-lg`}>
        <Icon size={20} className={`text-${color}-600`} />
      </div>
      <div>
        <p className="text-sm text-gray-600 font-medium">{label}</p>
        <p className={`text-xl font-bold text-${color}-700`}>{value}</p>
      </div>
    </div>
  </div>
);

const ItineraryDetail = ({ itinerary, onBack, onEdit, onDelete, openExportModal }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [diasAbiertos, setDiasAbiertos] = useState({ 1: true });
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [mostrarMapaOrden, setMostrarMapaOrden] = useState(false);
  const [lugaresMapa, setLugaresMapa] = useState([]);
  const [tipoMapa, setTipoMapa] = useState('dia');
  const [tituloMapa, setTituloMapa] = useState('');
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  // NUEVOS ESTADOS PARA EL MODAL
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { showAlert } = useAlert();

  const imagenes = itinerary.imagenes?.length > 0
    ? itinerary.imagenes.map(img => `/img/lugares/${img}`)
    : [itinerary.image];

  const siguiente = () => {
    setCurrentIndex((prev) => (prev + 1) % imagenes.length);
  };

  const anterior = () => {
    setCurrentIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length);
  };

  const toggleDia = (dia) => {
    setDiasAbiertos(prev => ({
      ...prev,
      [dia]: !prev[dia]
    }));
  };

  // Función para abrir modal de eliminación
  const abrirModalEliminar = () => {
    setShowDeleteModal(true);
  };

  // Función para cerrar modal
  const cerrarModalEliminar = () => {
    setShowDeleteModal(false);
  };

  // Función para manejar la eliminación desde el detalle
  const manejarEliminacion = async () => {
    try {
      await onDelete(itinerary);
      // La alerta se mostrará desde el ItineraryManager
    } catch (error) {
      showAlert('error', 'Error al eliminar itinerario', 'No se pudo eliminar el itinerario. Inténtalo de nuevo más tarde.');
    }
    cerrarModalEliminar();
  };

  const verMapaCompleto = () => {
    const lugaresAgrupados = {};
    itinerary.dailyPlan?.forEach(day => {
      lugaresAgrupados[day.day] = day.lugares.map(lugar => ({
        ...lugar,
        imagen: `/img/lugares/${lugar.foto}`,
        direccion: lugar.ubicacion
      }));
    });

    setLugaresMapa(lugaresAgrupados);
    setTipoMapa('completo');
    setTituloMapa(`Mapa completo - ${itinerary.name}`);
    setMostrarMapa(true);
  };

  const verMapaDia = (lugares, dia) => {
    const lugaresConImagen = lugares.map(lugar => ({
      ...lugar,
      imagen: `/img/lugares/${lugar.foto}`,
      direccion: lugar.ubicacion
    }));

    setLugaresMapa(lugaresConImagen);
    setTipoMapa('dia');
    setDiaSeleccionado(dia);
    setTituloMapa(`Día ${dia} - ${itinerary.name}`);
    setMostrarMapa(true);
  };

  const verRutaOrden = (lugares, dia) => {
    const lugaresConImagen = lugares.map(lugar => ({
      ...lugar,
      imagen: `/img/lugares/${lugar.foto}`,
      direccion: lugar.ubicacion
    }));

    setLugaresMapa(lugaresConImagen);
    setTituloMapa(`Ruta del Día ${dia} - ${itinerary.name}`);
    setMostrarMapaOrden(true);
  };

  const cerrarMapa = () => {
    setMostrarMapa(false);
    setLugaresMapa([]);
  };

  const cerrarMapaOrden = () => {
    setMostrarMapaOrden(false);
    setLugaresMapa([]);
  };

  // Calcular estadísticas
  const totalLugares = itinerary.dailyPlan?.reduce((acc, day) => acc + day.lugares.length, 0) || 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header con fondo verde*/}
        <div className="bg-green-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 text-white mb-6 sm:mb-8 shadow-xl">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-emerald-100 hover:text-white mb-4 sm:mb-6 transition-colors group"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm sm:text-base">Volver a mis viajes</span>
          </button>

          <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 drop-shadow-lg">{itinerary.name}</h1>
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-wrap">
                <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium">
                  {itinerary.isPublic ? <Globe size={14} className="sm:w-4 sm:h-4" /> : <Lock size={14} className="sm:w-4 sm:h-4" />}
                  {itinerary.isPublic ? "Viaje Público" : "Viaje Privado"}
                </span>
                <span className="text-emerald-100 text-xs sm:text-sm lg:text-base">
                  Creado el {itinerary.createdDate}
                </span>
              </div>

              {itinerary.description && (
                <p className="text-emerald-100 mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed">
                  {itinerary.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-2 sm:p-3 self-start">
              {/* REEMPLAZADO: imprimir -> exportar */}
              <button
                onClick={() => openExportModal(itinerary)}
                className="p-1.5 sm:p-2 text-white hover:bg-white/20 rounded-lg sm:rounded-xl transition-colors"
                title="Exportar PDF"
              >
                <Printer size={18} className="sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => onEdit(itinerary)}
                className="p-1.5 sm:p-2 text-white hover:bg-white/20 rounded-lg sm:rounded-xl transition-colors"
                title="Editar viaje"
              >
                <Pencil size={18} className="sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={abrirModalEliminar}
                className="p-1.5 sm:p-2 text-white hover:bg-red-500/50 rounded-lg sm:rounded-xl transition-colors"
                title="Eliminar viaje"
              >
                <Trash2 size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Columna izquierda - Información general */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Carrusel de imágenes */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
              <div className="relative h-40 sm:h-48">
                <img
                  src={imagenes[currentIndex]}
                  alt="Foto del itinerario"
                  className="w-full h-full object-cover"
                />
                {/* Carrusel */}
                {imagenes.length > 1 && (
                  <>
                    <button
                      onClick={anterior}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      onClick={siguiente}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Estadísticas del viaje */}
            <div className="space-y-3 sm:space-y-4">
              <StatsCard
                icon={Calendar}
                label="Duración del viaje"
                value={`${itinerary.duration} días`}
                color="emerald"
              />
              <StatsCard
                icon={MapPin}
                label="Lugares a visitar"
                value={totalLugares}
                color="emerald"
              />
              <StatsCard
                icon={Users}
                label="Estado"
                value={itinerary.isPublic ? "Público" : "Privado"}
                color="gray"
              />
            </div>

            {/* Fechas */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
              <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Calendar className="text-green-800" size={18} />
                Fechas del viaje
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                  <span className="text-sm text-gray-600">Inicio</span>
                  <span className="font-semibold text-green-800">{itinerary.startDate}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Fin</span>
                  <span className="font-semibold text-gray-700">{itinerary.endDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Itinerario detallado */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                  <Compass className="text-green-800" size={20} className="sm:w-6 sm:h-6" />
                  Ruta de Viaje
                </h2>
                <button
                  onClick={verMapaCompleto}
                  className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-200 text-emerald-700 rounded-md hover:bg-emerald-300 transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
                >
                  <Map size={16} className="sm:w-[18px] sm:h-[18px]" />
                  Ver Mapa Completo
                </button>
              </div>

              {itinerary.dailyPlan && itinerary.dailyPlan.length > 0 && (
                <div className="space-y-4 sm:space-y-6">
                  {itinerary.dailyPlan.map(day => (
                    <div key={day.day} className="border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden">
                      <div
                        className="flex justify-between items-center p-4 sm:p-6 gradient-to-r from-gray-50 to-white hover:from-emerald-50 cursor-pointer transition-all"
                        onClick={() => toggleDia(day.day)}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 text-white rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shadow-lg">
                            D{day.day}
                          </div>
                          <div>
                            <h3 className="font-bold text-base sm:text-lg lg:text-xl text-gray-900">
                              Día {day.day} {obtenerUbicacionDelDia(day.lugares)}
                            </h3>
                            <p className="text-gray-600 text-sm sm:text-base">{day.lugares.length} destino(s) programado(s)</p>
                          </div>
                        </div>
                        <button className={`text-gray-500 transition-transform duration-300 ${diasAbiertos[day.day] ? 'rotate-180 text-emerald-600' : ''}`}>
                          <ChevronDown size={24} />
                        </button>
                      </div>

                      {diasAbiertos[day.day] && (
                        <div className="p-4 sm:p-6 bg-white border-t border-gray-200">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
                            <h4 className="font-semibold text-gray-800 text-base sm:text-lg">Tu ruta del día:</h4>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  verRutaOrden(day.lugares, day.day);
                                }}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-300 transition-colors text-sm font-medium"
                              >
                                <Navigation size={14} className="sm:w-4 sm:h-4" />
                                Ver en mapa
                              </button>

                            </div>
                          </div>

                          <RutaConectada lugares={day.lugares} dia={day.day} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modales al final */}
        {mostrarMapa && (
          <MapaDia
            lugares={lugaresMapa}
            dia={tipoMapa === 'dia' ? diaSeleccionado : null}
            onClose={cerrarMapa}
            titulo={tituloMapa}
          />
        )}

        {mostrarMapaOrden && (
          <MapaOrden
            lugares={lugaresMapa}
            onClose={cerrarMapaOrden}
            titulo={tituloMapa}
          />
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN EN EL DETALLE */}
      <ModalConfirmacion
        isOpen={showDeleteModal}
        onClose={cerrarModalEliminar}
        onConfirm={manejarEliminacion}
        itinerarioNombre={itinerary.name}
      />
    </div>
  );
};

// Componente de lista de itinerarios rediseñado
const ItineraryListItem = ({ itinerary, onClick, onEdit, onDelete, onExport }) => {
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(itinerary);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(itinerary);
  };

  const handleExportClick = (e) => {
    e.stopPropagation();
    if (typeof onExport === 'function') {
      onExport(itinerary);
    }
  };

  // USAR los datos ya calculados en el itinerario
  const totalLugares = itinerary.totalLugares || 0;
  const duracion = itinerary.duration || 1;

  return (
    <div
      onClick={() => onClick(itinerary)}
      className="group bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-32 h-40 sm:h-32 relative shrink-0">
          <img
            src={itinerary.image}
            alt={traductorFrontend.traducirTexto(itinerary.name)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 gradient-to-t from-black/20 to-transparent"></div>

        </div>

        <div className="flex-1 p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2 gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-green-800 transition-colors">
                  {traductorFrontend.traducirTexto(itinerary.name)}
                </h3>
                <span
                  className={`
                    inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium shrink-0
                    ${itinerary.isPublic ? 'bg-emerald-100 text-green-800' : 'bg-gray-100 text-gray-700'}
                  `}
                >
                  {itinerary.isPublic ? <Globe size={11} className="sm:w-3 sm:h-3" /> : <Lock size={11} className="sm:w-3 sm:h-3" />}
                  {itinerary.isPublic ? 'Publico' : 'Privado'}
                </span>
              </div>

              {/* Descripción en la lista */}
              {itinerary.description && (
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                  {traductorFrontend.traducirTexto(itinerary.description)}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar size={13} className="sm:w-[14px] sm:h-[14px] text-green-800 shrink-0" />
                  <span className="truncate">Del {itinerary.startDate} al {itinerary.endDate}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <MapPin size={13} className="sm:w-[14px] sm:h-[14px] text-blue-600 shrink-0" />
                  {/* USAR el total de lugares ya calculado */}
                  <span>{totalLugares} {totalLugares === 1 ? 'lugar' : 'lugares'}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Clock size={13} className="sm:w-[14px] sm:h-[14px] text-purple-600 shrink-0" />
                  {/* USAR la duración ya calculada */}
                  <span>{duracion} {duracion === 1 ? 'día' : 'días'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 ml-2 sm:ml-4 flex-shrink-0">
              {/* REEMPLAZADO: imprimir -> exportar (detener propagación) */}
              <button
                onClick={handleExportClick}
                className="p-1.5 sm:p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors"
                title="Exportar PDF"
              >
                <Printer size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              <button
                onClick={handleEdit}
                className="p-1.5 sm:p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar"
              >
                <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 sm:p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// El resto del componente ItineraryManager se mantiene igual...
const ItineraryManager = ({ onEditar }) => {
  const { openExportModal } = useExport();
  const [itineraries, setItineraries] = useState([]);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // NUEVOS ESTADOS PARA EL MODAL
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itinerarioAEliminar, setItinerarioAEliminar] = useState(null);

  const { token } = useAuth();
  const { showAlert } = useAlert();

  // Función para cargar itinerarios - CORREGIDA COMPLETAMENTE
  const cargarItinerarios = async () => {
    if (!token) {
      setError("No hay sesión activa");
      setLoading(false);
      return;
    }

    try {
      const data = await obtenerItinerariosUsuario(token);

      // DEBUG: Ver qué devuelve la API
      console.log("📦 Datos crudos de la API:", data);
      console.log("🔍 Tipo de datos:", typeof data);
      console.log("📊 Es array?", Array.isArray(data));

      if (!Array.isArray(data)) {
        console.log("❌ No es array, contenido:", data);
        setItineraries([]);
        return;
      }

      const itinerariosNormalizados = data.map((item, index) => {
        console.log(`📝 Procesando itinerario ${index}:`, item);

        // Calcular total de lugares
        let totalLugares = 0;
        const grouped = {};

        if (item.lugares && Array.isArray(item.lugares)) {
          item.lugares.forEach(l => {
            if (!grouped[l.dia]) grouped[l.dia] = [];

            // Asegurarse de que cada lugar tenga la propiedad 'foto'
            const lugarConFoto = {
              ...l,
              foto: l.foto || 'default.jpg' // Valor por defecto si no hay foto
            };

            grouped[l.dia].push(lugarConFoto);
            totalLugares++;
          });
        }

        const dailyPlan = Object.keys(grouped)
          .sort((a, b) => a - b)
          .map(dia => ({
            day: parseInt(dia),
            lugares: grouped[dia]
          }));

        const duracion = calcularDuracion(item.fecha_inicio, item.fecha_termino);

        // Determinar privacidad: en backend 1 = privado, 0/null = publico
        const isPrivateFlag = (item.id_privacidad === 1) || (item.privacidad === true);
        const itinerarioNormalizado = {
          id: item.id_itinerario,
          name: item.titulo,
          image: item.portada
            ? `http://localhost:3000/uploads/lugares/${item.portada}`
            : (item.lugares?.[0]?.foto
              ? `/img/lugares/${item.lugares[0].foto}`
              : '/img/lugares/default.jpg'),
          startDate: item.fecha_inicio,
          endDate: item.fecha_termino,
          duration: duracion,
          createdDate: item.fecha_creacion,
          // isPrivate: true cuando es privado; isPublic es el inverso (compatibilidad)
          isPrivate: isPrivateFlag,
          isPublic: !isPrivateFlag,
          description: item.descripcion,
          dailyPlan,
          totalLugares,
          images: item.lugares?.map(l => `/img/lugares/${l.foto}`) || []
        };

        console.log(`✅ Itinerario ${index} normalizado:`, itinerarioNormalizado);
        return itinerarioNormalizado;
      });

      console.log("🎯 Itinerarios finales:", itinerariosNormalizados);
      setItineraries(itinerariosNormalizados);

    } catch (err) {
      console.error("💥 Error al cargar itinerarios:", err);
      setError(err.message || "Error al cargar itinerarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarItinerarios();
  }, [token]);

  // Función para abrir el modal de confirmación
  const abrirModalEliminar = (itinerary) => {
    setItinerarioAEliminar(itinerary);
    setShowDeleteModal(true);
  };

  // Función para cerrar el modal
  const cerrarModalEliminar = () => {
    setShowDeleteModal(false);
    setItinerarioAEliminar(null);
  };

  // Función para eliminar itinerario - MODIFICADA
  const handleDelete = async (itinerary) => {
    if (!itinerary || !itinerary.id) {
      console.error('Error: itinerary o itinerary.id es undefined');
      showAlert('error', 'Error al identificar itinerario', 'No se pudo identificar el itinerario a eliminar');
      return;
    }

    setIsDeleting(true);

    try {
      await eliminarItinerario(itinerary.id, token);

      showAlert('success', '¡Itinerario eliminado con éxito!', `Itinerario "${itinerary.name}"  se eliminó.`);

      // Si estamos viendo el detalle del itinerario que se eliminó, volver a la lista
      if (selectedItinerary && selectedItinerary.id === itinerary.id) {
        setSelectedItinerary(null);
      }

      // Recargar la lista de itinerarios
      await cargarItinerarios();

    } catch (err) {
      console.error('Error al eliminar itinerario:', err);
      showAlert('error', 'Error al eliminar itinerario', `No se pudo eliminar el itinerario: ${err.message}. Inténtalo de nuevo más tarde.`);
    } finally {
      setIsDeleting(false);
      cerrarModalEliminar(); // Cerrar el modal después de la operación
    }
  };

  // Función para confirmar eliminación
  const confirmarEliminacion = () => {
    if (itinerarioAEliminar) {
      handleDelete(itinerarioAEliminar);
    }
  };

  const handleViewItinerary = async (itinerary) => {
    try {
      if (!itinerary || !itinerary.id) {
        console.error('Error: itinerary o itinerary.id es undefined');
        return;
      }

      const data = await obtenerItinerarioPorId(itinerary.id, token);

      const grouped = {};
      data.lugares?.forEach(l => {
        if (!grouped[l.dia]) grouped[l.dia] = [];

        // Asegurarse de que cada lugar tenga la propiedad 'foto'
        const lugarConFoto = {
          ...l,
          foto: l.foto || 'default.jpg' // Valor por defecto si no hay foto
        };

        grouped[l.dia].push(lugarConFoto);
      });

      const dailyPlan = Object.keys(grouped)
        .sort((a, b) => a - b)
        .map(dia => ({
          day: parseInt(dia),
          lugares: grouped[dia]
        }));

      const totalLugares = dailyPlan.reduce((acc, day) => acc + day.lugares.length, 0);
      const isPrivateFlagDetail = (data.id_privacidad === 1) || (data.privacidad === true);

      setSelectedItinerary({
        ...data,
        id: data.id_itinerario, // ← Asegurar que el ID esté presente
        name: data.titulo,
        image: data.portada
          ? `http://localhost:3000/uploads/lugares/${data.portada}`
          : (data.lugares?.[0]?.foto
            ? `/img/lugares/${data.lugares[0].foto}`
            : '/img/lugares/default.jpg'),
        startDate: data.fecha_inicio,
        endDate: data.fecha_termino,
        duration: calcularDuracion(data.fecha_inicio, data.fecha_termino),
        createdDate: new Date(data.fecha_creacion).toLocaleDateString('es-ES'),
        isPrivate: isPrivateFlagDetail,
        isPublic: !isPrivateFlagDetail,
        description: data.descripcion,
        dailyPlan,
        totalLugares,
        images: data.lugares?.map(l => `/img/lugares/${l.foto}`) || []
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error al obtener itinerario por ID:', err);
    }
  };

  const handleBack = () => {
    setSelectedItinerary(null);
  };

  const handleEdit = (itinerary) => {
    if (onEditar) {
      onEditar(itinerary.id);
    } else {
      console.error("La función onEditar no fue proporcionada al componente");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-800 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Cargando tus aventuras...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-red-600 bg-white p-6 rounded-2xl shadow-lg">{error}</p>
    </div>
  );

  if (selectedItinerary) {
    return (
      <ItineraryDetail
        itinerary={selectedItinerary}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
        openExportModal={openExportModal} // <-- PASAMOS onExport AL DETALLE
        isDeleting={isDeleting}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
            Mis Itinerarios de Viaje
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-900 font-light leading-relaxed max-w-2xl">
            Administra tus itinerarios, organiza tus viajes y descubre nuevas experiencias para tus próximas aventuras.
          </p>
        </div>
        <div className="space-y-6">
          {itineraries.map((itinerary) => (
            <ItineraryListItem
              key={itinerary.id}
              itinerary={itinerary}
              onClick={handleViewItinerary}
              onEdit={handleEdit}
              onDelete={abrirModalEliminar} // ← Cambiar aquí
              onExport={() => openExportModal(itinerary)} // <-- PASAMOS onExport A CADA ITEM
            />
          ))}
        </div>

        {itineraries.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
              <Compass className="text-white" size={32} className="sm:w-10 sm:h-10" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
              ¡Comienza tu aventura!
            </h3>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg max-w-md mx-auto px-4">
              Aún no tienes itinerarios creados. Planifica tu primer viaje y crea recuerdos inolvidables.
            </p>
            <button
              onClick={() => onEditar && onEditar(null)}
              className="bg-emerald-200 hover:bg-emerald-300 text-emerald-700 px-6 py-2.5 sm:px-8 sm:py-3 rounded-md font-semibold text-base sm:text-lg transition-colors">
              Crear mi primera aventura
            </button>
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      <ModalConfirmacion
        isOpen={showDeleteModal}
        onClose={cerrarModalEliminar}
        onConfirm={confirmarEliminacion}
        itinerarioNombre={itinerarioAEliminar?.name}
      />
    </div>
  );
};

export default ItineraryManager;
