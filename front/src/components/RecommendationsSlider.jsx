// src/components/RecommendationsSlider.jsx
import { useRef, useState, useEffect } from "react";
import RecommendationCard from "./RecommendationCard";


// Medidas
const CARD_WIDTH = 300;
const GAP = 16;
const ITEMS_PER_PAGE = 3; // Cantidad de tarjetas visibles

const RecommendationsSlider = ({ recommendations = [], onViewItinerary, onControlsReady, hideHeaderControls = false }) => {
  const sliderRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Calculamos el número total de páginas (grupos de 3)
  const totalPages = Math.ceil(recommendations.length / ITEMS_PER_PAGE);

  // Estilos compartidos con el botón "Ver detalles"
  // bg-green-200 border-emerald-200 text-emerald-700
  // Botones más grandes para mejor accesibilidad
  const BUTTON_BASE_CLASSES = "p-3 rounded-xl border transition-colors flex items-center justify-center";
  const ACTIVE_BTN_CLASSES = "bg-green-200 border-emerald-200 text-emerald-700 hover:bg-green-300 hover:border-emerald-300 shadow";
  const DISABLED_BTN_CLASSES = "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed";

  // Función para mover el slider y actualizar el estado
  const scrollSlider = (pageIndex) => {
    if (sliderRef.current) {
      const scrollAmount = (CARD_WIDTH + GAP) * ITEMS_PER_PAGE;
      sliderRef.current.scrollTo({
        left: pageIndex * scrollAmount,
        behavior: "smooth",
      });
    }
    setCurrentPage(pageIndex);
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      scrollSlider(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      scrollSlider(currentPage - 1);
    }
  };

  // Exponer controles al exterior para ubicar los botones junto al título
  useEffect(() => {
    if (typeof onControlsReady === 'function') {
      onControlsReady({
        currentPage,
        totalPages,
        prev: handlePrev,
        next: handleNext,
        goTo: scrollSlider,
        BUTTON_BASE_CLASSES,
        ACTIVE_BTN_CLASSES,
        DISABLED_BTN_CLASSES,
      });
    }
  }, [currentPage, totalPages]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* --- CABECERA DE CONTROLES (Arriba) --- */}
      {!hideHeaderControls && (
      <div className="hidden md:flex items-center justify-end px-5 w-full">

        {/* Controles: Botones e Indicadores */}
        <div className="flex items-center gap-4">
          
          {/* Botón Izquierda */}
          <button
            onClick={handlePrev}
            disabled={currentPage === 0}
            className={`${BUTTON_BASE_CLASSES} ${currentPage === 0 ? DISABLED_BTN_CLASSES : ACTIVE_BTN_CLASSES}`}
            aria-label="Anterior"
          >
          </button>

          {/* Indicadores (Dots) */}
          <div className="flex items-center gap-1.5 mx-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => scrollSlider(index)}
                className={`transition-all duration-300 rounded-full ${
                  currentPage === index
                    ? "w-7  bg-emerald-600" // Activo (alargado y oscuro)
                    : "w-7  bg-emerald-200 hover:bg-emerald-300" // Inactivo (punto claro)
                }`}
                aria-label={`Ir a página ${index + 1}`}
              />
            ))}
          </div>

          {/* Botón Derecha */}
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages - 1}
            className={`${BUTTON_BASE_CLASSES} ${currentPage === totalPages - 1 ? DISABLED_BTN_CLASSES : ACTIVE_BTN_CLASSES}`}
            aria-label="Siguiente"
          >
          </button>
        </div>
      </div>
      )}

      {/* --- SLIDER --- */}
      <div
        className="overflow-hidden w-full">
        <div
          ref={sliderRef}
          className="flex gap-4 py-4 px-2 overflow-x-auto no-scrollbar snap-x snap-mandatory"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="w-[85vw] sm:w-[45vw] md:w-[300px] flex-shrink-0 snap-center"
            >
              <RecommendationCard 
                place={rec} 
                onViewItinerary={onViewItinerary} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendationsSlider;