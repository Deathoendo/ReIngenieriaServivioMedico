import * as consultaService from '../services/consulta.service.js';

/**
 * Controladores del módulo de consultas.
 *
 * Su única responsabilidad es traducir HTTP <-> servicio: leen la petición,
 * llaman al servicio y formatean la respuesta. No contienen reglas de negocio,
 * que es lo que permite probar el servicio sin levantar un servidor.
 */

/** GET /api/consultas/buscar?cedula=&idModalidad=&fechaConsulta= */
export async function buscar(req, res) {
  const data = await consultaService.buscar(req.query, req.user.id);
  res.status(200).json({ success: true, total: data.length, data });
}

/** GET /api/consultas/:id */
export async function obtener(req, res) {
  const data = await consultaService.obtener(req.params.id);
  res.status(200).json({ success: true, data });
}

/** GET /api/consultas/colaborador/:cedula */
export async function colaborador(req, res) {
  const data = await consultaService.datosColaborador(req.params.cedula);
  res.status(200).json({ success: true, data });
}

/** POST /api/consultas */
export async function crear(req, res) {
  const resultado = await consultaService.crear(req.body, req.user.id);
  res.status(201).json({
    success: true,
    message: resultado.message,
    data: { idConsulta: resultado.idConsulta },
  });
}

/** PUT /api/consultas/:id */
export async function actualizar(req, res) {
  const resultado = await consultaService.actualizar(req.params.id, req.body);
  res.status(200).json({ success: true, message: resultado.message });
}

/** DELETE /api/consultas/:id */
export async function eliminar(req, res) {
  const resultado = await consultaService.eliminar(req.params.id);
  res.status(200).json({ success: true, message: resultado.message });
}

/* ----------------------------------------------------------------- catálogos */

/** GET /api/consultas/catalogos — todos los combos en una sola llamada. */
export async function catalogos(req, res) {
  const [cargos, vicepresidencias, subdatos] = await Promise.all([
    consultaService.cargos(),
    consultaService.vicepresidencias(),
    consultaService.subdatos(),
  ]);
  res.status(200).json({ success: true, data: { cargos, vicepresidencias, ...subdatos } });
}

/** GET /api/consultas/cargos */
export async function cargos(req, res) {
  res.status(200).json({ success: true, data: await consultaService.cargos() });
}

/** GET /api/consultas/vicepresidencias */
export async function vicepresidencias(req, res) {
  res.status(200).json({ success: true, data: await consultaService.vicepresidencias() });
}

/** GET /api/consultas/medicamentos */
export async function medicamentos(req, res) {
  res.status(200).json({ success: true, data: await consultaService.medicamentos() });
}

/** GET /api/consultas/lotes — lotes vigentes con existencias. */
export async function lotes(req, res) {
  res.status(200).json({ success: true, data: await consultaService.lotes() });
}
