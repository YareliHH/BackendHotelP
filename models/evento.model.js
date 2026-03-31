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
// ACTUALIZAR TOTALES
//////////////////////////////////////////////////////

const actualizarTotales = async (
  connection,
  idEvento,
  subtotal,
  iva,
  total,
  monto_anticipo,
  restante
) => {
  await connection.query(
    `UPDATE eventos SET 
      subtotal = ?, iva = ?, total = ?, 
      monto_anticipo = ?, restante = ?
     WHERE id_evento = ?`,
    [subtotal, iva, total, monto_anticipo, restante, idEvento]
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
     ORDER BY e.numero_contrato ASC`
  );

  return eventos;
};

//////////////////////////////////////////////////////
// RESUMEN DASHBOARD
//////////////////////////////////////////////////////

const getResumen = async () => {
  const [rows] = await db.promise().query(`
    SELECT 
      (SELECT COUNT(*) FROM eventos) AS totalEventos,
      (SELECT COUNT(*) FROM salones) AS salonesTotales
  `);

  return rows[0];
};

//////////////////////////////////////////////////////
// FINALIZAR EVENTO (MODEL)
//////////////////////////////////////////////////////

const finalizarEvento = async (idEvento) => {
  await db.promise().query(
    "UPDATE eventos SET estado = 'finalizado' WHERE id_evento = ?",
    [idEvento]
  );
};

//////////////////////////////////////////////////////
// ELIMINAR EVENTO (MODEL)
//////////////////////////////////////////////////////

const eliminarEvento = async (idEvento) => {
  await db.promise().query(
    "DELETE FROM eventos WHERE id_evento = ?",
    [idEvento]
  );
};

//////////////////////////////////////////////////////
// EXPORT
//////////////////////////////////////////////////////

export default {
  createEvento,
  insertEventoServicio,
  insertEventoServicioItem,
  actualizarTotales,  // 👈 agregado
  getEventos,
  getResumen,
  finalizarEvento,
  eliminarEvento// 👈 AGREGA ESTO
};