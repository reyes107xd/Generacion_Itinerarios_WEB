// src/components/RecommendationCard.jsx
import { User, Calendar } from 'lucide-react';
// Importamos el logo
import recomendacionLogo from '../img/Logo _TLAMATINI Itinerarios_ con tocado azteca.png';

const RecommendationCard = ({ place, onViewItinerary }) => {
  const handleViewMore = () => {
    if (onViewItinerary && place.id) {
      onViewItinerary(place.id);
    }
  };
  const HOVER_BUTTON_CLASSES = 'hover:bg-green-300 hover:border-emerald-200 hover:shadow-sm hover:font-medium hover:text-emerald-900 transition-all';

  return (
    <div className="group relative h-full flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      
      {/* Imagen Header con Overlay Gradiente */}
      <div className="relative h-36 md:h-40 overflow-hidden bg-gray-100">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        <img
          src={recomendacionLogo}
          alt="itinerario"
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
        />
        {/* Título sobre la imagen para ahorrar espacio y modernizar */}
        <h4 className="absolute bottom-3 left-4 right-4 z-20 text-white font-bold text-lg leading-tight truncate drop-shadow-md">
          {place.title || 'Itinerario sin título'}
        </h4>
      </div>

      <div className="p-4 flex flex-1 flex-col">
        {/* Info Creador */}
        {place.creadorNombre && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
               <User size={12} />
            </div>
            <span className="text-xs font-medium text-gray-600 truncate">
              Creado por: {place.creadorNombre}
            </span>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
           {place.description || 'Explora este increíble destino con nuestra guía recomendada.'}
        </p>

        <div className="mt-auto space-y-3">
          {/* Fechas Compactas */}
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 mb-2">
             <Calendar size={12} className="text-emerald-500" />
             <span className='gap-2'>
              <p className='font-semibold'>Fecha de inicio</p>
                {place.startDate ? new Date(place.startDate).toLocaleDateString() : '—'} 
             </span>
             <span className='mx-5'> | </span>
             <span className='gap-2'>
              <p className='font-semibold'>Fecha de fin</p>
                {place.endDate ? new Date(place.endDate).toLocaleDateString() : '—'} 
             </span>
          </div>

          <button
            onClick={handleViewMore}
            className={`w-full py-2 rounded-lg bg-green-200 border border-emerald-200 text-emerald-700 text-sm font-semibold ${HOVER_BUTTON_CLASSES}`}
          >
            Ver detalles
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;