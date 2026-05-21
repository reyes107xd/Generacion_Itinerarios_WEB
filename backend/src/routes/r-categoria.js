/* 
    Rutas para el módulo de categorías
    Endpoint = ruta que consulta el front ../api/categorias/...
*/ 
import express from 'express';
import { obtenerCategoriasController } from '../controllers/c-lugar.js';

const router = express.Router();

/**
 * GET /api/categorias/listar
 * Obtiene todas las categorías disponibles
 */
router.get('/listar', obtenerCategoriasController);

export default router;