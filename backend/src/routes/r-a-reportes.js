import { Router } from "express";
import * as reporteController from "../controllers/c-a-reportes.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { adminMiddleware } from "../middlewares/adminMiddleware.js";

const router = Router();

router.get("/", authMiddleware, adminMiddleware, reporteController.listarReportes);
router.get("/:id", authMiddleware, adminMiddleware, reporteController.obtenerReporte);
router.patch("/:id/estatus", authMiddleware, adminMiddleware, reporteController.actualizarEstatus);
router.delete("/:id", authMiddleware, adminMiddleware, reporteController.eliminarReporte);

export default router;
