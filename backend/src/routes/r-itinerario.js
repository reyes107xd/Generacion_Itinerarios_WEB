// src/routes/r-itinerario.js
/*
    Aquí se definen las rutas y su respectivo controlador para cada endpoint 
    relacionado con la gestión de itinerarios.
    Endpoint = ruta que consulta el front ../api/itinerarios/...
*/ 
import express from 'express';
import {
  crearItinerarioController,
  obtenerItinerariosController,
  obtenerItinerariosDelUsuarioController,
  obtenerItinerarioPorIdController,
  eliminarItinerarioController,
  exportarItinerarioPDFController,
  actualizarItinerarioController,
  obtenerSugerenciasController,
  cContarItinerarios
} from '../controllers/c-itinerario.js';

import auth from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get('/conteo/:id', auth, cContarItinerarios);
router.get('/listar', obtenerItinerariosController);
router.get('/listar/:id', obtenerItinerarioPorIdController);
router.get('/exportar/:id', exportarItinerarioPDFController);

router.post('/crear', auth, crearItinerarioController);
router.get('/mis-itinerarios', auth, obtenerItinerariosDelUsuarioController);
router.delete('/eliminar/:id', auth, eliminarItinerarioController);
router.put('/:id', auth, actualizarItinerarioController);
router.get('/sugerencias', auth, obtenerSugerenciasController);

export default router;
