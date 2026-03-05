import Salon from '../models/salon.model.js';

export const getSalones = (req, res) => {
  Salon.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

export const createSalon = (req, res) => {
  Salon.create(req.body, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Salón creado", id: results.insertId });
  });
};

export const updateSalon = (req, res) => {
  const id = req.params.id;
  Salon.update(id, req.body, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Salón actualizado" });
  });
};

export const deleteSalon = (req, res) => {
  const id = req.params.id;
  Salon.delete(id, (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Salón eliminado" });
  });
};