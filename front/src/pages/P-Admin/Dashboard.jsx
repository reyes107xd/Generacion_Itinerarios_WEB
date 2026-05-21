import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  Home, Users, BookOpen, Bell, LogOut, Menu, X, Search 
} from 'lucide-react';

// Importa los contextos
import { useAuth } from '../../context/authContext.jsx';
import { useAlert } from '../../context/alertContext.jsx';

// Componentes de Admin
import AdminUserManagement from './components/Gestionusuarios.jsx';
import ReporteDetalle from './components/Reportesusuario.jsx';
import Principal from './components/Principal';
import DetalleReporte from './components/DetalleReporte.jsx';
import NotificacionesReportesAdmin from './components/Notificaciones.jsx';

import AdminReportsBell from '../../components/common/AdminReportsBell.jsx';

const MENU_ITEMS = [
    { key: 'principal',       label: 'Dashboard',           icon: Home,      count: 0, path: '/admin' },
    { key: 'estado_usuarios', label: 'Gestión de Usuarios', icon: Users,     count: 0, path: '/admin/usuarios' },
    { key: 'reportes',        label: 'Reportes',            icon: BookOpen,  count: 0, path: '/admin/reportes' },
    { key: 'notificaciones',  label: 'Notificaciones',      icon: Bell,      count: 0, path: '/admin/notificaciones' },
];

const AdminDashboardLayout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const title = 'TLAMATINI';
    
    const { logout, user } = useAuth();
    const { showAlert } = useAlert();

    const handleLogout = async () => {
        try {
            await logout();
            showAlert('success', '¡Sesión cerrada con éxito!', 'Vuelve pronto.');
            navigate('/login', { replace: true });
        } catch (error) {
            console.error(error);
            showAlert('error', 'Error al cerrar sesión', 'No se pudo cerrar la sesión. Intentelo de nuevo más tarde.');
        }
    };

    const getProfileImage = () => {
        if (user?.foto) return user.foto;
        const name = user?.nombre || 'Admin';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&bold=true`;
    };

    // --- COMPONENTE NAVITEM (Diseño visual del Sidebar.jsx adaptado) ---
    const NavItem = ({ item, isMobile = false }) => {
        const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin/');
        const Icon = item.icon;

        return (
            <div 
                onClick={() => {
                    navigate(item.path);
                    if (isMobile) setIsMobileMenuOpen(false);
                }}
                className={`
                    relative flex items-center h-11 px-3 rounded-xl cursor-pointer
                    transition-colors duration-200 overflow-hidden mb-1
                    ${!isActive && 'hover:bg-white/10'}
                `}
            >
                {/* FONDO ANIMADO BLANCO */}
                {isActive && (
                    <motion.div
                        layoutId="active-admin-item"
                        className="absolute inset-0 bg-white shadow-md rounded-xl"
                        initial={false}
                        transition={{ 
                          type: "spring", 
                          stiffness: 400, 
                          damping: 30 
                        }}
                    />
                )}
                
                {/* CONTENIDO (Icono y Texto) */}
                <div className="relative z-10 flex items-center w-full">
                    <div className="shrink-0 flex items-center justify-center w-8">
                         <Icon 
                            size={22} 
                            className={`transition-colors duration-200 ${isActive ? 'text-green-900' : 'text-white/90'}`}
                            strokeWidth={isActive ? 2.5 : 2} 
                         />
                    </div>
                    
                    <span className={`
                        ml-3 text-sm flex-1 transition-colors duration-200
                        ${isActive ? 'text-green-900 font-semibold' : 'text-white/90'}
                    `}>
                        {item.label}
                    </span>
                    
                    {item.count > 0 && (
                        <span className={`
                            px-2 py-0.5 text-xs rounded-full font-bold border
                            ${isActive 
                                ? 'bg-red-500 text-white border-transparent' 
                                : 'bg-green-700 text-white border-green-600'}
                        `}>
                            {item.count}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
            
            {/* === SIDEBAR DESKTOP === */}
            <aside className="hidden md:flex flex-col w-64 bg-green-800 text-white border-r border-green-700 shadow-2xl flex-shrink-0">
                
                {/* Logo Area */}
                <div className="h-20 flex items-center px-6 border-b border-green-700 mb-2 shrink-0">
                     <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-xl mr-3 shadow-inner">
                        <img src="/src/img/SoloLogo.png" alt="Logo" className="w-7 h-7 object-contain" onError={(e) => e.target.style.display='none'}/>
                    </div>
                    <span className="font-bold text-xl tracking-wide text-white">TLAMATINI</span>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 pt-2 overflow-y-auto custom-scrollbar">
                    {MENU_ITEMS.map((item) => (
                        <NavItem key={item.key} item={item} />
                    ))}
                </nav>

                {/* Footer del Sidebar (Copyright) */}
                <div className="p-6 border-t border-green-700 shrink-0 text-center">
                   <span className="text-xs text-green-200/60 block">
                      © 2025 Tlamatini
                   </span>
                </div>
            </aside>

            {/* === SIDEBAR MOBILE (Overlay) === */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                        />
                        {/* Sidebar Panel Mobile */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 left-0 w-64 bg-green-800 text-white z-50 md:hidden flex flex-col shadow-2xl border-r border-green-700"
                        >
                            <div className="h-20 flex items-center justify-between px-6 border-b border-green-700 mb-2">
                                <span className="font-bold text-xl tracking-wide">{title}</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                            <nav className="flex-1 px-4 pt-2 space-y-1">
                                {MENU_ITEMS.map((item) => (
                                    <NavItem key={item.key} item={item} isMobile={true} />
                                ))}
                            </nav>
                            
                            {/* Footer Mobile (Copyright) */}
                             <div className="p-6 border-t border-green-700 shrink-0 text-center">
                               <span className="text-xs text-green-200/60 block">
                                  © 2025 Tlamatini
                               </span>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* === ÁREA DE CONTENIDO PRINCIPAL === */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
                
                {/* --- TOP HEADER (Barra Superior) --- */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20">
                    
                    {/* Izquierda: Botón Menú Móvil */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        

                    </div>

                    {/* Derecha: Acciones */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        <AdminReportsBell />
                        
                        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                        <div className="flex items-center gap-2">
                             <span className="text-sm font-medium text-slate-600 hidden sm:block mr-2">
                                Hola, {user?.nombre?.split(' ')[0] || 'Admin'}
                             </span>
                             
                             <motion.button 
                                whileHover={{ scale: 1.05, backgroundColor: "#fee2e2", color: "#ef4444" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleLogout} 
                                className="p-2.5 text-slate-500 rounded-full transition-colors hover:bg-slate-100 border border-transparent hover:border-slate-200"
                                title="Cerrar Sesión"
                            >
                                <LogOut size={18} />
                            </motion.button>
                        </div>
                    </div>
                </header>

                {/* --- MAIN CONTENT (Scrollable) --- */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="max-w-7xl mx-auto w-full"
                        >
                            <Routes>
                                <Route index element={<Principal />} />
                                <Route path="/usuarios" element={<AdminUserManagement />} />
                                <Route path="/reportes" element={<ReporteDetalle />} />
                                <Route path="/reportes/:id" element={<DetalleReporte />} />
                                <Route path="/notificaciones" element={<NotificacionesReportesAdmin />} />
                            </Routes>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboardLayout;