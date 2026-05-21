import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";
import { obtenerEstadisticas, obtenerMetricasTiempoReal, obtenerDatosRegistroUsuarios, obtenerDistribucionReportes } from "../controllers/c-a-dash.js";

const router = Router();

// Todas las rutas requieren autenticación y permisos de administrador
router.get("/estadisticas", authMiddleware, adminMiddleware, obtenerEstadisticas);
router.get("/metricas-tiempo-real", authMiddleware, adminMiddleware, obtenerMetricasTiempoReal);
router.get("/grafica-registro-usuarios", authMiddleware, adminMiddleware, obtenerDatosRegistroUsuarios);
router.get("/distribucion-reportes", authMiddleware, adminMiddleware, obtenerDistribucionReportes);

export default router;