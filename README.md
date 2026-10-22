# Portal de Servicio Médico

Aplicación **full-stack** de un portal corporativo de gestión de consultas médicas.

- **API** — Node.js 20+ (ESM nativo) con Express 4: autenticación contra Directorio
  Activo, sesión única por usuario, control de acceso por roles y el módulo de
  consultas (cabecera + diagnósticos) sobre MySQL.
- **Interfaz** — Angular 21 con componentes standalone, formularios reactivos y
  sesión en el cliente. Consume la API anterior y no duplica reglas de negocio:
  valida en pantalla lo que la persona puede corregir y delega el resto al servidor.

> **Implementación de referencia con datos sintéticos.**
> Este repositorio es una reescritura limpia de la *arquitectura* de un portal de
> servicio médico que operé profesionalmente. No contiene código, esquema, nombres,
> credenciales ni datos del sistema original: la empresa **Grupo Meridiano** es
> ficticia y todos sus registros son inventados. Se publica como pieza de portafolio
> técnico, no como código de producción de terceros.

---

## Qué resuelve

Un departamento de servicio médico necesita registrar consultas de sus colaboradores
y consultarlas después. Eso implica tres problemas que este backend resuelve de forma
explícita:

1. **Identidad corporativa.** El personal ya existe en el Directorio Activo de la
   empresa. El portal no administra contraseñas: valida contra el directorio y
   traduce su pertenencia a grupos en permisos de acceso.
2. **Sesión controlada.** Un empleado que inicia sesión en un equipo no debe seguir
   con la sesión abierta en otro. El JWT por sí solo no se puede revocar, así que la
   sesión vigente se persiste y se compara en cada petición.
3. **Datos clínicos íntegros.** Una consulta es una cabecera más N diagnósticos. O se
   guardan los dos, o no se guarda nada.

### Por qué la demo pública usa el modo local

El portal valida la identidad contra **Directorio Activo** y ese proveedor está
implementado (`backend/src/auth/providers/ldap.provider.js`: bind real con `ldapts`,
escape de filtros según la RFC 4515, traducción de la pertenencia a grupos en permisos).

Pero **la demo que se levanta desde este repositorio corre con `AUTH_PROVIDER=local`**,
que valida contra la tabla `usuarios` con hash bcrypt. El motivo es práctico: un
directorio corporativo no se puede exponer en un repositorio público, y sin él la
aplicación no arrancaría para quien la clone. El modo local existe para que el sistema
sea ejecutable y verificable sin depender de infraestructura privada — **no es un atajo
para saltarse la autenticación**: comprueba el hash y falla si la contraseña no
corresponde.

Los dos proveedores comparten la misma interfaz, así que el resto del sistema no
distingue cuál está activo. Pasar a un despliegue real es cambiar una variable:

```bash
AUTH_PROVIDER=ldap
```

## Stack

| Capa | Tecnología |
|---|---|
| Interfaz | Angular 21 (componentes standalone, signals, control de flujo `@if`/`@for`) |
| Kit de UI | CoreUI for Angular 5 (MIT) — ver [CREDITS.md](CREDITS.md) |
| Formularios | Angular Reactive Forms con validación en el cliente |
| Runtime | Node.js 20+ (ESM nativo) |
| HTTP | Express 4 |
| Identidad | LDAP / Active Directory (`ldapts`) · bcrypt para el modo local |
| Sesión | JSON Web Tokens (`jsonwebtoken`) con sesión única persistida |
| Base de datos | MySQL 8 / MariaDB 11 con stored procedures |
| Pruebas | `node:test` en la API · Karma + Jasmine en la interfaz |

**Sin dependencias de más:** la validación de entrada y el manejo de errores están
escritos a mano en lugar de traer un framework. Son unas 200 líneas y se leen. En la
interfaz se usa el mismo criterio: no hay librería de estado ni de formularios más
allá de lo que Angular trae de serie.

---

## Arquitectura

```
                      ┌──────────────────────────────────────┐
   HTTP  ──────────▶  │  routes/       declara endpoints     │
                      ├──────────────────────────────────────┤
                      │  middleware/   sesión, roles, errores│
                      ├──────────────────────────────────────┤
                      │  controllers/  traduce HTTP ⇄ servicio│
                      ├──────────────────────────────────────┤
                      │  services/     REGLAS DE NEGOCIO     │
                      ├──────────────────────────────────────┤
                      │  repositories/ SQL y stored procs    │
                      ├──────────────────────────────────────┤
                      │  db/           pool de conexiones    │
                      └───────────────┬──────────────────────┘
                                      │
                              ┌───────▼────────┐   ┌──────────────┐
                              │     MySQL      │   │  LDAP / AD   │
                              └────────────────┘   └──────────────┘
```

Cada capa conoce solo a la de abajo. Un controlador nunca escribe SQL y un repositorio
nunca decide si una operación es válida. Esto es lo que permite probar las reglas de
negocio sin levantar un servidor.

### Estructura

El repositorio tiene dos proyectos independientes, cada uno con su propio
`package.json`:

```
servicio-medico-ref/
├── backend/      API REST  (Node.js + Express + MySQL)
├── frontend/     Interfaz  (Angular 21 + CoreUI)
└── docker-compose.yml        base de datos para desarrollo
```

Detalle del backend:

```
backend/
├── src/
│   ├── app.js                  ensambla Express (exporta una fábrica)
│   ├── index.js                arranque, validación de config, apagado ordenado
│   ├── config.js               lectura y validación de variables de entorno
│   ├── errors.js               errores tipados con código HTTP
│   ├── validate.js             validación de entrada
│   ├── auth/
│   │   ├── provider.js         selecciona el proveedor de identidad
│   │   ├── tokens.js           emisión y verificación de JWT
│   │   └── providers/
│   │       ├── ldap.provider.js    bind real contra el directorio
│   │       └── local.provider.js   validación por hash bcrypt
│   ├── db/
│   │   ├── pool.js             pool + helpers de conexión y transacción
│   │   ├── schema.sql          tablas y stored procedures
│   │   └── seed.sql            datos sintéticos
│   ├── repositories/           acceso a datos
│   ├── services/               reglas de negocio
│   ├── controllers/            capa HTTP
│   ├── middleware/             sesión, roles, errores
│   └── routes/                 definición de endpoints
├── scripts/migrate.js          carga esquema + datos
└── test/                       pruebas unitarias y de integración
```

Detalle del frontend:

```
frontend/
├── src/
│   ├── main.ts                     arranque de la aplicación
│   ├── index.html                  documento base
│   ├── environments/               configuración por entorno (dev / producción)
│   ├── scss/                       estilos globales: base de CoreUI + ajustes propios
│   └── app/
│       ├── app.config.ts           providers globales (router, http, interceptores)
│       ├── app.routes.ts           rutas con carga diferida y guards de sesión
│       ├── core/
│       │   ├── models/             contrato tipado de la API (sin `any`)
│       │   ├── services/           auth.service · consulta.service
│       │   ├── guards/             authGuard · publicoGuard
│       │   └── interceptors/       inyecta el token y reacciona al 401
│       ├── layout/                 armazón: barra lateral y cabecera
│       ├── icons/                  subconjunto de iconos registrados
│       └── views/
│           ├── login/              acceso al portal
│           ├── inicio/             resumen de la sesión
│           ├── consultas/
│           │   ├── listado/        búsqueda, filtros y baja
│           │   └── formulario/     alta y edición (un solo componente)
│           └── no-encontrado/      404
├── angular.json
├── karma.conf.js
└── package.json
```

---

## Puesta en marcha

Se levantan dos procesos: la **API** (puerto 3000) y la **interfaz** (puerto 4200).

### 1. Base de datos

Con Docker:

```bash
docker compose up -d
```

O con un MySQL/MariaDB propio, crea un usuario y ajusta el `.env` en consecuencia.

### 2. API

```bash
cd backend
cp .env.example .env
# Genera un secreto real para JWT:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# Pégalo en JWT_SECRET y luego:
npm install
npm run db:migrate
```

```bash
npm start        # producción
npm run dev      # desarrollo, con recarga automática
npm test         # 39 pruebas
```

El servidor queda en `http://localhost:3000` y expone `GET /api/health`.

### 3. Interfaz

```bash
cd frontend
npm install
npm start        # http://localhost:4200
```

`npm start` usa la configuración de desarrollo y apunta a `http://localhost:3000/api`,
que es donde escucha la API. El puerto 4200 está declarado en `CORS_ORIGIN` dentro del
`.env` del backend; si cambias uno, cambia el otro.

```bash
npm run build    # compila a dist/ (usa environment.production.ts)
npm test         # pruebas de la interfaz
```

**Credenciales de la demo** — usuario `ana.reyes@meridiano.local`, contraseña `Demo1234!`
(la misma para `luis.pardo@` y `marta.leon@`).

---

## Endpoints

Todas las rutas salvo `login` y `health` exigen `Authorization: Bearer <token>`.

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Valida credenciales y abre sesión |
| `POST` | `/api/auth/logout` | Cierra la sesión vigente |
| `GET` | `/api/auth/me` | Identidad y rol de la sesión actual |

### Consultas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/consultas/buscar` | Busca por `cedula`, `idModalidad`, `fechaConsulta` |
| `GET` | `/api/consultas/:id` | Consulta completa con su detalle de diagnósticos |
| `GET` | `/api/consultas/colaborador/:cedula` | Datos del colaborador (precarga del formulario) |
| `POST` | `/api/consultas` | Registra una consulta |
| `PUT` | `/api/consultas/:id` | Actualiza cabecera y reemplaza diagnósticos |
| `DELETE` | `/api/consultas/:id` | Elimina la consulta y su detalle |

### Catálogos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/consultas/catalogos` | Todos los combos en una sola llamada |
| `GET` | `/api/consultas/cargos` · `/vicepresidencias` · `/medicamentos` · `/lotes` | Combos individuales |

### Ejemplo

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana.reyes@meridiano.local","password":"Demo1234!"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -s "http://localhost:3000/api/consultas/buscar?cedula=V-10000005" \
  -H "Authorization: Bearer $TOKEN"
```

### Contrato de respuesta

Toda respuesta respeta la misma forma. Los errores los produce un único manejador
central, así que el cliente nunca tiene que adivinar:

```jsonc
// éxito
{ "success": true, "data": { } }

// error de validación
{
  "success": false,
  "code": "BAD_REQUEST",
  "message": "El campo \"cedula\" debe ser una cédula válida (ejemplo: V-10000001)",
  "details": { "field": "cedula" }
}
```

Códigos: `BAD_REQUEST` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403),
`NOT_FOUND` (404), `CONFLICT` (409), `INTERNAL_ERROR` (500).

---

## Frontend

Interfaz en **Angular 21** con componentes *standalone*. No hay `NgModule`: cada
componente declara sus propias dependencias. Las rutas cargan cada pantalla de forma
diferida, así que entrar al portal no descarga el formulario de consultas.

| Ruta | Pantalla | Guard |
|---|---|---|
| `/login` | Acceso | `publicoGuard` |
| `/` | Resumen de la sesión | `authGuard` |
| `/consultas` | Listado con filtros | `authGuard` |
| `/consultas/nueva` | Alta | `authGuard` |
| `/consultas/:id` | Edición | `authGuard` |
| `**` | 404 | — |

### Capa de datos

`core/models/api.models.ts` declara el contrato de la API: `ConsultaResumen`,
`ConsultaDetalle`, `ConsultaPayload`, `Catalogos`, etc. **No se usa `any`** en las
respuestas. Si el backend renombra un campo, el error aparece en compilación y no como
un `undefined` silencioso en pantalla. Ese contrato se verificó contra la API real: el
ciclo completo alta → lectura → edición → baja devuelve los 25 campos que el modelo
espera.

### Sesión en el cliente

- El token vive en **`sessionStorage`**, no en `localStorage`. En una terminal de
  servicio médico compartida entre turnos, la sesión debe morir al cerrar la pestaña.
- El **interceptor** añade la cabecera `Authorization` en cada petición y, ante un
  `401`, limpia la sesión y vuelve al login con un aviso. Como el backend invalida el
  token anterior en cada login nuevo (sesión única), un `401` también significa "entraste
  desde otro equipo"; ambos casos se tratan igual.
- El `401` del propio login se excluye de esa redirección: ahí el formulario necesita
  mostrar "usuario o contraseña incorrectos" en lugar de recargar la pantalla.
- Un indicador evita el bucle de redirecciones cuando varias peticiones fallan a la vez.

### Decisiones de diseño

**Un solo componente para alta y edición.** `/consultas/nueva` y `/consultas/:id`
montan el mismo componente; el modo se decide por la presencia del parámetro. Con dos
formularios separados, las reglas de captura terminan divergiendo.

**El IMC se calcula en el cliente.** El backend rechaza con un `400` un IMC que no
cuadre con la talla y el peso. La pantalla lo recalcula al cambiar cualquiera de los
dos, así que ese error no llega a producirse. El cálculo se hace con `emitEvent: false`
para no disparar un ciclo entre los tres campos.

**Tras guardar o borrar se vuelve a consultar al servidor** en lugar de modificar la
lista en memoria. La pantalla refleja el estado real y no una suposición del cliente.

**Los catálogos se piden una sola vez** con `/catalogos`, no en una llamada por combo.

**El subconjunto de iconos está declarado explícitamente.** CoreUI registra cientos de
iconos por defecto; `icons/icon-subset.ts` incluye solo los 16 que las plantillas usan.
Añadir uno nuevo y olvidarlo en esa lista se nota en pantalla (se ve en blanco).

**El payload se construye con coerción explícita.** El backend distingue "sin dato" de
"cadena vacía", así que los campos opcionales se envían como `null` y no como `''`, y
los `DECIMAL` que MySQL devuelve como cadena se convierten a número antes de compararlos.

---

## Decisiones de diseño

Las que valen la pena explicar en una revisión.

**La autenticación se separa de la autorización.** El proveedor de identidad responde
"¿quién eres?" y una función aparte responde "¿puedes entrar?". Son preguntas distintas:
con LDAP manda la pertenencia a los grupos del directorio; en modo local manda el rol
de la base de datos. Mezclarlas es la vía habitual a los agujeros de permisos.

**La sesión única se apoya en la base de datos.** Un JWT firmado no se puede revocar:
sigue siendo válido hasta que expira. Por eso el token vigente se guarda en la columna
`token_activo` y el middleware lo compara en cada petición. Un login nuevo invalida el
token anterior de inmediato.

**Los mensajes de error de login no distinguen los casos.** Usuario inexistente y
contraseña incorrecta devuelven exactamente el mismo 401. Si fueran distintos, el
endpoint permitiría averiguar qué correos existen en la empresa. El motivo real se
registra en el servidor, nunca en la respuesta.

**Las operaciones maestro-detalle van en transacción.** Guardar la consulta y sus
diagnósticos son varios INSERT. Sin transacción, un fallo a mitad deja una consulta
clínica sin su diagnóstico. Con transacción, o entra todo o no entra nada.

**`ON DUPLICATE KEY UPDATE` en lugar de `INSERT IGNORE`.** `INSERT IGNORE` degrada a
advertencia *todos* los errores de la sentencia, incluidas las violaciones de clave
foránea: un diagnóstico apuntando a un id inexistente se descartaba en silencio y el
usuario veía un "registrado correctamente" falso. `ON DUPLICATE KEY UPDATE` absorbe
solo el choque de clave primaria y deja subir el resto de los errores de integridad.

**Las referencias se validan antes de escribir.** Los ids de catálogo de los
diagnósticos se comprueban antes del INSERT para poder responder un 400 que diga cuál
id está mal, en vez de un 500 genérico por clave foránea. La restricción de la base de
datos se conserva como red de seguridad: esto mejora el mensaje, no la sustituye.

**El `SELECT *` no se usa en la capa de usuarios.** Se listan las columnas necesarias.
`SELECT *` arrastra el hash de la contraseña y el token de sesión a capas que no
deberían verlos, y rompe el código en silencio cuando el esquema cambia.

**`ldapts` en vez de `ldapjs`.** `ldapjs` está descontinuado por su mantenedor. `ldapts`
expone una API de promesas, lo que elimina el envoltorio manual de callbacks y con él
toda una clase de errores por escapes olvidados.

**Los valores de los filtros LDAP se escapan.** La búsqueda por correo interpola un
valor que viene del cliente. Sin escapar los caracteres de la RFC 4515, se puede
alterar el filtro y consultar el directorio como si fuera una inyección SQL.

**El servidor falla al arrancar si falta configuración.** Es preferible que el proceso
no levante a que sirva peticiones a medio configurar. Lo mismo con la base de datos: se
comprueba la conexión antes de abrir el puerto.

**Apagado ordenado.** Ante `SIGTERM` deja de aceptar peticiones, termina las que están
en curso y cierra el pool. Sin esto, un despliegue corta consultas a la mitad.

---

## Pruebas

```bash
cd backend && npm test
```

**39 pruebas, 0 fallos.** Dos capas:

- `test/validate.test.js` — unitarias puras. No tocan red ni base de datos.
- `test/api.test.js` — integración sobre HTTP real: login, sesión única, permisos,
  filtros, ciclo completo de alta/consulta/cambio/baja, validaciones y 404.

Si MySQL no responde, las pruebas de integración se **omiten** en lugar de fallar, para
que `npm test` siga siendo útil en un clon recién bajado.

La interfaz se verifica con:

```bash
cd frontend && npm run build
```

La compilación corre con plantillas **estrictas**, así que un campo que no exista en el
modelo o un método que falte en el componente rompen el build. Además, el contrato de
datos se contrastó contra la API en ejecución: el payload que arma el formulario se
envió de verdad y se comprobó que la respuesta devuelve los 25 campos del modelo.

---

## Limitaciones conocidas

- **Sin límite de tasa en el login.** En producción debería haber uno por IP y por
  cuenta; hoy nada impide intentos ilimitados.
- **Sin refresco de token.** La sesión dura lo que dura el JWT (15 minutos por
  defecto) y luego hay que volver a entrar. Un refresh token sería lo siguiente.
- **El listado corta en 500 filas** (`LIMIT 500` en el procedure). Para volúmenes
  mayores hace falta paginación.
- **Sin registro estructurado.** Los eventos van a consola con `console.*`. En
  producción corresponde un logger con niveles y correlación por petición.
- **Sin migraciones versionadas.** `schema.sql` recrea las tablas desde cero; sirve
  para desarrollo, no para evolucionar un esquema en producción.
- **La interfaz no tiene pruebas automatizadas todavía.** Lo que está verificado es que
  compila con plantillas estrictas y que su contrato de datos coincide con la API real.
  Faltan *specs* de componentes y una prueba de extremo a extremo en navegador.

---

## Licencia

MIT — ver [LICENSE](LICENSE).
