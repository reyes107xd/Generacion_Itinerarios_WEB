import { sToggleGuardar, sObtenerIdsGuardados, sObtenerColeccionGuardados } from '../services/s-guardado.js';

export const cToggleGuardado = async (req, res) => {
  try {
    const idTurista = req.user.id;
    
    // DEBUG: Logs internos
    console.log("--> [cToggleGuardado] Body recibido:", req.body);

    const { id_objeto, id_publicacion, accion, tipo } = req.body; 

    const idFinal = parseInt(id_objeto || id_publicacion); 
    const tipoFinal = tipo || 'publicacion';

    if (!idFinal || isNaN(idFinal)) {
      console.error("ID inválido ", { id_objeto, id_publicacion });
      return res.status(400).json({ message: 'ID inválido.' });
    }
    
    if (!accion) {
      console.error("Acción faltante.");
      return res.status(400).json({ message: 'Acción inválida.' });
    }

    console.log(`Procesando: Turista ${idTurista} -> ${accion} ${tipoFinal} ID ${idFinal}`);

    const resultado = await sToggleGuardar(idTurista, idFinal, accion, tipoFinal);
    
    res.status(200).json(resultado);

  } catch (error) {
    console.error("Error en cToggleGuardado:", error);
    if (error.message === 'Acción inválida.') {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error al procesar solicitud.' });
  }
};

export const cObtenerIdsGuardados = async (req, res) => {
  try {
    const idTurista = req.user.id;
    const ids = await sObtenerIdsGuardados(idTurista);
    res.status(200).json(ids);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener IDs.' });
  }
};

export const cObtenerColeccion = async (req, res) => {
  try {
    const idTurista = req.user.id;
    const coleccion = await sObtenerColeccionGuardados(idTurista);
    res.status(200).json(coleccion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener guardados.' });
  }
};