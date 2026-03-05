import db from '../config/db.js';

const Usuario = {

  findByEmail: (correo, callback) => {
    const sql = 'SELECT * FROM usuarios WHERE correo = ?';
    db.query(sql, [correo], callback);
  }

};

export default Usuario;