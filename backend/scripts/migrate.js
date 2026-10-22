#!/usr/bin/env node
/**
 * Carga el esquema y los datos sintéticos en MySQL.
 *
 * Uso:  npm run db:migrate
 *
 * Lee los .sql y los ejecuta sentencia por sentencia. Se usa el cliente de la
 * librería (y no el `mysql` del sistema) para que funcione sin instalar nada
 * extra; el único cuidado es respetar los delimitadores de los stored procedures.
 *
 * Funciona igual contra un MySQL local y contra uno gestionado (Aiven, Railway,
 * PlanetScale…): en estos últimos lo normal es que el usuario de conexión NO
 * tenga permiso de `CREATE DATABASE` ni libertad para elegir el nombre, así que
 * el script:
 *   1. intenta crear la base y, si no puede, continúa;
 *   2. se conecta a la base indicada en MYSQL_DB;
 *   3. ignora las sentencias `CREATE DATABASE` / `USE` de los .sql, que sobran
 *      una vez que la conexión ya apunta a la base correcta.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '../src/db');

/** Sentencias que solo tienen sentido cuando el script crea la base él mismo. */
const IGNORAR = /^\s*(CREATE\s+DATABASE|USE\s)/i;

/**
 * Divide un script SQL en sentencias, respetando los bloques DELIMITER de los
 * stored procedures (que contienen `;` en su interior y romperían un split ingenuo).
 */
export function splitStatements(sql) {
  const statements = [];
  let current = '';
  let delimiter = ';';

  for (const rawLine of sql.split('\n')) {
    const line = rawLine.trim();

    if (line.toUpperCase().startsWith('DELIMITER ')) {
      delimiter = line.split(/\s+/)[1];
      continue;
    }

    current += `${rawLine}\n`;

    if (current.trimEnd().endsWith(delimiter)) {
      const statement = current.trimEnd().slice(0, -delimiter.length).trim();
      if (statement && !IGNORAR.test(statement)) statements.push(statement);
      current = '';
    }
  }

  if (current.trim() && !IGNORAR.test(current)) statements.push(current.trim());
  return statements;
}

async function runFile(connection, filename, log) {
  const sql = await fs.readFile(path.join(SRC, filename), 'utf8');
  const statements = splitStatements(sql);

  for (const statement of statements) {
    try {
      await connection.query(statement);
    } catch (error) {
      log(`[db:migrate] Falló una sentencia de ${filename}:`);
      log(statement.slice(0, 400));
      throw error;
    }
  }
  log(`[db:migrate] ${filename}: ${statements.length} sentencias ejecutadas.`);
}

/**
 * Aplica el esquema y los datos sintéticos. Exportada para poder reutilizarla
 * desde el adaptador sin servidor, que la invoca cuando AUTO_MIGRATE=true.
 */
export async function migrate({ log = console.log } = {}) {
  const { host, port, user, password, database } = config.mysql;
  log(`[db:migrate] Conectando a ${host}:${port} como ${user}...`);

  // 1. Conexión SIN base de datos: puede que todavía no exista.
  const admin = await mysql.createConnection({ host, port, user, password });
  try {
    try {
      await admin.query(
        `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
    } catch {
      // Sin permiso de CREATE DATABASE (habitual en MySQL gestionado).
      // No es un problema: la base ya existe y el usuario tiene acceso a ella.
      log('[db:migrate] Sin permiso para crear la base; se usará la existente.');
    }
  } finally {
    await admin.end();
  }

  // 2. Conexión ya dentro de la base de datos de destino.
  const connection = await mysql.createConnection({ host, port, user, password, database });
  try {
    await runFile(connection, 'schema.sql', log);
    await runFile(connection, 'seed.sql', log);
    log(`[db:migrate] Listo. Base de datos "${database}" creada y poblada.`);
    log('[db:migrate] Usuario de prueba: ana.reyes@meridiano.local / Demo1234!');
  } finally {
    await connection.end();
  }
}

// Ejecutado directamente (npm run db:migrate) y no importado desde otro módulo.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  migrate().catch((error) => {
    console.error('\n[db:migrate] Error:', error.message);
    process.exit(1);
  });
}
