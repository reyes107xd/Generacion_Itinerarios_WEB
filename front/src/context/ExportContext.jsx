// context/ExportContext.jsx
import { createContext, useState, useContext } from "react";
import ExportarItinerario from "../components/Itinerarios/ExportarItinerario"; // Ajusta la ruta

const ExportContext = createContext();

export function ExportProvider({ children }) {
  const [exportState, setExportState] = useState({
    isOpen: false,
    itinerary: null
  });

  const openExportModal = (itinerary) => {
    setExportState({ isOpen: true, itinerary });
  };

  const closeExportModal = () => {
    setExportState({ isOpen: false, itinerary: null });
  };

  return (
    <ExportContext.Provider value={{ openExportModal }}>
      {children}
      
      {/* Modal de exportación */}
      {exportState.isOpen && (
        <ExportarItinerario
          itinerario={exportState.itinerary}
          onClose={closeExportModal}
        />
      )}
    </ExportContext.Provider>
  );
}

export const useExport = () => useContext(ExportContext);