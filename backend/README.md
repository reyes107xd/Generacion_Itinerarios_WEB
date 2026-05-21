
```text
backend-itinerarios/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── itinerarioController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── models/
│   │   └── Itinerario.js
│   ├── routes/
│   │   └── itinerarioRoutes.js
│   ├── services/
│   │   └── itinerarioService.js
│   ├── utils/
│   │   └── helpers.js
│   ├── app.js
│   └── server.js
├── .env
├── package.json
└── README.md
```


| Carpeta / Archivo | Descripción                                                                                    |
|-------------------|------------------------------------------------------------------------------------------------|
| `src/`            | Contiene todo el código fuente del servidor.                                                   |
| `config/`         | Configuraciones globales, como la conexión a la base de datos o variables comunes.             |
| `models/`         | Define los modelos de datos (por ejemplo, con Mongoose o Sequelize).                           |
| `controllers/`    | Lógica principal que recibe y responde las peticiones HTTP.                                    |
| `routes/`         | Define los endpoints del servidor y enlaza cada ruta con su controlador.                       |
| `middlewares/`    | Funciones que se ejecutan antes o durante el manejo de peticiones (autenticación, logs, etc.). |
| `services/`       | Contiene la lógica de negocio o funciones que procesan datos antes de enviarlos a los controladores. |
| `utils/`          | Funciones auxiliares o de utilidad general (formato de fechas, validaciones, etc.).           |
| `app.js`          | Configura Express, los middlewares globales y las rutas principales.                           |
| `server.js`       | Inicia el servidor y lo pone a escuchar peticiones en un puerto específico.                    |
| `.env`            | Variables de entorno (puerto, URI de la base de datos, claves secretas, etc.).                 |




## cosas que se han instalado con npm

```bash
npm install google-auth-library
npm install jsonwebtoken
npm install dotenv
npm install --save-dev nodemon
npm install pg
npm install bcrypt
npm install @supabase/supabase-js
```

# API de Autenticación

Esta sección detalla los *endpoints* necesarios para la gestión de usuarios, incluyendo el registro, el inicio de sesión local y la autenticación con Google.

** Nota Importante sobre la Sesión (Token): **
Tras el inicio de sesión o registro exitoso, el servidor retorna un  `appToken` (JSON Web Token o JWT) .

* Propósito: Sirve para manejar la sesión del usuario.
* Expiración: Expira en 1 día.
* Uso: Debe ser guardado por el cliente y enviado en el header `Authorization: Bearer <appToken>` en todas las peticiones protegidas .

---

## 1. Inicio de Sesión Local (Login)

Inicia una sesión de usuario con credenciales locales.

| Parámetro | Valor |
| :--- | :--- |
| Endpoint  | `POST /api/auth/login` |
| Autenticación  | Pública (no requiere token previo) |

### Solicitud Front (Body)
```JSON
{
  "correo": "juan@gmail.com",
  "password": "eewewe"
}

### Back responde
codigo: 401
{
    "message": "Error en la solicitud.",
    "error": "Contraseña incorrecta."
}
```

o bien

codigo: 200
```JSON 
{
    "message": "Autenticación exitosa",
    "user": {
        "id_usuario": 6,
        "correo": "juan@gmail.com",
        "tipo_autenticacion": "local",
        "rol": "turista",
        "fecha_creacion": "2025-10-26T08:15:46.451Z",
        "nombre_perfil": "Juan",
        "ap_p": null,
        "ap_m": null,
        "fecha_nac": "1995-06-20T06:00:00.000Z",
        "genero": "M",
        "telefono": "5512345678",
        "foto": null
    },
    "appToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImNvcnJlbyI6Imp1YW5AZ21haWwuY29tIiwiaWF0IjoxNzYxNTAwNjU0LCJleHAiOjE3NjE1ODcwNTR9.5q7JsmlgnQiR43tSo9-8arXdlDKf7z6boUlGg9ziGJs"
}
```

## 2. REGISTRO
Inicia una sesión de usuario con credenciales locales.

| Parámetro | Valor |
| :--- | :--- |
| Endpoint | `POST /api/auth/registrar` |
| Autenticación  | Pública (no requiere token previo) |

### Solicitud Front (Body)
```JSON
{
  "nombre": "Paco",
  "ap_p": "Palencia",
  "ap_m": "Gomez",
  "fecha_nac": "1995-06-20",
  "correo": "paco@gmail.com",
  "password": "1234567",
  "genero": "M",
  "telefono": "5512345678"
}
```

### Back responde 
codigo: 409
```JSON
{
    "message": "Error en la solicitud.",
    "error": "El correo ya está registrado"
}
``` 
o bien 
codigo: 200
```JSON
{
    "message": "Autenticación exitosa",
    "user": {
        "id_usuario": 11,
        "correo": "pacopalencia@gmail.com",
        "nombre": "Paco",
        "ap_p": null,
        "ap_m": null,
        "fecha_nac": "1995-06-20",
        "genero": "M",
        "telefono": "5512345678",
	"foto": null
    },
    "appToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjExLCJjb3JyZW8iOiJwYWNvcGFsZW5jaWFAZ21haWwuY29tIiwiaWF0IjoxNzYxNTAwODc3LCJleHAiOjE3NjE1ODcyNzd9.vM3SQBUA9sLqhRpSuxZ8aZ-7OEVM4b8dG9QO7Mv7yE0"
} 
``` 


## 3. CON GOOGLE

| Parámetro | Valor |
| :--- | :--- |
|  Endpoint | `POST /api/auth/google-login` |
|  Autenticación | en el campo headers enviar token |

### Front me envía en el campo headers
```JSON 
headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
    }
```
### Back responde 
codigo: 200
```JSON
{
    "message": "Autenticación exitosa",
    "user": {
        "id_usuario": 8,
        "fecha_nac": null,
        "genero": null,
        "telefono": null,
        "nombre": "Esteban Ríos",
        "ap_p": null,
        "ap_m": null,
        "foto": "https://lh3.googleusercontent.com/a/ACg8ocI0VatG_zZY6xnJdW62SVOIpnKv4Kl3kNEcxdd4HSQWnTZMT_fpbQ=s96-c",
        "correo": "estebanrg00@gmail.com"
    },
    "appToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsImVtYWlsIjoiZXN0ZWJhbnJnMDBAZ21haWwuY29tIiwiaWF0IjoxNzYxNTAyNDI0LCJleHAiOjE3NjE1ODg4MjR9.174vGif3UVLcbfRKKl-T6lwzqRqI50ZMBNgslpCXwSg"
}
```
