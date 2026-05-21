import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import 'leaflet/dist/leaflet.css';
import traductorFrontend from '../../utils/traductor'; 
import { getPlaceImage } from '../../utils/placeImages'; // ← CAMBIA LA RUTA SI ES NECESARIO

const traducirCategoria = (categoriaIngles) => {
  const mapaTraduccion = {
    'amusement_park': 'Parque de atracciones',
    'museum': 'Museo',
    'park': 'Parque',
    'tourist_attraction': 'Atracción turística',
    'zoo': 'Zoológico'
  };

  const categoriaLower = categoriaIngles ? categoriaIngles.toLowerCase() : '';
  
  if (categoriaLower && mapaTraduccion[categoriaLower]) {
    return mapaTraduccion[categoriaLower];
  }
  
  return categoriaIngles 
    ? categoriaIngles.charAt(0).toUpperCase() + categoriaIngles.slice(1).replace(/_/g, ' ')
    : 'Sin categoría';
};

// Fix para los iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Colores para cada día
const coloresDias = [
  '#B22222', // Día 1 - Rojo oscuro
  '#6A0DAD', // Día 2 - Morado oscuro
  '#1E6091', // Día 3 - Azul oscuro
  '#2F6F4E', // Día 4 - Verde oscuro
  '#B89B00', // Día 5 - Amarillo oscuro
  '#9932CC', // Día 6 - Ciruela oscuro
  '#3A7968', // Día 7 - Verde menta oscuro
];

// Función para crear iconos personalizados
const crearIconoPersonalizado = (diaNum, color, numeroOrden = null) => {
  const texto = numeroOrden !== null ? numeroOrden : diaNum;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">
        ${texto}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

export default function Mapa({ 
  lat = 19.4326, 
  lng = -99.1332, 
  zoom = 13, 
  lugaresPorDia = {},
  mostrarNumeroOrden = false,
  containerId = 'mapa-real'
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapaListo, setMapaListo] = useState(false);

  // Función para traducir y procesar los datos del lugar
  const traducirLugarParaMapa = (lugar) => {
    if (!lugar) return lugar;
    
    const lugarTraducido = traductorFrontend.traducirLugar(lugar);
    
    // USAR getPlaceImage para obtener la imagen correcta
    const imagenLugar = getPlaceImage(lugar);
    
    return {
      ...lugar,
      nombreTraducido: lugarTraducido.nombreEspanol || lugar.nombre,
      categoriaTraducida: traducirCategoria(lugar.categoria),
      imagenProcesada: imagenLugar // ← IMAGEN PROCESADA
    };
  };

  useEffect(() => {
    // Esperar a que el DOM esté listo
    const timer = setTimeout(() => {
      const mapContainer = document.getElementById(containerId);
      
      if (mapContainer && !mapInstanceRef.current) {
        // Crear el mapa solo si el contenedor existe y no hay instancia previa
        const map = L.map(containerId).setView([lat, lng], zoom);
        mapInstanceRef.current = map;

        // Cargar capas de mapa (OpenStreetMap)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(map);

        setMapaListo(true);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      // Limpiar el mapa cuando el componente se desmonte
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, zoom]);

  // Efecto para actualizar marcadores cuando cambian los lugares
  useEffect(() => {
    if (!mapInstanceRef.current || !mapaListo) return;

    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Agregar nuevos marcadores para cada lugar
    Object.entries(lugaresPorDia).forEach(([diaNum, lugares]) => {
      const dia = parseInt(diaNum);
      const color = coloresDias[dia - 1] || coloresDias[0];

      lugares.forEach((lugar, index) => {
        if (lugar.latitud && lugar.longitud) {
          // Traducir el lugar para el mapa
          const lugarTraducido = traducirLugarParaMapa(lugar);
          const numeroOrden = mostrarNumeroOrden ? (index + 1) : dia;
          
          const marker = L.marker([lugar.latitud, lugar.longitud], {
            icon: crearIconoPersonalizado(dia, color, numeroOrden)
          }).addTo(mapInstanceRef.current);

          // Popup con nombres traducidos e IMAGEN PROCESADA
          const popupContent = `
            <div class="p-3 max-w-[360px]">
              <div class="flex gap-3">
                <img 
                  src="${lugarTraducido.imagenProcesada}" 
                  alt="${lugarTraducido.nombreTraducido}"
                  class="w-24 h-20 object-cover rounded-lg flex-shrink-0"
                />
                <div class="flex-1 min-w-0 space-y-1">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${color}"></div>
                    <strong class="text-sm text-gray-800">
                      ${mostrarNumeroOrden ? `Orden ${index + 1}` : `Día ${dia}`}
                    </strong>
                  </div>
                  <h3 class="font-bold text-base text-gray-900 leading-tight break-words">${lugarTraducido.nombreTraducido}</h3>
                  <p class="text-xs text-gray-700 leading-tight break-words line-clamp-2">${lugar.direccion || ''}</p>
                  ${lugarTraducido.categoriaTraducida ? `<p class="text-xs text-gray-500">${lugarTraducido.categoriaTraducida}</p>` : ''}
                  ${lugar.puntaje ? `
                    <div class="flex items-center gap-2 mt-1">
                      <span class="text-xs text-yellow-600 font-semibold">★ ${lugar.puntaje.toFixed(1)}</span>
                      ${lugar.votaciones ? `<span class="text-xs text-gray-500">${lugar.votaciones} votos</span>` : ''}
                    </div>
                  ` : ''}
                  ${lugar.estado ? `<p class="text-xs text-blue-600 font-medium mt-1">${lugar.estado}</p>` : ''}
                </div>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent, {
            maxWidth: 360
          });

          // Tooltip también traducido
          const tooltipContent = `
            <div class="p-3 max-w-[380px] w-max bg-white border border-gray-200 rounded-lg shadow-xl">
              <div class="flex items-start gap-3">
                <img 
                  src="${lugarTraducido.imagenProcesada}" 
                  alt="${lugarTraducido.nombreTraducido}"
                  class="w-20 h-16 object-cover rounded-md flex-shrink-0"
                />
                <div class="flex-1 min-w-0 max-w-[240px]">
                  <div class="flex items-center gap-2 mb-1">
                    <div class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${color}"></div>
                    <strong class="text-sm text-gray-800 whitespace-nowrap">
                      ${mostrarNumeroOrden ? `Orden ${index + 1}` : `Día ${dia}`}
                    </strong>
                  </div>
                  <h4 class="font-semibold text-sm text-gray-900 mb-1 truncate">${lugarTraducido.nombreTraducido}</h4>
                  <p class="text-xs text-gray-600 line-clamp-2 break-words leading-tight">${lugar.direccion || 'Ubicación no disponible'}</p>
                  ${lugar.puntaje ? `
                    <div class="flex items-center gap-1 mt-2">
                      <span class="text-xs text-yellow-600 font-medium">★ ${lugar.puntaje.toFixed(1)}</span>
                      ${lugar.votaciones ? `<span class="text-xs text-gray-500">(${lugar.votaciones} votos)</span>` : ''}
                    </div>
                  ` : ''}
                  ${lugar.estado ? `<p class="text-xs text-blue-600 font-medium">${lugar.estado}</p>` : ''}
                </div>
              </div>
            </div>
          `;

          marker.bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top',
            offset: [0, -15]
          });

          markersRef.current.push(marker);
        }
      });
    });

    // Ajustar el viewport para mostrar todos los marcadores si hay alguno
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [lugaresPorDia, mostrarNumeroOrden, mapaListo]);

  return (
    <div
      id={containerId}
      className="relative z-0"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "12px",
      }}
    ></div>
  );
}