// Vista simplificada de notificaciones
import { useState, useEffect } from 'react';
import { 
    Bell, 
    BellOff, 
    Filter, 
    Search, 
    Eye,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Check,
    Trash2,
    ExternalLink,
    Clock,
    XCircle,
    CheckCircle
} from 'lucide-react';
import { useAuth } from '../../../context/authContext';
import { useAlert } from '../../../context/alertContext';
import { 
    obtenerNotificacionesAdmin,
    marcarNotificacionComoLeida,
    eliminarNotificacion
} from '../../../api/a-admin-notificaciones';

const NotificacionesAdmin = () => {
    const [notificaciones, setNotificaciones] = useState([]);
    const [filtros, setFiltros] = useState({
        tipo: 'todos',
        leida: 'noLeidas',
        busqueda: ''
    });
    const [paginacion, setPaginacion] = useState({
        paginaActual: 1,
        totalPaginas: 1,
        totalNotificaciones: 0,
        limite: 10
    });
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
    const [notificacionSeleccionada, setNotificacionSeleccionada] = useState(null);

    const { token } = useAuth();
    const { showAlert } = useAlert();

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const datos = await obtenerNotificacionesAdmin(
                token, 
                paginacion.paginaActual, 
                paginacion.limite, 
                filtros
            );
            setNotificaciones(datos.data || []);
            setPaginacion(prev => ({
                ...prev,
                totalPaginas: datos.paginacion?.totalPaginas || 1,
                totalNotificaciones: datos.paginacion?.totalNotificaciones || 0
            }));
        } catch (err) {
            setError(err.message);
            showAlert('error', 'Error al cargar notificaciones', err.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [filtros, paginacion.paginaActual]);

    const formatearFecha = (fecha) => {
        if (!fecha) return '';
        const fechaObj = new Date(fecha);
        return fechaObj.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleMarcarComoLeida = async (id) => {
        try {
            await marcarNotificacionComoLeida(id, token);
            // Actualizar estado local
            setNotificaciones(prev => 
                prev.map(n => n.id_notificacion === id ? { ...n, leida: true } : n)
            );
        } catch (err) {
            showAlert('error', 'Error al marcar notificación como leída', 'Inténtalo de nuevo más tarde.');
        }
    };

    const handleEliminar = async (id) => {
        try {
            await eliminarNotificacion(id, token);
            await cargarDatos();
            showAlert('success', '¡Notificación eliminada con éxito!', 'La notificación ha sido eliminada.');
            setModalEliminarAbierto(false);
        } catch (err) {
            showAlert('error', 'Error al eliminar notificación', err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
                <p className="text-gray-600">Notificaciones del sistema para administradores</p>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Filter size={20} />
                        Filtros
                    </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={filtros.busqueda}
                                onChange={(e) => setFiltros(prev => ({...prev, busqueda: e.target.value}))}
                                placeholder="Buscar notificaciones..."
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>
                    
                    <select
                        value={filtros.leida}
                        onChange={(e) => setFiltros(prev => ({...prev, leida: e.target.value}))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                        <option value="todos">Todas</option>
                        <option value="noLeidas">No leídas</option>
                        <option value="leidas">Leídas</option>
                    </select>
                </div>
            </div>

            {/* Lista de notificaciones */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {cargando ? (
                    <div className="p-8 text-center">Cargando...</div>
                ) : notificaciones.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No hay notificaciones
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {notificaciones.map((notif) => (
                            <div 
                                key={notif.id_notificacion} 
                                className={`p-4 ${!notif.leida ? 'bg-emerald-50' : ''}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-900">
                                                {notif.titulo}
                                            </h4>
                                            {!notif.leida && (
                                                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                                    Nuevo
                                                </span>
                                            )}
                                        </div>
                                        
                                        <p className="text-gray-600 text-sm mb-2">
                                            {notif.mensaje}
                                        </p>
                                        
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatearFecha(notif.fecha_creacion)}
                                            </span>
                                            <span className={`flex items-center gap-1 ${notif.leida ? 'text-green-600' : 'text-gray-500'}`}>
                                                {notif.leida ? (
                                                    <>
                                                        <CheckCircle size={12} />
                                                        Leída
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle size={12} />
                                                        No leída
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 ml-4">
                                        {!notif.leida && (
                                            <button
                                                onClick={() => handleMarcarComoLeida(notif.id_notificacion)}
                                                className="p-1 text-gray-400 hover:text-green-500"
                                                title="Marcar como leída"
                                            >
                                                <Check size={18} />
                                            </button>
                                        )}
                                        
                                        <button
                                            onClick={() => {
                                                setNotificacionSeleccionada(notif);
                                                setModalEliminarAbierto(true);
                                            }}
                                            className="p-1 text-gray-400 hover:text-red-500"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Eliminar */}
            {modalEliminarAbierto && notificacionSeleccionada && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Trash2 className="text-red-600" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold">Eliminar Notificación</h3>
                        </div>
                        
                        <p className="text-gray-600 mb-6">
                            ¿Eliminar "{notificacionSeleccionada.titulo}"?
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setModalEliminarAbierto(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleEliminar(notificacionSeleccionada.id_notificacion)}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificacionesAdmin;