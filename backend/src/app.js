// backend/src/app.js (o donde esté tu archivo)
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// importar rutas
import authRoutes from './routes/r-auth.js';
import pruebaRoutes from './routes/r.prueba.js';
import notificationRoutes from './routes/r-notification.js';
import userRoutes from './routes/r-user.js';
import publicacionRoutes from './routes/r-publicacion.js';
import itinerarioRoutes from './routes/r-itinerario.js';
import lugaresRoutes from './routes/r-lugar.js';
import categoriasRoutes from './routes/r-categoria.js';
import reaccionRoutes from './routes/r-reaccion.js';
import guardadoRoutes from './routes/r-guardado.js';
import reporteRoutes from './routes/r-reporte.js';
import preferenciasRoutes from './routes/r-preferencias.js';
import comentarioRoutes from './routes/r-comentario.js';
import optimizadorRoutes from './routes/r-optimizador.js';
import chatRoutes from './routes/r-chat.js';
// Movi rutasAmistad aquí para orden
import rutasAmistad from './routes/r-amistad.js';

// import admin routes
import reportesAdminRoutes from './routes/r-a-reportes.js';
import turistasAdminRoutes from './routes/r-a-turistas.js';
import dashboardAdminRoutes from './routes/r-a-dash.js';
import notiAdminRoutes from './routes/r-a-notificaciones.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// --- CONFIGURACIÓN CORS CORREGIDA ---
// Permite la URL que venga de las variables de entorno O localhost si no hay variable
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({
  origin: allowedOrigin,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));
// ------------------------------------

app.use('/api/auth', authRoutes);
app.use('/api/prueba', pruebaRoutes);
app.use('/api/notificaciones', notificationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/publicaciones', publicacionRoutes);
app.use('/api/itinerarios', itinerarioRoutes);
app.use('/api/lugares', lugaresRoutes);
app.use('/api/categorias', categoriasRoutes);
// ADVERTENCIA: En Render (Free), los archivos subidos aquí se borran al redesplegar.
// Lo ideal es usar Supabase Storage.
app.use('/static/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/api/reacciones', reaccionRoutes);
app.use('/api/guardados', guardadoRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/preferencias', preferenciasRoutes);
app.use('/api/comentarios', comentarioRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/amistad', rutasAmistad); // Movido aquí desde server.js

app.use('/api/admin/reportes', reportesAdminRoutes);
app.use('/api/admin/turistas', turistasAdminRoutes);
app.use('/api/optimizador', optimizadorRoutes);
app.use('/api/admin/dashboard', dashboardAdminRoutes);
app.use('/api/admin/notificaciones', notiAdminRoutes);

export default app;