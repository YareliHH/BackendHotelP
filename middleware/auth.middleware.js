const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {

  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({
      error: 'Token requerido'
    });
  }

  jwt.verify(token, 'secretkey', (err, decoded) => {

    if (err) {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }

    req.user = decoded;
    next();
  });
};