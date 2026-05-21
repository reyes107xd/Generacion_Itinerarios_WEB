// backend/src/server.js
import 'dotenv/config';
import app from './app.js';
import http from 'http';
import { Server } from 'socket.io';
import { testConnection } from './config/cf-con-db.js';
import { setIo } from './services/s-notification.js';

const httpServer = http.createServer(app);

// --- CONFIGURACIÓN SOCKET.IO ---
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigin,
        methods: ["GET", "POST"],
        credentials: true
    }
});
// -------------------------------

// Inicializar el Servicio de Notificaciones
setIo(io);

// Lógica de Conexión de Socket.IO
io.on('connection', (socket) => {
    console.log(`Cliente Socket.IO conectado: ${socket.id}`);

    socket.on('register_turista', (id_turista) => {
        socket.join(id_turista.toString());
        console.log(`Turista ${id_turista} registrado en sala para notificaciones.`);
    });

    socket.on('disconnect', () => {
        console.log('Cliente Socket.IO desconectado');
    });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    console.log('--- Intentando conectar a la base de datos (Supabase) ---');
    
    const isConnected = await testConnection();

    if (isConnected) {
        console.log('\x1b[32mConexión a la DB exitosa. Iniciando servidor...\x1b[0m');
        
        httpServer.listen(PORT, () => {
            console.log(`Servidor corriendo en puerto ${PORT}`);
            console.log(`Permitiendo acceso CORS desde: ${allowedOrigin}`);
        });

    } else {
        console.error('\x1b[31mFALLO CRÍTICO: No se pudo conectar a la base de datos.\x1b[0m');
        process.exit(1);
    }
}

startServer();