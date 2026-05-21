import { useState, useEffect } from 'react'
import logo from '../img/Logo _TLAMATINI Itinerarios_ con tocado azteca.png'
import bellas_artes from '../img/bellas_artes.jpg'
import zocalo from '../img/zocalo.jpg'
import aztlan from '../img/aztlan.jpg'

// Datos del carrusel SIN details
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

function AuthLayout({ children }) {
  const [currentImage, setCurrentImage] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Efecto para el carrusel automático
  useEffect(() => {
    if (isPaused || isTransitioning) return
    
    const interval = setInterval(() => {
      handleNextImage()
    }, 4000)
    
    return () => clearInterval(interval)
  }, [isPaused, isTransitioning])

  const handleNextImage = () => {
    if (isTransitioning) return
    
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentImage((prev) => (prev + 1) % destinations.length)
      setIsTransitioning(false)
    }, 600)
  }

  const handlePrevImage = () => {
    if (isTransitioning) return
    
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentImage((prev) => (prev - 1 + destinations.length) % destinations.length)
      setIsTransitioning(false)
    }, 600)
  }

  const goToImage = (index) => {
    if (isTransitioning || index === currentImage) return
    
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentImage(index)
      setIsTransitioning(false)
    }, 600)
  }

  const destination = destinations[currentImage]

  return (
    <div className="auth-container">
      {/* Logo en esquina superior izquierda */}
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      <div className="auth-content">
        {/* Sección izquierda - Formulario */}
        <div className="form-section">
          {children}
        </div>

        {/* Sección derecha - CARRUSEL CON TRANSICIÓN */}
        <div 
          className="image-section"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Contenedor de todas las imágenes */}
          <div className="carousel-container">
            {destinations.map((dest, index) => (
              <img 
                key={index}
                src={dest.image} 
                alt={dest.title}
                className={`location-image ${
                  index === currentImage ? 'active' : 'inactive'
                } ${isTransitioning ? 'transitioning' : ''}`}
              />
            ))}
          </div>
          
          {/* Overlay con información (SIN details) */}
          <div className="image-overlay">
            <div className="location-info">
              <h3>📍 {destination.title}</h3>
              <p>{destination.description}</p>
              {/* ❌ Se eliminó la sección de details */}
            </div>
          </div>

          {/* Controles del carrusel */}
          <button 
            className="carousel-btn carousel-prev"
            onClick={handlePrevImage}
            aria-label="Imagen anterior"
            disabled={isTransitioning}
          >
            ‹
          </button>
          
          <button 
            className="carousel-btn carousel-next"
            onClick={handleNextImage}
            aria-label="Siguiente imagen"
            disabled={isTransitioning}
          >
            ›
          </button>

          {/* Indicadores de puntos */}
          <div className="carousel-indicators">
            {destinations.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentImage ? 'active' : ''} ${
                  isTransitioning ? 'disabled' : ''
                }`}
                onClick={() => goToImage(index)}
                disabled={isTransitioning}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>

          {/* Contador */}
          <div className="carousel-counter">
            {currentImage + 1} / {destinations.length}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout