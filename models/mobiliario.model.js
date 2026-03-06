import db from "../config/db.js";

const Mobiliario = {

  getAll: (callback) => {
    db.query("SELECT * FROM mobiliario", callback);
  },

  create: (tipo, cantidad, callback) => {
    db.query(
      "INSERT INTO mobiliario (tipo, cantidad) VALUES (?, ?)",
      [tipo, cantidad],
      callback
    );
  },

  updateCantidad: (id, cantidad, callback) => {
    db.query(
      "UPDATE mobiliario SET cantidad = ? WHERE id = ?",
      [cantidad, id],
      callback
    );
  },

  delete: (id, callback) => {
    db.query(
      "DELETE FROM mobiliario WHERE id = ?",
      [id],
      callback
    );
  }

};

export default Mobiliario;