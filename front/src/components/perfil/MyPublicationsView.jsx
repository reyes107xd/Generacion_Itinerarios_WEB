import { Heart, MessageCircle, Info, Trash2 } from 'lucide-react';

export default function MyPublicationsView({ posts, onPostClick, allowDelete = false, onDeletePost }) {


  // Función para manejar el clic en una publicación
  const handleCardClick = (post, e) => {
    // Evitar que se dispare si se hizo clic en el botón de eliminar
    if (e && e.target.closest('.delete-btn')) {
      return;
    }

    if (onPostClick) {
      onPostClick(post);
    }
  };

  const handleDeleteClick = (post, e) => {
    e.stopPropagation();
    if (onDeletePost) {
      onDeletePost(post);
    }
  };

  const hasPosts = posts && posts.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Publicaciones</h2>
        {hasPosts && (
          <span className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
            {posts.length} {posts.length === 1 ? 'publicación' : 'publicaciones'}
          </span>
        )}
      </div>

      {hasPosts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer transform hover:-translate-y-1 transition-transform relative"
              onClick={(e) => handleCardClick(post, e)}
            >
              {/* Botón de eliminar */}
              {allowDelete && (
                <button
                  className="delete-btn absolute top-3 right-3 z-10 p-2 text-gray-500 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors shadow-lg bg-white/70"
                  onClick={(e) => handleDeleteClick(post, e)}
                  title="Eliminar publicación"
                >
                  <Trash2 size={20} />
                </button>
              )}

              {/* Imagen */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                {allowDelete && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-black/20 pointer-events-none"></div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {post.description}
                </p>

                {/* Info Interacción */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-1" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span>{Array.isArray(post.comments) ? post.comments.length : (post.comments || 0)}</span>
                    </div>
                  </div>
                  <span className="text-xs">
                    {new Date(post.fecha_publicacion).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-100">
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 mb-4">
            <Info size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-center">
            No tienes publicaciones aún.
          </p>
        </div>
      )}

    </div>
  );
}