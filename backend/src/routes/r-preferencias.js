// src/routes/r-preferencias.js
import express from "express";
import auth from "../middlewares/authMiddleware.js";
import PreferenciasController from "../controllers/c-preferencias.js";

const router = express.Router();

// ID sale del token (req.user.id)
router.get("/estado", auth, PreferenciasController.getEstadoPreferencias);

// Guardar preferencias
router.post("/", auth, PreferenciasController.savePreferencias);

export default router;
