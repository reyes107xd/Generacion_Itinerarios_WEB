import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicUserAPI, getPublicPostsAPI } from "../../api/a-user";

import MyPublicationsView from "../../components/perfil/MyPublicationsView";
import PublicationDetailModal from "../../components/common/PublicationDetailModal";
import { useAlert } from "../../context/alertContext";
import { useAuth } from "../../context/authContext";
import { enviarSolicitudAmistadAPI } from "../../api/friends";
import { getFullName, generateAvatarUrl } from "../../utils/userHelpers";

export default function PerfilPublico() {
  const { id } = useParams();
  const [usuario, setUsuario] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localRequestSent, setLocalRequestSent] = useState(false);
  
  const { token, user: currentUser } = useAuth();
  const { showAlert } = useAlert();

  const isOwnProfile = currentUser && (currentUser.id_usuario || currentUser.id) === parseInt(id);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const [dataUser, dataPosts] = await Promise.all([
          getPublicUserAPI(id),
          getPublicPostsAPI(id)
        ]);

        if (!dataUser) {
          showAlert('error', 'Error al obtener perfil', 'El perfil solicitado no existe o fue eliminado.');
          return;
        }

        setUsuario(dataUser);
        
        if (dataUser.solicitud_enviada) {
          setLocalRequestSent(true);
        }
        
        // Formatear publicaciones
        const userFullName = getFullName(dataUser); // Usamos el helper
        const userAvatar = generateAvatarUrl(dataUser?.foto, userFullName); // Usamos el helper
        
        const postsAdaptados = dataPosts.map(p => {
          let imageUrl = 'https://via.placeholder.com/300';
          let imagesArray = [];
          
          if (p.foto) {
            if (Array.isArray(p.foto)) {
              imagesArray = p.foto.filter(img => img && img.trim() !== '');
              imageUrl = imagesArray[0] || imageUrl;
            } else if (typeof p.foto === 'string' && p.foto.trim() !== '') {
              imagesArray = [p.foto];
              imageUrl = p.foto;
            }
          }
          
          const postAuthorName = p.autor?.nombre ? 
            `${p.autor.nombre} ${p.autor.ap_p || ''} ${p.autor.ap_m || ''}`.trim() 
            : userFullName;
          
          const postAuthorAvatar = generateAvatarUrl(p.autor?.foto || dataUser?.foto, postAuthorName);
          
          return {
            id: p.id_publicacion || p.id,
            title: p.titulo || 'Sin título',
            description: p.descripcion || '',
            fecha_publicacion: p.fecha_publicacion || new Date().toISOString(),
            image: imageUrl,
            images: imagesArray,
            likes: p.likes || 0,
            comments: p.commentsCount || 0,
            isFriend: dataUser.es_amigo || false,
            author: {
              id: p.autor?.id || id,
              name: postAuthorName,
              avatar: postAuthorAvatar,
              nombre_usuario: dataUser.nombre_usuario || '',
              foto: p.autor?.foto || dataUser?.foto,
              nombre: p.autor?.nombre || dataUser.nombre,
              ap_p: p.autor?.ap_p || dataUser.ap_p
            },
            id_itinerario: p.id_itinerario,
            created_at: p.fecha_publicacion || new Date().toISOString()
          };
        });

        setPosts(postsAdaptados);

      } catch (error) {
        console.error(' Error cargando perfil público:', error);
        showAlert('error', 'Error al obtener perfil.', 'No se pudo cargar el perfil del usuario. Inténtalo de nuevo mas tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      cargar();
    }
  }, [id, showAlert]);

  const handleSendRequest = async (authorId = null) => {
    if (!token) {
      showAlert('error', 'Usuario no autenticado.', 'Debes iniciar sesión para enviar solicitudes');
      return;
    }
    
    const targetId = authorId || usuario?.id_usuario;
    
    if (!targetId) return;

    try {
      await enviarSolicitudAmistadAPI(token, targetId);
      showAlert('success', '¡Solicitud enviada con éxito!', 'Se ha notificado al usuario.');
      
      setLocalRequestSent(true);
      
      setUsuario(prev => ({
        ...prev,
        solicitud_enviada: true,
        estado_amistad: 'pendiente'
      }));
      
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      showAlert('error', 'Error al enviar solicitud.', error.message || 'No se pudo enviar la solicitud. Intentelo de nuevo más tarde.');
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const handleDeletePost = async (postId) => {
    console.log('Eliminar publicación:', postId);
    showAlert('success', 'Función no implementada', 'La eliminación de publicaciones no está disponible aún');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-48 bg-gray-200 rounded-2xl"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
        <p className="text-center text-gray-500 mt-4">Cargando perfil...</p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Usuario no encontrado</h1>
        <p className="text-gray-600 mt-2">El usuario que buscas no existe o ha sido eliminado.</p>
      </div>
    );
  }

  const userFullName = getFullName(usuario);
  const userAvatar = generateAvatarUrl(usuario?.foto, userFullName);

  // Lógica para determinar el estado del botón de solicitud
  let requestButtonText = "Enviar Solicitud";
  let requestButtonClass = "flex items-center justify-center gap-2 border border-emerald-500 text-emerald-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-emerald-50 transition-colors w-full";
  let isRequestDisabled = false;

  if (usuario.es_amigo === true) {
      requestButtonText = "Amigos";
      requestButtonClass = "flex items-center justify-center gap-2 bg-gray-400 text-white px-4 py-2.5 rounded-xl font-semibold w-full cursor-default";
      isRequestDisabled = true;
  } else if (localRequestSent || usuario.solicitud_enviada) {
      requestButtonText = "Solicitud Enviada";
      requestButtonClass = "flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold w-full cursor-default opacity-80";
      isRequestDisabled = true;
  }


  return (
    <>
      <div className="max-w-7xl mx-auto p-6">
        {/* ESTRUCTURA DE GRID IDÉNTICA A PERFIL.JSX */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Columna izquierda: INFO DEL USUARIO (ASIDE) */}
          <aside className="lg:col-span-2 h-fit lg:sticky lg:top-24 space-y-6">
            
            {/* CABECERA DE PERFIL ESTANDARIZADA */}
            <div className="bg-white rounded-3xl shadow-xl p-6 flex flex-col gap-6 items-center">
                <img
                    src={userAvatar}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full ring-4 ring-emerald-500 object-cover"
                />

                <div className="space-y-3 text-center w-full">
                    <h1 className="text-2xl font-bold text-gray-900">{userFullName}</h1>
                    <p className="text-emerald-600 text-sm font-medium bg-emerald-50 inline-block px-3 py-0.5 rounded-full truncate max-w-full">@{usuario?.nombre_usuario || 'usuario'}</p>
                    <p className="text-gray-700">{usuario?.descripcion || 'Sin descripción'}</p>

                    {/* ESTADÍSTICAS */}
                    <div className="flex justify-center gap-8 pt-4 border-t border-gray-100 mt-4">
                        <div className="text-gray-700">
                            <p className="text-xl font-bold">{posts.length}</p>
                            <p className="text-sm text-gray-500">Publicaciones</p>
                        </div>
                        <div className="text-gray-700">
                            <p className="text-xl font-bold">{usuario.num_amigos || 0}</p>
                            <p className="text-sm text-gray-500">Amigos</p>
                        </div>
                    </div>
                </div>

                {/* BOTONES DE ACCIÓN: Solo el de solicitud/amistad */}
                {!isOwnProfile && (
                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={() => handleSendRequest()}
                            className={requestButtonClass}
                            disabled={isRequestDisabled}
                        >
                            {requestButtonText}
                        </button>
                    </div>
                )}
            </div>
            
          </aside>

          {/* Columna derecha: publicaciones del usuario */}
          <main className="lg:col-span-3 h-full">
            <div className="bg-white rounded-3xl shadow-md p-6"> 
              {posts.length > 0 ? (
                <MyPublicationsView 
                  posts={posts} 
                  onPostClick={handlePostClick}
                  allowDelete={isOwnProfile}
                />
              ) : (
                <div className="text-center">
                  <p className="text-gray-500 text-lg">
                    {isOwnProfile 
                      ? "No has creado publicaciones públicas aún" 
                      : "Este usuario no tiene publicaciones públicas"}
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Modal para ver detalles de la publicación */}
      {isModalOpen && selectedPost && (
        <PublicationDetailModal
          post={selectedPost}
          onClose={handleCloseModal}
          onDelete={isOwnProfile ? handleDeletePost : null}
          onSendRequest={isOwnProfile ? null : (authorId) => handleSendRequest(authorId)}
          allowDelete={isOwnProfile}
          hideFriendButton={isOwnProfile || localRequestSent || usuario.solicitud_enviada || usuario.es_amigo}
        />
      )}
    </>
  );
}
