import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Map } from 'lucide-react';
import Mapa from './Itinerarios/Mapa';
import { createPortal } from 'react-dom';
import traductorFrontend from '../utils/traductor';
import { getPlaceImage, categoryImages } from '../utils/placeImages';

// URL base para las imágenes
const IMAGEN_BASE_URL = 'http://localhost:5173/img/lugares/';

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

// Componente para las acotaciones de los días
const LeyendaMapa = ({ dias, colores }) => {
  if (!dias || dias.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 justify-center mt-3 mb-2">
      {dias.map((dia, index) => (
        <div key={dia} className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: colores[index] }}
          />
          <span className="text-sm font-medium text-gray-700">
            Día {dia}
          </span>
        </div>
      ))}
    </div>
  );
};

// Componente auxiliar para mostrar la imagen
const ImagenLugar = ({ lugar }) => {
  const [src, setSrc] = useState('/img/lugares/categoria-default.jpg');
  const [error, setError] = useState(false);

  useEffect(() => {
    // Obtener la imagen usando la función getPlaceImage
    const imagenUrl = getPlaceImage(lugar);
    
    // Preload de la imagen
    const img = new Image();
    img.src = imagenUrl;
    
    img.onload = () => {
      setSrc(imagenUrl);
      setError(false);
    };
    
    img.onerror = () => {
      console.warn('Error cargando imagen para lugar:', {
        id: lugar.id,
        nombre: lugar.nombre,
        categoria: lugar.categoria,
        imagenObtenida: imagenUrl,
        imagenOriginal: lugar.imagen
      });
      setError(true);
      
      // Intentar con imagen de categoría como fallback
      if (lugar.categoria && categoryImages[lugar.categoria]) {
        setSrc(categoryImages[lugar.categoria]);
      } else {
        setSrc('/img/lugares/categoria-default.jpg');
      }
    };
  }, [lugar]);

  return (
    <img
      src={src}
      alt={lugar.nombreEspanol || lugar.nombre || 'Lugar'}
      className="w-10 h-10 object-cover rounded-md flex-shrink-0"
      title={lugar.nombreEspanol || lugar.nombre}
      loading="lazy"
    />
  );
};

const ModalSugerenciaItinerario = ({
  isOpen,
  onClose,
  onReject,
  onAccept,
  itinerarioOriginal,
  itinerarioSugerido
}) => {
  const [mapaKey, setMapaKey] = useState(0);
  const [itinerariosTraducidos, setItinerariosTraducidos] = useState({
    original: [],
    sugerido: []
  });

  // Obtener los días únicos para la leyenda
  const obtenerDiasUnicos = (itinerario) => {
    if (!itinerario || !Array.isArray(itinerario)) return [];
    return itinerario.map(dia => dia.dia).filter((dia, index, array) => array.indexOf(dia) === index);
  };

  const diasOriginal = obtenerDiasUnicos(itinerariosTraducidos.original);
  const diasSugerido = obtenerDiasUnicos(itinerariosTraducidos.sugerido);

  useEffect(() => {
    if (isOpen) {
      // Esto asegura que el mapa se reinicialice al abrir el modal
      setMapaKey(prev => prev + 1);

      // Lógica de traducción
      if (itinerarioOriginal && itinerarioSugerido) {
        const originalTraducido = itinerarioOriginal.map(dia => ({
          ...dia,
          lugares: dia.lugares?.map(lugar => traductorFrontend.traducirLugar(lugar)) || []
        }));

        const sugeridoTraducido = itinerarioSugerido.map(dia => ({
          ...dia,
          lugares: dia.lugares?.map(lugar => traductorFrontend.traducirLugar(lugar)) || []
        }));

        setItinerariosTraducidos({
          original: originalTraducido,
          sugerido: sugeridoTraducido
        });
      }
    }
  }, [isOpen, itinerarioOriginal, itinerarioSugerido]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const handleUseOriginal = () => {
    onReject();
  };

  // Convertir itinerarios al formato que espera el componente Mapa
  const convertirParaMapa = (itinerario) => {
    const lugaresPorDia = {};

    itinerario?.forEach(dia => {
      if (dia.lugares && Array.isArray(dia.lugares)) {
        lugaresPorDia[dia.dia] = dia.lugares.map(lugar => ({
          id: lugar.id,
          nombre: lugar.nombreEspanol || lugar.nombre,
          latitud: parseFloat(lugar.lat),
          longitud: parseFloat(lugar.lng),
          direccion: lugar.direccion,
          categoria: lugar.categoria,
          estado: lugar.estado,
          imagen: getPlaceImage(lugar), // Usar getPlaceImage aquí también
          puntaje: lugar.puntaje,
          votaciones: lugar.votaciones
        }));
      }
    });

    return lugaresPorDia;
  };

  const mapaOriginal = convertirParaMapa(itinerariosTraducidos.original);
  const mapaSugerido = convertirParaMapa(itinerariosTraducidos.sugerido);

  const sugeModal = (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl m-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <h2 className="text-2xl font-bold">Sugerencia de Itinerario Optimizado</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-green-600 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">

            {/* Columna izquierda - Itinerario Original - MODIFICADO A GRIS */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-300">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="text-gray-600" size={20} />
                Tu Itinerario Original
              </h3>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {itinerariosTraducidos.original?.map((dia, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={16} className="text-gray-600" />
                      <h4 className="font-semibold text-gray-700">Día {dia.dia}</h4>
                      {dia.estado && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          {dia.estado}
                        </span>
                      )}
                    </div>

                    {/* Lista de lugares */}
                    <ul className="space-y-2">
                      {dia.lugares?.map((lugar, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-3 p-2 bg-gray-50 rounded-md"
                        >
                          <ImagenLugar lugar={lugar} />
                          <span className="text-sm text-gray-700 flex-1 text-left">
                            {lugar.nombreEspanol || lugar.nombre || `Lugar ${idx + 1}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Mapa Original - Siempre visible */}
              <div className="mt-4">
                <div className="flex items-center w-full p-3 bg-gray-100 rounded-lg">
                  <span className="font-semibold text-gray-800 flex items-center gap-2">
                    <Map size={18} />
                    Mapa Original
                  </span>
                </div>
                
                {/* Leyenda del Mapa Original */}
                <LeyendaMapa dias={diasOriginal} colores={coloresDias} />
                
                <div className="mt-3 bg-white rounded-lg p-4 border border-gray-200">
                  <div className="h-48 md:h-64">
                    <Mapa
                      key={`original-${mapaKey}`}
                      containerId={`mapa-original-${mapaKey}`}
                      lugaresPorDia={mapaOriginal}
                      mostrarNumeroOrden={false}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Itinerario Sugerido - MANTENIDO VERDE */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="text-green-600" size={20} />
                Itinerario Optimizado
              </h3>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {itinerariosTraducidos.sugerido?.map((dia, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={16} className="text-green-600" />
                      <h4 className="font-semibold text-green-700">Día {dia.dia}</h4>
                      {dia.estado && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {dia.estado}
                        </span>
                      )}
                    </div>

                    {/* Lista de lugares */}
                    <ul className="space-y-2">
                      {dia.lugares?.map((lugar, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-3 p-2 bg-green-50 rounded-md"
                        >
                          <ImagenLugar lugar={lugar} />
                          <span className="text-sm text-gray-700 flex-1 text-left">
                            {lugar.nombreEspanol || lugar.nombre || `Lugar ${idx + 1}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Mapa Sugerido - Siempre visible */}
              <div className="mt-4">
                <div className="flex items-center w-full p-3 bg-green-100 rounded-lg">
                  <span className="font-semibold text-green-800 flex items-center gap-2">
                    <Map size={18} />
                    Mapa Optimizado
                  </span>
                </div>
                
                {/* Leyenda del Mapa Sugerido */}
                <LeyendaMapa dias={diasSugerido} colores={coloresDias} />
                
                <div className="mt-3 bg-white rounded-lg p-4 border border-green-200">
                  <div className="h-64">
                    <Mapa
                      key={`sugerido-${mapaKey}`}
                      containerId={`mapa-sugerido-${mapaKey}`}
                      lugaresPorDia={mapaSugerido}
                      mostrarNumeroOrden={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional*/}
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              <strong>¿Qué se optimizó?</strong> Se reorganizaron los lugares dentro de cada estado
              para reducir distancias de viaje y mejorar la experiencia. En el mapa optimizado podrás
              ver el orden sugerido de visita (indicado con números).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleUseOriginal}
            className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold"
          >
            Usar Original
          </button>
          <button
            onClick={onAccept}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
          >
            Aceptar y Guardar
          </button>
        </div>
      </div>
    </div>
  );
  return createPortal(sugeModal, document.body);
};

export default ModalSugerenciaItinerario;