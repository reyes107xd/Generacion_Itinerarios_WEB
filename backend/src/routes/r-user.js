import express from 'express';
import auth from '../middlewares/authMiddleware.js';
//import upload from '../middlewares/upload.js';

import {
  obtenerPerfil,
  actualizarUsuario,
  eliminarUsuario,
  searchUsers,
  obtenerPerfilPublico,
  cambiarContrasena
} from '../controllers/c-user.js';

const router = express.Router();

// Perfil propio
router.get('/perfil', auth, obtenerPerfil);
router.put('/actualizarUsuario', auth, actualizarUsuario); 
router.delete('/eliminarUsuario', auth, eliminarUsuario);
// Actualiza
router.put('/update/:id', auth, actualizarUsuario);

// Perfil público (NO requiere auth)
router.get('/public/:id', obtenerPerfilPublico);

// Búsqueda
router.get('/search', searchUsers);

//Cambiar Contraseña
router.put('/cambiar-contrasena', auth, cambiarContrasena);
export default router;