import { useState, useEffect } from 'react';
import { 
    Users, 
    UserCheck, 
    UserX, 
    Filter, 
    Search, 
    Eye,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Mail,
    Calendar,
    MapPin,
    Clock,
    Calendar as CalendarIcon,
    Ban,
    Loader2 // Importar el ícono de carga
} from 'lucide-react';
import { useAuth } from '../../../context/authContext';
import { useAlert } from '../../../context/alertContext';
import { 
    obtenerTuristas, 
    bloquearTurista, 
    desbloquearTurista, 
    obtenerEstadisticasTuristas 
} from '../../../api/a-admin-gestionTuristas';

const GestionTuristas = () => {
    // Estados para la gestión de datos
    const [turistas, setTuristas] = useState([]);
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        activos: 0,
        bloqueados: 0,
        verificados: 0
    });
    const [filtros, setFiltros] = useState({
        estado: 'todos',
        verificacion: 'todos',
        busqueda: ''
    });
    const [paginacion, setPaginacion] = useState({
        paginaActual: 1,
        totalPaginas: 1,
        totalTuristas: 0,
        limite: 10
    });
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(true);

    // Estados para los modales
    const [modalBloquearAbierto, setModalBloquearAbierto] = useState(false);
    const [modalDesbloquearAbierto, setModalDesbloquearAbierto] = useState(false);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [duracionBloqueo, setDuracionBloqueo] = useState('3_dias');
    const [motivoBloqueo, setMotivoBloqueo] = useState('');

     const [procesandoAccion, setProcesandoAccion] = useState(false);

    const { token } = useAuth();
    const { showAlert } = useAlert();

  // Cargar datos iniciales
    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);
            
            if (!token) {
                throw new Error('No se encontró token de autenticación');
            }

            // Cargar turistas y estadísticas en paralelo
            const [datosTuristas, datosEstadisticas] = await Promise.all([
                obtenerTuristas(token, paginacion.paginaActual, paginacion.limite, filtros),
                obtenerEstadisticasTuristas(token)
            ]);

            console.log('Datos de turistas obtenidos:', datosTuristas);

            setTuristas(datosTuristas.data || []);
            setEstadisticas(datosEstadisticas.data);
            setPaginacion(prev => ({
            ...prev,
            totalPaginas: datosTuristas.paginacion?.totalPaginas || 1,
            totalTuristas: datosTuristas.paginacion?.totalTuristas || 0
            }));

        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError(err.message || 'Error al cargar los datos de turistas');
        } finally {
            setCargando(false);
        }
    };

  // Efecto para cargar datos cuando cambien los filtros o paginación
    useEffect(() => {
        cargarDatos();
    }, [filtros, paginacion.paginaActual]);

    // Manejar cambios en los filtros
    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
        ...prev,
        [campo]: valor
        }));
        // Reiniciar a página 1 cuando cambian los filtros
        setPaginacion(prev => ({ ...prev, paginaActual: 1 }));
    };

  // Limpiar filtros
    const limpiarFiltros = () => {
        setFiltros({
        estado: 'todos',
        verificacion: 'todos',
        busqueda: ''
        });
        setPaginacion(prev => ({ ...prev, paginaActual: 1 }));
    };

    // Abrir modal de bloquear
    const abrirModalBloquear = (turista) => {
        setUsuarioSeleccionado(turista);
        setDuracionBloqueo('3_dias');
        setMotivoBloqueo('');
        setModalBloquearAbierto(true);
    };

    // Abrir modal de desbloquear
    const abrirModalDesbloquear = (turista) => {
        setUsuarioSeleccionado(turista);
        setModalDesbloquearAbierto(true);
    };

    // Cerrar modales
    // Cerrar modales - MODIFICADO para resetear estado de procesamiento
    const cerrarModales = () => {
        setModalBloquearAbierto(false);
        setModalDesbloquearAbierto(false);
        setUsuarioSeleccionado(null);
        setMotivoBloqueo('');
        setProcesandoAccion(false); // Resetear estado de procesamiento
    };


    // Confirmar bloqueo
    const confirmarBloqueo = async () => {
        if (!usuarioSeleccionado || procesandoAccion) return;

        // Validar que el motivo no esté vacío
        if (!motivoBloqueo || motivoBloqueo.trim() === '') {
            showAlert('error', 'Error al bloquear usuario', 'Debes especificar el motivo del bloqueo.');
            return;
        }

        try {
            setProcesandoAccion(true); // Activar estado de procesamiento
            
            await bloquearTurista(
                usuarioSeleccionado.id_usuario, 
                duracionBloqueo, 
                motivoBloqueo.trim(),
                token
            );
            
            // Recargar datos para reflejar los cambios
            await cargarDatos();
            
            showAlert('success', '¡Usuario bloqueado con éxito!', `Usuario ${usuarioSeleccionado.nombre_usuario} ha sido bloqueado.`);
            cerrarModales();
            
        } catch (err) {
            console.error('Error al bloquear usuario:', err);
            showAlert('error', err.message || 'Error al bloquear el usuario');
        } finally {
            setProcesandoAccion(false); // Desactivar estado de procesamiento
        }
    };

    

  // Confirmar desbloqueo
    const confirmarDesbloqueo = async () => {
        if (!usuarioSeleccionado || procesandoAccion) return;

        try {
            setProcesandoAccion(true); // Activar estado de procesamiento
            
            await desbloquearTurista(usuarioSeleccionado.id_usuario, token);
            
            // Recargar datos para reflejar los cambios
            await cargarDatos();
            
            showAlert('success', '¡Usuario desbloqueado con éxito!', `Usuario ${usuarioSeleccionado.nombre_usuario} ha sido desbloqueado.`);
            cerrarModales();
            
        } catch (err) {
            console.error('Error al desbloquear usuario:', err);
            showAlert('error', err.message || 'Error al desbloquear el usuario');
        } finally {
            setProcesandoAccion(false); // Desactivar estado de procesamiento
        }
    };

  // Manejar cambio de página
    const handleCambiarPagina = (nuevaPagina) => {
        setPaginacion(prev => ({
        ...prev,
        paginaActual: nuevaPagina
        }));
    };

  // Obtener texto de duración del bloqueo
    const obtenerTextoDuracion = (duracion) => {
        const duraciones = {
        '3_dias': '3 días',
        '1_semana': '1 semana',
        '1_mes': '1 mes',
        '1_anio': '1 año',
        'permanente': 'Permanente'
        };
        return duraciones[duracion] || duracion;
    };

    // Formatear fecha y hora
    const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    };

    const turistasParaMostrar = turistas;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
        {/* Header de la página */}
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Gestión de Usuarios Turistas
            </h1>
            <p className="text-gray-600">
            Administra y supervisa a los usuarios turistas registrados en la plataforma.
            </p>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
                </div>
                <Users className="text-blue-500" size={24} />
            </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.activos}</p>
                </div>
                <UserCheck className="text-green-500" size={24} />
            </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-red-200">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Bloqueados</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas.bloqueados}</p>
                </div>
                <UserX className="text-red-500" size={24} />
            </div>
            </div>


            <div className="bg-white p-4 rounded-lg shadow-sm border border-amber-200">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Verificados</p>
                <p className="text-2xl font-bold text-amber-600">{estadisticas.verificados}</p>
                </div>
                <Mail className="text-amber-500" size={24} />
            </div>
            </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Filter size={20} />
                Filtros
            </h3>
            <button
                onClick={limpiarFiltros}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
                Limpiar filtros
            </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda por texto */}
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar usuario
                </label>
                <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    value={filtros.busqueda}
                    onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                    placeholder="Buscar por username, email o nombre..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                </div>
            </div>

            {/* Filtro por estado */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
                </label>
                <select
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="bloqueado">Bloqueados</option>
                </select>
            </div>

            {/* Filtro por verificación */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Verificación
                </label>
                <select
                value={filtros.verificacion}
                onChange={(e) => handleFiltroChange('verificacion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                <option value="todos">Todos</option>
                <option value="verificado">Verificados</option>
                <option value="no-verificado">No verificados</option>
                </select>
            </div>
            </div>
        </div>

        {/* Mensaje de error */}
        {error && (
            <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
            >
                ×
            </button>
            </div>
        )}

        {/* Tabla de turistas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                {/* En el thead de la tabla */}
                <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Información de Contacto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actividad
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Acciones
                    </th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {cargando ? (
                    <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        Cargando usuarios...
                    </td>
                    </tr>
                ) : turistasParaMostrar.length === 0 ? (
                    <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No hay usuarios que coincidan con los filtros seleccionados
                    </td>
                    </tr>
                ) : (
                    turistasParaMostrar.map((turista) => (
                    <tr key={turista.id_usuario} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="text-blue-600" size={20} />
                            </div>
                            <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                                {turista.nombre_usuario || 'Sin username'}
                            </div>
                            <div className="text-sm text-gray-500">
                                {turista.nombre} {turista.ap_p} {turista.ap_m}
                            </div>
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 flex items-center gap-1 mb-1">
                            <Mail size={14} />
                            {turista.correo}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Registrado: {formatearFecha(turista.fecha_creacion)}
                        </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                                {turista.itinerarios_creados} itinerarios
                            </div>
                            <div className="text-xs text-gray-500">
                                Reportes: {turista.reportes_recibidos} recibidos, {turista.reportes_hechos} hechos
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Última conexión: {formatearFecha(turista.ultima_conexion)}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            turista.estado === 'activo' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {turista.estado === 'activo' ? 'Activo' : 'Bloqueado'}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            turista.esta_verificado
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {turista.esta_verificado ? 'Email verificado' : 'Email no verificado'}
                            </span>
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">                
                            <button
                            onClick={() => turista.estado === 'activo' 
                                ? abrirModalBloquear(turista) 
                                : abrirModalDesbloquear(turista)
                            }
                            className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                                turista.estado === 'activo'
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-emerald-200 hover:bg-emerald-300 text-emerald-700'
                            }`}
                            style={{ borderRadius: '6px' }}
                            >
                            {turista.estado === 'activo' ? (
                                <>
                                <UserX size={16} />
                                Bloquear
                                </>
                            ) : (
                                <>
                                <UserCheck size={16} />
                                Desbloquear
                                </>
                            )}
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
        </div>

        {/* Paginación */}
        {turistasParaMostrar.length > 0 && (
            <div className="flex items-center justify-between mt-6 px-4">
            <div className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{turistasParaMostrar.length}</span> de{' '}
                <span className="font-medium">{paginacion.totalTuristas}</span> usuarios
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                onClick={() => handleCambiarPagina(paginacion.paginaActual - 1)}
                disabled={paginacion.paginaActual === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                style={{ borderRadius: '6px' }}
                >
                <ChevronLeft size={16} />
                Anterior
                </button>
                
                <div className="flex items-center gap-1">
                {[...Array(paginacion.totalPaginas)].map((_, index) => {
                    const numeroPagina = index + 1;
                    return (
                    <button
                        key={numeroPagina}
                        onClick={() => handleCambiarPagina(numeroPagina)}
                        className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                        paginacion.paginaActual === numeroPagina
                            ? 'bg-emerald-500 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                        style={{ borderRadius: '6px' }}
                    >
                        {numeroPagina}
                    </button>
                    );
                })}
                </div>
                
                <button 
                onClick={() => handleCambiarPagina(paginacion.paginaActual + 1)}
                disabled={paginacion.paginaActual === paginacion.totalPaginas}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                style={{ borderRadius: '6px' }}
                >
                Siguiente
                <ChevronRight size={16} />
                </button>
            </div>
            </div>
        )}

            {/* Modal de Bloquear Usuario - MODIFICADO */}
            {modalBloquearAbierto && usuarioSeleccionado && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Ban className="text-red-600" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Bloquear Usuario
                            </h3>
                        </div>
                        
                        <p className="text-gray-600 mb-4">
                            ¿Estás seguro de que deseas bloquear al usuario <strong>{usuarioSeleccionado.nombre_usuario}</strong>? 
                            El usuario no podrá acceder a su cuenta durante el período seleccionado.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Duración del bloqueo:
                            </label>
                            <div className="space-y-2">
                                {[
                                    { value: '3_dias', label: '3 días', icon: Clock },
                                    { value: '1_semana', label: '1 semana', icon: CalendarIcon },
                                    { value: '1_mes', label: '1 mes', icon: CalendarIcon },
                                    { value: '1_anio', label: '1 año', icon: CalendarIcon },
                                    { value: 'permanente', label: 'Permanente', icon: Ban }
                                ].map((opcion) => {
                                    const IconComponent = opcion.icon;
                                    return (
                                        <label key={opcion.value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="radio"
                                                value={opcion.value}
                                                checked={duracionBloqueo === opcion.value}
                                                onChange={(e) => setDuracionBloqueo(e.target.value)}
                                                className="text-red-600 focus:ring-red-500"
                                                disabled={procesandoAccion} // Deshabilitar durante procesamiento
                                            />
                                            <IconComponent size={18} className="text-gray-600" />
                                            <span className="text-sm font-medium text-gray-700">{opcion.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Motivo del bloqueo <span className="text-red-500">*</span>:
                            </label>
                            <textarea
                                value={motivoBloqueo}
                                onChange={(e) => setMotivoBloqueo(e.target.value)}
                                placeholder="Describe el motivo del bloqueo (obligatorio)..."
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                required
                                disabled={procesandoAccion} // Deshabilitar durante procesamiento
                            />
                            {motivoBloqueo.trim() === '' && !procesandoAccion && (
                                <p className="text-red-500 text-sm mt-1">
                                    El motivo del bloqueo es obligatorio
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cerrarModales}
                                disabled={procesandoAccion} // Deshabilitar durante procesamiento
                                className={`px-4 py-2 font-medium transition-colors duration-200 ${
                                    procesandoAccion 
                                        ? 'text-gray-400 cursor-not-allowed' 
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                                style={{ borderRadius: '6px' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarBloqueo}
                                disabled={motivoBloqueo.trim() === '' || procesandoAccion}
                                className={`px-4 py-2 font-medium transition-colors duration-200 flex items-center justify-center gap-2 min-w-[120px] ${
                                    motivoBloqueo.trim() === '' || procesandoAccion
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                        : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                                style={{ borderRadius: '6px' }}
                            >
                                {procesandoAccion ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Procesando...
                                    </>
                                ) : (
                                    `Bloquear por ${obtenerTextoDuracion(duracionBloqueo)}`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal de Desbloquear Usuario - MODIFICADO */}
            {modalDesbloquearAbierto && usuarioSeleccionado && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <UserCheck className="text-emerald-700" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Desbloquear Usuario
                            </h3>
                        </div>
                        
                        <p className="text-gray-600 mb-6">
                            ¿Estás seguro de que deseas desbloquear al usuario <strong>{usuarioSeleccionado.nombre_usuario}</strong>? 
                            El usuario podrá volver a acceder a su cuenta inmediatamente.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cerrarModales}
                                disabled={procesandoAccion} // Deshabilitar durante procesamiento
                                className={`px-4 py-2 font-medium transition-colors duration-200 ${
                                    procesandoAccion 
                                        ? 'text-gray-400 cursor-not-allowed' 
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                                style={{ borderRadius: '6px' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarDesbloqueo}
                                disabled={procesandoAccion}
                                className={`px-4 py-2 font-medium transition-colors duration-200 flex items-center justify-center gap-2 min-w-[140px] ${
                                    procesandoAccion
                                        ? 'bg-emerald-100 text-emerald-400 cursor-not-allowed' 
                                        : 'bg-emerald-200 hover:bg-emerald-300 text-emerald-700'
                                }`}
                                style={{ borderRadius: '6px' }}
                            >
                                {procesandoAccion ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Procesando...
                                    </>
                                ) : (
                                    'Desbloquear Usuario'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default GestionTuristas;