// src/components/admin/DetalleReporte.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, FileText, MapPin, AlertCircle, Heart, Flag, Eye, Trash2, Loader } from 'lucide-react';
import { useAuth } from '../../../context/authContext';
import { useAlert } from '../../../context/alertContext';
import { obtenerReportePorId, actualizarEstatusReporte, eliminarReporte } from '../../../api/a-admin-reportes';
import { eliminarPublicacionAPI } from '../../../api/a-publicacion';
import ImageLightbox from '../../../components/common/ImageLightbox';
// En la parte superior del archivo con las otras importaciones
import { eliminarComentarioAPI } from '../../../api/a-comentario';

const DetalleReporte = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showAlert } = useAlert();
    const [modalAbierto, setModalAbierto] = useState(false);
    const [accionPendiente, setAccionPendiente] = useState(null); // 'eliminar_contenido', 'rechazar', 'eliminar_reporte'

  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cargandoAccion, setCargandoAccion] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);

  useEffect(() => {
    cargarDetalleReporte();
  }, [id]);

    // Funciones para manejar el modal
  const abrirModal = (accion) => {
    setAccionPendiente(accion);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setAccionPendiente(null);
  };

  const confirmarAccion = async () => {
    cerrarModal();
    
    try {
      setCargandoAccion(true);
      
      switch (accionPendiente) {
        case 'eliminar_contenido':
          await handleEliminarContenido();
          break;
        case 'rechazar':
          await handleRechazar();
          break;
        case 'eliminar_reporte':
          await handleEliminarReporte();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error en la acción:', error);
    } finally {
      setCargandoAccion(false);
    }
  };

  const cargarDetalleReporte = async () => {
    try {
      setLoading(true);
      const respuesta = await obtenerReportePorId(id, token);
      console.log('Detalle del reporte obtenido:', respuesta);
      setReporte(respuesta.data);
    } catch (error) {
      showAlert('error', 'Error al cargar reporte', 'No se pudo cargar el detalle del reporte');
      console.error('Error al cargar detalle:', error);
    } finally {
      setLoading(false);
    }
  };

    const handleRechazar = async () => {
    // Elimina el confirm y solo deja la lógica
    try {
        await actualizarEstatusReporte(id, 'rechazado', token);
        showAlert('success', '¡Reporte rechazado con éxito!', 'El reporte ha sido marcado como rechazado.');
        navigate('/admin/reportes');
    } catch (error) {
        showAlert('error', 'Error al rechazar reporte', 'No se pudo rechazar el reporte');
        throw error; // Important: re-lanzar el error para que confirmarAccion lo capture
    }
    };

    const handleEliminarReporte = async () => {
    // Elimina el confirm y solo deja la lógica
    try {
        await eliminarReporte(id, token);
        showAlert('success', '¡Reporte eliminado con éxito!', 'El reporte ha sido eliminado.');
        navigate('/admin/reportes');
    } catch (error) {
        showAlert('error', 'Error al eliminar reporte', 'No se pudo eliminar el reporte');
        throw error;
    }
    };

    const handleEliminarContenido = async () => {
      try {
        if (reporte.tipo_reporte === 'publicacion' && reporte.publicacion_reportada) {
          await eliminarPublicacionAPI(token, reporte.publicacion_reportada.id_publicacion);
          showAlert('success', '¡Publicación eliminada con éxito!', 'La publicación reportada ha sido eliminada.');
        }
        if (reporte.tipo_reporte === 'comentario') {
          // Usar el ID del comentario del reporte
          const idComentario = reporte.id_comentario_reportado;
          if (idComentario) {
            await eliminarComentarioAPI(token, idComentario);
            showAlert('success', '¡Comentario eliminado con éxito!', 'El comentario reportado ha sido eliminado.');
          } else {
            throw new Error('No se encontró el ID del comentario');
          }
        }
        
        await actualizarEstatusReporte(id, 'resuelto', token);
        showAlert('success', '¡Reporte resuelto con éxito!', 'El contenido ha sido eliminado y el reporte marcado como resuelto.');
        
        // Recargar para actualizar estado
        await cargarDetalleReporte();
        
      } catch (error) {
        showAlert('error', 'Error al eliminar contenido', error.message || 'No se pudo eliminar el contenido');
        console.error('Error al eliminar contenido:', error);
        throw error;
      }
    };

  const openLightbox = (index) => {
    setInitialImageIndex(index);
    setLightboxOpen(true);
  };

  const formatearFecha = (fechaString) => {
    return new Date(fechaString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para procesar las imágenes del string
  const procesarImagenes = (fotoString) => {
    if (!fotoString) return [];
    
    try {
      // Si es un string con URLs separadas por comas
      if (typeof fotoString === 'string' && fotoString.includes(',')) {
        return fotoString.split(',').map(url => url.trim());
      }
      
      // Si ya es un array
      if (Array.isArray(fotoString)) {
        return fotoString;
      }
      
      // Si es un solo string
      return [fotoString];
    } catch (error) {
      console.error('Error al procesar imágenes:', error);
      return [];
    }
  };

  // Componente para mostrar la publicación real
  const PublicacionReal = ({ publicacion }) => {
    const imagenes = procesarImagenes(publicacion?.foto);
    const autor = publicacion?.turista?.usuario?.perfil_usuario?.[0];
    const profileImage = autor?.foto
      ? autor.foto
      : autor?.nombre
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(autor.nombre)}&background=1D7743&color=fff`
        : 'https://ui-avatars.com/api/?name=Usuario&background=1D7743&color=fff'; 
    
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5">
        {/* Header de la publicación */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={profileImage}
              alt={autor?.nombre_usuario}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <span className="font-semibold text-gray-900 block">
                {autor?.nombre_usuario || 'Usuario desconocido'}
              </span>
              <span className="text-xs text-gray-500">
                {formatearFecha(publicacion?.fecha_publicacion)}
              </span>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <h3 className="text-lg font-bold text-tlamati-600 mb-2">
          {publicacion?.titulo || 'Sin título'}
        </h3>
        <p className="text-gray-600 text-sm mb-4 whitespace-pre-line leading-relaxed">
          {publicacion?.descripcion || 'Sin descripción disponible'}
        </p>

        {/* Imágenes */}
        {imagenes.length > 0 && (
          <div
            className={`grid gap-2 mb-4 ${
              imagenes.length > 1 ? 'grid-cols-[2fr_1fr]' : 'grid-cols-1'
            }`}
          >
            {/* Imagen 1 */}
            <img
              src={imagenes[0]}
              alt={publicacion?.titulo}
              onClick={() => openLightbox(0)}
              className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-95 transition"
            />

            {imagenes.length > 1 && (
              <div
                className={`grid gap-2 ${
                  imagenes.length === 2 ? 'grid-rows-1' : 'grid-rows-2'
                }`}
              >
                {/* Imagen 2 */}
                <img
                  src={imagenes[1]}
                  alt={publicacion?.titulo}
                  onClick={() => openLightbox(1)}
                  className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-95 transition"
                />

                {/* Imagen 3 */}
                {imagenes.length > 2 && (
                  <img
                    src={imagenes[2]}
                    alt={publicacion?.titulo}
                    onClick={() => openLightbox(2)}
                    className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-95 transition"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer de la publicación */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">    
          <div className="text-xs text-gray-500 capitalize px-2 py-1 bg-gray-100 rounded-full">
            {publicacion?.tipo_publicacion || 'No especificado'}
          </div>
        </div>
      </div>
    );
  };

  // Componente para mostrar itinerario real
  const ItinerarioReal = ({ itinerario }) => {
    const imagenes = procesarImagenes(itinerario?.foto);
    const autor = itinerario?.turista?.usuario?.perfil_usuario?.[0];
    const profileImage = autor?.foto
      ? autor.foto
      : autor?.nombre
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(autor.nombre)}&background=1D7743&color=fff`
        : 'https://ui-avatars.com/api/?name=Usuario&background=1D7743&color=fff';

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5">
        {/* Header del itinerario */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={profileImage}
              alt={autor?.nombre_usuario}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <span className="font-semibold text-gray-900 block">
                {autor?.nombre_usuario || 'Usuario desconocido'}
              </span>
              <span className="text-xs text-gray-500">
                {formatearFecha(itinerario?.fecha_creacion)}
              </span>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <h3 className="text-lg font-bold text-tlamati-600 mb-2">
          {itinerario?.titulo || 'Sin título'}
        </h3>
        <p className="text-gray-600 text-sm mb-4 whitespace-pre-line leading-relaxed">
          {itinerario?.descripcion || 'Sin descripción disponible'}
        </p>

        {/* Imágenes */}
        {imagenes.length > 0 && (
          <div className="grid grid-cols-1 gap-2 mb-4">
            {imagenes.map((imagen, index) => (
              <img
                key={index}
                src={imagen}
                alt={`${itinerario?.titulo} - Imagen ${index + 1}`}
                onClick={() => openLightbox(index)}
                className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-95 transition"
              />
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 pt-3 border-t border-gray-100 px-2 py-1 bg-gray-100 rounded-full inline-block">
          Itinerario de viaje
        </div>
      </div>
    );
  };
  // Agrega este componente justo después del componente ItinerarioReal:

  // Componente para mostrar comentario real
  const ComentarioReal = ({ comentario }) => {
    if (!comentario) {
      return (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
          <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-lg font-medium text-gray-600">Comentario No Disponible</p>
          <p className="text-sm text-gray-400 mt-2">
            La información del comentario no se pudo cargar
          </p>
        </div>
      );
    }

    const autor = comentario?.turista?.usuario?.perfil_usuario?.[0];
    const nombreAutor = autor?.nombre_usuario || autor?.nombre || 'Usuario desconocido';
    const contenidoComentario = comentario?.contenido || 'Sin contenido disponible';
    
    const profileImage = autor?.foto
      ? autor.foto
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreAutor)}&background=1D7743&color=fff`;

    // Obtener información de la publicación relacionada
    const publicacionAsociada = comentario?.publicacion;
    const imagenesPublicacion = procesarImagenes(publicacionAsociada?.foto);

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5">
        {/* Header del comentario */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={profileImage}
              alt={nombreAutor}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <span className="font-semibold text-gray-900 block">
                {nombreAutor}
              </span>
              <span className="text-xs text-gray-500">
                {comentario?.fecha_comentario 
                  ? formatearFecha(comentario.fecha_comentario)
                  : 'Fecha no disponible'}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Comentario #{comentario?.id_comentario || 'ID no disponible'}
          </div>
        </div>

        {/* Contenido del comentario */}
        <div className="mb-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[100px]">
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
              {contenidoComentario}
            </p>
          </div>
        </div>

        {/* Información de la publicación relacionada */}
        {publicacionAsociada && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-tlamati-50 rounded-lg">
                <FileText size={16} className="text-tlamati-500" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900">
                Este comentario fue publicado en:
              </h4>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors">
              <div className="flex items-start gap-3">
                {imagenesPublicacion.length > 0 && (
                  <img
                    src={imagenesPublicacion[0]}
                    alt="Publicación"
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 mb-1">
                    {publicacionAsociada.titulo || 'Publicación sin título'}
                  </h5>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {publicacionAsociada.descripcion || 'Sin descripción'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      {publicacionAsociada.fecha_publicacion 
                        ? formatearFecha(publicacionAsociada.fecha_publicacion)
                        : 'Fecha no disponible'}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 rounded-full">
                      {publicacionAsociada.tipo_publicacion || 'General'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-600">
            <Loader className="animate-spin" size={24} />
            <span>Cargando detalles del reporte...</span>
            </div>
        </div>
    );
  }

  if (!reporte) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Reporte no encontrado</h2>
          <button
            onClick={() => navigate('/admin/reportes')}
            className="text-tlamati-600 hover:text-tlamati-700 font-medium"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }


return (
  <div className="min-h-screen bg-gray-50">
    {/* Header Mejorado */}
    <div className="bg-gradient-to-r from-tlamati-600 to-tlamati-700 text-black shadow-lg">
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/reportes')}
              className="flex items-center gap-2 text-black/90 hover:text-black transition-colors bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg"
            >
              <ArrowLeft size={20} />
              <span>Volver</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                Reporte #{reporte.id_reporte}
              </h1>
              <p className="text-black/80">Detalles completos del caso reportado</p>
            </div>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              reporte.estatus === "pendiente"
                ? "bg-amber-500 text-white"
                : reporte.estatus === "en_revision"
                ? "bg-blue-500 text-white"
                : reporte.estatus === "resuelto"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {reporte.estatus.replace('_', ' ').toUpperCase()}
          </div>
        </div>
      </div>
    </div>

    {/* Contenido principal - Layout mejorado */}
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA - INFORMACIÓN ADMINISTRATIVA */}
        <div className="xl:col-span-1 space-y-6">
          {/* Tarjeta de Información General */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-tlamati-100 rounded-lg">
                <FileText size={20} className="text-tlamati-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Información del Caso
              </h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-emerald-100 p-4 rounded-lg border border-emerald-200">
                <label className="block text-xs font-semibold text-tlamati-700 uppercase tracking-wide mb-1">
                  Tipo de Contenido
                </label>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {reporte.tipo_reporte}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Fecha del Reporte
                </label>
                <p className="text-sm text-gray-900 flex items-center gap-2">
                  <Calendar size={14} className="text-tlamati-500" />
                  {formatearFecha(reporte.fecha_reporte)}
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta del Usuario que Reportó */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User size={20} className="text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Usuario que Reportó
              </h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {reporte.turista_reporta?.usuario?.perfil_usuario?.[0]?.nombre_usuario?.charAt(0) || 'U'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {reporte.turista_reporta?.usuario?.perfil_usuario?.[0]?.nombre_usuario || "Usuario no disponible"}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {reporte.turista_reporta?.usuario?.correo || "Correo no disponible"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Motivo del Reporte */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Flag size={20} className="text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Motivo del Reporte
              </h2>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                {reporte.motivo || "No se proporcionó un motivo específico"}
              </p>
            </div>
          </div>
        </div>

        {/* COLUMNA CENTRAL - VISTA PREVIA DEL CONTENIDO */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye size={20} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Contenido Reportado
                </h2>
                <p className="text-sm text-gray-600">
                  Vista previa del {reporte.tipo_reporte} que ha sido reportado
                </p>
              </div>
            </div>

            {/* Contenido Real */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-1 bg-gray-50/50">
              {reporte.tipo_reporte === "publicacion" &&
                (reporte.publicacion_reportada ? (
                  <PublicacionReal publicacion={reporte.publicacion_reportada} />
                ) : (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
                    <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-lg font-medium text-gray-600">Contenido Eliminado</p>
                    <p className="text-sm text-gray-400 mt-2">
                      La publicación asociada ya no está disponible
                    </p>
                  </div>
                ))}

              {reporte.tipo_reporte === "itinerario" &&
                (reporte.itinerario_reportado ? (
                  <ItinerarioReal itinerario={reporte.itinerario_reportado} />
                ) : (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
                    <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-lg font-medium text-gray-600">Contenido Eliminado</p>
                    <p className="text-sm text-gray-400 mt-2">
                      El itinerario asociado ya no está disponible
                    </p>
                  </div>
                ))}
                {reporte.tipo_reporte === "comentario" &&
                  (reporte.comentario_reportado ? (
                    <ComentarioReal comentario={reporte.comentario_reportado} />
                  ) : (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
                      <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
                      <p className="text-lg font-medium text-gray-600">Contenido Eliminado</p>
                      <p className="text-sm text-gray-400 mt-2">
                        El comentario asociado ya no está disponible
                      </p>
                    </div>
                  ))}
            </div>

            {/* Acciones Administrativas - Ahora en la parte inferior derecha */}
            {reporte.estatus !== "rechazado" && reporte.estatus !== "resuelto" && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Acciones Disponibles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => abrirModal("eliminar_contenido")}
                    disabled={cargandoAccion}
                    className="px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled-amber-300 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Trash2 size={18} />
                    {cargandoAccion ? "Procesando..." : "Eliminar contenido"}
                  </button>

                  <button
                    onClick={() => abrirModal("rechazar")}
                    disabled={cargandoAccion}
                    className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-400 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    {cargandoAccion ? "Procesando..." : "Rechazar reporte"}
                  </button>

                  <button
                    onClick={() => abrirModal("eliminar_reporte")}
                    disabled={cargandoAccion}
                    className="px-4 py-3 bg-gray-100 hover:gray-200 disabled:from-gray-300 disabled:to-gray-400 text-gray-600 font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    {cargandoAccion ? "Procesando..." : "Eliminar reporte"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Lightbox y Modal se mantienen igual */}
    {lightboxOpen && (
      <ImageLightbox
        images={procesarImagenes(
          reporte.tipo_reporte === "publicacion"
            ? reporte.publicacion_reportada?.foto
            : reporte.itinerario_reportado?.foto
        )}
        initialIndex={initialImageIndex}
        onClose={() => setLightboxOpen(false)}
      />
    )}

    {/* Modal de Confirmación Mejorado */}
    {modalAbierto && (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${
              accionPendiente === "eliminar_contenido" ? "bg-amber-100" :
              accionPendiente === "rechazar" ? "bg-red-100" : "bg-gray-100"
            }`}>
              <AlertCircle size={24} className={
                accionPendiente === "eliminar_contenido" ? "text-amber-600" :
                accionPendiente === "rechazar" ? "text-red-600" : "text-gray-600"
              } />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {accionPendiente === "eliminar_contenido" ? "Eliminar Contenido" :
               accionPendiente === "rechazar" ? "Rechazar Reporte" : "Eliminar Reporte"}
            </h3>
          </div>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            {accionPendiente === "eliminar_contenido" 
              ? "Esta acción eliminará permanentemente el contenido reportado y marcará el caso como resuelto. Esta operación no se puede deshacer."
              : accionPendiente === "rechazar"
              ? "¿Estás seguro de rechazar este reporte? El contenido permanecerá activo y el caso se cerrará."
              : "¿Estás seguro de eliminar este reporte? Esta acción eliminará el registro del reporte del sistema."}
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
                accionPendiente === "eliminar_contenido"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : accionPendiente === "rechazar"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-500 hover:bg-gray-600"
              }`}
            >
              {accionPendiente === "eliminar_contenido"
                ? "Eliminar Contenido"
                : accionPendiente === "rechazar"
                ? "Rechazar Reporte"
                : "Eliminar Reporte"}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

// Los componentes PublicacionReal e ItinerarioReal se mantienen igual
};
export default DetalleReporte;