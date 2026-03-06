import Mobiliario from "../models/mobiliario.model.js";

export const getAll = (req, res) => {
  Mobiliario.getAll((err, results) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json(results);
  });
};
export const create = (req, res) => {
  const { tipo, cantidad } = req.body;

  if (!tipo || cantidad === undefined) {
    return res.status(400).json({
      message: "Tipo y cantidad son requeridos"
    });
  }

  Mobiliario.create(tipo, cantidad, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({
      message: "Mobiliario creado correctamente",
      id: result.insertId
    });
  });
};
export const update = (req, res) => {
  const id = req.params.id;
  const { cantidad } = req.body;

  if (cantidad === undefined) {
    return res.status(400).json({
      message: "Cantidad requerida"
    });
  }

  Mobiliario.updateCantidad(id, cantidad, (err) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({
      message: "Cantidad actualizada correctamente"
    });
  });
};