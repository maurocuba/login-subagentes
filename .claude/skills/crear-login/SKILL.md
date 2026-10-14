---
name: crear-login
description: Construye el login completo (base de datos → backend + frontend → verificación) usando los subagentes del proyecto. Úsala cuando pidan "crear el login", "armar el proyecto" o "flujo completo".
---

Coordina a los subagentes. Tú eres el orquestador: los subagentes no se llaman entre sí,
tú le pasas a cada uno lo que necesita del anterior. Todos leen `CONTRATO.md`.

1. **dev-database**: que cree `app/db/` según el contrato y ejecute `npm run db:init`.
2. Cuando termine el paso 1, lanza **EN PARALELO** (en el mismo mensaje):
   - **dev-backend**: pásale las funciones que exportó dev-database. Que cree la API y sus pruebas.
   - **dev-frontend**: que cree las pantallas. No depende del backend porque el contrato ya fija la API.
3. Si dev-backend reporta pruebas en ❌ o algo que le falta a `app/db/`, vuelve a llamar
   al subagente dueño de ese archivo (una sola vez) con el detalle exacto.
4. Verificación final (la haces tú):
   - `cd app && npm test`
   - Levanta el servidor en segundo plano (`npm start`) y prueba con `curl`:
     login correcto (200), contraseña mala (401), `/api/me` con el token (200).
   - Confirma que `http://localhost:3000/` devuelve el HTML del login.

Al final, muestra una tabla resumen:
| Etapa | Subagente | Archivos | Resultado |
y cómo abrir la app: `cd app && npm run db:init && npm start` → http://localhost:3000
(usuario `demo@upb.edu` / `Demo123!`).
