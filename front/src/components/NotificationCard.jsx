import { Bell, Heart, MessageSquare, UserPlus } from "lucide-react";

const NotificationCard = ({ tipo, titulo, tiempo, leida }) => {
  // Definir ícono según tipo
  const Icono =
    tipo === "like"
      ? Heart
      : tipo === "comentario"
      ? MessageSquare
      : tipo === "solicitud"
      ? UserPlus
      : Bell;

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 shadow-sm border
        ${leida ? "bg-white" : "bg-green-50 border-green-200"}
        hover:bg-green-100`}
    >
      {/* Ícono */}
      <div
        className={`p-2 rounded-full ${
          leida ? "bg-gray-100 text-green-800" : "bg-green-800 text-white"
        }`}
      >
        <Icono size={20} />
      </div>

      {/* Texto */}
      <div className="flex-1">
        <p className="text-gray-800 text-sm md:text-base">{titulo}</p>
        <span className="text-gray-500 text-xs">{tiempo}</span>
      </div>
    </div>
  );
};

export default NotificationCard;
