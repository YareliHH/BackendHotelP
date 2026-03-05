const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "eventos_hotel"
});

db.connect((err) => {
  if (err) {
    console.error("Error de conexión:", err);
    return;
  }

  console.log("Conexión a MySQL exitosa");
});

module.exports = db;