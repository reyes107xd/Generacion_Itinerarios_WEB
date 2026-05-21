// r-a-notificaciones.js
import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import {
  obtenerNotificacionesAdmin,  // Cambiado el nombre
  marcarNotificacionComoLeida,
  eliminarNotificacion
} from "../controllers/c-a-notificaciones.js";

const router = Router();

// Todas las rutas requieren autenticación y permisos de administrador
router.get("/", authMiddleware, adminMiddleware, obtenerNotificacionesAdmin);  // Cambiado a "/"
router.patch("/:id/marcar-leida", authMiddleware, adminMiddleware, marcarNotificacionComoLeida);
router.delete("/:id", authMiddleware, adminMiddleware, eliminarNotificacion);

export default router;