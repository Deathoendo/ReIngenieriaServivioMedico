import { pool, withConnection, withTransaction } from '../db/pool.js';
import { callProcedure, succeeded } from './procedure.js';

/**
 * Acceso a datos del módulo de consultas médicas.
 *
 * La operación maestro-detalle (cabecera `consultas` + N filas en
 * `consulta_diagnosticos`) va en transacción: si falla el guardado de un
 * diagnóstico, no debe quedar una consulta sin su detalle.
 */

/** Busca consultas por cédula, modalidad y/o fecha. Todos los filtros son opcionales. */
export async function buscar({ cedula, idModalidad, fechaConsulta }, idUsuario) {
  return withConnection(async (connection) => {
    const { rows, out } = await callProcedure(
      connection,
      'CALL sp_buscar_consultas(?, ?, ?, ?, @codigo, @mensaje)',
      [cedula || null, idModalidad || null, fechaConsulta || null, idUsuario],
      ['codigo', 'mensaje'],
    );
    return { data: rows, mensaje: out.mensaje, success: succeeded(out) };
  });
}

/**
 * Recupera una consulta con su detalle de diagnósticos.
 *
 * El SP original obligaba a que el repositorio hiciera una consulta extra por cada
 * fila del listado (problema N+1). El listado ahora trae un resumen agregado y
 * solo el detalle se pide cuando se abre una consulta concreta.
 */
export async function obtenerPorId(idConsulta) {
  return withConnection(async (connection) => {
    const { resultSets, out } = await callProcedure(
      connection,
      'CALL sp_obtener_consulta(?, @codigo, @mensaje)',
      [idConsulta],
      ['codigo', 'mensaje'],
    );

    // El procedure emite dos SELECT: la cabecera de la consulta y sus diagnósticos.
    const cabecera = resultSets[0]?.[0] ?? null;
    const diagnosticos = resultSets[1] ?? [];

    return {
      data: cabecera ? { ...cabecera, diagnosticos } : null,
      mensaje: out.mensaje,
      success: succeeded(out),
    };
  });
}

/** Devuelve los datos del colaborador asociados a una cédula. */
export async function datosColaborador(cedula) {
  return withConnection(async (connection) => {
    const { rows, out } = await callProcedure(
      connection,
      'CALL sp_datos_colaborador(?, @codigo, @mensaje)',
      [cedula],
      ['codigo', 'mensaje'],
    );
    return { data: rows[0] ?? null, mensaje: out.mensaje, success: succeeded(out) };
  });
}

export async function crear(payload, idUsuario) {
  return withTransaction(async (connection) => {
    const { out } = await callProcedure(
      connection,
      `CALL sp_guardar_consulta(
         ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
         ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @codigo, @mensaje, @id_nuevo)`,
      [
        payload.cedula,
        payload.fechaConsulta,
        payload.edad ?? null,
        payload.cargo ?? null,
        payload.vicepresidencia ?? null,
        payload.tipoNomina ?? null,
        payload.modalidad ?? null,
        payload.tension ?? null,
        payload.tensionB ?? null,
        payload.frecuencia ?? null,
        payload.temperatura ?? null,
        payload.respiracion ?? null,
        payload.talla ?? null,
        payload.peso ?? null,
        payload.imc ?? null,
        payload.flagReposo ? 1 : 0,
        payload.idTipoReposo ?? null,
        payload.idCategoriaReposo ?? null,
        payload.diasReposo ?? null,
        payload.fechaDesde ?? null,
        payload.fechaHasta ?? null,
        payload.fechaReintegro ?? null,
        payload.email ?? null,
        payload.telefono ?? null,
        payload.contactoEmergencia ?? null,
        idUsuario,
      ],
      ['codigo', 'mensaje', 'id_nuevo'],
    );

    if (!succeeded(out)) {
      return { success: false, message: out.mensaje, idConsulta: null };
    }

    const idConsulta = out.id_nuevo;
    await reemplazarDiagnosticos(connection, idConsulta, payload.diagnosticos);

    return {
      success: true,
      message: out.mensaje,
      idConsulta,
    };
  });
}

export async function actualizar(idConsulta, payload) {
  return withTransaction(async (connection) => {
    const { out } = await callProcedure(
      connection,
      `CALL sp_actualizar_consulta(
         ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
         ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @codigo, @mensaje)`,
      [
        idConsulta,
        payload.edad ?? null,
        payload.cargo ?? null,
        payload.vicepresidencia ?? null,
        payload.tipoNomina ?? null,
        payload.modalidad ?? null,
        payload.tension ?? null,
        payload.tensionB ?? null,
        payload.frecuencia ?? null,
        payload.temperatura ?? null,
        payload.respiracion ?? null,
        payload.talla ?? null,
        payload.peso ?? null,
        payload.imc ?? null,
        payload.flagReposo ? 1 : 0,
        payload.idTipoReposo ?? null,
        payload.idCategoriaReposo ?? null,
        payload.diasReposo ?? null,
        payload.fechaDesde ?? null,
        payload.fechaHasta ?? null,
        payload.fechaReintegro ?? null,
        payload.email ?? null,
        payload.telefono ?? null,
        payload.contactoEmergencia ?? null,
      ],
      ['codigo', 'mensaje'],
    );

    if (!succeeded(out)) {
      return { success: false, message: out.mensaje };
    }

    await reemplazarDiagnosticos(connection, idConsulta, payload.diagnosticos);
    return { success: true, message: out.mensaje };
  });
}

export async function eliminar(idConsulta) {
  return withConnection(async (connection) => {
    const { out } = await callProcedure(
      connection,
      'CALL sp_eliminar_consulta(?, @codigo, @mensaje)',
      [idConsulta],
      ['codigo', 'mensaje'],
    );
    return { success: succeeded(out), message: out.mensaje };
  });
}

/**
 * Comprueba que los ids de catálogo referenciados por los diagnósticos existan.
 *
 * Se valida antes de escribir para poder devolver un 400 con el id exacto que
 * falla, en lugar de un 500 genérico por violación de clave foránea. La base de
 * datos conserva la restricción como red de seguridad: esto mejora el mensaje,
 * no sustituye la integridad referencial.
 *
 * Los nombres de tabla y columna salen de este mapa fijo, nunca de la entrada.
 */
const REFERENCIAS = {
  diagnostico: { tabla: 'diagnosticos', columna: 'id_diagnostico' },
  patologia: { tabla: 'patologias', columna: 'id_patologia' },
  especialidad: { tabla: 'especialidades', columna: 'id_especialidad' },
};

export async function referenciasInvalidas(diagnosticos = []) {
  const porTipo = {
    diagnostico: [...new Set(diagnosticos.map((d) => d.diagnostico).filter(Boolean))],
    patologia: [...new Set(diagnosticos.map((d) => d.patologia).filter(Boolean))],
    especialidad: [...new Set(diagnosticos.map((d) => d.especialidad).filter(Boolean))],
  };

  const faltantes = {};

  for (const [tipo, ids] of Object.entries(porTipo)) {
    if (ids.length === 0) continue;

    const { tabla, columna } = REFERENCIAS[tipo];
    const [filas] = await pool.query(
      `SELECT ${columna} AS id FROM ${tabla} WHERE ${columna} IN (?)`,
      [ids],
    );

    const existentes = new Set(filas.map((fila) => fila.id));
    const desconocidos = ids.filter((id) => !existentes.has(id));
    if (desconocidos.length > 0) faltantes[tipo] = desconocidos;
  }

  return faltantes;
}

/**
 * Reemplaza el detalle de diagnósticos de una consulta.
 *
 * Se borra y se reinserta en vez de comparar diferencia por diferencia: el detalle
 * es pequeño (unos pocos diagnósticos por consulta) y el `ON DUPLICATE KEY UPDATE`
 * del SP hace que reinsertar sea idempotente. Menos código y menos casos borde.
 */
async function reemplazarDiagnosticos(connection, idConsulta, diagnosticos = []) {
  await connection.query('DELETE FROM consulta_diagnosticos WHERE id_consulta = ?', [
    idConsulta,
  ]);

  for (const item of diagnosticos) {
    await connection.query('CALL sp_insertar_diagnostico(?, ?, ?, ?)', [
      idConsulta,
      item.diagnostico,
      item.patologia ?? null,
      item.especialidad ?? null,
    ]);
  }
}
