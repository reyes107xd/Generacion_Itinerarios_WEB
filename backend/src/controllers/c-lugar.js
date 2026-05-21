import {
  obtenerLugares,
  obtenerLugaresDestacados,
  obtenerLugarPorId,
  obtenerCategorias
} from '../services/s-lugar.js';

/**
 * Obtener lugares con filtros
 */
export const obtenerLugaresController = async (req, res) => {
  try {
    const filtros = {
      estado: req.query.estado,
      categoria: req.query.categoria,
      busqueda: req.query.busqueda,
      limite: req.query.limite || 50
    };

    const lugares = await obtenerLugares(filtros);
    
    res.status(200).json({
      success: true,
      data: lugares,
      total: lugares.length
    });
  } catch (error) {
    console.error('Error al obtener lugares:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener lugares',
      details: error.message
    });
  }
};

/**
 * Obtener lugares destacados 
 */
export const obtenerLugaresDestacadosController = async (req, res) => {
  try {
    const limite = req.query.limite || 10;
    const lugares = await obtenerLugaresDestacados(parseInt(limite));
    
    res.status(200).json({
      success: true,
      data: lugares
    });
  } catch (error) {
    console.error('Error al obtener lugares destacados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener lugares destacados',
      details: error.message
    });
  }
};

/**
 * Obtener lugar por ID
 */
export const obtenerLugarPorIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const lugar = await obtenerLugarPorId(id);
    
    if (!lugar) {
      return res.status(404).json({
        success: false,
        error: 'Lugar no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: lugar
    });
  } catch (error) {
    console.error('Error al obtener lugar:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener lugar',
      details: error.message
    });
  }
};

/**
 * Obtener todas las categorías
 */
export const obtenerCategoriasController = async (req, res) => {
  try {
    const categorias = await obtenerCategorias();
    
    res.status(200).json({
      success: true,
      data: categorias
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener categorías',
      details: error.message
    });
  }
};