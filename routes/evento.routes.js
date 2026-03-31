import express from 'express';
import {
  crearEvento,
  obtenerEventos,
  obtenerResumen,
  generarContrato,
  finalizarEvento,
  eliminarEvento,
  actualizarEvento
} from '../controllers/evento.controller.js';

const router = express.Router();

router.post('/', crearEvento);
router.get('/', obtenerEventos);
router.get('/resumen', obtenerResumen);
router.get('/contrato/:id', generarContrato);
router.put('/:id/finalizar', finalizarEvento);
router.put('/:id', actualizarEvento);
router.delete('/:id', eliminarEvento);

export default router;