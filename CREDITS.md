# Créditos

## Autoría

El código de este repositorio es de **Bryan Augusto Gámez Badler**.

Es una reescritura en limpio de la arquitectura de un portal de servicio médico:
el diseño de capas, el modelo de datos, los stored procedures, la autenticación
contra directorio y las decisiones documentadas en el README se reconstruyeron
desde cero, con datos sintéticos y una empresa ficticia (Grupo Meridiano).

No contiene código, esquema, credenciales, nombres de grupos, nombres de tablas ni
datos de ningún sistema en producción.

## Dependencias

- [Express](https://expressjs.com/) — MIT
- [mysql2](https://github.com/sidorares/node-mysql2) — MIT
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — MIT
- [ldapts](https://github.com/ldapts/ldapts) — MIT
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js) — MIT
- [dotenv](https://github.com/motdotla/dotenv) — BSD-2-Clause
- [cors](https://github.com/expressjs/cors) — MIT
- [nodemon](https://github.com/remy/nodemon) — MIT (solo desarrollo)

## Interfaz gráfica (frontend)

La interfaz en Angular se construyó sobre **CoreUI Free Angular Admin Template**.

- Proyecto: https://github.com/coreui/coreui-free-angular-admin-template
- Licencia: MIT — Copyright (c) 2017-2025 creativeLabs Łukasz Holeczek
- Autoría del template: The CoreUI Team y colaboradores

CoreUI proporciona el armazón de la interfaz (layout, tema y componentes). El
trabajo propio sobre el frontend es la integración con la API, los formularios de
consulta, los servicios, los *guards* de sesión y los interceptores HTTP. La
licencia MIT del template se conserva y se reconoce aquí de forma explícita.
