import express from "express";
import * as mobiliarioController from "../controllers/mobiliario.controller.js";

const router = express.Router();

// Obtener todo el mobiliario
router.get("/", mobiliarioController.getAll);

// Crear nuevo mobiliario
router.post("/", mobiliarioController.create);

// Actualizar cantidad de mobiliario
router.put("/:id", mobiliarioController.update);

// Eliminar mobiliario
router.delete("/:id", mobiliarioController.remove);

export default router;