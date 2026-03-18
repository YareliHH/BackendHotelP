import db from '../config/db.js';

//////////////////////////////////////////////////////
// CREAR EVENTO
//////////////////////////////////////////////////////

const createEvento = async (connection, eventoData) => {
  const [result] = await connection.query(
    'INSERT INTO eventos SET ?',
    [eventoData]
  );
  return result.insertId;
};

//////////////////////////////////////////////////////
// INSERTAR SERVICIO AL EVENTO
//////////////////////////////////////////////////////

const insertEventoServicio = async (
  connection,
  idEvento,
  idServicio,
  cantidad_personas
) => {
  const [result] = await connection.query(
    `INSERT INTO evento_servicios 
     (id_evento, id_servicio, cantidad_personas)
     VALUES (?, ?, ?)`,
    [idEvento, idServicio, cantidad_personas]
  );

  return result.insertId;
};

//////////////////////////////////////////////////////
// INSERTAR ITEMS SELECCIONADOS
//////////////////////////////////////////////////////

const insertEventoServicioItem = async (
  connection,
  idEventoServicio,
  idItem
) => {
  await connection.query(
    `INSERT INTO evento_servicio_items
     (id_evento_servicio, id_item)
     VALUES (?, ?)`,
    [idEventoServicio, idItem]
  );
};

//////////////////////////////////////////////////////
// OBTENER EVENTOS
//////////////////////////////////////////////////////

const getEventos = async () => {
  const [eventos] = await db.promise().query(
    `SELECT e.*, s.nombre AS nombre_salon
     FROM eventos e
     LEFT JOIN salones s ON e.id_salon = s.id_salon
     ORDER BY e.fecha_evento DESC`
  );

  return eventos;
};

export default {
  createEvento,
  insertEventoServicio,
  insertEventoServicioItem,
  getEventos
};