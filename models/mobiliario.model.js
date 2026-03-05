import db from "../config/db.js";

const Mobiliario = {

  getAll: (callback) => {
    db.query("SELECT * FROM mobiliario", callback);
  },

  updateCantidad: (id, cantidad, callback) => {
    db.query(
      "UPDATE mobiliario SET cantidad = ? WHERE id = ?",
      [cantidad, id],
      callback
    );
  }

};

export default Mobiliario;