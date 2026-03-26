import db from '../config/db.js';
import Evento from '../models/evento.model.js';

//////////////////////////////////////////////////////
// CREAR EVENTO COMPLETO
//////////////////////////////////////////////////////

export const crearEvento = async (req, res) => {
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const { servicios, ...eventoData } = req.body;

    // 1️⃣ Crear evento
    const idEvento = await Evento.createEvento(
      connection,
      eventoData
    );

    // 2️⃣ Insertar servicios seleccionados
    for (const servicio of servicios) {

      const idEventoServicio =
        await Evento.insertEventoServicio(
          connection,
          idEvento,
          servicio.id_servicio,
          servicio.cantidad_personas
        );

      // 3️⃣ Insertar items seleccionados
      if (
        servicio.itemsSeleccionados &&
        servicio.itemsSeleccionados.length > 0
      ) {
        for (const idItem of servicio.itemsSeleccionados) {
          await Evento.insertEventoServicioItem(
            connection,
            idEventoServicio,
            idItem
          );
        }
      }
    }

    await connection.commit();

    res.json({
      message: 'Evento creado correctamente'
    });

  } catch (error) {
    await connection.rollback();

    res.status(500).json({
      detalle: 'Error al crear el evento',
      error
    });

  } finally {
    connection.release();
  }
};

//////////////////////////////////////////////////////
// OBTENER EVENTOS
//////////////////////////////////////////////////////

export const obtenerEventos = async (req, res) => {
  try {
    const eventos = await Evento.getEventos();
    res.json(eventos);
  } catch (error) {
    res.status(500).json(error);
  }
};
//////////////////////////////////////////////////////
// RESUMEN DASHBOARD
//////////////////////////////////////////////////////

export const obtenerResumen = async (req, res) => {
  try {
    const resumen = await Evento.getResumen(); // 👈 viene del model
    res.json(resumen);
  } catch (error) {
    console.error('Error en resumen:', error);
    res.status(500).json({ message: 'Error al obtener resumen' });
  }
};