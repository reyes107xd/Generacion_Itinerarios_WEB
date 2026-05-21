import { Link, useLocation } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  Home, MapPlus, Users, Bookmark, 
  MessageCircle, CircleUser, X, Map 
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, logoSrc, logoAlt = 'TLAMATINI' }) => {
  const location = useLocation();
  const notificationContext = useNotifications();
  const messageUnreadCount = notificationContext?.messageUnreadCount || 0;

  const menuItems = [
    { icon: Home, label: 'Inicio', path: '/home' },
    { icon: MapPlus, label: 'Itinerarios', path: '/GestionarItinerario' },
    { icon: Users, label: 'Comunidad', path: '/comunidad' },
    { icon: Bookmark, label: 'Guardados', path: '/guardados' },
    { icon: MessageCircle, label: 'Mensajes', path: '/mensajes', badge: messageUnreadCount },
    { icon: CircleUser, label: 'Mi perfil', path: '/perfil' },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside 
        className={`
          fixed left-0 top-0 h-screen z-50 flex flex-col
          bg-green-800 text-white border-r border-green-700 shadow-2xl
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          w-20 lg:hover:w-64 group
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        
        {/* HEADER LOGO */}
        <div className="h-14 sm:h-16 lg:h-20 flex items-center px-2 sm:px-3 relative border-b border-green-700 mb-1 sm:mb-2 shrink-0 overflow-hidden">
           <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 whitespace-nowrap">
             <motion.div 
               whileHover={{ rotate: 10, scale: 1.1 }}
               whileTap={{ scale: 0.9 }}
               className="relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 lg:w-13 lg:h-12 flex items-center justify-center bg-white/20 rounded-lg sm:rounded-xl cursor-pointer"
             >
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt={logoAlt}
                    className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 object-contain select-none"
                    draggable="false"
                  />
                ) : (
                  <Map className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                )}
             </motion.div>
             <span className={`
                text-base sm:text-lg lg:text-xl font-bold tracking-wide transition-all duration-300 delay-75
                opacity-0 -translate-x-4
                lg:group-hover:opacity-100 lg:group-hover:translate-x-0
                ${isOpen ? 'opacity-100 translate-x-0' : ''}
             `}>
               TLAMATINI
             </span>
           </div>
           <button onClick={onClose} className="lg:hidden absolute right-3 sm:right-4 text-white/80 hover:text-white">
             <X className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
           </button>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 flex flex-col px-2 sm:px-3 pt-1 sm:pt-2 gap-1.5 sm:gap-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link key={index} to={item.path} onClick={onClose}>
                  <div className={`
                    relative flex items-center h-10 sm:h-11 px-2.5 sm:px-3 rounded-lg sm:rounded-xl cursor-pointer
                    transition-colors duration-200 overflow-hidden whitespace-nowrap
                    /* Quitamos el background directo aquí para usar motion.div abajo, 
                       pero mantenemos el hover para los items inactivos */
                    ${!isActive && 'hover:bg-white/10'}
                  `}>
                    
                    {/* FONDO ANIMADO (SLIDING BACKGROUND) */}
                    {isActive && (
                      <motion.div
                        layoutId="active-sidebar-item" // ID Único compartido para la magia
                        className="absolute inset-0 bg-white shadow-md rounded-xl"
                        initial={false}
                        transition={{ 
                          type: "spring", 
                          stiffness: 400, 
                          damping: 30 
                        }}
                      />
                    )}

                    {/* CONTENIDO (ICONO Y TEXTO) 
                        Usamos 'relative z-10' para que esté ENCIMA del fondo blanco animado 
                    */}
                    <div className="relative z-10 flex items-center w-full">
                        <div className="shrink-0 flex items-center justify-center w-6 sm:w-7 lg:w-8">
                          {/* Cambiamos el color condicionalmente ya que el padre ya no controla el color por CSS puro tan fácil */}
                          <Icon 
                            className={`w-5 h-5 sm:w-5.5 sm:h-5.5 lg:w-6 lg:h-6 transition-colors duration-200 ${isActive ? 'text-green-900' : 'text-white/90'}`}
                            strokeWidth={isActive ? 2.5 : 2} 
                          />
                          
                          {item.badge > 0 && (
                            <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-red-500 text-[9px] sm:text-[10px] font-bold text-white border border-green-800 z-20">
                              {item.badge > 9 ? '9+' : item.badge}
                            </span>
                          )}
                        </div>

                        <span className={`
                          ml-3 sm:ml-4 text-xs sm:text-sm transition-all duration-300
                          opacity-0 -translate-x-2
                          lg:group-hover:opacity-100 lg:group-hover:translate-x-0
                          ${isOpen ? 'opacity-100 translate-x-0' : ''}
                          /* Color del texto condicional */
                          ${isActive ? 'text-green-900 font-semibold' : 'text-white/90'}
                        `}>
                          {item.label}
                        </span>
                    </div>

                  </div>
                </Link>
              );
            })}
        </nav>

        {/* FOOTER */}
        <div className="p-3 sm:p-4 lg:p-6 border-t border-green-700 shrink-0 overflow-hidden whitespace-nowrap text-center h-12 sm:h-14 lg:h-[70px]">
           <span className={`
              text-[10px] sm:text-xs text-green-200/60 block transition-all duration-300 delay-100
              opacity-0 translate-y-4
              lg:group-hover:opacity-100 lg:group-hover:translate-y-0
              ${isOpen ? 'opacity-100 translate-y-0' : ''}
           `}>
              © 2025 Tlamatini
           </span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;