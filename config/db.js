const mysql = require("mysql2");

const db = mysql.createPool({  // 👈 solo cambia esta línea
  host: "localhost",
  user: "root",
  password: "",
  database: "eventos_hotel"
});

db.getConnection((err) => {
  if (err) {
    console.error("Error de conexión:", err);
    return;
  }

  console.log("Conexión a MySQL exitosa");
});

module.exports = db;