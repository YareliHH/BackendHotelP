import Usuario from '../models/usuario.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = (req, res) => {

  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({
      error: 'Correo y contraseña son obligatorios'
    });
  }

  Usuario.findByEmail(correo, async (err, results) => {

    if (err) {
      return res.status(500).json({ error: 'Error del servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const usuario = results[0];

    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: usuario.id_usuario, rol: usuario.rol },
      'secretkey',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  });

};