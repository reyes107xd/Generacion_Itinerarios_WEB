import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageLightbox = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    // Bloquea el scroll del body mientras el lightbox está abierto
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Función segura para cerrar
  const handleClose = (e) => {
    if (e) e.stopPropagation();
    onClose();
  };

  const lightboxContent = (
    <div
      // CORRECCIÓN: z-[10000] para estar encima del modal y bg-black/90 para tapar todo bien
      className="fixed inset-0 z-[10000] w-screen h-screen bg-black/90 backdrop-blur-md flex items-center justify-center animate-fade-in"
      onClick={handleClose}
    >
      {/* Botón Cerrar */}
      <button
        onClick={handleClose}
        className="absolute top-5 right-5 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-[110]"
      >
        <X size={32} />
      </button>

      {/* Contenedor de la Imagen */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 md:p-10"
        onClick={(e) => e.stopPropagation()} // Evita cerrar si das clic a la imagen
      >
        <img
          src={images[currentIndex]}
          alt={`Imagen ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain shadow-2xl rounded-sm select-none"
        />

        {/* Flechas de Navegación */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 md:left-8 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 p-2 rounded-full transition"
            >
              <ChevronLeft size={40} />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 md:right-8 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 p-2 rounded-full transition"
            >
              <ChevronRight size={40} />
            </button>

            {/* Indicador */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/40 px-3 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
};

export default ImageLightbox;