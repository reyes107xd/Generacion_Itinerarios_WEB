import express from 'express';
import { cCrearReporte, cObtenerMisReportes } from '../controllers/c-reporte.js';
import auth from '../middlewares/authMiddleware.js';   

const router = express.Router();

// POST /api/reportes
router.post('/', auth, cCrearReporte);                
router.get('/mis-reportes', auth, cObtenerMisReportes); 

export default router;
