export const categoryImages = {
  park: '/img/lugares/categoria-parque.jpg',
  zoo: '/img/lugares/categoria-zoo.jpg',
  tourist_attraction: '/img/lugares/categoria-turista.jpg',
  museum: '/img/lugares/categoria-museo.jpg'
};

export const getPlaceImage = (place) => {
  // Función para verificar si una imagen es válida
  const esImagenValida = (imagen) => {
    if (!imagen) return false;
    if (imagen === '/api/placeholder/120/80') return false;
    if (imagen.includes('/null')) return false;
    if (imagen.includes('undefined')) return false;
    if (imagen === '') return false;
    if (imagen === 'default.jpg') return false; // ← ESTA LÍNEA ES CLAVE
    if (imagen.includes('default.jpg')) return false;
    return true;
  };

  // PRIMERO: Verificar diferentes formatos de imagen
  if (esImagenValida(place?.imagen)) {
    return place.imagen;
  }
  
  // Si tiene 'foto' pero no 'imagen', construir la ruta
  if (esImagenValida(place?.foto)) {
    return `/img/lugares/${place.foto}`;
  }
  
  if (esImagenValida(place?.image)) {
    return place.image;
  }

  // SEGUNDO: Si NO tiene imagen válida, usar la de categoría
  if (place?.categoria && categoryImages[place.categoria]) {
    return categoryImages[place.categoria];
  }
  
  // TERCERO: Imagen por defecto
  return '/img/lugares/categoria-default.jpg';
};