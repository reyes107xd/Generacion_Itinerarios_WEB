import { useState, useEffect } from 'react';
import { Trash2 } from "lucide-react";
import { useAuth } from '../../context/authContext'; 
import { useAlert } from '../../context/alertContext';
import { obtenerFavoritosAPI, toggleLikeAPI } from '../../api/a-publicacion'; 
import { enviarSolicitudAmistadAPI } from '../../api/friends'; 
import PublicationDetailModal from '../../components/common/PublicationDetailModal';

// Helper para avatar seguro
const getAvatarUrl = (foto, nombre) => {
  if (foto && foto.trim() !== '') return foto;
  const nombreSafe = nombre || 'Usuario';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreSafe)}&background=1D7743&color=fff&bold=true`;
};

const FavoritePostCard = ({ post, onRemove, onClickImage }) => {
  // Estandarización Visual
  // Aquí usamos el nombre que ya viene listo del useEffect
  const authorName = post.author.name || 'Anónimo';
  const authorAvatar = getAvatarUrl(post.author.avatar, authorName);

  return (
    <article className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-[1.02] duration-300">
      <img 
        src={post.images && post.images.length > 0 ? post.images[0] : 'https://via.placeholder.com/300?text=Sin+Imagen'} 
        alt={post.title} 
        className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition"
        onClick={() => onClickImage(post)}
      />
      
      <div className="p-5 flex flex-col flex-grow">
        <h3 
          className="font-bold text-lg text-emerald-700 mb-1 cursor-pointer hover:text-emerald-600"
          onClick={() => onClickImage(post)}
        >
          {post.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
          {post.description}
        </p>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 pt-3 border-t border-gray-100">
          <img 
            src={authorAvatar} 
            alt={authorName} 
            className="w-8 h-8 rounded-full object-cover shadow-sm border border-gray-100" 
          />
          <span>{authorName}</span>
        </div>
      </div>
      
      <button 
        onClick={() => onRemove(post.id)}
        className="flex items-center justify-center gap-2 w-full p-3 bg-gray-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors text-sm font-medium border-t border-gray-100"
      >
        <Trash2 className="w-4 h-4" />
        Quitar de Favoritos
      </button>
    </article>
  );
};

const Favoritos = () => {
  const { token } = useAuth();
  const { showAlert } = useAlert();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null); 

useEffect(() => {
  const cargarFavoritos = async () => {
    if (!token) return;
    try {
      setLoading(true);
      
      // 1. Aquí recibes los datos crudos gracias a a-guardado.js
      const datosBackend = await obtenerColeccionGuardadosAPI(token);

      // DEBUG: Esto te dirá la verdad en la consola del navegador (F12)
      console.log("Datos recibidos del API:", datosBackend);

      const adaptados = datosBackend.map(p => {
        // IMPORTANTE: Aquí es donde fallaba. 
        // Tu backend nuevo envía el objeto "autor", no "usuario" ni "turista".
        
        // Verificamos que 'autor' exista para evitar errores
        const datosAutor = p.autor || {}; 

        // Unimos nombre y apellido
        const nombreCompleto = `${datosAutor.nombre || ''} ${datosAutor.ap_p || ''}`.trim();
        const nombreFinal = nombreCompleto || datosAutor.nombre_usuario || 'Anónimo';

        return {
          id: p.id_objeto || p.id_publicacion, // Ajuste para asegurar ID
          title: p.titulo,
          description: p.descripcion,
          fecha_publicacion: p.fecha_guardado || p.fecha, // Fecha guardado suele ser más relevante aquí
          images: Array.isArray(p.foto) ? p.foto : (p.foto ? [p.foto] : []),
          
          // Mapeo correcto para la tarjeta visual
          author: {
            id: datosAutor.id,
            name: nombreFinal, 
            nombre_usuario: datosAutor.nombre_usuario, 
            ap_p: datosAutor.ap_p,
            avatar: datosAutor.foto // <--- AQUÍ estaba el fallo, asegúrate de leer .foto del objeto autor
          }
        };
      });

      setFavorites(adaptados);
    } catch (error) {
      console.error(error);
      showAlert('error', 'Error al cargar favoritos.');
    } finally {
      setLoading(false);
    }
  };
  cargarFavoritos();
}, [token]);

  const handleRemoveFavorite = async (postId) => {
    try {
      await toggleLikeAPI(token, postId, 'quitar');
      setFavorites(prev => prev.filter(p => p.id !== postId));
      showAlert('success', '¡Favorito eliminado con éxito!', 'La publicación ha sido eliminada de tus favoritos.');
    } catch (error) {
      console.error(error);
      showAlert('error', 'Error al eliminar favoritos');
    }
  };

  const handleSendRequest = async (authorId) => {
    try {
      await enviarSolicitudAmistadAPI(token, authorId);
      showAlert('success', '¡Solicitud enviada con éxito!', 'Se ha notificado al usuario.', 3000);
    } catch (error) {
      console.error(error);
      showAlert('error', 'Error al enviar solicitud', error.message || 'No se pudo enviar la solicitud.');
    }
  };

  if (loading) {
      return <div className="p-20 text-center text-gray-500 animate-pulse">Cargando tus favoritos...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Mis Publicaciones Favoritas</h1>
      
      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center bg-white rounded-3xl shadow-sm p-16 text-center max-w-2xl mx-auto">
          <h3 className="text-sm font-bold text-gray-500 mb-2">Aún no tienes favoritos</h3>
          <p className="text-gray-400 text-sm">
            Explora el feed y presiona el corazón en las publicaciones que te gusten para guardarlas aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {favorites.map((post) => (
            <FavoritePostCard 
              key={post.id} 
              post={post} 
              onRemove={handleRemoveFavorite}
              onClickImage={setSelectedPost} 
            />
          ))}
        </div>
      )}

      {selectedPost && (
        <PublicationDetailModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
          onSendRequest={handleSendRequest} 
          allowDelete={false} 
          hideFriendButton={true} // Ocultamos el botón en favoritos
        />
      )}
    </div>
  );
};

export default Favoritos;