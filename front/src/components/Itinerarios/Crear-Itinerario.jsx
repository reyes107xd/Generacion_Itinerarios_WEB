import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Plus, X, Search, Trash2, AlertCircle, MapPin, Map, Compass, Check, ChevronRight, Plane, List } from 'lucide-react';
import { crearItinerario, actualizarItinerario, obtenerItinerarioPorId } from '../../api/api-itinerario';
import { obtenerLugares, obtenerCategorias } from '../../api/api-lugares';
import { useAuth } from "../../context/authContext";
import { addDays, parse } from 'date-fns';
import { useAlert } from '../../context/alertContext';
import DatePicker, { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
registerLocale('es', es);
import 'react-datepicker/dist/react-datepicker.css';
import 'leaflet/dist/leaflet.css';
import Mapa from './Mapa';
import traductorFrontend from '../../utils/traductor';
import { getPlaceImage } from '../../utils/placeImages';
import ModalSugerenciaItinerario from '../../components/ModalSugerenciaItinerario';
import { obtenerSugerenciaOptimizada } from '../../api/api-itinerario';

const CrearItinerario = ({ idProp, onCancelar }) => {
    const [nombreItinerario, setNombreItinerario] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [privacidad, setPrivacidad] = useState('');
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaTermino, setFechaTermino] = useState(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [diaSeleccionado, setDiaSeleccionado] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
    const [estadoSeleccionado, setEstadoSeleccionado] = useState('CDMX');
    const [diasDesbloqueados, setDiasDesbloqueados] = useState([1]);
    const [diasItinerario, setDiasItinerario] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});
    const [haIntentadoGuardar, setHaIntentadoGuardar] = useState(false);
    const [suppressValidation, setSuppressValidation] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [touched, setTouched] = useState({});
    const [lugaresTemp, setLugaresTemp] = useState([]);
    const [activeModalTab, setActiveModalTab] = useState('buscar'); // 'buscar' o 'seleccionados'
    const inicioRef = useRef(null);
    const terminoRef = useRef(null);
    const { showAlert } = useAlert();
    const { token } = useAuth();
    const esEdicion = !!idProp;
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);

    const [suggestionData, setSuggestionData] = useState(null);
    const [itinerarioParaGuardar, setItinerarioParaGuardar] = useState(null);
    const [obteniendoSugerencia, setObteniendoSugerencia] = useState(false);

    // Estados para datos del backend
    const [lugaresDisponibles, setLugaresDisponibles] = useState([]);
    const [categorias, setCategorias] = useState(['Todas']);
    const [cargandoLugares, setCargandoLugares] = useState(false);
    const [errorLugares, setErrorLugares] = useState(null);
    const [lugaresPorDia, setLugaresPorDia] = useState({});

    // Función para transformar el formato de datos al esperado por el optimizador
    // Función para transformar el formato de datos al esperado por el optimizador
    const transformarParaOptimizador = () => {
        return diasItinerario.map((diaObj, index) => {
            const diaNum = index + 1;
            const lugaresDia = lugaresPorDia[diaNum] || [];

            // Filtrar lugares que tengan id válido y coordenadas
            const lugaresValidos = lugaresDia.filter(lugar => {
                const valido = lugar.id && lugar.latitud && lugar.longitud;
                return valido;
            });

            // DETERMINAR EL ESTADO DEL DÍA:
            let estadoDelDia;
            if (lugaresValidos.length > 0) {
                // Tomar el estado del primer lugar (todos deben tener el mismo)
                estadoDelDia = lugaresValidos[0].estado;
            } else {
                // Si no hay lugares, usar el estado por defecto
                estadoDelDia = estadoSeleccionado || 'CDMX';
            }

            console.log(`Día ${diaNum} - Estado asignado:`, estadoDelDia);

            return {
                dia: diaNum,
                estado: estadoDelDia,
                lugares: lugaresValidos.map(lugar => ({
                    // DATOS ESENCIALES para el optimizador
                    id: lugar.id,
                    nombre: lugar.nombre,
                    lat: parseFloat(lugar.latitud),
                    lng: parseFloat(lugar.longitud),

                    // DATOS ADICIONALES que deben preservarse
                    direccion: lugar.direccion || 'Sin dirección',
                    categoria: lugar.categoria || 'Sin categoría',
                    estado: lugar.estado,
                    imagen: lugar.imagen, // ← PRESERVAR IMAGEN
                    puntaje: lugar.puntaje,
                    votaciones: lugar.votaciones,

                    // Campos alternativos por si acaso
                    foto: lugar.foto || lugar.imagen,
                    id_lugar: lugar.id_lugar || lugar.id
                }))
            };
        });
    };
    // Función para verificar si hay mejoras significativas
    const tieneMejorasSignificativas = (sugerencia) => {
        return JSON.stringify(sugerencia.original) !== JSON.stringify(sugerencia.sugerido);
    };

    // Función principal que se llama al hacer clic en guardar
    const handleClickGuardar = async () => {
        const valido = validateItinerario(true, true);
        setHaIntentadoGuardar(true);

        if (!valido) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setObteniendoSugerencia(true);

        try {
            // Transformar datos para el optimizador
            const itinerarioParaOptimizar = transformarParaOptimizador();
            // === DEBUG: VER QUÉ SE ESTÁ ENVIANDO ===
            console.log("=== DATOS ENVIADOS AL OPTIMIZADOR ===");
            console.log("DATOS ENVIADOS AL OPTIMIZADOR:", itinerarioParaOptimizar);
            itinerarioParaOptimizar.forEach((dia, idx) => {
                console.log(`Día ${idx + 1}:`, {
                    estado: dia.estado,
                    lugares: dia.lugares.map(l => ({ nombre: l.nombre, estado: l.estado }))
                });
            });
            console.log("=== FIN DEBUG ===");
            // === FIN DEBUG ===

            // Obtener sugerencia del backend
            const resultado = await obtenerSugerenciaOptimizada(itinerarioParaOptimizar, token);

            // Verificar estructura de respuesta
            if (resultado && resultado.success && resultado.data) {

                // VERIFICAR ESTRUCTURA DE LOS DATOS
                console.log("Estructura de datos originales:", {
                    esArray: Array.isArray(resultado.data.original),
                    longitud: resultado.data.original?.length,
                    dias: resultado.data.original?.map(d => ({ dia: d.dia, lugares: d.lugares?.length }))
                });

                console.log("Estructura de datos sugeridos:", {
                    esArray: Array.isArray(resultado.data.sugerido),
                    longitud: resultado.data.sugerido?.length,
                    dias: resultado.data.sugerido?.map(d => ({ dia: d.dia, lugares: d.lugares?.length }))
                });

                if (tieneMejorasSignificativas(resultado.data)) {
                    setSuggestionData(resultado.data);
                    setItinerarioParaGuardar(itinerarioParaOptimizar);
                    setShowSuggestionModal(true);
                } else {
                    console.log("No hay mejoras, guardando directamente");
                    await guardarItinerarioDirecto();
                }
            } else {
                console.warn(" Respuesta inesperada:", resultado);
                await guardarItinerarioDirecto();
            }
        } catch (error) {
            console.error(' Error obteniendo sugerencia:', error);
            await guardarItinerarioDirecto();
        } finally {
            setObteniendoSugerencia(false);
        }
    };

    // Función para guardar directamente (sin sugerencia)
    // Busca la función: guardarItinerarioDirecto y reemplázala TODA por esto:

    const guardarItinerarioDirecto = async (itinerarioData = null) => {
        try {
            // 1. HELPER: Limpiar fechas
            const formatearFechaSimple = (fecha) => {
                if (!fecha) return null;
                if (fecha instanceof Date) return fecha.toLocaleDateString('en-CA');
                return fecha.toString().split('T')[0];
            };

            // 2. Definir qué datos procesar
            const datosAProcesar = (itinerarioData && Array.isArray(itinerarioData))
                ? itinerarioData
                : diasItinerario.map((diaObj, index) => {
                    const diaNum = index + 1;
                    const lugaresDia = lugaresPorDia[diaNum] || [];

                    // Determinar estado del día
                    let estadoDelDia;
                    if (lugaresDia.length > 0) {
                        // Tomar estado del primer lugar
                        estadoDelDia = lugaresDia[0].estado;
                    } else {
                        estadoDelDia = estadoSeleccionado || 'CDMX';
                    }

                    return {
                        dia: diaNum,
                        estado: estadoDelDia,
                        lugares: lugaresDia
                    };
                });

            console.log("=== DATOS A PROCESAR ===", datosAProcesar);

            // 3. Validar fechas
            if (!fechaInicio || !fechaTermino) {
                showAlert('error', 'Error al guardar itinerario', 'Faltan las fechas de inicio o término');
                return;
            }

            // 4. Armar el objeto final (SOLO ENVIAR LO NECESARIO)
            const nuevoItinerario = {
                titulo: nombreItinerario ? nombreItinerario.trim() : 'Sin título',
                descripcion: descripcion ? descripcion.trim() : '',
                privacidad: privacidad === 'privado',
                fecha_inicio: formatearFechaSimple(fechaInicio),
                fecha_termino: formatearFechaSimple(fechaTermino),
                dias: datosAProcesar // ← ENVIAR LOS DÍAS CON ESTADO Y LUGARES
            };

            console.log("🚀 Enviando al backend:", nuevoItinerario);

            // 5. Enviar
            let resultado;
            if (esEdicion) {
                resultado = await actualizarItinerario(idProp, nuevoItinerario, token);
                showAlert('success', '¡Itinerario actualizado con éxito!', 'Se actualizó el itinerario.');
                if (onCancelar) onCancelar();
            } else {
                resultado = await crearItinerario(nuevoItinerario, token);
                showAlert('success', '¡Itinerario creado con éxito!', 'Consultalo en la sección "Mis itinerarios"!');
                limpiarFormulario();
                if (onCancelar) onCancelar();
            }

        } catch (error) {
            console.error("❌ Error CRÍTICO al guardar:", error);
            // Intentar leer el mensaje del backend
            const msg = error.response?.data?.error || error.response?.data?.message || error.message;
            showAlert('error', 'Error en el servidor.', `No se pudo guardar: ${msg}. Intentelo de nuevo más tarde.`);
        }
    };

    // Manejar aceptación de sugerencia
    const handleAceptarSugerencia = async () => {
        setShowSuggestionModal(false);

        if (!suggestionData || !suggestionData.sugerido) {
            await guardarItinerarioDirecto();
            return;
        }

        // DEBUG: Verificar datos antes de guardar
        console.log("=== ACEPTANDO SUGERENCIA ===");
        suggestionData.sugerido.forEach((dia, index) => {
            console.log(`Día ${dia.dia}:`, {
                estado: dia.estado,
                lugares: dia.lugares.map(l => ({
                    id: l.id,
                    nombre: l.nombre,
                    imagen: l.imagen,
                    tieneImagen: !!l.imagen
                }))
            });
        });

        //     // En guardarItinerarioDirecto, justo antes de enviar al backend:
        // console.log("=== DATOS FINALES PARA GUARDAR ===");
        // diasParaBackend.forEach(dia => {
        //   console.log(`Día ${dia.dia || dia.fecha}:`, {
        //     estado: dia.estado,
        //     cantidadLugares: dia.lugares?.length || 0,
        //     lugares: dia.lugares?.map(l => l.nombre)
        //   });
        // });

        // Transformar manteniendo TODOS los campos
        const itinerarioSugeridoFormateado = suggestionData.sugerido.map(dia => ({
            dia: dia.dia,
            estado: dia.estado,
            lugares: dia.lugares.map(lugar => ({
                // Preservar todos los campos posibles
                ...lugar,
                // Asegurar campos críticos
                id: lugar.id,
                nombre: lugar.nombre,
                lat: lugar.lat,
                lng: lugar.lng,
                direccion: lugar.direccion,
                categoria: lugar.categoria,
                estado: lugar.estado,
                imagen: lugar.imagen,
                puntaje: lugar.puntaje,
                votaciones: lugar.votaciones,
                // Campos alternativos
                latitud: lugar.lat,
                longitud: lugar.lng,
                id_lugar: lugar.id_lugar || lugar.id,
                foto: lugar.foto || lugar.imagen
            }))
        }));

        await guardarItinerarioDirecto(itinerarioSugeridoFormateado);
    };

    // Manejar rechazo de sugerencia
    const handleRechazarSugerencia = () => {
        setShowSuggestionModal(false);
        guardarItinerarioDirecto();
    };

    // Calcular estadísticas (nuevo)
    const totalLugares = Object.values(lugaresPorDia).reduce((acc, arr) => acc + (arr?.length || 0), 0);
    const totalDias = diasItinerario.length;

    // Genera arreglo de días preservando los lugares ya asignados
    const generarDias = (inicio, fin) => {
        if (!inicio || !fin) return;

        const fechaI = new Date(inicio);
        const fechaF = new Date(fin);

        if (fechaF < fechaI) return;

        const dias = [];
        let actual = new Date(fechaI);

        // 1. Generamos el nuevo array de fechas
        while (actual <= fechaF) {
            const fechaStr = actual.toLocaleDateString('en-CA');
            dias.push({ fecha: fechaStr });
            actual.setDate(actual.getDate() + 1);
        }

        // 2. IDENTIFICAR QUÉ FECHAS SE ELIMINARON O CAMBIARON
        const fechasAnteriores = diasItinerario.map(d => d.fecha);
        const fechasNuevas = dias.map(d => d.fecha);
        const fechasEliminadas = fechasAnteriores.filter(fecha => !fechasNuevas.includes(fecha));

        setDiasItinerario(dias);

        // 3. CALCULAR EL NUEVO MAPA DE LUGARES
        // Extraemos la lógica del setLugaresPorDia para tener los datos disponibles inmediatamente
        const nuevosLugares = {};

        fechasNuevas.forEach((fecha, index) => {
            const diaNum = index + 1;
            const indiceAnterior = fechasAnteriores.indexOf(fecha);

            if (indiceAnterior !== -1) {
                // La fecha ya existía - mantenemos sus lugares del estado actual
                const diaAnterior = indiceAnterior + 1;
                nuevosLugares[diaNum] = lugaresPorDia[diaAnterior] || [];
            } else {
                // Es una fecha nueva - iniciamos con array vacío
                nuevosLugares[diaNum] = [];
            }
        });

        setLugaresPorDia(nuevosLugares);

        // 4. CALCULAR LUGARES ELIMINADOS PARA EL ALERTA
        let lugaresEliminados = 0;
        fechasEliminadas.forEach(fecha => {
            const indice = fechasAnteriores.indexOf(fecha);
            if (indice !== -1) {
                const dia = indice + 1;
                lugaresEliminados += (lugaresPorDia[dia] || []).length;
            }
        });

        if (lugaresEliminados > 0) {
            setTimeout(() => {
                showAlert('warning', 'Fechas eliminadas',
                    `Se eliminaron ${fechasEliminadas.length} fecha(s) y ${lugaresEliminados} lugar(es) asociados.`);
            }, 0);
        }

        // 5. ACTUALIZAR DÍAS DESBLOQUEADOS (CORRECCIÓN)
        // Recalculamos la cadena completa de desbloqueo basada en los lugares que ya existen
        const nuevosDesbloqueados = [1]; // El día 1 siempre inicia desbloqueado

        for (let i = 1; i < dias.length; i++) {
            // Revisamos si el día anterior (i) tiene lugares
            const lugaresDiaAnterior = nuevosLugares[i] || [];

            if (lugaresDiaAnterior.length > 0) {
                // Si el día anterior tiene lugares, desbloqueamos el actual (i + 1)
                nuevosDesbloqueados.push(i + 1);
            } else {
                // Si encontramos un día vacío, dejamos de desbloquear los siguientes
                // para mantener el orden secuencial.
                break;
            }
        }

        setDiasDesbloqueados(nuevosDesbloqueados);
    };
    //Ve si esta en modo de edicion o creacion
    // Cargar datos si es edición

    useEffect(() => {
        const cargarDatos = async () => {
            if (!esEdicion || !token) return;

            try {
                // 1. Obtenemos los datos del backend
                const data = await obtenerItinerarioPorId(idProp, token);
                const item = data.itinerario || data;

                // 2. Rellenar datos básicos
                setNombreItinerario(item.titulo);
                setDescripcion(item.descripcion || '');

                // Privacidad: soportar backend que puede enviar `privacidad` boolean o `id_privacidad` numeric
                const esPrivado = (item.privacidad === true) || (item.id_privacidad === 1);
                if (esPrivado) setPrivacidad('privado');
                else setPrivacidad('publico');

                // 3. Fechas (Cortamos la parte de la hora 'T...')
                const fInicio = item.fecha_inicio ? item.fecha_inicio.split('T')[0] : '';
                const fTermino = item.fecha_termino ? item.fecha_termino.split('T')[0] : '';

                // 2. SOLUCIÓN DEL +1 / -1 DÍA
                // Agregamos "T00:00:00" para decirle al navegador: "Esta es la medianoche de MI CIUDAD"
                if (fInicio) setFechaInicio(new Date(`${fInicio}T00:00:00`));
                if (fTermino) setFechaTermino(new Date(`${fTermino}T00:00:00`));

                // 3. REGENERAR LOS DÍAS VISUALES
                if (fInicio && fTermino) {
                    // Usamos el mismo truco aquí
                    const start = new Date(`${fInicio}T00:00:00`);
                    const end = new Date(`${fTermino}T00:00:00`);

                    const diasArr = [];

                    // Loop seguro
                    let loopDate = new Date(start);
                    while (loopDate <= end) {
                        // Usamos toLocaleDateString('en-CA') para obtener formato YYYY-MM-DD local
                        // Esto evita que .toISOString() te cambie la zona horaria
                        diasArr.push({ fecha: loopDate.toLocaleDateString('en-CA') });

                        // Sumar 1 día
                        loopDate.setDate(loopDate.getDate() + 1);
                    }

                    setDiasItinerario(diasArr);
                    setDiasDesbloqueados(diasArr.map((_, i) => i + 1));
                }

                // 5. TRANSFORMACIÓN CLAVE: De Array Plano -> A Objeto por Día
                const lugaresRaw = item.lugares || []; // La lista plana que viene del backend
                const mapaLugares = {};

                lugaresRaw.forEach(lugar => {
                    const diaNum = lugar.dia;

                    if (diaNum) {
                        if (!mapaLugares[diaNum]) {
                            mapaLugares[diaNum] = [];
                        }

                        // Formateamos el lugar para que coincida con lo que espera el componente
                        // Formateamos el lugar para que coincida con lo que espera el componente
                        mapaLugares[diaNum].push({
                            id: lugar.id_lugar || lugar.id,
                            nombre: lugar.nombre,
                            imagen: lugar.foto
                                ? (lugar.foto.startsWith('http') ? lugar.foto : `/img/lugares/${lugar.foto}`)
                                : '/api/placeholder/120/80',
                            direccion: lugar.ubicacion || lugar.direccion || 'Sin dirección',
                            categoria: lugar.categoria,
                            latitud: parseFloat(lugar.latitud),
                            longitud: parseFloat(lugar.longitud),
                            estado: lugar.estado,
                            puntaje: lugar.puntaje,
                            votaciones: lugar.votaciones
                        });
                    }
                });

                console.log("Lugares transformados para edición:", mapaLugares);
                // DEBUG: Verificar el estado de cada lugar
                Object.keys(mapaLugares).forEach(dia => {
                    console.log(`Día ${dia} lugares:`, mapaLugares[dia].map(l => ({
                        nombre: l.nombre,
                        estado: l.estado
                    })));
                });

                setLugaresPorDia(mapaLugares);

            } catch (error) {
                console.error("Error cargando edición:", error);
            }
        };

        cargarDatos();
    }, [idProp, esEdicion, token]);    // Cargar categorías al montar el componente

    useEffect(() => {
        cargarCategorias();
    }, []);

    // Cargar lugares cuando cambian los filtros
    useEffect(() => {
        if (modalAbierto) {
            cargarLugares();
        }
    }, [modalAbierto, estadoSeleccionado, categoriaSeleccionada, searchTerm]);

    const cargarCategorias = async () => {
        try {
            const data = await obtenerCategorias();
            const nombresCategorias = ['Todas', ...data.map(cat => cat.nombre)];
            setCategorias(nombresCategorias);
        } catch (error) {
            setCategorias(['Todas', 'Museos', 'Atracciones turísticas', 'Parques', 'Zoológicos']);
        }
    };

    const cargarLugares = async () => {
        setCargandoLugares(true);
        setErrorLugares(null);

        try {
            const filtros = {
                estado: estadoSeleccionado,
                categoria: categoriaSeleccionada === 'Todas' ? '' : categoriaSeleccionada,
                busqueda: searchTerm,
                limite: 50
            };

            const response = await obtenerLugares(filtros);
            const data = response.data || [];

            const lugaresFormateados = data.map(lugar => ({
                id: lugar.id_lugar || lugar.id,
                nombre: lugar.nombre,
                direccion: lugar.ubicacion || 'Ubicación no disponible',
                imagen: `/img/lugares/${lugar.foto}` || '/api/placeholder/120/80',
                categoria: lugar.categoria,
                puntaje: lugar.puntaje,
                votaciones: lugar.votaciones,
                latitud: lugar.latitud,
                longitud: lugar.longitud,
                horario: lugar.horario,
                estado: lugar.estado || lugar.nombre_estado || lugar.state || 'Desconocido'
            }));

            setLugaresDisponibles(lugaresFormateados);
        } catch (error) {
            console.error('Error al cargar lugares:', error);
            setErrorLugares('No se pudieron cargar los lugares. Por favor, intenta de nuevo.');
            setLugaresDisponibles([]);
        } finally {
            setCargandoLugares(false);
        }
    };

    const abrirModal = (dia) => {
        if (diasDesbloqueados.includes(dia)) {
            setDiaSeleccionado(dia);
            setLugaresTemp([...lugaresPorDia[dia] || []]);
            setActiveModalTab('buscar'); // Resetear a la pestaña de búsqueda al abrir
            setModalAbierto(true);
        }
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setDiaSeleccionado(null);
        setSearchTerm('');
        setActiveModalTab('buscar'); // Resetear pestaña al cerrar
    };

    const guardarYCerrarModal = () => {
        if (!diaSeleccionado) return;

        setLugaresPorDia(prev => ({
            ...prev,
            [diaSeleccionado]: [...lugaresTemp]   // copiamos los temporales al real
        }));

        if (diaSeleccionado < totalDias && !diasDesbloqueados.includes(diaSeleccionado + 1)) {
            setDiasDesbloqueados(prev => [...prev, diaSeleccionado + 1]);
        }
        cerrarModal();
    };

    const agregarLugar = (lugar) => {
        if (!diaSeleccionado) return;

        // 1. Validar cantidad
        if (lugaresTemp.length >= 10) {
            showAlert('warning', 'Día Lleno', 'Has alcanzado el límite de lugares por día.');
            return;
        }

        // 2. Validar duplicados en el día actual
        if ((lugaresTemp || []).some(l => l.id === lugar.id)) return;

        // 3. === VALIDACIÓN DE LUGAR REPETIDO EN TODO EL ITINERARIO ===
        if (lugarYaEstaEnUso(lugar.id)) {
            showAlert(
                'error',
                'Lugar Ya Seleccionado',
                `"${lugar.nombre}" ya fue agregado en otro día. No puedes repetir lugares en el itinerario.`
            );
            return;
        }

        // 4. Validar estado
        if (lugaresTemp.length > 0) {
            const primerLugar = lugaresTemp[0];
            const estadoDia = (primerLugar.estado || "").trim().toUpperCase();
            const estadoNuevo = (lugar.estado || "").trim().toUpperCase();

            if (estadoDia && estadoNuevo && estadoDia !== estadoNuevo) {
                showAlert(
                    'error',
                    'Ubicación Diferente',
                    `No puedes mezclar estados. Este día ya tiene lugares de "${primerLugar.estado}".`
                );
                return;
            }
        }

        setHasInteracted(true);
        setTouched(prev => ({ ...prev, lugares: true }));
        setLugaresTemp(prev => [...prev, lugar]);
        
        // Cambiar a la pestaña de seleccionados en móvil para mostrar el lugar agregado
        setActiveModalTab('seleccionados');
    };

    // Agregar esta función después de las otras funciones de validación
    const lugarYaEstaEnUso = (lugarId) => {
        return Object.values(lugaresPorDia).some(lugaresDia =>
            (lugaresDia || []).some(lugar => lugar.id === lugarId)
        );
    };

    const eliminarLugar = (lugarId) => {
        if (!diaSeleccionado) return;
        setHasInteracted(true);
        setTouched(prev => ({ ...prev, lugares: true }));
        setLugaresTemp(prev => (prev || []).filter(l => l.id !== lugarId));
    };

    const eliminarLugarPrincipal = (dia, lugarId) => {
        // borrar del estado REAL
        setLugaresPorDia(prev => ({
            ...prev,
            [dia]: prev[dia].filter(l => l.id !== lugarId)
        }));

        if (modalAbierto && diaSeleccionado === dia) {
            setLugaresTemp(prev =>
                prev.filter(l => l.id !== lugarId)
            );
        }
    };

    const lugarYaAgregado = (lugarId) => {
        if (!diaSeleccionado) return false;
        return (lugaresPorDia[diaSeleccionado] || []).some(l => l.id === lugarId);
    };

    const validateItinerario = (shouldSetState = true, forceShow = false) => {
        const errors = {};

        // Nombre
        const nombreErr = [];
        if (!nombreItinerario || !nombreItinerario.trim()) {
            nombreErr.push('El nombre del itinerario es requerido.');
        } else if (nombreItinerario.trim().length < 3) {
            nombreErr.push('El nombre debe tener al menos 3 caracteres.');
        } else if (nombreItinerario.trim().length > 100) {
            nombreErr.push('El nombre no puede exceder 100 caracteres.');
        }
        if (nombreErr.length) errors.nombre = nombreErr;

        // Privacidad
        const privacidadErr = [];
        if (!privacidad) {
            privacidadErr.push('Selecciona la privacidad del itinerario.');
        }
        if (privacidadErr.length) errors.privacidad = privacidadErr;

        // Fechas
        const fechasErr = [];
        if (!fechaInicio || !fechaTermino) {
            fechasErr.push('Selecciona fecha de inicio y fecha de término.');
        } else {
            const fi = new Date(fechaInicio);
            const ft = new Date(fechaTermino);
            if (isNaN(fi.getTime()) || isNaN(ft.getTime())) {
                fechasErr.push('Formato de fecha inválido.');
            } else if (ft < fi) {
                fechasErr.push('La fecha de término no puede ser anterior a la fecha de inicio.');
            } else {
                const diff = Math.ceil((ft - fi) / (1000 * 60 * 60 * 24));
                if (diff > 4) {
                    fechasErr.push('El itinerario no puede durar más de 5 días.');
                }
            }
        }
        if (fechasErr.length) errors.fechas = fechasErr;

        // Días
        const diasErr = [];
        if (!diasItinerario || diasItinerario.length === 0) {
            diasErr.push('Debes generar al menos un día para el itinerario (selecciona fechas).');
        }
        if (diasErr.length) errors.dias = diasErr;

        // Lugares: validar que cada día tenga al menos 1 lugar y máximo 3
        const lugaresErr = [];
        const totalLugares = Object.values(lugaresPorDia || {}).reduce((acc, arr) => acc + (arr?.length || 0), 0);

        // Si no hay días generados, se reportará por la validación de días.
        if (diasItinerario && diasItinerario.length > 0) {
            // Para cada día esperado (1..n) comprobar si tiene al menos 1 lugar
            for (let i = 0; i < diasItinerario.length; i++) {
                const diaIndex = i + 1;
                const arr = lugaresPorDia[diaIndex] || [];
                if (!arr || arr.length === 0) {
                    lugaresErr.push(`El día ${diaIndex} debe tener al menos 1 lugar.`);
                }
                if (arr && arr.length > 10) {
                    lugaresErr.push(`El día ${diaIndex} tiene más de 3 lugares (máximo 3).`);
                }
            }
        } else {
            // Si no hay días, pero tampoco lugares, dejamos la comprobación de total para el caso general
            if (totalLugares === 0) {
                lugaresErr.push('Debes agregar al menos un lugar al itinerario.');
            }
        }

        if (lugaresErr.length) errors.lugares = lugaresErr;

        // Descripción opcional: límite
        const descErr = [];
        if (!descripcion || !descripcion.trim()) {
            descErr.push('La descripción del itinerario es requerida.');
        } else if (descripcion.trim().length < 3) {
            descErr.push('La descripción debe tener al menos 3 caracteres.');
        } else if (descripcion && descripcion.length > 100) {
            descErr.push('La descripción no puede exceder 100 caracteres.');
        }
        if (descErr.length) errors.descripcion = descErr;

        if (shouldSetState) {
            if (suppressValidation) {
                setValidationErrors({});
            } else if (forceShow || haIntentadoGuardar) {
                setValidationErrors(errors);
            } else {
                const visible = {};
                for (const key of Object.keys(errors)) {
                    if (touched && touched[key]) {
                        visible[key] = errors[key];
                    }
                }
                setValidationErrors(visible);
            }
        }
        return Object.keys(errors).length === 0;
    };

    // Validación en tiempo real
    useEffect(() => {
        if (suppressValidation) return;
        validateItinerario(true);
    }, [nombreItinerario, privacidad, fechaInicio, fechaTermino, diasItinerario, lugaresPorDia, descripcion, suppressValidation, touched]);

    const errorFor = (field) => {
        if (!validationErrors) return [];
        return validationErrors[field] || [];
    };

    const validFor = (field) => {
        if (!validationErrors) return false;
        if ((validationErrors[field] || []).length > 0) return false;

        switch (field) {
            case 'nombre': {
                const v = nombreItinerario && nombreItinerario.trim().length >= 3 && nombreItinerario.trim().length <= 100;
                return !!v;
            }
            case 'privacidad':
                return !!privacidad;
            case 'fechas': {
                if (!fechaInicio || !fechaTermino) return false;
                const fi = new Date(fechaInicio);
                const ft = new Date(fechaTermino);
                if (isNaN(fi.getTime()) || isNaN(ft.getTime())) return false;
                if (ft < fi) return false;
                const diff = Math.ceil((ft - fi) / (1000 * 60 * 60 * 24));
                return diff >= 0 && diff <= 4;
            }
            case 'descripcion':
                return !!descripcion && descripcion.length <= 1000;
            case 'lugares': {
                const totalLugares = Object.values(lugaresPorDia || {}).reduce((acc, arr) => acc + (arr?.length || 0), 0);
                if (totalLugares === 0) return false;
                for (const arr of Object.values(lugaresPorDia || {})) {
                    if (arr && arr.length > 3) return false;
                }
                return true;
            }
            default:
                return false;
        }
    };

    const limpiarFormulario = () => {
        setNombreItinerario("");
        setPrivacidad("");
        setFechaInicio(null);
        setFechaTermino(null);
        setDiasItinerario([]);
        setLugaresPorDia({});
        setDescripcion("");
        setValidationErrors({});
        setHaIntentadoGuardar(false);
        setTouched({});
        setHasInteracted(false);
        setDiasDesbloqueados([1]); // Resetear a solo el primer día desbloqueado
        setLugaresTemp([]); // Limpiar lugares temporales del modal
        setModalAbierto(false); // Cerrar modal si está abierto
        setDiaSeleccionado(null); // Resetear día seleccionado
        setSearchTerm(''); // Limpiar búsqueda
        setCategoriaSeleccionada('Todas'); // Resetear categoría
        setEstadoSeleccionado('CDMX'); // Resetear estado
        setSuppressValidation(false); // Resetear validación suprimida
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Header con fondo verde - diseño estilizado y alineado */}
                <div className="bg-green-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 text-white mb-6 sm:mb-8 shadow-2xl overflow-hidden relative">

                    {/* Patrón de mapa estilizado - más sutil */}
                    <div className="absolute top-0 right-0 w-96 h-96 opacity-5 pointer-events-none">
                        <svg className="w-full h-full" viewBox="0 0 500 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 180 C 150 50, 350 150, 490 20" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" className="text-white" />
                        </svg>
                    </div>

                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between relative z-10">

                        {/* Contenido de texto */}
                        <div className="flex-1 max-w-4xl mb-4 lg:mb-0 lg:mr-8">
                            <div className="mb-3 sm:mb-4">
                                <div className="text-left mb-1">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 rounded-full text-xs sm:text-sm font-medium">
                                        <Compass className="w-4 h-4" />
                                        <span>{esEdicion ? "Editando itinerario" : "Nuevo itinerario"}</span>
                                    </div>
                                </div>
                                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-2 sm:mb-3 drop-shadow-lg text-left leading-tight">
                                    {esEdicion ? "Modifica tu Aventura" : "Crea tu Próximo Viaje Soñado"}
                                </h1>
                            </div>

                            <p className="text-sm sm:text-base lg:text-lg text-green-100 text-left max-w-3xl leading-relaxed">
                                ¡El mundo espera! Diseña tu itinerario perfecto: desde el primer día hasta el último recuerdo.
                                Traza la ruta, selecciona tus imperdibles y prepárate para una experiencia inolvidable.
                            </p>
                        </div>

                        {/* Elemento visual derecho: Composición estilizada y alineada */}
                        <div className="hidden lg:block w-56 flex-shrink-0">
                            {/* Contenedor principal con dimensiones fijas */}
                            <div className="relative w-56 h-56">

                                {/* Círculo de fondo decorativo */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-44 h-44 rounded-full border-2 border-white/10"></div>
                                </div>

                                {/* Línea diagonal principal - perfectamente alineada */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-40 h-40 relative">
                                        {/* Línea diagonal de esquina a esquina */}
                                        <div className="absolute top-0 left-0 w-full h-full">
                                            <div className="relative w-full h-full">
                                                <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-transparent via-yellow-400/50 to-transparent transform rotate-45 origin-top"></div>
                                                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent transform rotate-45 origin-left"></div>
                                            </div>
                                        </div>

                                        {/* Puntos decorativos a lo largo de la línea */}
                                        <div className="absolute top-0 left-0 w-3 h-3 bg-yellow-400/30 rounded-full transform translate-x-8 translate-y-8"></div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-400/30 rounded-full transform -translate-x-8 -translate-y-8"></div>
                                    </div>
                                </div>

                                {/* 1. Avión - Posicionado perfectamente en esquina superior izquierda */}
                                <div className="absolute top-8 left-8 transform -rotate-12">
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-gradient-to-br from-sky-400/20 to-blue-300/10 rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-lg backdrop-blur-sm">
                                            <Plane className="w-8 h-8 text-white" />
                                        </div>
                                        {/* Efecto de movimiento */}
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white/10 rounded-full backdrop-blur-sm flex items-center justify-center">
                                            <div className="w-4 h-4 bg-white/20 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Destino - Posicionado perfectamente en esquina inferior derecha */}
                                <div className="absolute bottom-8 right-8 transform rotate-6">
                                    <div className="relative">
                                        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400/30 to-amber-300/20 rounded-2xl flex items-center justify-center border-2 border-yellow-300/30 shadow-xl backdrop-blur-sm">
                                            <MapPin className="w-10 h-10 text-yellow-300" />
                                        </div>
                                        {/* Anillos concéntricos */}
                                        <div className="absolute inset-0 animate-ping-slow">
                                            <div className="w-full h-full border-2 border-yellow-400/20 rounded-2xl"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Elemento central - Maleta de viaje */}
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                                    <div className="w-14 h-10 bg-gradient-to-b from-white to-white/80 rounded-lg shadow-xl relative">
                                        {/* Asa */}
                                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-10 h-3 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-t-lg shadow-md"></div>
                                        {/* Detalles */}
                                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-emerald-400/50 rounded-full"></div>
                                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-emerald-400/30 rounded-full"></div>
                                        {/* Calcomanías */}
                                        <div className="absolute top-6 left-4 w-2 h-2 bg-sky-400/60 rounded-full"></div>
                                        <div className="absolute top-7 right-4 w-1.5 h-1.5 bg-yellow-400/60 rounded-full"></div>
                                    </div>
                                </div>

                                {/* Flecha direccional - conectando los elementos */}
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0">
                                    <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent transform rotate-45"></div>
                                    <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2">
                                        <ChevronRight className="w-6 h-6 text-yellow-400/60" />
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {/* Columna izquierda - Formulario básico */}
                    <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                        {/* Estadísticas del viaje */}

                        {/* Información básica */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
                            <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                                <Compass className="text-green-800" size={18} />
                                Información básica
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">Nombre del itinerario:</label>
                                    <input
                                        type="text"
                                        value={nombreItinerario}
                                        onChange={(e) => { setNombreItinerario(e.target.value); setHasInteracted(true); setTouched(prev => ({ ...prev, nombre: true })); }}
                                        placeholder="Escribe el nombre de tu itinerario"
                                        className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all ${errorFor('nombre').length > 0
                                            ? 'border-red-500 bg-red-50'
                                            : validFor('nombre')
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-300 focus:border-emerald-500 focus:bg-white'
                                            }`}
                                    />
                                    {errorFor('nombre').length > 0 && (
                                        <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                            {errorFor('nombre').map((e, i) => <li key={i}>{e}</li>)}
                                        </ul>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">Privacidad:</label>
                                    <select
                                        value={privacidad}
                                        onChange={(e) => { setPrivacidad(e.target.value); setHasInteracted(true); setTouched(prev => ({ ...prev, privacidad: true })); }}
                                        className={`w-full px-4 py-3 border-2 rounded-xl outline-none transition-all ${errorFor('privacidad').length > 0
                                            ? 'border-red-500 bg-red-50'
                                            : validFor('privacidad')
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-300 focus:border-emerald-500 focus:bg-white'
                                            }`}
                                    >
                                        <option value="">Seleccione una opción</option>
                                        <option value="publico">Público</option>
                                        <option value="privado">Privado</option>
                                    </select>
                                    {errorFor('privacidad').length > 0 && (
                                        <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                            {errorFor('privacidad').map((e, i) => <li key={i}>{e}</li>)}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Fechas */}


                        {/* Descripción */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
                            <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                                <Map className="text-green-800" size={18} />
                                Descripción
                            </h3>
                            <textarea
                                value={descripcion}
                                onChange={(e) => { setDescripcion(e.target.value); setHasInteracted(true); setTouched(prev => ({ ...prev, descripcion: true })); }}
                                placeholder="Describe brevemente tu itinerario..."
                                rows="4"
                                className={`w-full px-4 py-3 border-2 rounded-xl outline-none resize-none transition-all ${errorFor('descripcion').length > 0
                                    ? 'border-red-500 bg-red-50'
                                    : validFor('descripcion') && descripcion
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-300 focus:border-emerald-500 focus:bg-white'
                                    }`}
                            />
                            {errorFor('descripcion').length > 0 && (
                                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                    {errorFor('descripcion').map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            )}
                            {validFor('descripcion') && descripcion && (
                                <p className="mt-2 text-sm text-green-700 font-medium">✓ Descripción válida</p>
                            )}
                            {touched.descripcion && !descripcion && !errorFor('descripcion').length && (
                                <p className="mt-2 text-sm text-gray-500 font-medium">Descripción opcional (máx. 100 caracteres)</p>
                            )}
                        </div>
                    </div>

                    {/* Columna derecha - Lugares y Mapa */}
                    <div className="lg:col-span-2">
                        {/* Tarjeta Principal */}
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200">

                            {/* Encabezado */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center gap-2 sm:gap-3">
                                    <MapPin className="text-green-800" size={20} />
                                    Planificación de Lugares
                                </h2>
                                <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-emerald-800 rounded-xl font-semibold text-sm sm:text-base">
                                    <MapPin size={16} />
                                    {totalLugares} lugares agregados
                                </div>
                            </div>

                            {/* Sección de Fechas (Organizada en Grid) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Fecha Inicio */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">Fecha de inicio:</label>
                                    <div
                                        className="relative"
                                        onClick={(e) => { e.stopPropagation(); if (inicioRef.current) inicioRef.current.setOpen(true); }}
                                    >
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                                        <DatePicker
                                            ref={inicioRef}
                                            selected={fechaInicio}
                                            onKeyDown={(e) => e.preventDefault()}
                                            onChange={(date) => {
                                                setHasInteracted(true);
                                                setTouched(prev => ({ ...prev, fechas: true }));
                                                setFechaInicio(date);
                                                const limite = addDays(date, 4);
                                                if (fechaTermino) {
                                                    // IMPORTANTE: Si la nueva fecha de inicio es posterior a la de término,
                                                    // normalmente reseteas término. Pero si es válida:
                                                    if (date <= fechaTermino) {
                                                        generarDias(date, fechaTermino);
                                                    } else {
                                                        // Si la fecha inicio supera a la fecha fin, reiniciamos fin (lógica estándar)
                                                        setFechaTermino(null);
                                                        setDiasItinerario([]);
                                                        setLugaresPorDia({});
                                                    }
                                                }
                                            }}
                                            minDate={new Date()}
                                            dateFormat="yyyy-MM-dd"
                                            placeholderText="Selecciona la fecha de inicio"
                                            locale="es"
                                            className={`w-full px-4 py-3 pl-10 border-2 rounded-xl outline-none transition-all ${errorFor('fechas').length > 0
                                                ? 'border-red-500 bg-red-50'
                                                : validFor('fechas') && fechaInicio
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-300 focus:border-emerald-500 focus:bg-white'
                                                }`}
                                        />
                                    </div>
                                </div>

                                {/* Fecha Término */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-gray-700">Fecha de término:</label>
                                    <div
                                        className="relative"
                                        onClick={(e) => { e.stopPropagation(); if (terminoRef.current) terminoRef.current.setOpen(true); }}
                                    >
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                                        <DatePicker
                                            ref={terminoRef}
                                            selected={fechaTermino}
                                            onKeyDown={(e) => e.preventDefault()}
                                            onChange={(date) => {
                                                setHasInteracted(true);
                                                setTouched(prev => ({ ...prev, fechas: true }));
                                                setFechaTermino(date);
                                                if (fechaInicio) {
                                                    generarDias(fechaInicio, date);
                                                }
                                            }}
                                            minDate={fechaInicio ? new Date(fechaInicio) : new Date()}
                                            maxDate={fechaInicio ? addDays(new Date(fechaInicio), 4) : null}
                                            disabled={!fechaInicio}
                                            dateFormat="yyyy-MM-dd"
                                            placeholderText={fechaInicio ? "Selecciona fecha de término" : "Selecciona primero la fecha inicio"}
                                            locale="es"
                                            className={`w-full px-4 py-3 pl-10 border-2 rounded-xl outline-none transition-all ${errorFor('fechas').length > 0
                                                ? 'border-red-500 bg-red-50'
                                                : validFor('fechas') && fechaTermino
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-300 focus:border-emerald-500 focus:bg-white'
                                                } ${!fechaInicio ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Mensajes de Error (Fechas) */}
                            {errorFor('fechas').length > 0 && (
                                <div className="mb-2 p-3 rounded-lg">
                                    <ul className="text-sm text-red-700 list-disc list-inside">
                                        {errorFor('fechas').map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Mensajes de Error (Lugares) */}
                            {errorFor('lugares').length > 0 && (
                                <div className="mb-2 p-4  rounded-xl">
                                    <ul className="text-sm text-red-700 list-disc list-inside">
                                        {errorFor('lugares').map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Lista de Días del Itinerario */}
                            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                                {diasItinerario.length === 0 && (
                                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-lg">Selecciona las fechas para comenzar a planificar</p>
                                    </div>
                                )}

                                {diasItinerario.map((diaObj, index) => {
                                    const diaNum = index + 1;
                                    const estaBloqueado = !diasDesbloqueados.includes(diaNum);
                                    const cantidad = (lugaresPorDia[diaNum] || []).length;

                                    return (
                                        <div
                                            key={diaNum}
                                            className="border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden transition-all hover:shadow-md"
                                        >

                                            {/* ENCABEZADO DEL DÍA */}
                                            <div
                                                className="flex justify-between items-center p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-white cursor-pointer"
                                                onClick={() => abrirModal(diaNum)}
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4">
                                                    <div
                                                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shadow-lg ${estaBloqueado
                                                            ? 'bg-gray-300 text-gray-600'
                                                            : 'bg-emerald-500 text-white'
                                                            }`}
                                                    >
                                                        D{diaNum}
                                                    </div>

                                                    <div>
                                                        <h3
                                                            className={`font-bold text-base sm:text-lg lg:text-xl ${estaBloqueado ? 'text-gray-400' : 'text-gray-900'
                                                                }`}
                                                        >
                                                            Día {diaNum} - {diaObj.fecha}
                                                        </h3>

                                                        <p className={`text-sm sm:text-base ${estaBloqueado ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {cantidad} lugar(es) programado(s)
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    disabled={estaBloqueado}
                                                    className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors ${estaBloqueado
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : 'text-emerald-600 hover:bg-emerald-50'
                                                        }`}
                                                >
                                                    <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                                                </button>
                                            </div>
                                            {/* LISTA DE LUGARES DEBAJO DEL DÍA */}
                                            {(lugaresPorDia[diaNum] || []).map((lugar) => {
                                                const lugarTraducido = traductorFrontend.traducirLugar(lugar);
                                                return (
                                                    <div key={lugar.id} className="flex items-center justify-between bg-gray-50 p-2 sm:p-3 mx-2 mb-2 rounded-lg sm:rounded-xl border border-gray-200 gap-2">
                                                        <img src={getPlaceImage(lugar)} alt={lugarTraducido.nombreEspanol} className="w-16 h-12 sm:w-24 sm:h-16 object-cover rounded-md flex-shrink-0" />
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                            <span className="font-semibold text-sm sm:text-base text-gray-900 truncate">{lugarTraducido.nombreEspanol}</span>
                                                            <span className="text-gray-600 text-xs sm:text-sm truncate">{lugar.direccion}</span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                eliminarLugarPrincipal(diaNum, lugar.id);
                                                            }}
                                                            className="p-2 sm:p-3 rounded-full bg-gray-100 hover:text-red-600 hover:bg-red-200 transition flex-shrink-0"
                                                        >
                                                            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Mapa */}
                            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
                                <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                                    <Map className="text-green-800" size={20} />
                                    Vista Previa del Mapa
                                </h3>
                                <div className="w-full h-[250px] sm:h-[350px] lg:h-[400px] rounded-xl overflow-hidden shadow-inner border border-gray-200">
                                    <Mapa lugaresPorDia={lugaresPorDia} />
                                </div>
                                <p>Cada número en el mapa corresponde al día que se eligió para ese lugar.</p>
                            </div>
                        </div>

                        {/* Botones Guardar y Limpiar */}
                        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                            <button
                                onClick={handleClickGuardar}
                                disabled={obteniendoSugerencia}
                                className="px-6 sm:px-8 py-3 sm:py-4 bg-emerald-200 text-emerald-700 rounded-md hover:bg-emerald-300 transition-colors font-semibold text-base sm:text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {obteniendoSugerencia ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-700"></div>
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={20} />
                                        {esEdicion ? "Guardar Cambios" : "Guardar Itinerario"}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    if (esEdicion) {
                                        // Si está editando, limpiar y volver a consultar
                                        limpiarFormulario();
                                        if (onCancelar) onCancelar();
                                    } else {
                                        // Si está creando, solo limpiar el formulario
                                        limpiarFormulario();
                                    }
                                }}
                                className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors font-semibold text-base sm:text-lg flex items-center justify-center gap-2"
                            >
                                <Trash2 size={20} />
                                {esEdicion ? "Cancelar Edición" : "Limpiar Datos"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de lugares */}
            {modalAbierto && diaSeleccionado != null && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm transition-all">
                    <div className="bg-white w-full max-w-6xl h-[90vh] sm:h-[85vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn">
                        
                        {/* Pestañas para móviles */}
                        <div className="lg:hidden flex border-b border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setActiveModalTab('buscar')}
                                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                                    activeModalTab === 'buscar'
                                        ? 'bg-white text-emerald-600 border-b-2 border-emerald-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Search size={18} />
                                Buscar Lugares
                            </button>
                            <button
                                onClick={() => setActiveModalTab('seleccionados')}
                                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                                    activeModalTab === 'seleccionados'
                                        ? 'bg-white text-emerald-600 border-b-2 border-emerald-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <List size={18} />
                                Seleccionados
                                {lugaresTemp.length > 0 && (
                                    <span className="ml-1 px-2 py-0.5 bg-emerald-600 text-white rounded-full text-xs font-bold">
                                        {lugaresTemp.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Contenedor principal con scroll */}
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* PANEL IZQUIERDO: BUSCADOR Y RESULTADOS */}

                            <div className={`w-full lg:w-3/5 flex flex-col border-r border-gray-100 overflow-hidden ${
                                activeModalTab === 'buscar' ? 'block' : 'hidden lg:flex'
                            }`}>{/* Header del Buscador (Sticky) */}
                            <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100 bg-white z-10 flex-shrink-0">
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                                    <Search className="text-emerald-600" size={20} />
                                    Explorar Lugares
                                </h2>
                                {/* Texto informativo */}
                                <div className="mt-3 mb-3 text-center">
                                    <div className="group relative inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50/80 rounded-lg cursor-help">
                                        <AlertCircle className="w-3 h-3 text-emerald-500" />
                                        <span className="text-xs text-emerald-600 font-medium">
                                            Reglas de selección
                                        </span>

                                        {/* Tooltip que abre hacia abajo */}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-70 text-left z-50">
                                            <ol className="space-y-1">
                                                <li>• Cada lugar solo se puede seleccionar una vez, independientemente del día.</li>
                                                <li>• Máximo 10 lugares por día.</li>
                                            </ol>
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-800"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4">
                                    <div className="md:col-span-1">
                                        <select
                                            value={estadoSeleccionado}
                                            onChange={(e) => setEstadoSeleccionado(e.target.value)}
                                            className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-gray-700 cursor-pointer"
                                        >
                                            <option value="CDMX">Ciudad de México</option>
                                            <option value="Edomex">Estado de México</option>
                                            <option value="Hidalgo">Hidalgo</option>
                                            <option value="Querétaro">Querétaro</option>
                                            <option value="Morelos">Morelos</option>
                                            <option value="Puebla">Puebla</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 relative">
                                        <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="¿Qué lugar buscas?"
                                            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {categorias.map((categoria) => (
                                        <button
                                            key={categoria}
                                            onClick={() => setCategoriaSeleccionada(categoria)}
                                            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${categoriaSeleccionada === categoria
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
                                                }`}
                                        >
                                            {categoria}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Lista de Resultados (Scrollable) */}
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-gray-50/50">
                                {cargandoLugares && (
                                    <div className="flex flex-col items-center justify-center h-40">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-3"></div>
                                        <p className="text-gray-500 text-sm animate-pulse">Buscando lugares increíbles...</p>
                                    </div>
                                )}

                                {errorLugares && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <p className="text-sm font-medium">{errorLugares}</p>
                                    </div>
                                )}

                                {!cargandoLugares && !errorLugares && lugaresDisponibles.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-60 text-gray-400">
                                        <Map className="w-16 h-16 mb-4 opacity-20" />
                                        <p className="text-lg font-medium">No encontramos resultados</p>
                                        <p className="text-sm">Intenta con otra búsqueda o categoría</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-2 sm:gap-3 lg:gap-4">
                                    {!cargandoLugares && !errorLugares && lugaresDisponibles.map((lugar) => {
                                        const lugarTraducido = traductorFrontend.traducirLugar(lugar);
                                        const isAgregado = lugarYaAgregado(lugar.id);
                                        const isLleno = (lugaresTemp || []).length >= 10;
                                        const estadoDelDia = (lugaresTemp || []).length > 0 ? lugaresTemp[0].estado : null;
                                        const esCompatible = !estadoDelDia || lugar.estado === estadoDelDia;

                                        return (
                                            <div
                                                key={lugar.id}
                                                className={`group flex bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all duration-200 ${isAgregado
                                                    ? 'border-emerald-200 bg-emerald-50/30'
                                                    : !esCompatible
                                                        ? 'border-gray-100 bg-gray-50 opacity-60 grayscale'
                                                        : lugarYaEstaEnUso(lugar.id)
                                                            ? 'border-orange-200 bg-orange-50/50'
                                                            : 'border-gray-100 hover:border-emerald-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="relative w-20 h-16 sm:w-24 sm:h-20 lg:w-28 lg:h-24 shrink-0 overflow-hidden rounded-lg sm:rounded-xl">
                                                    <img
                                                        src={getPlaceImage(lugar)}
                                                        alt={lugarTraducido.nombreEspanol}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                </div>

                                                <div className="flex-1 px-2 sm:px-3 lg:px-4 flex flex-col justify-center min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="font-bold text-sm sm:text-base text-gray-800 line-clamp-1">{lugarTraducido.nombreEspanol}</h3>
                                                            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1 line-clamp-1 flex items-center gap-1">
                                                                <MapPin size={12} /> {lugar.direccion}
                                                            </p>
                                                        </div>
                                                        {lugar.puntaje > 4 && (
                                                            <span className="bg-yellow-100 text-yellow-700 text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold flex items-center gap-1 flex-shrink-0">
                                                                ★ {lugar.puntaje?.toFixed(1)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-auto flex items-center justify-between pt-1.5 sm:pt-2 gap-2">
                                                        {/* Etiqueta del estado (Si no es compatible, se pone roja) */}
                                                        <span className={`text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg flex-shrink-0 ${!esCompatible ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-emerald-600'
                                                            }`}>
                                                            {lugar.estado}
                                                        </span>

                                                        <button
                                                            onClick={() => agregarLugar(lugar)}
                                                            disabled={isAgregado || isLleno || !esCompatible || lugarYaEstaEnUso(lugar.id)}
                                                            className={`p-2 rounded-full transition-all ${isAgregado
                                                                ? 'bg-emerald-100 text-emerald-600 cursor-default'
                                                                : !esCompatible
                                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                    : isLleno
                                                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                                        : lugarYaEstaEnUso(lugar.id)
                                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                            : 'bg-gray-900 text-white hover:bg-emerald-600 hover:shadow-lg hover:scale-105 active:scale-95'
                                                                }`}
                                                            title={
                                                                isAgregado ? "Ya agregado en este día"
                                                                    : !esCompatible ? `Bloqueado: El día actual es exclusivo de ${estadoDelDia}`
                                                                        : isLleno ? "Día lleno (máx 10)"
                                                                            : lugarYaEstaEnUso(lugar.id) ? "Ya usado en otro día"
                                                                                : "Agregar al día"
                                                            }
                                                        >
                                                            {isAgregado ? <Check size={18} /> :
                                                                !esCompatible ? <X size={18} /> :
                                                                    lugarYaEstaEnUso(lugar.id) ? <X size={18} /> :
                                                                        <Plus size={18} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* -------------------------------------------------------- */}
                        {/* PANEL DERECHO: LUGARES SELECCIONADOS */}
                        {/* -------------------------------------------------------- */}
                        <div className={`w-full lg:w-2/5 flex flex-col bg-gray-50 border-l border-gray-200 overflow-hidden ${
                            activeModalTab === 'seleccionados' ? 'flex' : 'hidden lg:flex'
                        }`}>

                            {/* Header del Día */}
                            <div className="p-3 sm:p-4 lg:p-6 bg-white border-b border-gray-200 flex-shrink-0">
                                <div className="flex items-center justify-between mb-2 gap-2">
                                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">Tu selección</h2>
                                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${(lugaresTemp || []).length === 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {(lugaresTemp || []).length} / 10 lugares
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-3 text-gray-500 bg-gray-50 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-gray-100">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center font-bold text-sm sm:text-base text-emerald-600 shadow-sm border border-gray-100">
                                        D{diaSeleccionado}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs uppercase tracking-wide font-bold text-gray-400">Fecha</span>
                                        <span className="font-semibold text-sm sm:text-base text-gray-700 truncate">{diasItinerario[diaSeleccionado - 1]?.fecha}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de Seleccionados */}
                            <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
                                {(lugaresTemp || []).length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-white/50">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                            <MapPin size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-700 mb-1">¡Está vacío!</h3>
                                        <p className="text-sm text-gray-500 max-w-xs">
                                            Selecciona lugares del panel izquierdo para armar tu día perfecto.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                                        {(lugaresTemp || []).map((lugar, index) => {
                                            const lugarTraducido = traductorFrontend.traducirLugar(lugar);
                                            return (
                                                <div key={lugar.id} className="relative group bg-white p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all flex gap-2 sm:gap-3 lg:gap-4 animate-fadeIn">
                                                    <div className="absolute -left-1.5 -top-1.5 sm:-left-2 sm:-top-2 w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10">
                                                        {index + 1}
                                                    </div>

                                                    <img
                                                        src={getPlaceImage(lugar)}
                                                        alt={lugarTraducido.nombreEspanol}
                                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl object-cover flex-shrink-0"
                                                    />

                                                    <div className="flex-1 flex flex-col justify-center min-w-0">
                                                        <h3 className="font-bold text-gray-800 text-xs sm:text-sm truncate">{lugarTraducido.nombreEspanol}</h3>
                                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{lugar.direccion}</p>
                                                        <span className="text-xs text-emerald-600 font-medium">{lugar.estado}</span>
                                                    </div>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); eliminarLugar(lugar.id); }}
                                                        className="self-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer de Acciones (CON VALIDACIÓN DE LISTA VACÍA) - FIJO EN LA PARTE INFERIOR */}
                            <div className="p-3 sm:p-4 lg:p-6 bg-white border-t border-gray-200 flex-shrink-0">
                                <div className="flex gap-2 sm:gap-3 lg:gap-4">
                                    <button
                                        onClick={cerrarModal}
                                        className="flex-1 py-2.5 sm:py-3 lg:py-3.5 px-3 sm:px-4 text-sm sm:text-base rounded-lg sm:rounded-xl text-gray-600 font-semibold hover:bg-gray-100 transition-colors border border-transparent"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={guardarYCerrarModal}
                                        disabled={(lugaresTemp || []).length === 0}
                                        className={`flex-1 py-2.5 sm:py-3 lg:py-3.5 px-3 sm:px-4 text-sm sm:text-base rounded-lg sm:rounded-xl font-bold text-white shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all ${(lugaresTemp || []).length === 0
                                            ? 'bg-gray-300 shadow-none cursor-not-allowed opacity-70'
                                            : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-xl transform hover:-translate-y-0.5'
                                            }`}
                                    >
                                        <Check size={20} />
                                        Confirmar Día
                                    </button>
                                </div>
                                {(lugaresTemp || []).length === 0 && (
                                    <p className="text-xs text-center text-red-400 mt-3 font-medium animate-pulse">
                                        * Debes agregar al menos 1 lugar para guardar
                                    </p>
                                )}
                            </div>
                        </div>
                        </div>
                        
                        {/* Footer de Acciones - SIEMPRE VISIBLE EN MOBILE */}
                        <div className="lg:hidden p-3 sm:p-4 bg-white border-t border-gray-200 flex-shrink-0">
                            <div className="flex gap-2 sm:gap-3">
                                <button
                                    onClick={cerrarModal}
                                    className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 text-sm sm:text-base rounded-lg sm:rounded-xl text-gray-600 font-semibold hover:bg-gray-100 transition-colors border border-transparent"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarYCerrarModal}
                                    disabled={(lugaresTemp || []).length === 0}
                                    className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 text-sm sm:text-base rounded-lg sm:rounded-xl font-bold text-white shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all ${(lugaresTemp || []).length === 0
                                        ? 'bg-gray-300 shadow-none cursor-not-allowed opacity-70'
                                        : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-xl transform hover:-translate-y-0.5'
                                        }`}
                                >
                                    <Check size={20} />
                                    Confirmar Día
                                </button>
                            </div>
                            {(lugaresTemp || []).length === 0 && (
                                <p className="text-xs text-center text-red-400 mt-3 font-medium animate-pulse">
                                    * Debes agregar al menos 1 lugar para guardar
                                </p>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* === MODAL DE SUGERENCIA DE ITINERARIO === */}
            <ModalSugerenciaItinerario
                isOpen={showSuggestionModal}
                onClose={() => {
                    // Solo cerrar el modal, NO guardar
                    setShowSuggestionModal(false);
                }}
                onReject={handleRechazarSugerencia} // Esto SÍ guarda el original
                onAccept={handleAceptarSugerencia}
                itinerarioOriginal={suggestionData?.original}
                itinerarioSugerido={suggestionData?.sugerido}
            />
        </div>
    );
};

export default CrearItinerario;