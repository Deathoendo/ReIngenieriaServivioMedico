#!/usr/bin/env node
/**
 * Carga el esquema y los datos sintéticos en MySQL.
 *
 * Uso:  npm run db:migrate
 *
 * Lee los .sql y los ejecuta statement por statement. Se usa el cliente de la
 * librería (y no el `mysql` del sistema) para que funcione sin instalar nada
 * extra; el único cuidado es respetar los delimitadores de los stored procedures.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '../src/db');

/**
 * Divide un script SQL en sentencias, respetando los bloques DELIMITER de los
 * stored procedures (que contienen `;` en su interior y romperían un split ingenuo).
 */
function splitStatements(sql) {
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
      if (statement) statements.push(statement);
      current = '';
    }
  }

  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function runFile(connection, filename) {
  const sql = await fs.readFile(path.join(SRC, filename), 'utf8');
  const statements = splitStatements(sql);

  for (const statement of statements) {
    try {
      await connection.query(statement);
    } catch (error) {
      console.error(`\n[db:migrate] Falló una sentencia de ${filename}:`);
      console.error(statement.slice(0, 400));
      throw error;
    }
  }
  console.log(`[db:migrate] ${filename}: ${statements.length} sentencias ejecutadas.`);
}

async function main() {
  console.log(
    `[db:migrate] Conectando a ${config.mysql.host}:${config.mysql.port} como ${config.mysql.user}...`,
  );

  // Sin `database`: el esquema puede no existir todavía, y es el propio
  // schema.sql el que hace el CREATE DATABASE.
  const connection = await mysql.createConnection({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    multipleStatements: false,
  });

  try {
    await runFile(connection, 'schema.sql');
    await runFile(connection, 'seed.sql');
    console.log('\n[db:migrate] Listo. Base de datos "servicio_medico" creada y poblada.');
    console.log('[db:migrate] Usuario de prueba: ana.reyes@meridiano.local / Demo1234!');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('\n[db:migrate] Error:', error.message);
  process.exit(1);
});
