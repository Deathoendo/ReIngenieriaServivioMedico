import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { closePool, ping } from '../src/db/pool.js';

/**
 * Pruebas de integración sobre HTTP real.
 *
 * Requieren la base de datos levantada y migrada (`npm run db:migrate`).
 * Si MySQL no responde, el bloque entero se omite en lugar de fallar: así
 * `npm test` sigue siendo útil en un clon recién bajado sin base de datos.
 */

let server;
let baseUrl;
let bdDisponible = true;

before(async () => {
  try {
    await ping();
  } catch {
    bdDisponible = false;
    return;
  }

  // Puerto efímero (0): el sistema operativo elige uno libre. Evita choques con
  // un `npm run dev` que ya esté ocupando el 3000 en la máquina del desarrollador.
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await closePool();
});

const api = (path, options = {}) =>
  fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

async function login(email = 'ana.reyes@meridiano.local', password = 'Demo1234!') {
  const response = await api('/auth/login', { method: 'POST', body: { email, password } });
  const payload = await response.json();
  return payload.data.token;
}

const conSesion = (token) => ({ Authorization: `Bearer ${token}` });

describe('salud del servicio', () => {
  test('GET /api/health responde ok y con la base de datos arriba', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const response = await api('/health');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.database, 'up');
  });
});

describe('autenticación', () => {
  test('rechaza credenciales incorrectas sin revelar si el usuario existe', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');

    const malaClave = await api('/auth/login', {
      method: 'POST',
      body: { email: 'ana.reyes@meridiano.local', password: 'incorrecta' },
    });
    const inexistente = await api('/auth/login', {
      method: 'POST',
      body: { email: 'nadie@meridiano.local', password: 'incorrecta' },
    });

    assert.equal(malaClave.status, 401);
    assert.equal(inexistente.status, 401);

    // Misma respuesta en ambos casos: sin enumeración de cuentas.
    const a = await malaClave.json();
    const b = await inexistente.json();
    assert.equal(a.message, b.message);
  });

  test('exige un correo con formato válido antes de consultar la base', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const response = await api('/auth/login', {
      method: 'POST',
      body: { email: 'sin-arroba', password: 'x' },
    });
    assert.equal(response.status, 400);
  });

  test('devuelve token y datos del usuario en un login correcto', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const response = await api('/auth/login', {
      method: 'POST',
      body: { email: 'ana.reyes@meridiano.local', password: 'Demo1234!' },
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.data.token, 'debe devolver un token');
    assert.equal(body.data.user.email, 'ana.reyes@meridiano.local');
    assert.ok(!('clave_hash' in body.data.user), 'la respuesta no debe incluir el hash');
  });

  test('bloquea sin token, con token inválido y con token manipulado', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');

    assert.equal((await api('/consultas/buscar')).status, 401);
    assert.equal((await api('/consultas/buscar', { headers: conSesion('basura') })).status, 401);

    // Firma alterada: el payload es legible pero el HMAC ya no valida.
    const token = await login();
    const [cabecera, payload] = token.split('.');
    const falso = `${cabecera}.${payload}x.firma-inventada`;
    assert.equal((await api('/consultas/buscar', { headers: conSesion(falso) })).status, 401);
  });

  test('invalida el token anterior al iniciar sesión de nuevo (sesión única)', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');

    const primerToken = await login();
    assert.equal((await api('/auth/me', { headers: conSesion(primerToken) })).status, 200);

    const segundoToken = await login();
    assert.equal((await api('/auth/me', { headers: conSesion(segundoToken) })).status, 200);
    assert.equal(
      (await api('/auth/me', { headers: conSesion(primerToken) })).status,
      401,
      'el token anterior debe quedar invalidado',
    );
  });

  test('logout cierra la sesión de forma efectiva', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');

    const token = await login();
    const cierre = await api('/auth/logout', { method: 'POST', headers: conSesion(token) });
    assert.equal(cierre.status, 200);
    assert.equal((await api('/auth/me', { headers: conSesion(token) })).status, 401);
  });
});

describe('consultas médicas', () => {
  test('lista las consultas existentes', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const token = await login();
    const response = await api('/consultas/buscar', { headers: conSesion(token) });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.total > 0);
    assert.ok(body.data[0].nombre_colaborador, 'debe traer el nombre del colaborador');
  });

  test('filtra por cédula y no devuelve el resto', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const token = await login();
    const response = await api('/consultas/buscar?cedula=V-10000005', {
      headers: conSesion(token),
    });
    const body = await response.json();

    assert.equal(body.total, 1);
    assert.equal(body.data[0].cedula, 'V-10000005');
  });

  test('filtra por modalidad', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const token = await login();
    const response = await api('/consultas/buscar?idModalidad=3', {
      headers: conSesion(token),
    });
    const body = await response.json();

    assert.ok(body.total > 0);
    assert.ok(body.data.every((fila) => fila.id_modalidad === 3));
  });

  test('devuelve 404 cuando la consulta no existe', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const token = await login();
    const response = await api('/consultas/999999', { headers: conSesion(token) });
    assert.equal(response.status, 404);
  });

  test('devuelve 404 cuando el colaborador no existe', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const token = await login();
    const response = await api('/consultas/colaborador/V-99999999', {
      headers: conSesion(token),
    });
    assert.equal(response.status, 404);
  });

  test('expone los catálogos agrupados por tipo', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const token = await login();
    const body = await (await api('/consultas/catalogos', { headers: conSesion(token) })).json();

    for (const clave of ['cargos', 'vicepresidencias', 'diagnostico', 'especialidad', 'modalidad']) {
      assert.ok(Array.isArray(body.data[clave]), `falta el catálogo "${clave}"`);
      assert.ok(body.data[clave].length > 0, `el catálogo "${clave}" viene vacío`);
    }
  });
});

describe('altas, cambios y bajas', () => {
  const consultaValida = (extra = {}) => ({
    cedula: 'V-10000004',
    fechaConsulta: '2026-10-21',
    edad: 38,
    cargo: 4,
    vicepresidencia: 4,
    modalidad: 2,
    talla: 1.66,
    peso: 68.4,
    imc: 24.82,
    diagnosticos: [{ diagnostico: 2, patologia: 1, especialidad: 1 }],
    ...extra,
  });

  test('crea una consulta con su detalle de diagnósticos', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const token = await login();

    const alta = await api('/consultas', {
      method: 'POST',
      headers: conSesion(token),
      body: consultaValida({
        diagnosticos: [
          { diagnostico: 2, patologia: 1, especialidad: 1 },
          { diagnostico: 7, patologia: 1, especialidad: 4 },
        ],
      }),
    });
    assert.equal(alta.status, 201);
    const { data } = await alta.json();

    const detalle = await (
      await api(`/consultas/${data.idConsulta}`, { headers: conSesion(token) })
    ).json();

    assert.equal(detalle.data.cedula, 'V-10000004');
    assert.equal(detalle.data.diagnosticos.length, 2, 'deben persistir ambos diagnósticos');

    await api(`/consultas/${data.idConsulta}`, { method: 'DELETE', headers: conSesion(token) });
  });

  test('actualiza los datos y reemplaza los diagnósticos', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const token = await login();

    const alta = await api('/consultas', {
      method: 'POST',
      headers: conSesion(token),
      body: consultaValida(),
    });
    const { data } = await alta.json();

    const cambio = await api(`/consultas/${data.idConsulta}`, {
      method: 'PUT',
      headers: conSesion(token),
      body: {
        talla: 1.66,
        peso: 70,
        imc: 25.4,
        flagReposo: true,
        idTipoReposo: 2,
        idCategoriaReposo: 1,
        diasReposo: 3,
        fechaDesde: '2026-10-21',
        fechaHasta: '2026-10-23',
        diagnosticos: [{ diagnostico: 6, patologia: 6, especialidad: 6 }],
      },
    });
    assert.equal(cambio.status, 200);

    const detalle = await (
      await api(`/consultas/${data.idConsulta}`, { headers: conSesion(token) })
    ).json();

    assert.equal(Number(detalle.data.peso), 70);
    assert.equal(detalle.data.flag_reposo, 1);
    assert.equal(detalle.data.diagnosticos.length, 1);
    assert.equal(detalle.data.diagnosticos[0].id_diagnostico, 6);

    await api(`/consultas/${data.idConsulta}`, { method: 'DELETE', headers: conSesion(token) });
  });

  test('elimina una consulta y luego responde 404', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const token = await login();

    const alta = await api('/consultas', {
      method: 'POST',
      headers: conSesion(token),
      body: consultaValida(),
    });
    const { data } = await alta.json();

    const baja = await api(`/consultas/${data.idConsulta}`, {
      method: 'DELETE',
      headers: conSesion(token),
    });
    assert.equal(baja.status, 200);

    const despues = await api(`/consultas/${data.idConsulta}`, { headers: conSesion(token) });
    assert.equal(despues.status, 404);
  });

  test('rechaza un diagnóstico que no existe en el catálogo sin dejar basura', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const token = await login();

    const antes = await (
      await api('/consultas/buscar', { headers: conSesion(token) })
    ).json();

    const response = await api('/consultas', {
      method: 'POST',
      headers: conSesion(token),
      body: consultaValida({ diagnosticos: [{ diagnostico: 999999 }] }),
    });
    assert.equal(response.status, 400);
    const error = await response.json();
    assert.equal(error.details.field, 'diagnosticos');

    // La transacción no debe haber dejado una consulta huérfana.
    const despues = await (
      await api('/consultas/buscar', { headers: conSesion(token) })
    ).json();
    assert.equal(despues.total, antes.total);
  });

  test('rechaza el IMC incoherente con la talla y el peso', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const token = await login();

    const response = await api('/consultas', {
      method: 'POST',
      headers: conSesion(token),
      body: consultaValida({ imc: 9 }),
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /IMC/);
  });

  test('exige el tipo de reposo cuando la consulta genera reposo', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const token = await login();

    const response = await api('/consultas', {
      method: 'POST',
      headers: conSesion(token),
      body: consultaValida({ flagReposo: true }),
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).message, /tipo de reposo/);
  });

  test('rechaza una fecha inexistente antes de llegar a la base', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const token = await login();

    const response = await api('/consultas', {
      method: 'POST',
      headers: conSesion(token),
      body: consultaValida({ fechaConsulta: '2026-02-30' }),
    });
    assert.equal(response.status, 400);
  });
});

describe('rutas desconocidas', () => {
  test('devuelve 404 con un contrato consistente', async (t) => {
    if (!bdDisponible) return t.skip('MySQL no disponible');
    const response = await api('/no-existe');
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.code, 'NOT_FOUND');
  });
});
