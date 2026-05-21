import { Router } from "express";
import * as turistaController from "../controllers/c-a-turistas.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";

const router = Router();

// Todas las rutas requieren autenticación y ser administrador
router.use(authMiddleware);
router.use(adminMiddleware);

// Obtener todos los turistas con filtros y paginación
router.get("/", turistaController.obtenerTuristas);

// Obtener estadísticas de turistas
router.get("/estadisticas", turistaController.obtenerEstadisticas);

// Bloquear un turista
router.post("/:id/bloquear", turistaController.bloquearTurista);

// Desbloquear un turista
router.post("/:id/desbloquear", turistaController.desbloquearTurista);

export default router;