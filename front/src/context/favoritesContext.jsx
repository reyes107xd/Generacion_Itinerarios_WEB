import React, { createContext, useContext, useState } from 'react';
const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  // Función para añadir o quitar una publicación de favoritos
  const toggleFavorite = (post) => {
    setFavorites((prevFavorites) => {
      // Comprobar si el post ya está en favoritos
      const isAlreadyFavorite = prevFavorites.some(p => p.id === post.id);

      if (isAlreadyFavorite) {
        // Si ya es favorito, lo quitamos
        return prevFavorites.filter(p => p.id !== post.id);
      } else {
        // Si no es favorito, lo añadimos
        return [...prevFavorites, post];
      }
    });
  };

  // Función para comprobar si un post es favorito (solo por ID)
  const isFavorite = (postId) => {
    return favorites.some(p => p.id === postId);
  };

  const value = {
    favorites,      // La lista de posts favoritos
    toggleFavorite, // La función para añadir/quitar
    isFavorite,     // La función para comprobar
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites debe ser usado dentro de un FavoritesProvider');
  }
  return context;
};