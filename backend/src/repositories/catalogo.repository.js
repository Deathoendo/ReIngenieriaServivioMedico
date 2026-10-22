import { withConnection } from '../db/pool.js';
import { callProcedure, succeeded } from './procedure.js';

/**
 * Acceso a datos de catálogos (combos del formulario).
 * Cada uno delega en su stored procedure, igual que en el sistema original.
 */

export async function listarCargos() {
  return withConnection(async (connection) => {
    const { rows, out } = await callProcedure(
      connection,
      'CALL sp_catalogo_cargos(@codigo, @mensaje)',
      [],
      ['codigo', 'mensaje'],
    );
    return { data: rows, mensaje: out.mensaje, success: succeeded(out) };
  });
}

export async function listarVicepresidencias() {
  return withConnection(async (connection) => {
    const { rows, out } = await callProcedure(
      connection,
      'CALL sp_catalogo_vicepresidencias(@codigo, @mensaje)',
      [],
      ['codigo', 'mensaje'],
    );
    return { data: rows, mensaje: out.mensaje, success: succeeded(out) };
  });
}

/**
 * Catálogos agrupados (diagnósticos, patologías, especialidades, tipos de reposo,
 * categorías y modalidades). Un solo viaje a la base de datos en vez de seis.
 */
export async function listarSubdatos() {
  return withConnection(async (connection) => {
    const { rows, out } = await callProcedure(
      connection,
      'CALL sp_catalogo_subdatos(@codigo, @mensaje)',
      [],
      ['codigo', 'mensaje'],
    );
    return { data: rows, mensaje: out.mensaje, success: succeeded(out) };
  });
}

export async function listarMedicamentos() {
  return withConnection(async (connection) => {
    const { rows, out } = await callProcedure(
      connection,
      'CALL sp_catalogo_medicamentos(@codigo, @mensaje)',
      [],
      ['codigo', 'mensaje'],
    );
    return { data: rows, mensaje: out.mensaje, success: succeeded(out) };
  });
}

export async function listarLotesDisponibles() {
  return withConnection(async (connection) => {
    const { rows, out } = await callProcedure(
      connection,
      'CALL sp_catalogo_lotes(@codigo, @mensaje)',
      [],
      ['codigo', 'mensaje'],
    );
    return { data: rows, mensaje: out.mensaje, success: succeeded(out) };
  });
}
