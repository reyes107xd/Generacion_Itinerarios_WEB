import express from 'express';
import { cToggleLike, cObtenerMisLikes,cObtenerFavoritos } from '../controllers/c-reaccion.js';
import auth from '../middlewares/authMiddleware.js';   

const router = express.Router();

router.post('/', auth, cToggleLike);                  
router.get('/mis-likes', auth, cObtenerMisLikes);  
router.get('/listado-completo', auth, cObtenerFavoritos);    

export default router;
