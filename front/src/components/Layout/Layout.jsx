import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import SweetAlert from '../../pages/login/SweetAlert';
import usePageTitle from '../../Extras/nombre'; 

const Layout = ({ children, pageTitle }) => {
  usePageTitle(pageTitle || 'Tlamatini');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', title: '', message: '', duration: 3000 });
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 relative selection:bg-emerald-100 selection:text-emerald-800 font-sans">
      
      {/* Background Pattern Global (Puntos sutiles) */}
      <div className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none" 
           style={{
             backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
             backgroundSize: '24px 24px'
           }}
      />

      {/* Sidebar (Fijo a la izquierda) */}
      {/* Para assets en Vite, usa la carpeta public con ruta absoluta desde "/" */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} logoSrc={'/img/default.jpg'} />
      
      {/* Contenedor Principal (A la derecha del Sidebar) */}
      {/* lg:ml-20 deja el espacio para la barra lateral colapsada */}
      <div className="lg:ml-20 transition-all duration-300 relative z-10 flex flex-col min-h-screen">
        
        {/* Header (Fijo arriba) */}
        <Header onMenuToggle={toggleSidebar} />
        
        {/* MAIN: Aquí es donde se renderiza Home.jsx */}
        {/* pt-[56px] sm:pt-[64px] lg:pt-[90px]: Empuja el contenido abajo para no chocar con el Header */}
        {/* max-w-[1600px] mx-auto: Centra el contenido en pantallas ultra anchas */}
        <main className="flex-1 pt-[56px] sm:pt-[64px] lg:pt-[90px] pb-6 sm:pb-8 lg:pb-10 px-3 sm:px-4 md:px-6 lg:px-8 w-full max-w-[1600px] mx-auto">
          {children}
        </main>

      </div>

      {/* Alertas Globales */}
      <SweetAlert
        show={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        duration={alert.duration}
        onClose={() => setAlert(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default Layout;