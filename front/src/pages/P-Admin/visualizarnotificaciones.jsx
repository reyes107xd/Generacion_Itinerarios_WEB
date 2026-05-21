import { Bell, MessageSquare, User, Flag } from "lucide-react";

const VisualizarNotificaciones = ({ isOpen, onClose, notificaciones = [] }) => {
  return (
    <div
      className={`
        fixed top-16 right-0 w-96 h-[calc(100vh-4rem)]
        bg-white shadow-2xl border-l border-gray-200 z-50
        transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}
    >
      {/* Encabezado */}
      <div className="flex justify-between items-center px-5 py-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">Notificaciones</h2>
        <button
          className="p-2 rounded-full hover:bg-gray-100"
          onClick={onClose}
        >
          <Bell className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Lista de notificaciones */}
      <div className="overflow-y-auto h-full p-4 space-y-4">
        {notificaciones.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">
            No hay notificaciones aún.
          </p>
        ) : (
          notificaciones.map((n) => (
            <div
              key={n.id}
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm hover:bg-gray-100 transition"
            >
              <div className="flex items-center mb-2">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                  {n.tipo === "reporte" ? (
                    <Flag size={18} />
                  ) : n.tipo === "comentario" ? (
                    <MessageSquare size={18} />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <p className="font-semibold text-gray-900">{n.titulo}</p>
              </div>

              <p className="text-gray-700 text-sm ml-1">{n.descripcion}</p>

              <p className="text-xs text-gray-400 mt-2 ml-1">{n.fecha}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VisualizarNotificaciones;
