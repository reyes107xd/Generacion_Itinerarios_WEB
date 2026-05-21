// routes/r-optimizador.js

import express from 'express';
import optimizadorController from '../controllers/c-optimizador.js';

const router = express.Router();

router.post('/optimizar', optimizadorController.optimizarItinerario);
router.get('/health', optimizadorController.healthCheck);

export default router;