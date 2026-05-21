// services/s-optimizador.js

/**
 * Servicio para optimización de itinerarios turísticos
 */

class OptimizadorItinerarios {
  constructor() {
    this.RADIO_TIERRA_KM = 6371;
  }

  /**
   * Calcula distancia entre dos puntos usando fórmula Haversine
   */
  calcularDistanciaHaversine(lat1, lon1, lat2, lon2) {
    const dLat = this.gradosARadianes(lat2 - lat1);
    const dLon = this.gradosARadianes(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.gradosARadianes(lat1)) *
      Math.cos(this.gradosARadianes(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.RADIO_TIERRA_KM * c;
  }

  gradosARadianes(grados) {
    return grados * (Math.PI / 180);
  }

  /**
   * Agrupa días por estado
   */
  agruparDiasPorEstado(itinerario) {
    const agrupamiento = {};

    itinerario.forEach((dia, index) => {
      const estado = dia.estado;
      if (!agrupamiento[estado]) {
        agrupamiento[estado] = [];
      }

      agrupamiento[estado].push({
        diaIndex: index,
        diaOriginal: dia.dia,
        lugares: dia.lugares.map(lugar => ({ ...lugar }))
      });
    });

    return agrupamiento;
  }

  /**
   * Detecta estados que aparecen en 2 o más días (optimizables)
   */
  detectarEstadosOptimizables(agrupamiento) {
    const estadosOptimizables = [];
    for (const estado in agrupamiento) {
      // SOLO optimizar estados que tengan 2 o más días
      if (agrupamiento[estado].length >= 2) {
        estadosOptimizables.push(estado);
      }
    }
    return estadosOptimizables;
  }

  /**
   * Recolecta todos los lugares de un estado específico
   */
  recolectarLugaresDeEstado(agrupamiento, estado) {
    const diasEstado = agrupamiento[estado];
    let todosLugares = [];

    diasEstado.forEach(diaInfo => {
      diaInfo.lugares.forEach(lugar => {
        todosLugares.push({
          ...lugar,
          diaOriginal: diaInfo.diaOriginal
        });
      });
    });

    return todosLugares;
  }

  /**
   * Ordena lugares por proximidad usando algoritmo nearest-neighbor
   */
  ordenarPorProximidad(lugares) {
    if (lugares.length <= 1) return lugares;

    // -------- FIX CRÍTICO: usar lng --------
    const getLat = (l) => l.lat;
    const getLng = (l) => l.lng;

    // -------- Punto inicial: centroide -------
    const centroLat = lugares.reduce((a, b) => a + getLat(b), 0) / lugares.length;
    const centroLng = lugares.reduce((a, b) => a + getLng(b), 0) / lugares.length;

    // Buscar el lugar más cercano al centroide
    let inicial = null;
    let distMin = Infinity;

    for (const l of lugares) {
      const d = this.calcularDistanciaHaversine(
        centroLat,
        centroLng,
        getLat(l),
        getLng(l)
      );
      if (d < distMin) {
        distMin = d;
        inicial = l;
      }
    }

    const visitados = new Set();
    const ruta = [];

    let actual = inicial;
    visitados.add(actual.id);
    ruta.push(actual);

    while (visitados.size < lugares.length) {
      let candidato = null;
      let mejorDistancia = Infinity;

      for (const l of lugares) {
        if (visitados.has(l.id)) continue;

        const dist = this.calcularDistanciaHaversine(
          getLat(actual),
          getLng(actual),
          getLat(l),
          getLng(l)
        );

        if (dist < mejorDistancia) {
          mejorDistancia = dist;
          candidato = l;
        }
      }

      visitados.add(candidato.id);
      ruta.push(candidato);
      actual = candidato;
    }

    return ruta;
  }


  /**
   * Redistribuye lugares entre días balanceadamente
   */
  redistribuirLugares(lugaresOrdenados, numDias) {
    const totalLugares = lugaresOrdenados.length;
    const lugaresPorDia = Math.ceil(totalLugares / numDias);
    const diasRedistribuidos = [];

    for (let i = 0; i < numDias; i++) {
      const inicio = i * lugaresPorDia;
      const fin = Math.min(inicio + lugaresPorDia, totalLugares);
      diasRedistribuidos.push(lugaresOrdenados.slice(inicio, fin));
    }

    return diasRedistribuidos;
  }

  /**
   * Función principal de optimización
   */
  /**
 * Función principal de optimización
 */
  optimizarItinerario(itinerarioOriginal) {
    try {
      // Validar que no haya lugares null
      itinerarioOriginal.forEach((dia, diaIndex) => {
        if (!dia.lugares) {
          return;
        }

        dia.lugares.forEach((lugar, lugarIndex) => {
          if (!lugar) {
            console.error(`Día ${diaIndex + 1}, Lugar ${lugarIndex}: es null o undefined`);
          } else if (!lugar.id) {
            console.error(`Día ${diaIndex + 1}, Lugar ${lugarIndex}: ID faltante`, lugar);
          }
        });
      });

      // Crear copia profunda para no modificar original
      const itinerarioCopia = JSON.parse(JSON.stringify(itinerarioOriginal));
      const itinerarioOptimizado = JSON.parse(JSON.stringify(itinerarioOriginal));


      // 1. Agrupar días por estado
      const agrupamiento = this.agruparDiasPorEstado(itinerarioCopia);

      // 2. Identificar estados optimizables
      const estadosOptimizables = this.detectarEstadosOptimizables(agrupamiento);

      // 3. Para cada estado optimizable, procesar SOLO si tiene múltiples días
      for (const estado of estadosOptimizables) {
        const diasEstado = agrupamiento[estado];

        // SOLO procesar si este estado aparece en 2+ días
        if (diasEstado.length >= 2) {
          // Optimizar este estado específico
          const lugaresUnificados = this.recolectarLugaresDeEstado(agrupamiento, estado);
          const lugaresOrdenados = this.ordenarPorProximidad(lugaresUnificados);
          const diasRedistribuidos = this.redistribuirLugares(lugaresOrdenados, diasEstado.length);

          // Aplicar solo a los días de ESTE estado
          diasEstado.forEach((diaInfo, index) => {
            const diaIndex = diaInfo.diaIndex;
            itinerarioOptimizado[diaIndex].lugares = diasRedistribuidos[index];
          });
        }
        // Los estados con solo 1 día se mantienen como están
      }

      console.log('Optimización completada');

      return {
        original: itinerarioOriginal,
        sugerido: itinerarioOptimizado
      };

    } catch (error) {
      console.error('Error en optimización de itinerario:', error);
      console.error('Stack trace:', error.stack);
      throw new Error('Fallo en optimización: ' + error.message);
    }
  }
}

export default new OptimizadorItinerarios();