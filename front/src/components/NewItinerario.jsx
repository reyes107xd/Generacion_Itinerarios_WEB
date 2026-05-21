import { MapPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Constante reutilizable para los estilos de hover del botón
const HOVER_BUTTON_CLASSES = 'hover:bg-green-300 hover:border-emerald-200 hover:shadow-sm hover:font-medium hover:text-emerald-900 transition-all';

const NewItinerario = () => {
  const navigate = useNavigate();
  const handleCreate = () => {
    navigate('/GestionarItinerario?tab=Crear-Itinerario');
  };

  return (
      <div className="flex flex-col items-center text-center p-4 md:p-6 h-full justify-between border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="w-full flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-green-50 to-emerald-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-1 ring-green-100/50">
            <MapPlus className="w-8 h-8 text-emerald-600" strokeWidth={1.5} />
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-2 tracking-tight">
            ¿Próxima aventura?
          </h4>
          <p className="text-sm text-gray-500 leading-relaxed mb-6 px-2">
            Diseña rutas detalladas y ayuda a otros viajeros a descubrir el mundo.
          </p>
        </div>
        
        <button
          onClick={handleCreate}
          className={`w-full bg-green-200 text-emerald-700 border border-emerald-100 py-2.5 rounded-md transition-all font-medium text-sm ${HOVER_BUTTON_CLASSES}`}
        >
          Crear un itinerario
        </button>
      </div>
  );
};

export default NewItinerario;