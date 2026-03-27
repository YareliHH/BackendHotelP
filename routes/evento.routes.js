import express from 'express';
import {
  crearEvento,
  obtenerEventos,
  obtenerResumen,
  generarContrato  // 👈 agregar
} from '../controllers/evento.controller.js';

const router = express.Router();

router.post('/', crearEvento);
router.get('/', obtenerEventos);
router.get('/resumen', obtenerResumen);
router.get('/contrato/:id', generarContrato);  // 👈 agregar

export default router;