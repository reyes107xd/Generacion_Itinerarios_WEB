import express from 'express';
import { 
  cCrearPublicacion, 
  cObtenerPublicaciones,
  cObtenerMisPublicaciones,
  cObtenerPublicacionPorId,
  cEliminarPublicacion,
  cActualizarPublicacion,
  cContarPublicacionesUsuario,
  cObtenerPublicacionesPublicasUsuario
} from '../controllers/c-publicacion.js';

import auth from '../middlewares/authMiddleware.js';   

const router = express.Router();

// Rutas públicas
router.get('/public/:idUsuario', cObtenerPublicacionesPublicasUsuario);

// Rutas que requieren autenticación
router.post('/', auth, cCrearPublicacion);
router.get('/', auth, cObtenerPublicaciones);
router.get('/mis-publicaciones', auth, cObtenerMisPublicaciones);

// Rutas dinámicas
router.get('/:id', cObtenerPublicacionPorId);
router.delete('/:id', auth, cEliminarPublicacion);
router.put('/:id', auth, cActualizarPublicacion);
router.get('/conteo/:id', auth, cContarPublicacionesUsuario);

export default router;