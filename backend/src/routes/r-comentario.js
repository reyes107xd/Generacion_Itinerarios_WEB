import express from 'express';
import { cCrearComentario, cObtenerComentarios, cEliminarComentario } from '../controllers/c-comentario.js';
import auth from '../middlewares/authMiddleware.js'; 

const router = express.Router();

// POST /api/comentarios -> Crear un comentario
router.post('/', auth, cCrearComentario);

// GET /api/comentarios/:idPublicacion -> Leer los comentarios de un post
router.get('/:idPublicacion', auth, cObtenerComentarios);

// DELETE /api/comentarios/:id -> Borrar un comentario específico
router.delete('/:id', auth, cEliminarComentario);

export default router;