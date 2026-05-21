import React, { useState, useEffect, useRef } from 'react';
import { 
    Users, BookOpen, MapPin, BarChart3, TrendingUp, 
    Calendar, Eye, AlertCircle, CheckCircle, XCircle,
    Loader, RefreshCw, Flag
} from 'lucide-react';
import { useAuth } from '../../../context/authContext';
import { useAlert } from '../../../context/alertContext';
import Chart from 'chart.js/auto';

// Importar las funciones de API
import { 
    obtenerEstadisticasDashboard,
    obtenerMetricasTiempoReal,
    obtenerDatosRegistroUsuarios,
    obtenerDistribucionReportes
} from '../../../api/a-admin-dash';

const DashboardPrincipal = () => {
    const { token } = useAuth();
    const { showAlert } = useAlert();
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    
    // Referencias para los canvas de Chart.js
    const chartRegistroUsuariosRef = useRef(null);
    const chartDistribucionReportesRef = useRef(null);
    
    // Instancias de Chart
    const [chartRegistroUsuarios, setChartRegistroUsuarios] = useState(null);
    const [chartDistribucionReportes, setChartDistribucionReportes] = useState(null);
    
    // Estados para los datos del dashboard
    const [metricasPrincipales, setMetricasPrincipales] = useState({
        totalUsuarios: 0,
        usuariosActivos: 0,
        totalPublicaciones: 0,
        totalItinerarios: 0,
        totalSitios: 0,
        reportesPendientes: 0
    });
    
    const [estadisticasUsuarios, setEstadisticasUsuarios] = useState({
        nuevosHoy: 0,
        nuevosEstaSemana: 0,
        tasaActividad: 0
    });
    
    const [tendencias, setTendencias] = useState({
        usuarios: { tendencia: 'up', porcentaje: 0 },
        publicaciones: { tendencia: 'up', porcentaje: 0 },
        itinerarios: { tendencia: 'up', porcentaje: 0 },
        reportes: { tendencia: 'down', porcentaje: 0 }
    });

    // Cargar datos del dashboard
// En tu componente DashboardPrincipal - modifica cargarDashboard:
const cargarDashboard = async (esRefresco = false) => {
  try {
    if (!esRefresco) setLoading(true);
    else setRefreshing(true);
    
    setError(null);

    
    // Obtener todas las estadísticas en paralelo
    const [
      estadisticasResponse,
      datosRegistroResponse,
      distribucionReportesResponse
    ] = await Promise.all([
      obtenerEstadisticasDashboard(token),
      obtenerDatosRegistroUsuarios(token),
      obtenerDistribucionReportes(token)
    ]);
    

    
    const datos = estadisticasResponse.data;
    
    setMetricasPrincipales(datos.metricasPrincipales);
    setEstadisticasUsuarios(datos.estadisticasUsuarios);
    setTendencias(datos.tendencias);
    
    // Inicializar gráficas con los datos
    inicializarGraficaRegistroUsuarios(datosRegistroResponse.data);
    inicializarGraficaDistribucionReportes(distribucionReportesResponse.data);
    
  } catch (err) {
    setError(err.message);
    console.error('Error al cargar dashboard:', err);
    showAlert('error', 'Error al cargar dashboard', 'No se pudieron cargar los datos del dashboard');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

    // Inicializar gráfica de registro de usuarios
    const inicializarGraficaRegistroUsuarios = (datos) => {
        if (chartRegistroUsuarios) {
            chartRegistroUsuarios.destroy();
        }

        const ctx = chartRegistroUsuariosRef.current?.getContext('2d');
        if (!ctx) return;

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: datos.labels || ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Nuevos Usuarios',
                    data: datos.data || [65, 59, 80, 81, 56, 55],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        setChartRegistroUsuarios(chart);
    };

    // Inicializar gráfica de distribución de reportes
    const inicializarGraficaDistribucionReportes = (datos) => {
        if (chartDistribucionReportes) {
            chartDistribucionReportes.destroy();
        }

        const ctx = chartDistribucionReportesRef.current?.getContext('2d');
        if (!ctx) return;

        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: datos.labels || ['Pendientes', 'Resueltos', 'Rechazados'],
                datasets: [{
                    data: datos.data || [15, 8, 45, 12],
                    backgroundColor: [
                        'rgb(234, 179, 8)',
                        'rgb(34, 197, 94)',
                        'rgb(239, 68, 68)'
                    ],
                    borderColor: [
                        'rgb(234, 179, 8)',
                        'rgb(34, 197, 94)',
                        'rgb(239, 68, 68)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        setChartDistribucionReportes(chart);
    };

    // Cargar datos en tiempo real
    const cargarMetricasTiempoReal = async () => {
        try {
            const respuesta = await obtenerMetricasTiempoReal(token);
            setMetricasPrincipales(prev => ({
                ...prev,
                ...respuesta.data
            }));
        } catch (err) {
            console.error('Error al cargar métricas en tiempo real:', err);
        }
    };

    useEffect(() => {
        cargarDashboard();
        
        // Actualizar cada 2 minutos
        const interval = setInterval(cargarMetricasTiempoReal, 120000);
        return () => {
            clearInterval(interval);
            // Limpiar charts al desmontar
            if (chartRegistroUsuarios) chartRegistroUsuarios.destroy();
            if (chartDistribucionReportes) chartDistribucionReportes.destroy();
        };
    }, []);

    const handleRefresh = () => {
        cargarDashboard(true);
    };

    // Componente para mostrar tendencias
    const IndicadorTendencia = ({ tendencia, porcentaje }) => {
        const esPositivo = tendencia === 'up';
        return (
            <div className={`flex items-center gap-1 text-sm ${
                esPositivo ? 'text-green-600' : 'text-red-600'
            }`}>
                <TrendingUp 
                    size={16} 
                    className={esPositivo ? '' : 'rotate-180'}
                />
                <span>{porcentaje}%</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center gap-2 text-gray-600">
                    <Loader className="animate-spin" size={24} />
                    <span>Cargando dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header del Dashboard */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Dashboard de Administración
                    </h1>
                    <p className="text-gray-600">
                        Resumen general de la plataforma y métricas clave
                    </p>
                </div>
                
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                >
                    <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    <span>Actualizar</span>
                </button>
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

            {/* Sección 1: Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {/* Total Usuarios */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {metricasPrincipales.totalUsuarios.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="text-blue-600" size={24} />
                        </div>
                    </div>

                </div>

                {/* Usuarios Activos */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {metricasPrincipales.usuariosActivos.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                {/* Total Publicaciones */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Publicaciones</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {metricasPrincipales.totalPublicaciones.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <BookOpen className="text-purple-600" size={24} />
                        </div>
                    </div>
                </div>

                {/* Total Itinerarios */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Itinerarios</p>
                            <p className="text-3xl font-bold text-gray-900">
                                {metricasPrincipales.totalItinerarios.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <MapPin className="text-orange-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección 2: Métricas Secundarias */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Sitios Turísticos */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Sitios Turísticos</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {metricasPrincipales.totalSitios}
                            </p>
                        </div>
                        <MapPin className="text-emerald-600" size={20} />
                    </div>
                </div>

                {/* Reportes Pendientes */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-red-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Reportes Pendientes</p>
                            <p className="text-2xl font-bold text-red-600">
                                {metricasPrincipales.reportesPendientes}
                            </p>
                        </div>
                        <AlertCircle className="text-red-500" size={20} />
                    </div>
                </div>

                {/* Nuevos Hoy */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Nuevos Hoy</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {estadisticasUsuarios.nuevosHoy}
                            </p>
                        </div>
                        <Users className="text-blue-500" size={20} />
                    </div>
                </div>
            </div>

            {/* Sección 3: Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Gráfica: Registro de Usuarios */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <BarChart3 size={20} />
                            Registro de Usuarios
                        </h3>
                        <Calendar className="text-gray-400" size={18} />
                    </div>
                    <div className="h-64">
                        <canvas ref={chartRegistroUsuariosRef} />
                    </div>
                </div>

                {/* Gráfica: Distribución de Reportes */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Flag size={20} />
                            Distribución de Reportes
                        </h3>
                        <Eye className="text-gray-400" size={18} />
                    </div>
                    <div className="h-64">
                        <canvas ref={chartDistribucionReportesRef} />
                    </div>
                </div>
            </div>

            {/* Sección 4: Actividad Reciente */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingUp size={20} />
                        Actividad Reciente
                    </h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Actividad de Publicaciones */}
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600 mb-2">
                                {estadisticasUsuarios.nuevosHoy}
                            </div>
                            <p className="text-sm text-gray-600">Publicaciones hoy</p>
                        </div>
                        
                        {/* Actividad de Itinerarios */}
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600 mb-2">
                                {Math.floor(metricasPrincipales.totalItinerarios * 0.1)}
                            </div>
                            <p className="text-sm text-gray-600">Itinerarios esta semana</p>
                        </div>
                        
                        {/* Reportes Nuevos */}
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600 mb-2">
                                {Math.floor(metricasPrincipales.reportesPendientes * 0.2)}
                            </div>
                            <p className="text-sm text-gray-600">Reportes nuevos hoy</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPrincipal;