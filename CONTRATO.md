# Contrato del login (lo leen los 3 subagentes)

Este archivo es el acuerdo entre base de datos, backend y frontend.
Gracias a él, el backend y el frontend pueden trabajar **en paralelo** sin hablarse.

Stack: **Node.js 24, sin dependencias** (`node:sqlite`, `node:http`, `node:crypto`, `node:test`).
Todo el código vive en `app/`.

## 1. Base de datos → `app/db/` (dueño: `dev-database`)

Archivo SQLite: `app/db/login.db` (se genera, no se versiona).

```sql
usuarios(id INTEGER PK, email TEXT UNIQUE NOT NULL, nombre TEXT NOT NULL,
         password_hash TEXT NOT NULL, creado_en TEXT DEFAULT CURRENT_TIMESTAMP)
sesiones(token TEXT PK, usuario_id INTEGER NOT NULL → usuarios.id,
         expira_en TEXT NOT NULL)   -- ISO 8601, 2 horas después del login
```

Módulos que debe exportar (CommonJS):

| Archivo | Exporta |
|---|---|
| `app/db/password.js` | `hashPassword(plano) → "salt:hash"` (scrypt, hex) · `verificarPassword(plano, guardado) → boolean` (timingSafeEqual) |
| `app/db/db.js` | `abrirDb(ruta?)` · `buscarUsuarioPorEmail(db, email)` · `buscarUsuarioPorId(db, id)` · `crearSesion(db, usuarioId) → token` · `buscarSesionValida(db, token) → { usuario_id } \| undefined` · `borrarSesion(db, token)` |
| `app/db/init.js` | Script: crea tablas (si no existen) y el usuario de prueba. `npm run db:init` |

Usuario de prueba (solo para desarrollo): `demo@upb.edu` / `Demo123!` / nombre `Usuario Demo`.

## 2. Backend → `app/backend/` (dueño: `dev-backend`)

`app/backend/server.js` exporta `crearServidor(db)` y, si se ejecuta directo, escucha en `PORT` (3000).
También sirve los archivos estáticos de `app/frontend/`.

| Método | Ruta | Body / Header | Respuestas |
|---|---|---|---|
| POST | `/api/login` | `{ "email", "password" }` | `200 { token, usuario: { id, nombre, email } }` · `400 { error }` faltan campos · `401 { error: "Credenciales inválidas" }` |
| GET | `/api/me` | `Authorization: Bearer <token>` | `200 { usuario: { id, nombre, email } }` · `401 { error }` |
| POST | `/api/logout` | `Authorization: Bearer <token>` | `204` |

Nunca devolver `password_hash`. El mensaje de 401 es el mismo si el email no existe o si la contraseña está mal.

## 3. Frontend → `app/frontend/` (dueño: `dev-frontend`)

| Archivo | Qué hace |
|---|---|
| `index.html` + `login.js` | Formulario email/contraseña → `POST /api/login`. Guarda el token en `sessionStorage` y va a `bienvenida.html`. Muestra el error si falla. |
| `bienvenida.html` + `bienvenida.js` | Llama `GET /api/me`. Muestra "Hola, {nombre}". Botón "Cerrar sesión" → `POST /api/logout` y vuelve a `index.html`. Sin token válido → vuelve a `index.html`. |
| `estilos.css` | Estilos compartidos. |

HTML, CSS y JavaScript puro (sin frameworks, sin CDN). Rutas relativas a la raíz: `/api/...`.
