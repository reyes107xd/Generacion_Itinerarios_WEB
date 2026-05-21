import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, MessageSquare, UserPlus, CheckCircle, Trash2, Inbox } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import ModalConfirmacion from '../modalConfirm';

const NotificationBell = () => {
  const { notifications, unreadCount, markOneAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Configuración centralizada para iconos, colores y rutas
  const notificationConfig = {
    message: { 
      icon: MessageSquare, 
      color: 'text-blue-500', 
      bg: 'bg-blue-50', 
      border: 'border-blue-100',
      route: '/mensajes' 
    },
    friend_request: { 
      icon: UserPlus, 
      color: 'text-green-500', 
      bg: 'bg-green-50', 
      border: 'border-green-100',
      route: '/comunidad' 
    },
    friend_accepted: { 
      icon: CheckCircle, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50', 
      border: 'border-emerald-100',
      route: '/perfil' 
    },
    default: { 
      icon: Bell, 
      color: 'text-gray-500', 
      bg: 'bg-gray-50', 
      border: 'border-gray-100',
      route: '#' 
    }
  };

  // Función para formatear tiempo relativo (ej: "hace 5 min")
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    return date.toLocaleDateString();
  };

  const toggleDropdown = () => {
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notif) => {
    // Marcar como leída si no lo está
    if (!notif.read) {
      markOneAsRead(notif.id);
    }
    setIsOpen(false);
    const config = notificationConfig[notif.type] || notificationConfig.default;
    if (config.route && config.route !== '#') navigate(config.route);
  };

  // Cierra el dropdown si se hace click fuera (mejor UX que el div fixed)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

    // Estados para el modal de limpiar todas las notificaciones
  const [modalLimpiarAbierto, setModalLimpiarAbierto] = useState(false);

  // Función para abrir modal de limpiar
  const abrirModalLimpiar = (e) => {
    e.stopPropagation();
    if (notifications.length > 0) {
      setModalLimpiarAbierto(true);
    }
  };

  // Función para cerrar modal
  const cerrarModalLimpiar = () => {
    setModalLimpiarAbierto(false);
  };

  // Función para confirmar limpieza
  const confirmarLimpiarTodo = () => {
    clearNotifications();
    cerrarModalLimpiar();
  };

  return (
    <>
      <div className="relative inline-block" ref={dropdownRef}>
        {/* Botón Campana */}
        <button 
          onClick={toggleDropdown}
          className={`relative p-2 sm:p-2.5 transition-all duration-200 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${isOpen ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:text-emerald-600'}`}
        >
          <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
          
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex h-4 w-4 sm:h-5 sm:w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 sm:h-5 sm:w-5 bg-red-500 border-2 border-white items-center justify-center text-[9px] sm:text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </button>

        {/* Dropdown con animación simple */}
        {isOpen && (
          <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 mt-2 sm:mt-3 w-auto sm:w-80 md:w-96 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform transition-all duration-200 origin-top sm:origin-top-right ring-1 ring-gray-300 ring-opacity-5">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 backdrop-blur-sm">
              <h3 className="font-bold text-base sm:text-lg text-gray-800">Notificaciones</h3>
              {notifications.length > 0 && (
                <button 
                  onClick={abrirModalLimpiar} 
                  className="text-xs sm:text-sm font-medium text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-red-50"
                  title="Eliminar todas las notificaciones"
                >
                  <Trash2 size={14} /> Limpiar
                </button>
              )}
            </div>
          
          {/* Lista de Notificaciones */}
          <div className="max-h-[60vh] sm:max-h-[24rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-gray-400">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-full mb-2 sm:mb-3">
                  <Inbox className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
                </div>
                <p className="text-sm sm:text-base font-medium">No hay notificaciones</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Estás al día con todo</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => {
                  const config = notificationConfig[notif.type] || notificationConfig.default;
                  const Icon = config.icon;

                  return (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer flex gap-3 sm:gap-4 items-start transition-all duration-200 group ${!notif.read ? 'bg-emerald-50/30' : ''}`}
                    >
                      {/* Icono dinámico */}
                      <div className={`mt-0.5 sm:mt-1 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-sm ${config.bg} ${config.color} border ${config.border} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>

                      <div className="flex-1 space-y-0.5 sm:space-y-1">
                        <p className={`text-xs sm:text-sm leading-snug ${!notif.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {notif.content}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-400 font-medium">
                          {formatTimeAgo(notif.time)}
                        </p>
                      </div>
                      
                      {/* Indicador visual de no leído (punto azul) */}
                      {!notif.read && (
                        <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 mt-1.5 sm:mt-2 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* Modal usando Portal para renderizar directamente en body */}
      {modalLimpiarAbierto && createPortal(
        <ModalConfirmacion
          isOpen={modalLimpiarAbierto}
          onClose={cerrarModalLimpiar}
          onConfirm={confirmarLimpiarTodo}
          titulo="Limpiar notificaciones"
          mensaje="¿Estás seguro de que quieres eliminar todas las notificaciones? Esta acción no se puede deshacer."
          textoConfirmar="Limpiar todo"
          textoCancelar="Cancelar"
          tipo="eliminar"
        />,
        document.body
      )}
    </>
  );
};

export default NotificationBell;