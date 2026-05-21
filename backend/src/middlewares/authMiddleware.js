import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ message: 'Acceso denegado.' });
    }

    const token = header.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token inválido.' });
    }

    const payload = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: payload.userId,
      correo: payload.correo,
      rol: payload.rol        // <<--- IMPORTANTE
    };

    next();
  } catch (error) {
    console.error('Error en authMiddleware:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado.' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido.' });
    }

    res.status(500).json({ message: 'Error al autenticar.' });
  }
};

export default authMiddleware;

