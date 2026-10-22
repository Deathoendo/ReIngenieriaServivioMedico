import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as v from '../src/validate.js';

/**
 * Pruebas unitarias de la capa de validación.
 * No tocan la base de datos ni la red: son las que deben correr siempre y rápido.
 */

const mensaje = (fn) => {
  try {
    fn();
    return null;
  } catch (error) {
    return error.message;
  }
};

describe('asCedula', () => {
  test('acepta los formatos válidos y los normaliza', () => {
    assert.equal(v.asCedula('V-10000001'), 'V-10000001');
    assert.equal(v.asCedula('v10000001'), 'V-10000001');
    assert.equal(v.asCedula('E-1234567'), 'E-1234567');
  });

  test('rechaza una cédula con letras o muy corta', () => {
    assert.match(mensaje(() => v.asCedula('ABC')), /cédula válida/);
    assert.match(mensaje(() => v.asCedula('V-12')), /cédula válida/);
  });

  test('devuelve null si es opcional y viene vacía', () => {
    assert.equal(v.asCedula(''), null);
    assert.equal(v.asCedula(undefined), null);
  });
});

describe('asDate', () => {
  test('acepta una fecha ISO válida', () => {
    assert.equal(v.asDate('2026-10-21'), '2026-10-21');
  });

  test('rechaza una fecha con forma correcta pero inexistente', () => {
    // El caso que un regex solo no detecta: febrero no tiene 30 días.
    assert.match(mensaje(() => v.asDate('2026-02-30')), /no es una fecha válida/);
  });

  test('rechaza formatos distintos a AAAA-MM-DD', () => {
    assert.match(mensaje(() => v.asDate('21/10/2026')), /AAAA-MM-DD/);
  });
});

describe('asInt y asDecimal', () => {
  test('convierte cadenas numéricas', () => {
    assert.equal(v.asInt('42', 'x'), 42);
    assert.equal(v.asDecimal('36.5', 'x'), 36.5);
  });

  test('rechaza decimales donde se espera entero', () => {
    assert.match(mensaje(() => v.asInt('1.5', 'x')), /número entero/);
  });

  test('respeta los límites', () => {
    assert.match(mensaje(() => v.asInt(200, 'edad', { min: 0, max: 120 })), /entre 0 y 120/);
  });

  test('rechaza texto no numérico', () => {
    assert.match(mensaje(() => v.asInt('abc', 'x')), /número entero/);
  });
});

describe('asBoolean', () => {
  test('interpreta las formas habituales', () => {
    assert.equal(v.asBoolean(true, 'x'), true);
    assert.equal(v.asBoolean('true', 'x'), true);
    assert.equal(v.asBoolean('1', 'x'), true);
    assert.equal(v.asBoolean('no', 'x'), false);
    assert.equal(v.asBoolean(undefined, 'x'), false);
  });

  test('rechaza un valor que no es booleano', () => {
    assert.match(mensaje(() => v.asBoolean('quizas', 'x')), /booleano/);
  });
});

describe('asDiagnosticos', () => {
  test('normaliza una lista correcta', () => {
    const resultado = v.asDiagnosticos([{ diagnostico: 1, patologia: 2, especialidad: null }]);
    assert.deepEqual(resultado, [{ diagnostico: 1, patologia: 2, especialidad: null }]);
  });

  test('exige el id de diagnóstico', () => {
    assert.match(mensaje(() => v.asDiagnosticos([{ patologia: 2 }])), /diagnosticos\[0\]\.diagnostico/);
  });

  test('rechaza algo que no es una lista', () => {
    assert.match(mensaje(() => v.asDiagnosticos('nope')), /debe ser una lista/);
  });

  test('limita la cantidad de diagnósticos por consulta', () => {
    const muchos = Array.from({ length: 21 }, () => ({ diagnostico: 1 }));
    assert.match(mensaje(() => v.asDiagnosticos(muchos)), /no puede tener más de 20/);
  });
});

describe('asEmail', () => {
  test('acepta un correo válido', () => {
    assert.equal(v.asEmail('ana.reyes@meridiano.local'), 'ana.reyes@meridiano.local');
  });

  test('rechaza un correo mal formado', () => {
    assert.match(mensaje(() => v.asEmail('ana.reyes@')), /no es un correo válido/);
  });
});
