import express from 'express';
import { 
    cBuscarUsuarios, 
    cEnviarSolicitud, 
    cObtenerPendientes, 
    cResponderSolicitud,
    cObtenerAmigos,
    cEliminarAmigo, 
    cContarAmigosUsuario,
    cCancelarSolicitud
} from '../controllers/c-amistad.js';
import auth from '../middlewares/authMiddleware.js'; 
const router = express.Router();

router.get('/usuarios/buscar', auth, cBuscarUsuarios);
router.post('/solicitar', auth, cEnviarSolicitud);
router.get('/pendientes', auth, cObtenerPendientes);
router.put('/responder', auth, cResponderSolicitud);
router.get('/amigos', auth, cObtenerAmigos);
router.delete('/eliminar/:idAmigo', auth, cEliminarAmigo);
router.get('/conteo/:id', auth, cContarAmigosUsuario);
router.delete('/cancelar/:idAmigo', auth, cCancelarSolicitud); 


export default router;