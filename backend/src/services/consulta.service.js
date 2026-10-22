import * as consultas from '../repositories/consulta.repository.js';
import * as catalogos from '../repositories/catalogo.repository.js';
import { badRequest, notFound } from '../errors.js';
import * as v from '../validate.js';

/**
 * Reglas de negocio del módulo de consultas médicas.
 * Los controladores traducen HTTP; aquí vive lo que tiene que cumplirse siempre,
 * sin importar si la llamada viene de la API, de un script o de un test.
 */

export async function buscar(filtros, idUsuario) {
  const limpios = {
    cedula: v.asCedula(filtros.cedula, 'cedula'),
    idModalidad: v.asInt(filtros.idModalidad, 'idModalidad', { min: 1 }),
    fechaConsulta: v.asDate(filtros.fechaConsulta, 'fechaConsulta'),
  };

  const resultado = await consultas.buscar(limpios, idUsuario);
  if (!resultado.success) {
    throw badRequest(resultado.mensaje || 'No se pudo buscar consultas');
  }
  return resultado.data;
}

export async function obtener(idConsulta) {
  const id = v.asInt(idConsulta, 'id', { required: true, min: 1 });
  const resultado = await consultas.obtenerPorId(id);

  if (!resultado.success) {
    throw badRequest(resultado.mensaje || 'No se pudo obtener la consulta');
  }
  if (!resultado.data) {
    throw notFound('La consulta solicitada no existe');
  }
  return resultado.data;
}

export async function datosColaborador(cedula) {
  const limpia = v.asCedula(cedula, 'cedula', { required: true });
  const resultado = await consultas.datosColaborador(limpia);

  if (!resultado.success) {
    throw notFound(resultado.mensaje || 'Colaborador no encontrado');
  }
  return resultado.data;
}

export async function crear(payload, idUsuario) {
  const limpio = normalizar(payload, { exigirCedula: true, exigirFecha: true });
  await assertReferenciasValidas(limpio.diagnosticos);

  const resultado = await consultas.crear(limpio, idUsuario);

  if (!resultado.success) {
    // El SP usa el código para distinguir validación de negocio (2 y 3) de error
    // interno (1). Se traduce a 400 para que el cliente pueda corregir el dato.
    throw badRequest(resultado.message || 'No se pudo registrar la consulta');
  }
  return resultado;
}

export async function actualizar(idConsulta, payload) {
  const id = v.asInt(idConsulta, 'id', { required: true, min: 1 });
  const limpio = normalizar(payload, { exigirCedula: false, exigirFecha: false });
  await assertReferenciasValidas(limpio.diagnosticos);

  const resultado = await consultas.actualizar(id, limpio);

  if (!resultado.success) {
    throw badRequest(resultado.message || 'No se pudo actualizar la consulta');
  }
  return resultado;
}

/**
 * Rechaza la petición si algún diagnóstico apunta a un catálogo inexistente.
 * Sin esta comprobación el error llegaría como violación de clave foránea (500)
 * en vez de un 400 que le diga al cliente exactamente qué id está mal.
 */
async function assertReferenciasValidas(diagnosticos) {
  const faltantes = await consultas.referenciasInvalidas(diagnosticos);
  const tipos = Object.keys(faltantes);
  if (tipos.length === 0) return;

  const detalle = tipos
    .map((tipo) => `${tipo}: ${faltantes[tipo].join(', ')}`)
    .join('; ');

  throw badRequest(`Los siguientes ids no existen en el catálogo -> ${detalle}`, {
    field: 'diagnosticos',
    desconocidos: faltantes,
  });
}

export async function eliminar(idConsulta) {
  const id = v.asInt(idConsulta, 'id', { required: true, min: 1 });
  const resultado = await consultas.eliminar(id);

  if (!resultado.success) {
    const mensaje = resultado.message || 'No se pudo eliminar la consulta';
    throw mensaje.includes('no existe') ? notFound(mensaje) : badRequest(mensaje);
  }
  return resultado;
}

export async function cargos() {
  const resultado = await catalogos.listarCargos();
  if (!resultado.success) throw badRequest(resultado.mensaje);
  return resultado.data;
}

export async function vicepresidencias() {
  const resultado = await catalogos.listarVicepresidencias();
  if (!resultado.success) throw badRequest(resultado.mensaje);
  return resultado.data;
}

export async function subdatos() {
  const resultado = await catalogos.listarSubdatos();
  if (!resultado.success) throw badRequest(resultado.mensaje);

  // El SP devuelve todos los catálogos en una sola lista etiquetada por `tipo`.
  // Aquí se agrupan por tipo para que el frontend los consuma directamente.
  const agrupados = {};
  for (const fila of resultado.data) {
    (agrupados[fila.tipo] ??= []).push({ id: fila.id, nombre: fila.nombre });
  }
  return agrupados;
}

export async function medicamentos() {
  const resultado = await catalogos.listarMedicamentos();
  if (!resultado.success) throw badRequest(resultado.mensaje);
  return resultado.data;
}

export async function lotes() {
  const resultado = await catalogos.listarLotesDisponibles();
  if (!resultado.success) throw badRequest(resultado.mensaje);
  return resultado.data;
}

/** Normaliza y valida el cuerpo de una consulta. */
function normalizar(payload, { exigirCedula, exigirFecha }) {
  const limpio = {
    cedula: v.asCedula(payload.cedula, 'cedula', { required: exigirCedula }),
    fechaConsulta: v.asDate(payload.fechaConsulta, 'fechaConsulta', { required: exigirFecha }),
    edad: v.asInt(payload.edad, 'edad', { min: 0, max: 120 }),
    cargo: v.asInt(payload.cargo, 'cargo', { min: 1 }),
    vicepresidencia: v.asInt(payload.vicepresidencia, 'vicepresidencia', { min: 1 }),
    tipoNomina: v.asString(payload.tipoNomina, 'tipoNomina', { max: 30 }),
    modalidad: v.asInt(payload.modalidad, 'modalidad', { min: 1 }),

    tension: v.asString(payload.tension, 'tension', { max: 10 }),
    tensionB: v.asString(payload.tensionB, 'tensionB', { max: 10 }),
    frecuencia: v.asInt(payload.frecuencia, 'frecuencia', { min: 0, max: 300 }),
    temperatura: v.asDecimal(payload.temperatura, 'temperatura', { min: 25, max: 45 }),
    respiracion: v.asInt(payload.respiracion, 'respiracion', { min: 0, max: 120 }),
    talla: v.asDecimal(payload.talla, 'talla', { min: 0.3, max: 2.8 }),
    peso: v.asDecimal(payload.peso, 'peso', { min: 1, max: 400 }),
    imc: v.asDecimal(payload.imc, 'imc', { min: 5, max: 90 }),

    flagReposo: v.asBoolean(payload.flagReposo, 'flagReposo'),
    idTipoReposo: v.asInt(payload.idTipoReposo, 'idTipoReposo', { min: 1 }),
    idCategoriaReposo: v.asInt(payload.idCategoriaReposo, 'idCategoriaReposo', { min: 1 }),
    diasReposo: v.asInt(payload.diasReposo, 'diasReposo', { min: 0, max: 365 }),
    fechaDesde: v.asDate(payload.fechaDesde, 'fechaDesde'),
    fechaHasta: v.asDate(payload.fechaHasta, 'fechaHasta'),
    fechaReintegro: v.asDate(payload.fechaReintegro, 'fechaReintegro'),

    email: v.asEmail(payload.email, 'email'),
    telefono: v.asString(payload.telefono, 'telefono', { max: 25 }),
    contactoEmergencia: v.asString(payload.contactoEmergencia, 'contactoEmergencia', { max: 120 }),

    diagnosticos: v.asDiagnosticos(payload.diagnosticos),
  };

  validarCoherencia(limpio);
  return limpio;
}

/** Reglas que cruzan varios campos y que ningún validador individual puede ver. */
function validarCoherencia(datos) {
  if (datos.flagReposo) {
    if (!datos.idTipoReposo) {
      throw badRequest('Si la consulta genera reposo, debes indicar el tipo de reposo', {
        field: 'idTipoReposo',
      });
    }
    if (datos.fechaDesde && datos.fechaHasta && datos.fechaHasta < datos.fechaDesde) {
      throw badRequest('La fecha de fin de reposo no puede ser anterior a la de inicio', {
        field: 'fechaHasta',
      });
    }
  }

  if (datos.imc && datos.talla && datos.peso) {
    // El IMC puede venir calculado por el frontend, pero se valida contra sus
    // propios insumos: un IMC incoherente en un registro clínico es un dato malo.
    const esperado = Number((datos.peso / (datos.talla * datos.talla)).toFixed(2));
    if (Math.abs(esperado - datos.imc) > 1) {
      throw badRequest(
        `El IMC (${datos.imc}) no coincide con la talla y el peso indicados (esperado: ${esperado})`,
        { field: 'imc' },
      );
    }
  }
}
