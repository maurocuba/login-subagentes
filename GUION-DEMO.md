# Demo: un equipo de subagentes construye un login

**Herramienta:** Claude Code · **Stack:** Node.js 24 sin dependencias (`node:sqlite`, `node:http`, `node:test`)

## Estructura

```
.claude/
  agents/
    dev-database.md   → crea app/db/ (tablas, hash de contraseñas, sesiones). Modelo haiku.
    dev-backend.md    → crea app/backend/ (API REST + pruebas). No toca la base de datos.
    dev-frontend.md   → crea app/frontend/ (HTML/CSS/JS). No puede ejecutar comandos.
  skills/
    crear-login/      → orquesta: database → (backend ∥ frontend) → verificación
CONTRATO.md           → el acuerdo entre los 3: tablas, funciones, endpoints y pantallas
app/package.json      → scripts: db:init, start, test
reiniciar-demo.ps1    → borra app/db, app/backend y app/frontend
```

## Diferencia con la demo de `subagentes/`

| | `subagentes/` (calidad) | `login-subagentes/` (construcción) |
|---|---|---|
| Los agentes... | revisan y corrigen código existente | **crean** el código desde cero |
| División | por **rol** (QA, revisor, depurador, docs) | por **capa** (BD, backend, frontend) |
| Coordinación | el resultado de uno entra al siguiente | un **contrato** compartido + orden de dependencias |
| Paralelismo | tests ∥ revisión | backend ∥ frontend |

## Guion

### Parte 1: Los tres agentes (5 min)
Abre los tres `.md` de `.claude/agents/` y compara:
- `tools`: el frontend **no tiene `Bash`**. El backend sí, porque corre pruebas.
- Cada uno tiene una carpeta propia en `app/` y la regla "no toques las otras".
- `model`: la base de datos usa `haiku` (tarea simple y barata).

### Parte 2: El contrato (3 min)
Abre `CONTRATO.md`. Pregunta: *"¿Cómo puede el frontend llamar a `/api/login` si el backend todavía no existe?"*
→ Porque los dos se guían por el mismo contrato, como un equipo real con una especificación OpenAPI.

### Parte 3: Paso a paso (8 min)
Ejecuta `./reiniciar-demo.ps1` y escribe en Claude Code:

1. `Usa el subagente dev-database para crear la base de datos`
2. `Usa dev-backend y dev-frontend en paralelo para crear la API y las pantallas`
3. `cd app && npm start` → abre http://localhost:3000 y entra con `demo@upb.edu` / `Demo123!`

### Parte 3b: Mostrar las 3 capas corriendo (3 terminales en `app/`)
| Terminal | Comando | Qué se ve |
|---|---|---|
| 1 · Base de datos | `npm run db:init` y luego `npm run db:ver` | Tabla `usuarios` con el hash (nunca la contraseña) |
| 2 · Backend | `npm run backend` | API en http://localhost:3001 |
| 3 · Frontend | `npm run frontend` | Web en http://localhost:5173 + log de cada petición |

Inicia sesión en el navegador y vuelve a correr `npm run db:ver`: aparece una fila en `sesiones`.
Cierra sesión y córrelo otra vez: la fila desaparece.

### Parte 4: Todo junto (5 min)
Reinicia y escribe `/crear-login`. Señala:
- El orquestador **espera** a la base de datos (backend depende de ella).
- Backend y frontend corren **al mismo tiempo**.
- Al final el orquestador verifica todo con `npm test` y `curl`.

### Parte 5: Preguntas
- ¿Por qué el frontend no puede ejecutar comandos? *(No los necesita: menos permisos = menos riesgo.)*
- ¿Qué pasa si el backend necesita una función que no existe en `app/db/`? *(No la crea: lo reporta, y el orquestador se lo pide a dev-database. Cada capa tiene un dueño.)*
- ¿Qué pasaría sin `CONTRATO.md`? *(Cada agente inventaría nombres distintos y no encajarían.)*

## Ejercicio para los estudiantes

Agregar **registro de usuarios** (`POST /api/registro` + pantalla `registro.html`):
1. Actualizar `CONTRATO.md` con el nuevo endpoint.
2. Pedirle a cada subagente su parte.
3. Bonus: crear un subagente `revisor-seguridad` (solo lectura) que revise el login completo.
