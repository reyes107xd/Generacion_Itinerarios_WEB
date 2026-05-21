import express from 'express';
import { getPrueba } from '../controllers/c.prueba.js';

const router = express.Router();

router.get('/', getPrueba);

export default router;
