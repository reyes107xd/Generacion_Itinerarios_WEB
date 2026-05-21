import express from 'express';
import { getNotifications, markAsRead, deleteAll } from '../controllers/c-notification.js';
import auth from '../middlewares/authMiddleware.js';   

const router = express.Router();

router.get('/', auth, getNotifications);              
router.put('/:id/read', auth, markAsRead);            
router.delete('/clear', auth, deleteAll);             

export default router;
