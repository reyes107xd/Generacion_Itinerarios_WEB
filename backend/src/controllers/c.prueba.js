import { listarRegistros } from '../services/s.prueba.js';

export const getPrueba = async (req, res) => {
  try {
    const data = await listarRegistros();
    res.json(data);
  } catch (error) {
    console.error('Error interno:', error);
    res.status(500).json({ message: 'Error al obtener registros.' });
  }
};