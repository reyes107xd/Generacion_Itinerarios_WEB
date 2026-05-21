// src/components/RecommendationsSection.jsx
import React, { useState, useEffect } from 'react';
import RecommendationsSlider from './RecommendationsSlider';
import ItineraryViewerModal from './common/ItineraryViewerModal';
import { useAuth } from '../context/authContext';
import { obtenerItinerariosRecomendados } from '../api/api-itinerario';

const RecommendationsSection = ({ onControlsReady, hideHeaderControls = false }) => {
  const { token } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para controlar el modal
  const [selectedItineraryId, setSelectedItineraryId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setRecommendations([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await obtenerItinerariosRecomendados(token);
        
        console.log("Datos de itinerarios recomendados:", data); // Para verificar la estructura

        // Ahora los datos ya vienen con el nombre del creador desde el backend
        const adaptados = (data || []).map(it => ({
          id: it.id_itinerario || it.id,
          title: it.titulo,
          description: it.descripcion,
          startDate: it.fecha_inicio,
          endDate: it.fecha_termino,
          categoriaDominante: it.categoria_dominante,
          creadorNombre: it.creador_nombre || it.nombre_creador || 'Usuario' // Ya viene del backend
        }));

        setRecommendations(adaptados);
        setError(null);
      } catch (err) {
        console.error("Error al obtener recomendaciones:", err);
        setError(err.message || "No se pudieron cargar las recomendaciones.");
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [token]);

  // Función para manejar la visualización del itinerario
  const handleViewItinerary = (id) => {
    setSelectedItineraryId(id);
    setShowModal(true);
  };

  // Función para cerrar el modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItineraryId(null);
  };

  // Función para manejar el éxito al guardar
  const handleSaveSuccess = (savedItinerary) => {
    console.log('Itinerario guardado exitosamente:', savedItinerary);
    // Aquí puedes mostrar un toast o notificación al usuario
  };

  if (isLoading) return <div className="p-6 text-sm text-gray-600">Cargando recomendaciones...</div>;
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;
  if (!recommendations.length) return <div className="p-6 text-sm text-gray-600">No hay recomendaciones disponibles.</div>;

  return (
    <>
      <RecommendationsSlider 
        recommendations={recommendations}
        onViewItinerary={handleViewItinerary}
        onControlsReady={onControlsReady}
        hideHeaderControls={hideHeaderControls}
      />
      
      {/* Modal de vista de itinerario */}
      {showModal && selectedItineraryId && (
        <ItineraryViewerModal
          idItinerario={selectedItineraryId}
          onClose={handleCloseModal}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </>
  );
};

export default RecommendationsSection;