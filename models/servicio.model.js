import db from '../config/db.js';

const getAll = (callback) => {
  db.query('SELECT * FROM servicios', callback);
};

const create = (data, callback) => {
  db.query('INSERT INTO servicios SET ?', data, callback);
};

const update = (id, data, callback) => {
  db.query(
    'UPDATE servicios SET ? WHERE id_servicio = ?',
    [data, id],
    callback
  );
};

const deleteServicio = (id, callback) => {
  db.query(
    'DELETE FROM servicios WHERE id_servicio = ?',
    [id],
    callback
  );
};

export default {
  getAll,
  create,
  update,
  deleteServicio
};