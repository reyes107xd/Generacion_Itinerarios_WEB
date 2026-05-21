import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Configuración para obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de almacenamiento local
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // CORRECCIÓN: Usamos '../..' para salir de 'middlewares' y de 'src' hasta la raíz
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath); 
  },

  filename: function (req, file, cb) {
    // Generamos un nombre único: timestamp + extensión original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Proporcione una imagen'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

export default upload;