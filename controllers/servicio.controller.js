import db from '../config/db.js';
import Servicio from '../models/servicio.model.js';

export const getServicios = (req, res) => {
  Servicio.getAll((err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

export const createServicio = (req, res) => {
  Servicio.create(req.body, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Servicio creado correctamente' });
  });
};

export const updateServicio = (req, res) => {
  const id = req.params.id;

  Servicio.update(id, req.body, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Servicio actualizado correctamente' });
  });
};

export const deleteServicio = (req, res) => {
  const id = req.params.id;

  Servicio.deleteServicio(id, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Servicio eliminado correctamente' });
  });
};

/////////////////////////////////////////////////////
// 🔥 Crear Servicio Completo (con secciones/items)
/////////////////////////////////////////////////////

export const createServicioCompleto = async (req, res) => {
  const { nombre, descripcion, precio_unitario, tipo, secciones } = req.body;

  try {
    const [servicioResult] = await db.promise().query(
      `INSERT INTO servicios (nombre, descripcion, precio_unitario, tipo)
       VALUES (?, ?, ?, ?)`,
      [nombre, descripcion, precio_unitario, tipo]
    );

    const idServicio = servicioResult.insertId;

    if (secciones && secciones.length > 0) {
      for (const seccion of secciones) {

        const [seccionResult] = await db.promise().query(
          `INSERT INTO servicio_secciones
           (id_servicio, titulo, tipo_seccion, minimo_opciones, maximo_opciones)
           VALUES (?, ?, ?, ?, ?)`,
          [
            idServicio,
            seccion.titulo,
            seccion.tipo_seccion,
            seccion.minimo_opciones,
            seccion.maximo_opciones
          ]
        );

        const idSeccion = seccionResult.insertId;

        if (seccion.items && seccion.items.length > 0) {
          for (const item of seccion.items) {
            await db.promise().query(
              `INSERT INTO servicio_items (id_seccion, nombre)
               VALUES (?, ?)`,
              [idSeccion, item.nombre]
            );
          }
        }
      }
    }

    res.json({ message: 'Servicio completo creado correctamente' });

  } catch (error) {
    res.status(500).json(error);
  }
};
/////////////////////////////////////////////////////
// Obtener Estructura Completa (con secciones/items)
/////////////////////////////////////////////////////

export const getEstructura = async (req, res) => {
  try {
    const [servicios] = await db.promise().query(`SELECT * FROM servicios`);

    for (const servicio of servicios) {
      const [secciones] = await db.promise().query(
        `SELECT * FROM servicio_secciones WHERE id_servicio = ?`,
        [servicio.id_servicio]
      );

      for (const seccion of secciones) {
        const [items] = await db.promise().query(
          `SELECT * FROM servicio_items WHERE id_seccion = ?`,
          [seccion.id_seccion]
        );
        seccion.items = items;
      }

      servicio.secciones = secciones;
    }

    res.json(servicios);

  } catch (error) {
    console.error('Error en getEstructura:', error);
    res.status(500).json({ mensaje: 'Error al obtener estructura de servicios' });
  }
};