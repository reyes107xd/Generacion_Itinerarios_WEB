import { useLocation, Link, useNavigate } from "react-router-dom";
import { Search, MessageCircle, LogOut, Menu, Bell } from "lucide-react";
import { useAuth } from "../../context/authContext.jsx";
import { useAlert } from "../../context/alertContext.jsx";
import NotificationBell from "./NotificationBell"; // Asegúrate de que este componente use iconos similares
import { useEffect, useRef, useState } from "react";
import { searchUsers } from "../../api/a-user.js";
import { generateAvatarUrl, getFullName } from "../../utils/userHelpers"; 

const getPageTitle = (pathname) => {
  // ... (Tu misma lógica de títulos) ...
  if (pathname.includes("/perfil")) return "Perfil";
  switch (pathname) {
    case "/home": return "Inicio";
    case "/GestionarItinerario": return "Itinerarios";
    case "/comunidad": return "Comunidad";
    case "/guardados": return "Guardados";
    case "/mensajes": return "Mensajes";
    default: return "Tlamatini";
  }
};

const Header = ({ onMenuToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const title = getPageTitle(location.pathname);
  const { logout, user } = useAuth(); 
  const { showAlert } = useAlert();

  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // ... (Toda tu lógica de useEffects de búsqueda se mantiene IGUAL) ...
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
      const timer = setTimeout(async () => {
        if (!searchText.trim()) { setResults([]); return; }
        const found = await searchUsers(searchText);
        const filteredResults = found.filter(u => u.id_usuario !== (user?.id_usuario || user?.id));
        const transformedResults = filteredResults.map(u => ({ ...u, fullName: getFullName(u), avatarUrl: generateAvatarUrl(u.foto, getFullName(u)) }));
        setResults(transformedResults);
        setShowDropdown(true);
      }, 300);
      return () => clearTimeout(timer);
  }, [searchText, user]);
  // ...

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
      showAlert("success", "Éxito", "Sesión cerrada correctamente.");
    } catch (error) { showAlert("error", "Error", "No se pudo cerrar sesión."); }
  };

  const currentUserFullName = getFullName(user);
  const profileImage = generateAvatarUrl(user?.foto, currentUserFullName);

  return (
    <header className="fixed top-0 left-0 lg:left-20 right-0 z-30 h-14 sm:h-16 lg:h-[70px] px-3 sm:px-4 lg:px-6 flex items-center justify-between transition-all duration-300
      bg-white/80 backdrop-blur-md border-b border-white/50 shadow-sm
    ">
      
      {/* Izquierda: Título y Menú Móvil */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        <button onClick={onMenuToggle} className="lg:hidden p-1.5 sm:p-2 -ml-1 sm:-ml-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors">
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        
        {/* Breadcrumb / Título dinámico */}
        <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 tracking-tight">
          {title}
        </h1>
      </div>

      {/* Centro: Buscador Flotante */}
      <div className="flex-1 max-w-xl mx-2 sm:mx-3 lg:mx-4 hidden md:block" ref={searchRef}>
        <div className="relative group">
          <div className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-gray-100/50 border border-gray-200 rounded-full 
              focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
              text-xs sm:text-sm text-gray-700 placeholder-gray-400 transition-all duration-300"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => searchText.trim() && setShowDropdown(true)}
          />

          {/* Resultados Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 sm:mt-3 bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
               {results.length > 0 ? (
                  <ul className="max-h-60 sm:max-h-80 overflow-y-auto py-1 sm:py-2">
                    {results.map((u) => (
                      <li 
                        key={u.id_usuario}
                        onClick={() => { navigate(`/perfil/${u.id_usuario}`, { state: { userData: u } }); setShowDropdown(false); setSearchText(""); }}
                        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                         <img src={u.avatarUrl} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-gray-100" alt={u.fullName} />
                         <div>
                            <p className="text-xs sm:text-sm font-semibold text-gray-800">{u.fullName}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">@{u.nombre_usuario}</p>
                         </div>
                      </li>
                    ))}
                  </ul>
               ) : (
                  <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-500">No se encontraron resultados.</div>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Derecha: Acciones */}
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
        
        {/* Mensajes */}
        <Link to="/mensajes" className="relative p-1.5 sm:p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all">
          <MessageCircle className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
        </Link>

        {/* Notificaciones (Tu componente existente) */}
        <div className="text-gray-500 hover:text-emerald-600 transition-colors">
           <NotificationBell />
        </div>

        <div className="h-4 sm:h-5 lg:h-6 w-px bg-gray-200 mx-0.5 sm:mx-1"></div>

        {/* Perfil y Logout */}
        <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
            <Link to="/perfil" className="group relative">
               <div className="absolute inset-0 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-20 blur-md transition-opacity"></div>
               <img 
                 src={profileImage} 
                 className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-gray-100 group-hover:ring-emerald-300 transition-all" 
                 alt="Perfil"
               />
            </Link>
            
            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;