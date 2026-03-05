import express from "express";
import * as salonController from "../controllers/salon.controller.js";

const router = express.Router();

router.get("/", salonController.getSalones);
router.post("/", salonController.createSalon);
router.put("/:id", salonController.updateSalon);
router.delete("/:id", salonController.deleteSalon);

export default router;