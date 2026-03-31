import express from 'express';
import {
  crearEvento,
  obtenerEventos,
  obtenerResumen,
  generarContrato,
  finalizarEvento,
  eliminarEvento
} from '../controllers/evento.controller.js';

const router = express.Router();

router.post('/', crearEvento);
router.get('/', obtenerEventos);
router.get('/resumen', obtenerResumen);
router.get('/contrato/:id', generarContrato);
router.put('/:id/finalizar', finalizarEvento);

// 🔴 NUEVA RUTA
router.delete('/:id', eliminarEvento);

export default router;