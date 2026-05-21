import { useState, useRef } from "react";
import { useAlert } from "../../context/alertContext.jsx";
import jsPDF from "jspdf";
import traductorFrontend from "../../utils/traductor.js";

// --- Configuración de Colores ---
const EMERALD_COLORS = {
    primary: [6, 95, 70],      // Emerald 800
    secondary: [16, 185, 129], // Emerald 500
    light: [236, 253, 245],    // Emerald 50
    text: [31, 41, 55],        // Gray 800
    textLight: [75, 85, 99],   // Gray 600
    pending: [249, 115, 22],   // Orange
    completed: [21, 128, 61]   // Green 700
};

// --- Helpers ---
const traducirCategoria = (categoriaIngles) => {
  if (!categoriaIngles) return 'Sin categoría';

  const mapaTraduccion = {
    'museum': 'Museo',
    'park': 'Parque',
    'tourist_attraction': 'Atracción Turística',
    'zoo': 'Zoológico',
    'point_of_interest': 'Punto de Interés',
    'establishment': 'Establecimiento',
    'church': 'Iglesia',
    'place_of_worship': 'Lugar de Culto',
    'restaurant': 'Restaurante',
    'food': 'Comida',
    // Agrega más según necesites
  };

  const key = categoriaIngles.toLowerCase().trim();
  if (mapaTraduccion[key]) return mapaTraduccion[key];
  return categoriaIngles.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatearFecha = (fechaString) => {
  if (!fechaString) return '';
  try {
    const fecha = fechaString.includes('T') ? new Date(fechaString) : new Date(`${fechaString}T00:00:00`);
    return fecha.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) { return fechaString; }
};

const calcularFechaDia = (fechaInicioStr, numeroDia) => {
    if (!fechaInicioStr) return '';
    try {
        const fecha = fechaInicioStr.includes('T') ? new Date(fechaInicioStr) : new Date(`${fechaInicioStr}T00:00:00`);
        fecha.setDate(fecha.getDate() + (numeroDia - 1));
        const fechaTexto = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        return fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
    } catch (e) { return ''; }
};

const cargarImagen = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  });
};

const obtenerUrlImagen = (lugarItem) => {
  const fotoLugar = lugarItem.lugar?.foto || lugarItem.foto;
  if (fotoLugar && fotoLugar !== "default.jpg") {
    return `/img/lugares/${fotoLugar}`;
  }
  return "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80";
};

const obtenerNombreUbicacion = (lugares) => {
  if (!lugares || !Array.isArray(lugares) || lugares.length === 0) return '';
  const primerLugar = lugares[0].lugar || lugares[0]; 
  if (!primerLugar || !primerLugar.ubicacion) return '';
  const partes = primerLugar.ubicacion.split(',').map(p => p.trim());
  for (let i = partes.length - 1; i >= 0; i--) {
      if (partes[i].length > 2 && !partes[i].match(/^\d+$/)) return partes[i];
  }
  return partes[0] || '';
};

export default function ExportarItinerario({ itinerario, onClose }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef(null);
  const { showAlert } = useAlert();

  const procesarLugares = (lugares) => {
    if (!lugares || !Array.isArray(lugares)) return [];
    return [...lugares]
      .sort((a, b) => (a.orden_visita || 0) - (b.orden_visita || 0))
      .map(lugarData => {
        const datosReales = lugarData.lugar || lugarData;
        const traducido = traductorFrontend.traducirLugar(datosReales);
        return {
          ...lugarData,
          lugar: {
            ...datosReales,
            nombreEspanol: traducido.nombreEspanol || datosReales.nombre,
            nombreOriginal: traducido.nombreOriginal || datosReales.nombre
          }
        };
      });
  };

  const generarPDF = async () => {
    setIsGenerating(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const addFooter = (pageNo) => {
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text(`Página ${pageNo} | ${itinerario?.name}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      };

      // --- PORTADA ---
      pdf.setFillColor(...EMERALD_COLORS.primary);
      pdf.rect(0, 0, pageWidth, pageHeight * 0.55, 'F');
      
      try {
        const logoUrl = "/src/img/SoloLogo.png"; 
        const logo = await cargarImagen(logoUrl);
        pdf.setFillColor(255, 255, 255);
        pdf.circle(pageWidth / 2, 50, 22, 'F');
        pdf.addImage(logo, "PNG", (pageWidth / 2) - 15, 35, 30, 30);
      } catch (e) { console.warn("Logo fallback"); }

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(32);
      const tituloSplit = pdf.splitTextToSize((itinerario?.name || "Itinerario").toUpperCase(), pageWidth - 40);
      pdf.text(tituloSplit, pageWidth / 2, 90, { align: 'center' });
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(14);
      pdf.setTextColor(209, 250, 229);
      pdf.text(`${formatearFecha(itinerario?.startDate)} — ${formatearFecha(itinerario?.endDate)}`, pageWidth / 2, 115, { align: 'center' });

      // Resumen
      const summaryY = (pageHeight * 0.55) - 25;
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(220);
      pdf.roundedRect(25, summaryY, pageWidth - 50, 50, 3, 3, 'FD');
      
      pdf.setTextColor(...EMERALD_COLORS.primary);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("DURACIÓN", pageWidth / 2 - 40, summaryY + 20, { align: 'center' });
      pdf.text("LUGARES", pageWidth / 2 + 40, summaryY + 20, { align: 'center' });
      
      pdf.setFontSize(20);
      pdf.setTextColor(...EMERALD_COLORS.text);
      pdf.text(`${itinerario?.duration || 0} Días`, pageWidth / 2 - 40, summaryY + 35, { align: 'center' });
      pdf.text(`${itinerario?.totalLugares || 0}`, pageWidth / 2 + 40, summaryY + 35, { align: 'center' });

      // --- DÍAS ---
      let pageNumber = 2;
      
      if (itinerario?.dailyPlan?.length > 0) {
        const planOrdenado = [...itinerario.dailyPlan].sort((a, b) => a.day - b.day);

        for (const dia of planOrdenado) {
          pdf.addPage();
          addFooter(pageNumber++);
          
          let currentY = 20;
          const lugares = procesarLugares(dia.lugares);
          const ubicacionDia = obtenerNombreUbicacion(lugares);
          const fechaDia = calcularFechaDia(itinerario?.startDate, dia.day);

          // HEADER DEL DÍA
          pdf.setFillColor(...EMERALD_COLORS.primary);
          pdf.rect(0, 0, pageWidth, 40, 'F');
          
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(24);
          pdf.setTextColor(255, 255, 255);
          pdf.text(`DÍA ${dia.day}`, 20, 22);

          pdf.setFontSize(14);
          pdf.setTextColor(167, 243, 208);
          let subtitulo = fechaDia.toUpperCase();
          if (ubicacionDia) subtitulo += ` • ${ubicacionDia.toUpperCase()}`;
          pdf.text(subtitulo, 20, 32);
          
          pdf.setFontSize(12);
          pdf.setTextColor(255, 255, 255);
          pdf.text(`${lugares.length} Lugares`, pageWidth - 20, 22, { align: 'right' });

          currentY = 55;

          // Lugares Loop
          for (let i = 0; i < lugares.length; i++) {
             const item = lugares[i];
             const lugar = item.lugar;
             if (!lugar) continue;
             
             // --- CÁLCULO DINÁMICO DE ALTURA ---
             const imgSize = 28; 
             const cardX = 20;
             const contentX = cardX + imgSize + 8;
             const contentWidth = pageWidth - contentX - 20;

             // 1. Calcular líneas del TÍTULO
             pdf.setFont("helvetica", "bold");
             pdf.setFontSize(12);
             const nombre = pdf.splitTextToSize(lugar.nombreEspanol || lugar.nombre, contentWidth);
             const alturaTitulo = nombre.length * 5; // Aprox 5mm por línea de título

             // 2. Calcular líneas de la UBICACIÓN
             pdf.setFont("helvetica", "normal");
             pdf.setFontSize(9);
             const ubicacion = lugar.ubicacion || '';
             const ubiSplit = pdf.splitTextToSize(ubicacion, contentWidth);
             const alturaUbicacion = ubiSplit.length * 4; // Aprox 4mm por línea de ubicación

             // 3. Determinar altura de la CATEGORÍA (si existe)
             const alturaCategoria = lugar.categoria ? 10 : 0;

             // 4. Altura total necesaria para el texto (+ padding)
             const alturaTextoTotal = 8 + alturaTitulo + 2 + alturaUbicacion + alturaCategoria;
             
             // 5. La altura de la tarjeta es el máximo entre la imagen (35mm) y el texto
             const cardHeight = Math.max(35, alturaTextoTotal);

             // Verificar salto de página con la altura calculada
             if (currentY + cardHeight > pageHeight - 20) {
                pdf.addPage();
                currentY = 20;
                addFooter(pageNumber++);
                pdf.setFontSize(10);
                pdf.setTextColor(...EMERALD_COLORS.textLight);
                pdf.text(`Día ${dia.day} (${fechaDia}) - Continuación`, 20, 15);
             }

             // --- DIBUJAR TARJETA ---
             pdf.setDrawColor(230);
             pdf.setLineWidth(0.5);
             pdf.roundedRect(cardX, currentY, pageWidth - 40, cardHeight, 3, 3, 'S');

             // Imagen (Top-Left de la tarjeta)
             try {
                const imgUrl = obtenerUrlImagen(item);
                const img = await cargarImagen(imgUrl);
                pdf.addImage(img, 'JPEG', cardX + 3, currentY + 3.5, imgSize, imgSize);
             } catch (e) {
                pdf.setFillColor(240);
                pdf.rect(cardX + 3, currentY + 3.5, imgSize, imgSize, 'F');
             }

             // Círculo Número (Sobre la imagen)
             pdf.setFillColor(...EMERALD_COLORS.secondary);
             pdf.circle(cardX + 3, currentY + 3, 3, 'F');
             pdf.setTextColor(255, 255, 255);
             pdf.setFontSize(7);
             pdf.setFont("helvetica", "bold");
             pdf.text(`${i + 1}`, cardX + 3, currentY + 4, { align: 'center' });

             // --- DIBUJAR TEXTO (Usando posiciones dinámicas) ---
             let textY = currentY + 8;

             // Título
             pdf.setFont("helvetica", "bold");
             pdf.setFontSize(12);
             pdf.setTextColor(...EMERALD_COLORS.text);
             pdf.text(nombre, contentX, textY);
             textY += alturaTitulo + 1; // Avanzar cursor Y

             // Ubicación
             pdf.setFont("helvetica", "normal");
             pdf.setFontSize(9);
             pdf.setTextColor(...EMERALD_COLORS.textLight);
             pdf.text(ubiSplit, contentX, textY);
             textY += alturaUbicacion + 2; // Avanzar cursor Y
             
             // Categoría
             if (lugar.categoria) {
                 const catTraducida = traducirCategoria(lugar.categoria);
                 
                 pdf.setFillColor(...EMERALD_COLORS.light);
                 const catWidth = (pdf.getStringUnitWidth(catTraducida) * 8 / pdf.internal.scaleFactor) * 3 + 6;
                 
                 // Dibujar fondo categoría
                 pdf.rect(contentX, textY, Math.max(catWidth, 20), 6, 'F');
                 
                 pdf.setTextColor(...EMERALD_COLORS.primary);
                 pdf.setFont("helvetica", "bold"); // Bold para la categoría
                 pdf.setFontSize(8);
                 pdf.text(catTraducida, contentX + 2, textY + 4);
             }

             currentY += cardHeight + 8;
          }
        }
      }

      const safeName = (itinerario?.name || 'itinerario').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      pdf.save(`Itinerario_${safeName}.pdf`);
      showAlert("success", "¡PDF Descargado con éxito!", `Tu itinerario se ha exportado.`);
      if (onClose) onClose();

    } catch (error) {
      console.error(error);
      showAlert("error", "Error al exportar", "No se pudo generar el PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* HEADER */}
        <div className="bg-emerald-800 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar Itinerario
            </h2>
            <p className="text-emerald-200 text-xs">Vista previa del documento PDF</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition text-white">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>

        {/* PREVIEW */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8" ref={previewRef}>
          <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden min-h-[600px] border border-gray-100">
            
            {/* Portada Preview */}
            <div className="bg-emerald-800 text-white p-10 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3 relative z-10">{itinerario?.name || "Sin Título"}</h1>
              <p className="text-emerald-100 relative z-10 mb-6">{itinerario?.description || "Plan de viaje"}</p>
              
              <div className="inline-flex gap-4 bg-white/10 backdrop-blur-sm p-2 rounded-lg border border-white/20 relative z-10">
                <div className="px-4 py-1">
                    <span className="block text-xs text-emerald-200 font-bold uppercase">Fechas</span>
                    <span className="font-medium">{formatearFecha(itinerario?.startDate)} - {formatearFecha(itinerario?.endDate)}</span>
                </div>
              </div>
            </div>

            {/* Contenido Preview */}
            <div className="p-8 space-y-8">
              {itinerario?.dailyPlan?.map((dia) => {
                const lugares = procesarLugares(dia.lugares);
                const ubicacionDia = obtenerNombreUbicacion(lugares);
                const fechaDia = calcularFechaDia(itinerario?.startDate, dia.day);

                return (
                  <div key={dia.day} className="relative">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                          {dia.day}
                       </div>
                       <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 flex flex-wrap items-center gap-x-2">
                             Día {dia.day}
                             <span className="text-base text-gray-500 font-normal border-l pl-2 border-gray-300">
                                {fechaDia}
                             </span>
                          </h3>
                          {ubicacionDia && <p className="text-sm text-emerald-600 font-semibold">{ubicacionDia}</p>}
                       </div>
                    </div>

                    <div className="pl-6 border-l-2 border-gray-100 space-y-3 ml-6">
                      {lugares.length > 0 ? lugares.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                           <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0 overflow-hidden relative">
                              <img 
                                src={obtenerUrlImagen(item)} 
                                className="w-full h-full object-cover"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                              <div className="absolute bottom-0 right-0 bg-emerald-500 text-white text-[8px] px-1 rounded-tl-sm font-bold">
                                {idx + 1}
                              </div>
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-800 text-sm truncate">{item.lugar?.nombreEspanol || item.lugar?.nombre}</h4>
                              <p className="text-xs text-gray-500 truncate">{item.lugar?.ubicacion || 'Sin ubicación'}</p>
                              
                              {/* --- CATEGORÍA EN LA VISTA PREVIA --- */}
                              {item.lugar?.categoria && (
                                <p className="text-[10px] text-emerald-700 mt-1 bg-emerald-50 px-2 py-0.5 rounded-md inline-block border border-emerald-100 font-medium">
                                  {traducirCategoria(item.lugar.categoria)}
                                </p>
                              )}
                              
                           </div>
                        </div>
                      )) : (
                        <div className="p-3 text-sm text-gray-400 italic bg-gray-50 rounded-lg">
                           Sin actividades programadas.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3 shrink-0 z-10">
           <button 
              onClick={onClose}
              className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
           >
              Cancelar
           </button>
           <button 
              onClick={generarPDF}
              disabled={isGenerating}
              className={`
                 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg 
                 flex items-center gap-2 font-medium shadow-lg shadow-emerald-200
                 disabled:opacity-70 disabled:cursor-wait transition-all transform active:scale-95
              `}
           >
              {isGenerating ? 'Generando PDF...' : 'Descargar PDF'}
           </button>
        </div>
      </div>
    </div>
  );
}