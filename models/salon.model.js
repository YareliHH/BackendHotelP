import db from '../config/db.js';

const Salon = {
  getAll: (callback) => {
    const sql = "SELECT * FROM salones";
    db.query(sql, callback);
  },

  create: (data, callback) => {
    const sql = "INSERT INTO salones (nombre, capacidad, descripcion) VALUES (?, ?, ?)";
    db.query(sql, [data.nombre, data.capacidad, data.descripcion], callback);
  },

  update: (id, data, callback) => {
    const sql = "UPDATE salones SET nombre=?, capacidad=?, descripcion=? WHERE id_salon=?";
    db.query(sql, [data.nombre, data.capacidad, data.descripcion, id], callback);
  },

  delete: (id, callback) => {
    const sql = "DELETE FROM salones WHERE id_salon=?";
    db.query(sql, [id], callback);
  }
};

export default Salon;