import { useState, useEffect } from 'react'
import logo from './img_login/logo_itinerario.png'
import bellas_artes from './img_login/bellas_artes_1_1.jpg'
import zocalo from './img_login/zocalo_4_3.jpg'
import aztlan from './img_login/aztlan_1_1.jpg'

const destinations = [
    {
        image: bellas_artes,
        title: "Bellas Artes, Ciudad de México",
        description: "Centro Histórico • CDMX"
    },
    {
        image: zocalo,
        title: "Zocalo, Ciudad de México",
        description: "Centro Histórico • CDMX"
    },
    {
        image: aztlan,
        title: "Aztlan, Ciudad de México",
        description: "Parque de diversiones • CDMX"
    }
]

const TRANSITION_DURATION = 800 
const AUTOPLAY_INTERVAL = 5000 

function AuthLayout({ children }) {
    const [currentImage, setCurrentImage] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false) 

    useEffect(() => {
        if (isPaused || isTransitioning) return

        const interval = setInterval(() => {
            handleNextImage()
        }, AUTOPLAY_INTERVAL)

        return () => clearInterval(interval)
    }, [isPaused, isTransitioning])

    const handleNextImage = () => {
        if (isTransitioning) return
        setIsTransitioning(true)
        setTimeout(() => {
            setCurrentImage((prev) => (prev + 1) % destinations.length)
            setIsTransitioning(false)
        }, TRANSITION_DURATION)
    }

    const handlePrevImage = () => {
        if (isTransitioning) return
        setIsTransitioning(true)
        setTimeout(() => {
            setCurrentImage((prev) => (prev - 1 + destinations.length) % destinations.length)
            setIsTransitioning(false)
        }, TRANSITION_DURATION)
    }

    const goToImage = (index) => {
        if (isTransitioning || index === currentImage) return
        setIsTransitioning(true)
        setTimeout(() => {
            setCurrentImage(index)
            setIsTransitioning(false)
        }, TRANSITION_DURATION)
    }

    const destination = destinations[currentImage]

    const buttonClasses = "text-white text-3xl w-12 h-12 flex items-center justify-center rounded-full border-2 border-white/80 bg-black/30 backdrop-blur-sm opacity-90 group-hover:opacity-100 transition-all duration-500 hover:bg-white/30 hover:scale-110 hover:border-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg";
    const prevIcon = '‹';
    const nextIcon = '›';

    return (
        <div className="flex min-h-screen w-full overflow-hidden bg-white">
            
            {/* Logo en esquina superior izquierda - SIN FONDO */}
            <div className="absolute top-6 left-6 z-30">
                <img 
                    src={logo} 
                    alt="Logo Itinerario" 
                    className="h-25 w-auto filter drop-shadow-lg hover:scale-105 transition-transform duration-300" 
                />
            </div>

            <div className="flex w-full">
                
                {/* Sección izquierda - Formulario (50%) */}
                <div className="flex w-full lg:w-1/2 items-center justify-center p-4 lg:p-8">
                    {children} 
                </div>

                {/* Sección derecha - CARRUSEL (50%) - TRANSICIONES MEJORADAS */}
                <div
                    className="relative hidden lg:block lg:w-1/2 overflow-hidden bg-gray-900 group"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Contenedor de todas las imágenes con transición mejorada */}
                    <div className="relative h-full w-full">
                        {destinations.map((dest, index) => (
                            <div
                                key={index}
                                className={`absolute inset-0 h-full w-full transition-all duration-700 ease-in-out transform
                                    ${index === currentImage 
                                        ? 'opacity-100 scale-100 z-10' 
                                        : 'opacity-0 scale-105 z-0'
                                    }
                                `}
                            >
                                <img
                                    src={dest.image}
                                    alt={dest.title}
                                    className="h-full w-full object-cover"
                                />
                                {/* Overlay de gradiente para mejor contraste */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10"></div>
                            </div>
                        ))}
                    </div>

                    {/* Overlay con información - MÁS TRANSPARENTE */}
                    <div className="absolute bottom-6 right-6 z-20">
                        <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl shadow-xl text-sm text-gray-800 border border-white/30 transition-all duration-500 hover:shadow-2xl hover:scale-105">
                            <h3 className="font-bold text-lg leading-tight text-gray-900">📍 {destination.title}</h3>
                            <p className="text-gray-700 text-sm mt-2 font-medium">{destination.description}</p>
                        </div>
                    </div>

                    {/* Controles del carrusel (Flechas) - MEJORADOS */}
                    <button
                        className={`absolute top-1/2 left-6 transform -translate-y-1/2 z-30 ${buttonClasses}`}
                        onClick={handlePrevImage}
                        aria-label="Imagen anterior"
                        disabled={isTransitioning}
                    >
                        {prevIcon}
                    </button>

                    <button
                        className={`absolute top-1/2 right-6 transform -translate-y-1/2 z-30 ${buttonClasses}`}
                        onClick={handleNextImage}
                        aria-label="Siguiente imagen"
                        disabled={isTransitioning}
                    >
                        {nextIcon}
                    </button>

                    {/* Indicadores de puntos (Bottom center) - MEJORADOS */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
                        {destinations.map((_, index) => (
                            <button
                                key={index}
                                className={`rounded-full transition-all duration-500 ease-out transform ${
                                    index === currentImage 
                                        ? 'w-8 h-2 bg-white shadow-lg scale-110' 
                                        : 'w-2 h-2 bg-white/60 hover:bg-white/80 hover:scale-125'
                                } ${isTransitioning ? 'cursor-wait opacity-70' : ''}`}
                                onClick={() => goToImage(index)}
                                disabled={isTransitioning}
                                aria-label={`Ir a imagen ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Contador (Bottom right) - MEJORADO */}
                    <div className="absolute bottom-6 right-24 mr-2 z-20 hidden md:block">
                        <div className="bg-black/70 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-full border border-white/20 transition-all duration-500 hover:bg-black/80">
                            <span className="font-semibold">{currentImage + 1}</span>
                            <span className="text-white/70"> / {destinations.length}</span>
                        </div>
                    </div>

                    {/* Efecto de brillo al cambiar de imagen */}
                    {isTransitioning && (
                        <div className="absolute inset-0 bg-white/5 z-15 animate-pulse pointer-events-none"></div>
                    )}
                    
                </div>
            </div>
        </div>
    )
}

export default AuthLayout