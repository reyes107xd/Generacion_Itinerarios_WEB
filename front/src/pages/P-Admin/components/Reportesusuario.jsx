import React, { useState, useEffect } from 'react';
import { 
    Eye, X, ChevronLeft, ChevronRight, Loader, AlertCircle, 
    Filter, BarChart3, Calendar, User, 
    Trash2
    } from 'lucide-react';
    import { useAuth } from '../../../context/authContext';
    import { 
    obtenerReportes, 
    actualizarEstatusReporte, 
    eliminarReporte,
    obtenerReportePorId 
    } from '../../../api/a-admin-reportes';
import { useNavigate } from 'react-router-dom';

import {useAlert} from '../../../context/alertContext';

    const GestionReportesUsuario = () => {
    const { token } = useAuth();
        // Dentro del componente, después de useAuth()
        const { showAlert } = useAlert();
        const [modalAbierto, setModalAbierto] = useState(false);
        const [accionPendiente, setAccionPendiente] = useState(null);
        const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paginacion, setPaginacion] = useState({
        paginaActual: 1,
        totalPaginas: 1,
        totalReportes: 0
    });

    const navigate = useNavigate();

    // Estados para filtros
    const [filtros, setFiltros] = useState({
        estatus: 'todos',
        tipo: 'todos',
        fecha: 'todos'
    });

    // Estadísticas
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        pendientes: 0,
        enRevision: 0,
        resueltos: 0,
        rechazados: 0
    });

    // En el componente
    const cargarReportes = async (pagina = 1, filtrosAplicados = filtros) => {
    try {
        setLoading(true);
        setError(null);
        
        // Construir query parameters para filtros manteniendo página y límite como parámetros separados
        const queryParams = {
        pagina: pagina.toString(),
        limite: '10'
        };
        
        // Agregar filtros solo si no son 'todos'
        if (filtrosAplicados.estatus !== 'todos') {
        queryParams.estatus = filtrosAplicados.estatus;
        }
        if (filtrosAplicados.tipo !== 'todos') {
        queryParams.tipo = filtrosAplicados.tipo;
        }
        if (filtrosAplicados.fecha !== 'todos') {
        queryParams.fecha = filtrosAplicados.fecha;
        }

        // Convertir a string
        const queryString = new URLSearchParams(queryParams).toString();
        
        const respuesta = await obtenerReportes(token, pagina, 10, queryString);

        console.log('Respuesta de reportes:', respuesta);
        
        setReportes(respuesta.data);
        setPaginacion(respuesta.paginacion);
        
        calcularEstadisticas(respuesta.data);
    } catch (err) {
        setError(err.message);
        console.error('Error al cargar reportes:', err);
    } finally {
        setLoading(false);
    }
    };

    // Calcular estadísticas
    const calcularEstadisticas = (reportesData) => {
        const stats = {
        total: reportesData.length,
        pendientes: reportesData.filter(r => r.estatus === 'pendiente').length,
        enRevision: reportesData.filter(r => r.estatus === 'en_revision').length,
        resueltos: reportesData.filter(r => r.estatus === 'resuelto').length,
        rechazados: reportesData.filter(r => r.estatus === 'rechazado').length
        };
        setEstadisticas(stats);
    };

    useEffect(() => {
        cargarReportes();
    }, []);

    // Manejar cambio de filtros
    const handleFiltroChange = (tipo, valor) => {
        const nuevosFiltros = {
        ...filtros,
        [tipo]: valor
        };
        setFiltros(nuevosFiltros);
        cargarReportes(1, nuevosFiltros);
    };

    // Limpiar filtros
    const limpiarFiltros = () => {
        const filtrosLimpiados = {
        estatus: 'todos',
        tipo: 'todos',
        fecha: 'todos'
        };
        setFiltros(filtrosLimpiados);
        cargarReportes(1, filtrosLimpiados);
    };

      const handleVerReporte = (id) => {
        navigate(`/admin/reportes/${id}`);
    };

        const abrirModalConfirmacion = (reporteId, tipoAccion) => {
        setReporteSeleccionado(reporteId);
        setAccionPendiente(tipoAccion);
        setModalAbierto(true);
        };

        const confirmarAccion = async () => {
        if (!reporteSeleccionado || !accionPendiente) return;

        try {
            if (accionPendiente === 'rechazar') {
            await actualizarEstatusReporte(reporteSeleccionado, 'rechazado', token);
            showAlert('success', '¡Reporte rechazado con éxito!', 'El reporte ha sido rechazado.');
            } else if (accionPendiente === 'eliminar') {
            await eliminarReporte(reporteSeleccionado, token);
            showAlert('success', '¡Reporte eliminado con éxito!', 'El reporte ha sido eliminado.');
            }
            
            await cargarReportes(paginacion.paginaActual);
        } catch (err) {
            showAlert('error', 'Error al obtener reportes', err.message);
        } finally {
            cerrarModal();
        }
        };

        const cerrarModal = () => {
        setModalAbierto(false);
        setReporteSeleccionado(null);
        setAccionPendiente(null);
        };

    const handleCambiarPagina = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= paginacion.totalPaginas) {
        cargarReportes(nuevaPagina);
        }
    };

    // Función para formatear la fecha
    const formatearFecha = (fechaString) => {
        return new Date(fechaString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
        });
    };

    // Función para obtener el nombre del usuario que reportó
    const obtenerNombreUsuario = (reporte) => {
        return reporte.turista_reporta?.usuario?.perfil_usuario[0]?.nombre_usuario || 
            'Usuario anónimo';
    };

    // Función para obtener el tipo de contenido reportado
    const obtenerTipoContenido = (reporte) => {
        console.log('Reporte para tipo de contenido:', reporte);
        if (reporte.tipo_reporte === 'publicacion') {
        return `Publicación: ${reporte.publicacion_reportada?.titulo || 'Sin título'}`;
        } else if (reporte.tipo_reporte === 'comentario') {
        return `Comentario en publicación`;
        }
        return 'Contenido no especificado';
    };

    if (loading) {
        return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-600">
            <Loader className="animate-spin" size={24} />
            <span>Cargando reportes...</span>
            </div>
        </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
        {/* Header de la página */}
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Gestión de reportes de usuario
            </h1>
            <p className="text-gray-600">
            Revisa y resuelve los reportes enviados por los usuarios sobre publicaciones/comentarios.
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
                <BarChart3 className="text-blue-500" size={24} />
            </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-yellow-200">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</p>
                </div>
                <AlertCircle className="text-yellow-500" size={24} />
            </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Resueltos</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.resueltos}</p>
                </div>
                <User className="text-green-500" size={24} />
            </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-red-200">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600">Rechazados</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas.rechazados}</p>
                </div>
                <X className="text-red-500" size={24} />
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por estatus */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Estatus
                </label>
                <select
                value={filtros.estatus}
                onChange={(e) => handleFiltroChange('estatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                <option value="todos">Todos los estatus</option>
                <option value="pendiente">Pendientes</option>
                <option value="resuelto">Resueltos</option>
                <option value="rechazado">Rechazados</option>
                </select>
            </div>

            {/* Filtro por tipo */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de contenido
                </label>
                <select
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                <option value="todos">Todos los tipos</option>
                <option value="comentario">Comentarios</option>
                <option value="publicacion">Publicaciones</option>
                </select>
            </div>

            {/* Filtro por fecha */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Orden por fecha
                </label>
                <select
                value={filtros.fecha}
                onChange={(e) => handleFiltroChange('fecha', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                <option value="todos">Más recientes primero</option>
                <option value="antiguos">Más antiguos primero</option>
                <option value="hoy">Hoy</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mes</option>
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

        {/* Tabla de reportes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Fecha del reporte
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Usuario que reportó
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tipo de contenido
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Estatus
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Acciones
                    </th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {reportes.length === 0 ? (
                    <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No hay reportes que coincidan con los filtros seleccionados
                    </td>
                    </tr>
                ) : (
                    reportes.map((reporte) => (
                    <tr key={reporte.id_reporte} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                            {formatearFecha(reporte.fecha_reporte)}
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                            {obtenerNombreUsuario(reporte)}
                        </div>
                        </td>
                        <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                            {obtenerTipoContenido(reporte)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {reporte.motivo}
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            reporte.estatus === 'pendiente' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : reporte.estatus === 'en_revision'
                            ? 'bg-blue-100 text-blue-800'
                            : reporte.estatus === 'resuelto'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                            {reporte.estatus}
                        </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <button
                                    onClick={() => handleVerReporte(reporte.id_reporte)}
                                    className="flex items-center gap-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700  text-sm font-medium rounded-lg transition-colors duration-200"
                                    >
                                    <Eye size={16} />
                                    Ver
                                    </button>
                            
                            {reporte.estatus !== 'rechazado' && reporte.estatus !== 'resuelto' && (
                            <button
                            onClick={() => abrirModalConfirmacion(reporte.id_reporte, 'rechazar')}
                            className="flex items-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors duration-200"
                            >
                            <X size={16} />
                            Rechazar
                            </button>
                            )}
                            <button
                            onClick={() => abrirModalConfirmacion(reporte.id_reporte, 'eliminar')}
                            className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors duration-200"
                            >
                            <Trash2 size={16} />
                            Eliminar
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
        {reportes.length > 0 && (
            <div className="flex items-center justify-between mt-6 px-4">
            <div className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{reportes.length}</span> de{' '}
                <span className="font-medium">{paginacion.totalReportes}</span> reportes
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                onClick={() => handleCambiarPagina(paginacion.paginaActual - 1)}
                disabled={paginacion.paginaActual === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors duration-200 ${
                        paginacion.paginaActual === numeroPagina
                            ? 'bg-emerald-500 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        {numeroPagina}
                    </button>
                    );
                })}
                </div>
                
                <button 
                onClick={() => handleCambiarPagina(paginacion.paginaActual + 1)}
                disabled={paginacion.paginaActual === paginacion.totalPaginas}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                Siguiente
                <ChevronRight size={16} />
                </button>
            </div>
            </div>
        )}
        {modalAbierto && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
            {/* Añadir esta sección para el icono */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                accionPendiente === 'rechazar' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                <AlertCircle size={24} className={
                    accionPendiente === 'rechazar' ? 'text-red-600' : 'text-gray-600'
                } />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                {accionPendiente === 'rechazar' ? 'Rechazar Reporte' : 'Eliminar Reporte'}
                </h3>
            </div>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
                {accionPendiente === 'rechazar' 
                ? '¿Estás seguro de rechazar este reporte? Esta acción no se puede deshacer.'
                : '¿Estás seguro de eliminar este reporte? Esta acción no se puede deshacer.'
                }
            </p>
            
            <div className="flex justify-end gap-3">
                <button
                onClick={cerrarModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                Cancelar
                </button>
                <button
                onClick={confirmarAccion}
                className={`px-4 py-2 text-white font-medium rounded-lg transition-colors ${
                    accionPendiente === 'rechazar' 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-500 hover:bg-gray-600'
                }`}
                >
                {accionPendiente === 'rechazar' ? 'Rechazar reporte' : 'Eliminar reporte'}
                </button>
            </div>
            </div>
        </div>
        )}
        </div>
    );
};

export default GestionReportesUsuario;