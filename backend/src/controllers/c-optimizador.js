import optimizadorService from '../services/s-optimizador.js';

class OptimizadorController {

    async optimizarItinerario(req, res) {
        try {
            const { itinerario } = req.body;

            console.log('Request body recibido:', {
                tieneItinerario: !!itinerario,
                tipo: Array.isArray(itinerario) ? 'array' : typeof itinerario,
                longitud: Array.isArray(itinerario) ? itinerario.length : 'N/A'
            });

            if (!itinerario || !Array.isArray(itinerario)) {
                console.error('Formato inválido recibido');
                return res.status(400).json({
                    error: 'Formato de datos inválido.'
                });
            }

            // === VALIDACIÓN MÁS FLEXIBLE ===
            const valido = itinerario.every(dia => {
                if (typeof dia !== 'object' || !Array.isArray(dia.lugares)) {
                    return false;
                }
                const lugaresValidos = dia.lugares.every(lugar =>
                    lugar && typeof lugar === 'object' && lugar.id && lugar.nombre
                );
                return lugaresValidos;
            });

            if (!valido) {
                return res.status(400).json({
                    error: 'Estructura de itinerario inválida.'
                });
            }

            const resultado = optimizadorService.optimizarItinerario(itinerario);

            res.json({
                success: true,
                data: resultado
            });

        } catch (error) {
            console.error('Error en controlador optimizador:', error);
            res.status(500).json({
                success: false,
                error: 'Error al optimizar itinerario.'
            });
        }
    }

    // Endpoint de salud del servicio
    async healthCheck(req, res) {
        res.json({
            service: 'optimizador-itinerarios',
            status: 'active',
            timestamp: new Date().toISOString()
        });
    }
}

export default new OptimizadorController();