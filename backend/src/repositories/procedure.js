/**
 * Utilidades para el patrón de stored procedures con parámetros OUT.
 *
 * El sistema original usa esta convención: el SP no lanza una excepción de negocio,
 * informa el resultado en `@codigo` / `@mensaje`. Se conserva porque es una decisión
 * válida en entornos donde la base de datos es compartida con sistemas legados y
 * los errores de negocio deben viajar como datos, no como SQLSTATE.
 */

/**
 * Ejecuta un procedure con parámetros OUT y devuelve `{ rows, out }`.
 *
 * La llamada y la lectura de las variables de sesión ocurren sobre la MISMA
 * conexión: las variables `@nombre` son de sesión, no globales. Si se leyeran
 * desde otra conexión del pool, devolverían valores vacíos o de otra petición.
 *
 * @param {import('mysql2/promise').PoolConnection} connection
 * @param {string} sql        sentencia CALL con los `?` de entrada y los `@salida`
 * @param {Array}  params     valores de entrada
 * @param {string[]} outNames nombres (sin @) de los parámetros OUT, en orden
 */
export async function callProcedure(connection, sql, params, outNames) {
  const [rawResults] = await connection.query(sql, params);

  const selectors = outNames.map((name) => `@${name} AS \`${name}\``).join(', ');
  const [outRows] = await connection.query(`SELECT ${selectors}`);

  // Un CALL devuelve un arreglo con TODOS sus result sets. Hay que conservarlos
  // todos: los procedures con más de un SELECT (por ejemplo cabecera + detalle)
  // devuelven la información repartida entre ellos, y quedarse solo con el primero
  // hace que el detalle llegue siempre vacío.
  const resultSets = Array.isArray(rawResults) ? rawResults.filter(Array.isArray) : [];

  return {
    resultSets,
    rows: resultSets[0] ?? [], // atajo para el caso habitual de un único SELECT
    out: outRows[0] ?? {},
  };
}

/** Interpreta el `@codigo` del procedure: 0 significa éxito. */
export function succeeded(out) {
  return Number(out?.codigo) === 0;
}
