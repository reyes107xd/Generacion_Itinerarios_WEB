// front/tailwind.config.js

module.exports = {
  // Asegúrate de que Tailwind analice todos tus archivos de código
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Inyectando tus variables de color personalizadas para usarlas en Tailwind
        'tlama-green': '#208928',         // --lemon-green-darker (Ej. color de hover del botón)
        'tlama-soft-black': '#2d3748',    // --black-soft
        'tlama-medium-black': '#1a202c',  // --black-medium (Ej. color de fondo del botón)
        'tlama-gray-border': '#e2e8f0',   // --gray-border
        'tlama-gray-light': '#f7fafc',    // --gray-light
        
        // Colores de validación que usas en auth.css
        'danger': '#ef4444', 
        'success': '#10b981', 
        'secondary': '#a0aec0', // Suponiendo un color para el botón deshabilitado
      },
    },
  },
  plugins: [],
}