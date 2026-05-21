// src/middlewares/adminMiddleware.js
export const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado.' });
  }

  if (req.user.rol !== 'administrador') {
    return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
  }

  next();
};
