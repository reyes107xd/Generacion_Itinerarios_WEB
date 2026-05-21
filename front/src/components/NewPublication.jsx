import { NotebookPen } from 'lucide-react';

const HOVER_BUTTON_CLASSES = 'hover:bg-green-300 hover:border-emerald-200 hover:shadow-sm hover:font-medium hover:text-emerald-900 transition-all';

const NewPublication = ({ onOpenModal }) => {
  return (
      <div className="flex flex-col items-center text-center p-4 md:p-6 h-full justify-between border border-gray-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="w-full flex flex-col items-center">
          <div className="w-16 h-16 bg-linear-to-tr from-green-50 to-emerald-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-1 ring-green-100/50">
            <NotebookPen className="w-8 h-8 text-emerald-600" strokeWidth={1.5} />
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-2 tracking-tight">
            Nueva Publicación
          </h4>
          <p className="text-sm text-gray-500 leading-relaxed mb-6 px-2">
            Comparte tus experiencias y recomendaciones de viaje con la comunidad.
          </p>
        </div>
        
        <button
          onClick={onOpenModal}
          className={`w-full bg-green-200 text-emerald-700 border border-emerald-200 py-2.5 rounded-md ${HOVER_BUTTON_CLASSES} font-medium text-sm`}
        >
          <span className="relative z-10">Crear publicación</span>
        </button>
      </div>
);
};

export default NewPublication;