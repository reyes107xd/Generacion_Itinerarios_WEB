import { useState } from 'react';
import usePageTitle from '../../Extras/nombre'; 
import SolicitudesGrid from '../../components/comunidad/SolicitudesGrid';
import BuscarAmigosView from '../../components/comunidad/BuscarAmigosView';
import { Search } from 'lucide-react';

const TITLES = {
  explorar: 'Explorar Comunidad',
  solicitudes: 'Solicitudes de Amistad',
};

const Comunidad = () => {
  usePageTitle('Comunidad');
  const [searchTerm, setSearchTerm] = useState(''); 

  return (
    <>
      <div className="max-w-7xl mx-auto p-5 ">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* --- COLUMNA IZQUIERDA --- */}
          <aside className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg flex flex-col">
              
              {/* Encabezado: Título y Búsqueda */}
              <div className="p-6 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 ">
                  {TITLES.explorar}
                </h2>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre "
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
              <div className="p-6">
                <BuscarAmigosView searchTerm={searchTerm} />
              </div>
              
            </div>
          </aside>

          {/* --- COLUMNA DERECHA--- */}
          <main className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg flex flex-col">
              
              <div className="flex justify-between items-center px-6 pt-5 pb-2 flex-shrink-0 ">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                  {TITLES.solicitudes}
                </h2>
              </div>
              <div className="p-6">
                <SolicitudesGrid />
              </div>
              
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Comunidad;