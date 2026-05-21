/* 
    Rutas para el módulo de lugares
    Endpoint = ruta que consulta el front ../api/lugares/...
*/ 
import express from 'express';
import {
  obtenerLugaresController,
  obtenerLugaresDestacadosController,
  obtenerLugarPorIdController
} from '../controllers/c-lugar.js';

const router = express.Router();

router.get('/listar', obtenerLugaresController);
router.get('/destacados', obtenerLugaresDestacadosController);
router.get('/listar/:id', obtenerLugarPorIdController);

export default router;