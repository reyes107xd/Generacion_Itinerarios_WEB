import { useState, useEffect } from 'react'; 
import { useSearchParams } from 'react-router-dom';
import { Map, MapPlus } from 'lucide-react';
import ItineraryManager from '../../components/Itinerarios/Consultar-Itinerario';
import CrearItinerario from './../../components/Itinerarios/Crear-Itinerario';
import usePageTitle from '../../Extras/nombre';

const ProfileTabs = ({ activeTab, onTabClick, esEdicion }) => {
  const tabs = [
    { id: 'Ver-Itinerarios', label: 'Mis itinerarios', icon: Map },
    { id: 'Crear-Itinerario', label: esEdicion ? 'Editar' : 'Nuevo itinerario', icon: MapPlus }
  ];

  return (
    <div className="flex border-b border-gray-200 mb-4 sm:mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 font-medium transition-colors
              ${isActive
                ? 'border-b-2 border-emerald-700 text-emerald-700'
                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'}
            `}
          >
            <Icon size={18} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

function GestionarItinerario() {

  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const urlId = searchParams.get('id');
  const urlEditar = searchParams.get('editar');

  const [activeTab, setActiveTab] = useState(urlTab || 'Ver-Itinerarios');
  const [idEditar, setIdEditar] = useState(null);

  useEffect(() => {
    if (urlEditar === 'true' && urlId) {
      setIdEditar(urlId);
      setActiveTab('Crear-Itinerario');
    }
  }, [urlEditar, urlId]);

  const manejarEdicion = (id) => {
    setIdEditar(id);
    setActiveTab('Crear-Itinerario');
  };

  const terminarEdicion = () => {
    setIdEditar(null);
    setActiveTab('Ver-Itinerarios');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Ver-Itinerarios':
        return (
          <div className="overflow-x-auto">
            <ItineraryManager onEditar={manejarEdicion} />
          </div>
        );
      case 'Crear-Itinerario':
        return (
          <div className="text-center text-gray-500">
            <CrearItinerario idProp={idEditar} onCancelar={terminarEdicion} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <main>
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10">
          <ProfileTabs activeTab={activeTab} onTabClick={setActiveTab} esEdicion={!!idEditar} />
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default GestionarItinerario;
