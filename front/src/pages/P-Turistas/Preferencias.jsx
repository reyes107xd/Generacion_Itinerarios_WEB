import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // 👈 Importamos useLocation
import { ArrowRight, Check, FerrisWheel, PawPrint, MapPin, Camera } from "lucide-react";
import { saveUserPreferences } from "../../api/a-preferencias";
import SweetAlert from '../../pages/login/SweetAlert';
import '../../Extras/SweetAlert.css';

// Imágenes
import parqueDiv from "../../img/ParqueDiv.png";
import zonaTuris from "../../img/zonaTuris.png";
import zoologico from "../../img/zoologico.png";
import museo from "../../img/museo.png";

function Preferencias() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [categoriasElegidas, setCategoriasElegidas] = useState([]);
  const isModifying = location.state?.fromProfile || false; 
  // 

  const [alertConfig, setAlertConfig] = useState({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  const showAlert = (type, title, message) => {
    setAlertConfig({
      show: true,
      type,
      title,
      message,
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, show: false }));
  };

 
  const mapaCategorias = {
    "Parques y Diversiones": 3, 
    "Zoológicos": 5,
    "Museos": 2,
    "Atracciones turísticas": 4,
  };

  // Datos de categorías (Sin cambios)
  const categorias = [
    {
      nombre: "Parques y Diversiones",
      imagen: parqueDiv, 
      icono: <FerrisWheel size={40} className="text-purple-600" />, 
      color: "bg-purple-50",
      descripcion: "Vive la adrenalina en atracciones o relájate en la naturaleza.",
      lugares: ["Six Flags México", "Bosque de Chapultepec"],
    },
    {
      nombre: "Zoológicos",
      imagen: zoologico,
      icono: <PawPrint size={40} className="text-yellow-600" />,
      color: "bg-yellow-50",
      descripcion: "Descubre la vida animal y aprende sobre conservación.",
      lugares: ["Zoológico Chapultepec", "Parque del pueblo"],
    },
    {
      nombre: "Museos",
      imagen: museo,
      icono: <MapPin size={40} className="text-blue-600" />,
      color: "bg-blue-50",
      descripcion: "Sumérgete en la historia, el arte y la ciencia.",
      lugares: ["Museo Antropología", "Frida Kahlo", "Papalote"],
    },
    {
      nombre: "Atracciones turísticas",
      imagen: zonaTuris,
      icono: <Camera size={40} className="text-orange-600" />,
      color: "bg-orange-50",
      descripcion: "Conoce los destinos turísticos más emblemáticos de México.",
      lugares: ["Teotihuacán", "Angel de la independencia", "Monumentos"],
    },
  ];

  const handleOmitir = () => {
    // Si está en modo modificación, omitir debe volver al perfil
    if (isModifying) {
        navigate("/perfil");
    } else {
        navigate("/home");
    }
  };

  const handleGuardar = async () => {
    try {
      if (categoriasElegidas.length === 0) {
        showAlert(
          "error",
          "Formulario incompleto.",
          "Selecciona al menos 1 categoría."
        );
        return;
      }
      
      // Corregido: mapeamos directamente a IDs numéricos (flatMap solo si es un array de arrays)
      const categoriasIDs = categoriasElegidas.map(
        (nombre) => mapaCategorias[nombre]
      );

      console.log("📤 Enviando IDs:", categoriasIDs);

      await saveUserPreferences(categoriasIDs);

      const successTitle = isModifying ? "Preferencias actualizadas." : "Preferencias guardadas con éxito.";
      const successMessage = isModifying ? "Regresando a tu perfil." : "Tus recomendaciones fueron actualizadas.";
      
      showAlert(
        "success",
        successTitle, 
        successMessage
      );

      // 🎯 Lógica de redirección corregida
      const redirectTo = isModifying ? "/perfil" : "/home";
      setTimeout(() => navigate(redirectTo), 4500); 
    } catch (err) {
      console.error("Error al guardar preferencias:", err);
      let mensajeError = "Error en el servidor";
      if (err.message && err.message.includes("foreign key constraint")) {
          mensajeError = "Error de configuración: Una de las categorías seleccionadas no existe en el sistema.";
      }

      showAlert(
        "error",
        "Error al guardar preferencias.", 
        mensajeError
      );
    }
  };

  const handleToggleCategoria = (nombreCategoria) => {
    if (categoriasElegidas.includes(nombreCategoria)) {
      setCategoriasElegidas(prev => prev.filter(c => c !== nombreCategoria));
    } else {
      setCategoriasElegidas(prev => [...prev, nombreCategoria]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#F8FAFC] py-12 px-4 sm:px-6 font-sans">
      {/* ... SweetAlert y resto del componente sin cambios mayores de estructura ... */}
      <SweetAlert
        show={alertConfig.show}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
        duration={3000}
      />

      {/* HEADER */}
      <div className="w-full max-w-7xl mb-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-gray-800 tracking-tight">
            {isModifying ? 'Modificar' : 'Elige tus'} preferencias
          </h2> 
          <p className="mt-2 text-gray-500 text-lg max-w-2xl">
            Selecciona las categorías para personalizar tus itinerarios.
          </p>
        </div>
        
        <button
          onClick={handleOmitir}
          className="text-gray-400 hover:text-gray-600 font-medium text-sm transition-colors flex items-center gap-1"
        >
          {isModifying ? 'Cancelar y volver' : 'Omitir por ahora'}
          <ArrowRight size={16} />
        </button>
      </div>

      {/* GRID DE TARJETAS RESPONSIVO (Sin cambios) */}
      <section className="w-full max-w-7xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6 mb-12">
        {categorias.map((cat) => {
           const isSelected = categoriasElegidas.includes(cat.nombre);

           return (
            <div
              key={cat.nombre}
              onClick={() => handleToggleCategoria(cat.nombre)}
              className={`
                relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full
                ${isSelected 
                    ? 'ring-4 ring-green-200 bg-white shadow-xl transform scale-[1.02]' 
                    : 'bg-white hover:shadow-lg hover:-translate-y-1 shadow-sm border border-gray-100'
                }
              `}
            >
              {/* Indicador de selección (Check verde) */}
              <div className={`
                absolute top-3 right-3 z-20 p-1.5 rounded-full transition-all duration-300
                ${isSelected ? 'bg-green-500 text-white shadow-md scale-100' : 'bg-gray-100 text-gray-300 scale-90'}
              `}>
                  <Check size={18} strokeWidth={3} />
              </div>

              {/* IMAGEN / ICONO SUPERIOR (Sin cambios) */}
              <div className="h-32 w-full relative flex items-center justify-center bg-gray-50 overflow-hidden">
                 {cat.imagen ? (
                    <>
                        <img 
                            src={cat.imagen} 
                            alt={cat.nombre} 
                            className="w-full h-full object-cover" 
                        />
                        {/* Overlay sutil si está seleccionado */}
                        {isSelected && <div className="absolute inset-0 bg-green-900/10" />}
                    </>
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${cat.color} bg-opacity-40`}>
                        {cat.icono}
                    </div>
                  )}
              </div>

              {/* CONTENIDO DEBAJO DEL ICONO (Sin cambios) */}
              <div className="p-4 flex flex-col flex-grow">
                <h3 className={`text-lg font-bold mb-1 ${isSelected ? 'text-green-800' : 'text-gray-900'}`}>
                    {cat.nombre}
                </h3>
                
                <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed flex-grow">
                    {cat.descripcion}
                </p>

                {/* Lista de lugares (Badge style) */}
                <div className="mt-auto pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Populares</p>
                    <div className="flex flex-wrap gap-1">
                        {cat.lugares.map((lugar, i) => (
                            <span 
                                key={i} 
                                className={`
                                    text-xs px-2 py-1 rounded-md font-medium
                                    ${isSelected ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}
                                `}
                            >
                                {lugar}
                            </span>
                        ))}
                    </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* BOTÓN GUARDAR (Sin cambios) */}
      <div className="w-full flex justify-center pb-8 sticky bottom-4 z-30 pointer-events-none">
        <button
          onClick={handleGuardar}
          disabled={categoriasElegidas.length === 0}
          className={`
            pointer-events-auto px-12 py-4 rounded-2xl text-lg font-bold shadow-lg transition-all duration-300 transform hover:scale-105
            ${categoriasElegidas.length === 0 
                ? 'bg-white text-gray-300 border border-gray-200 cursor-not-allowed' 
                : 'bg-[#86efac] hover:bg-[#4ade80] text-green-900 ring-4 ring-green-100 shadow-green-200/50' 
            }
          `}
        >
          {categoriasElegidas.length === 0 
            ? 'Selecciona una categoría' 
            : `Guardar preferencias (${categoriasElegidas.length})`
          }
        </button>
      </div>
    </div>
  );
}

export default Preferencias;