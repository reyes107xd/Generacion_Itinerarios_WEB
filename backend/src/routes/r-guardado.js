// src/routes/r-guardado.js
import express from 'express';
import { cToggleGuardado, cObtenerIdsGuardados, cObtenerColeccion } from '../controllers/c-guardado.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

// POST /api/guardados (Body: { id_publicacion, accion: 'guardar'/'quitar' })
router.post('/', auth, cToggleGuardado);

// GET /api/guardados/ids (Para pintar los iconos en el feed)
router.get('/ids', auth, cObtenerIdsGuardados);

// GET /api/guardados/coleccion (Para la página "Mis Guardados")
router.get('/coleccion', auth, cObtenerColeccion);

export default router;