import express from "express";
import * as mobiliarioController from "../controllers/mobiliario.controller.js";

const router = express.Router();

router.get("/", mobiliarioController.getAll);
router.put("/:id", mobiliarioController.update);

export default router;