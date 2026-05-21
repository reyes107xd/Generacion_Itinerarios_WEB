/* Aqui se definen las rutas y si respectivo controlador para cada endpoint relacionado con autenticacion.
    Endpoint = ruta que consulta el front ../api/...
*/ 
import express from 'express';

import { loginWithGoogle, loginUsuario, registrarUsuario,handleSolicitarRecuperacion,handleRestablecerContrasena,handleVerificarCorreo} from '../controllers/c-auth.js';

const router = express.Router();

router.post('/google-login', loginWithGoogle);
router.post('/login', loginUsuario);
router.post('/registrar', registrarUsuario);
router.post('/recuperar', handleSolicitarRecuperacion);
router.get('/verificar/:token', handleVerificarCorreo);
router.post('/restablecer/:token', handleRestablecerContrasena);

// Usamos export default en lugar de module.exports
export default router;