import logoIm from '/src/img/SoloLogo.png';
const SimpleLayout = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-emerald-600 text-white px-8 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          {/* LOGO */}
          <img
            src={logoIm}
            alt="Logo Tlamatini"
            className="w-10 h-10 rounded-full object-cover"
          />
          {/* TÍTULO */}
          <h1 className="text-xl font-bold tracking-wide text-white">
            {/* Se añade color esmeralda si no hay título, aunque el fondo ya es blanco */}
            {title || "TLAMATINI"}
          </h1>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default SimpleLayout;