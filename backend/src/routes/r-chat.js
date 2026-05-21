import express from 'express';
import { cEnviarMensaje, cObtenerHistorial, cObtenerMisMensajes,cEliminarChat } from '../controllers/c-chat.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/enviar', auth, cEnviarMensaje);
router.get('/historial/:otroUsuarioId', auth, cObtenerHistorial);
router.get('/mis-mensajes', auth, cObtenerMisMensajes);
router.delete('/eliminar/:otroUsuarioId', auth, cEliminarChat);

export default router;