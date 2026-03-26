import express from 'express';
import {
  crearEvento,
  obtenerEventos,
  obtenerResumen } from '../controllers/evento.controller.js';

const router = express.Router();

router.post('/', crearEvento);
router.get('/', obtenerEventos);
router.get('/resumen', obtenerResumen); //NUEVA RUTA PARA EL DASHBOARD

export default router;