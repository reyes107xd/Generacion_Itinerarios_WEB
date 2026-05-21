// src/utils/traductor.js 
class TraductorFrontend {
  constructor() {
    this.diccionario = {
      // ========== LUGARES MEXICANOS FAMOSOS ==========
      'The Angel of Independence': 'Ángel de la Independencia',
      'Mexico City Metropolitan Cathedral': 'Catedral Metropolitana de la Ciudad de México',
      'Basilica of Our Lady of Guadalupe': 'Basílica de Nuestra Señora de Guadalupe',
      'Monument to the Revolution': 'Monumento a la Revolución',
      'National Museum of Anthropology': 'Museo Nacional de Antropología',
      'Chapultepec Castle': 'Castillo de Chapultepec',
      'Palace of Fine Arts': 'Palacio de Bellas Artes',
      'Frida Kahlo Museum': 'Museo Frida Kahlo',
      'Soumaya Museum': 'Museo Soumaya',
      'Templo Mayor Museum': 'Museo del Templo Mayor',
      'National Palace': 'Palacio Nacional',
      'Chapultepec Zoo': 'Zoológico de Chapultepec',
      'Auditorio Nacional': 'Auditorio Nacional',
      'Parroquia San Juan Bautista': 'Parroquia San Juan Bautista',

      // ========== LUGARES CON CARACTERES EXTRAÑOS ==========
      'Six Flags México': 'Six Flags México',
      'KidZania': 'KidZania',
      'KidZania Cuicuilco': 'KidZania Cuicuilco',
      'Rancho Mágico': 'Rancho Mágico',
      'Granja Las Américas': 'Granja Las Américas',
      'Jump-In': 'Jump-In',
      'Sky Place, Trampoline Park': 'Sky Place, Trampoline Park',
      'Moctezuma water park': 'Parque Acuático Moctezuma',
      'Asesinos Seriales La Experiencia (Oceánica)': 'Asesinos Seriales La Experiencia',
      'Aztlán Feria de Chapultepec': 'Aztlán Feria de Chapultepec',
      'Fiction World': 'Fiction World',
      'Space Jump Centenario': 'Space Jump Centenario',
      'Flip Out Lomas Verdes': 'Flip Out Lomas Verdes',
      'Sky Zone Santa Fe': 'Sky Zone Santa Fe',
      'Another World Mundo E': 'Another World Mundo E',
      'El Dorado Park Mundo E': 'El Dorado Park Mundo E',
      'Jump-In Paseo Interlomas': 'Jump-In Paseo Interlomas',
      
      // ========== MUSEOS ==========
      'National Art Museum': 'Museo Nacional de Arte',
      'Former College of San Ildefonso': 'Antiguo Colegio de San Ildefonso',
      'Papalote Museo del Niño': 'Papalote Museo del Niño',
      'Memory and Tolerance Museum': 'Museo Memoria y Tolerancia',
      'Museo Franz Mayer': 'Museo Franz Mayer',
      'Interactive Museum of Economics': 'Museo Interactivo de Economía',
      'Museo de Arte Popular': 'Museo de Arte Popular',
      'Museum of El Carmen': 'Museo del Carmen',
      'University Museum of Contemporary Art': 'Museo Universitario de Arte Contemporáneo',
      'Museo de Cera': 'Museo de Cera',
      'Museo del Juguete Antiguo México': 'Museo del Juguete Antiguo México',
      'Museo Tamayo Arte Contemporáneo': 'Museo Tamayo Arte Contemporáneo',
      'Museo de Arte Moderno': 'Museo de Arte Moderno',
      'San Carlos National Museum': 'Museo Nacional de San Carlos',
      'Museo de la Ciudad de Mexico': 'Museo de la Ciudad de México',
      'Museo del Chocolate': 'Museo del Chocolate',
      'Museo Casa Estudio Diego Rivera y Frida Kahlo': 'Museo Casa Estudio Diego Rivera y Frida Kahlo',
      'Leon Trotsky\'s House Museum': 'Museo Casa de León Trotsky',
      'Jose Luis Cuevas Museum': 'Museo José Luis Cuevas',

      // ========== PARQUES Y ÁREAS NATURALES ==========
      'Bosque de Chapultepec': 'Bosque de Chapultepec',
      'Alameda Central': 'Alameda Central',
      'Parque Tezozómoc': 'Parque Tezozómoc',
      'Parque Lincoln': 'Parque Lincoln',
      'Huayamilpas Ecological Park': 'Parque Ecológico Huayamilpas',
      'Fuentes Brotantes de Tlalpan National Park': 'Parque Nacional Fuentes Brotantes de Tlalpan',
      'Parque España': 'Parque España',
      'Alameda Del Sur': 'Alameda del Sur',
      'Cerro de la Estrella': 'Cerro de la Estrella',
      'Parque de Las Arboledas': 'Parque de Las Arboledas',
      'Parque Nacional Los Remedios': 'Parque Nacional Los Remedios',
      
      // ========== SITIOS ARQUEOLÓGICOS ==========
      'Pyramid of the Sun': 'Pirámide del Sol',
      'Templo de Quetzalcóatl': 'Templo de Quetzalcóatl',
      'Teotihuacan Mexico': 'Teotihuacán México',
      
      // ========== BALNEARIOS Y PARQUES ACUÁTICOS ==========
      'Balneario Santa Ana': 'Balneario Santa Ana',
      'Balneario Quinta Alicia': 'Balneario Quinta Alicia',
      'Balneario Ojo de Agua': 'Balneario Ojo de Agua',
      'PINGOS FunPark': 'PINGOS FunPark',
      'AQUA REAL Punta Verde': 'AQUA REAL Punta Verde',
      'AQUATIC PARK WATER EYE TEMIXCO': 'Parque Acuático Water Eye Temixco',
      'Six Flags Hurricane Harbor Oaxtepec': 'Six Flags Hurricane Harbor Oaxtepec',
      
      // ========== SITIOS EN OTROS ESTADOS ==========
      'Site Museum Xochicalco': 'Museo de Sitio Xochicalco',
      'Robert Brady Museum': 'Museo Robert Brady',
      'Museo Universitario de Arte Indígena Contemporáneo, Cuernavaca': 'Museo Universitario de Arte Indígena Contemporáneo, Cuernavaca',
      'Museo Regional de Puebla': 'Museo Regional de Puebla',
      'Museo Amparo': 'Museo Amparo',
      'Museo Internacional del Barroco': 'Museo Internacional del Barroco',
      'Africam Safari': 'Africam Safari',
      'Zona Arqueológica de Cholula': 'Zona Arqueológica de Cholula',
      'Jardines de México': 'Jardines de México',
      'Museo Nacional del Agrarismo': 'Museo Nacional del Agrarismo',
      
      // ========== TÉRMINOS GENERALES ==========
      'Museum': 'Museo',
      'Park': 'Parque',
      'Cathedral': 'Catedral',
      'Basilica': 'Basílica',
      'Monument': 'Monumento',
      'Theater': 'Teatro',
      'Auditorium': 'Auditorio',
      'Square': 'Plaza',
      'Palace': 'Palacio',
      'Castle': 'Castillo',
      'Church': 'Iglesia',
      'Sanctuary': 'Santuario',
      'Chapel': 'Capilla',
      'Zoo': 'Zoológico',
      'Garden': 'Jardín',
      'Bridge': 'Puente',
      'Tower': 'Torre',
      'Center': 'Centro',
      'Market': 'Mercado',
      'Stadium': 'Estadio',
      'Lake': 'Lago',
      'River': 'Río',
      'Mountain': 'Montaña',
      'Forest': 'Bosque',
      'Beach': 'Playa',
      'Fountain': 'Fuente',
      
      // ========== PREPOSICIONES Y ARTÍCULOS ==========
      'of the': 'del',
      'of': 'de',
      'the': 'el',
      'and': 'y',
      'in': 'en',
      'to': 'a',
      'at': 'en',
      'for': 'para',
      'with': 'con'
    };
  }

  traducirTexto(texto) {
    if (!texto || typeof texto !== 'string') {
      return texto;
    }

    // Limpiar caracteres extraños primero
    let textoLimpio = this.limpiarCaracteres(texto);
    let textoTraducido = textoLimpio;

    // 1. Buscar coincidencias exactas primero
    for (const [ingles, espanol] of Object.entries(this.diccionario)) {
      if (textoTraducido.toLowerCase() === ingles.toLowerCase()) {
        return espanol;
      }
    }

    // 2. Reemplazar términos generales (case insensitive)
    for (const [ingles, espanol] of Object.entries(this.diccionario)) {
      const regex = new RegExp(`\\b${ingles}\\b`, 'gi');
      textoTraducido = textoTraducido.replace(regex, espanol);
    }

    return textoTraducido !== textoLimpio ? textoTraducido : textoLimpio;
  }

  limpiarCaracteres(texto) {
    // Corregir caracteres mal decodificados comunes
    const correcciones = {
      'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
      'Ã±': 'ñ', 'Ã': 'Á', 'Ã‰': 'É', 'Ã': 'Í', 'Ã“': 'Ó',
      'Ãš': 'Ú', 'Ã‘': 'Ñ', 'Ã¼': 'ü', 'Ãœ': 'Ü',
      'â€': '"', 'â€œ': '"', 'â€': '-', 'â€“': '-'
    };

    let textoLimpio = texto;
    for (const [mal, bien] of Object.entries(correcciones)) {
      textoLimpio = textoLimpio.replace(new RegExp(mal, 'g'), bien);
    }

    return textoLimpio;
  }

  traducirLugar(lugar) {
    if (!lugar || !lugar.nombre) return lugar;
    
    const nombreLimpio = this.limpiarCaracteres(lugar.nombre);
    const nombreTraducido = this.traducirTexto(nombreLimpio);
    
    return {
      ...lugar,
      nombreEspanol: nombreTraducido,
      nombreOriginal: lugar.nombre
    };
  }

  traducirLugares(lugares) {
    if (!lugares || !Array.isArray(lugares)) {
      return lugares;
    }

    return lugares.map(lugar => this.traducirLugar(lugar));
  }

  // Método para agregar más traducciones dinámicamente
  agregarTraducciones(nuevasTraducciones) {
    this.diccionario = { ...this.diccionario, ...nuevasTraducciones };
    console.log(`Diccionario actualizado. Total de traducciones: ${Object.keys(this.diccionario).length}`);
  }

  obtenerEstadisticas() {
    return {
      totalTraducciones: Object.keys(this.diccionario).length,
      categorias: {
        lugaresFamosos: Object.keys(this.diccionario).filter(k => 
          k.includes('Angel') || k.includes('Cathedral') || k.includes('Basilica') || k.includes('Monument')
        ).length,
        museos: Object.keys(this.diccionario).filter(k => k.includes('Museum')).length,
        parques: Object.keys(this.diccionario).filter(k => k.includes('Park')).length
      }
    };
  }
}

// Exportar instancia única
const traductorFrontend = new TraductorFrontend();
export default traductorFrontend;