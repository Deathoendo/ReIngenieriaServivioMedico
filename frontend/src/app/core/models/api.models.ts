/**
 * Modelos de la API.
 *
 * El frontend no usa `any` para las respuestas del backend. Tipar el contrato
 * convierte un cambio de nombre de campo en un error de compilación en vez de un
 * `undefined` silencioso en pantalla.
 */

/** Envoltura que devuelve toda la API cuando la operación tiene éxito. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  total?: number;
}

/** Envoltura que devuelve la API ante un error. */
export interface ApiError {
  success: false;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: number;
}

export interface Sesion {
  token: string;
  expiresIn: string;
  user: Usuario;
  authProvider: string;
}

export interface Opcion {
  id: number;
  nombre: string;
}

/** Catálogos del formulario, agrupados de la misma forma que los devuelve la API. */
export interface Catalogos {
  cargos: Opcion[];
  vicepresidencias: Opcion[];
  diagnostico: Opcion[];
  patologia: Opcion[];
  especialidad: Opcion[];
  tipo_reposo: Opcion[];
  categoria_reposo: Opcion[];
  modalidad: Opcion[];
}

export interface Diagnostico {
  diagnostico: number;
  patologia: number | null;
  especialidad: number | null;
}

/** Fila del listado de consultas (lo que devuelve `GET /consultas/buscar`). */
export interface ConsultaResumen {
  id_consulta: number;
  cedula: string;
  nombre_colaborador: string | null;
  fecha_consulta: string;
  edad: number | null;
  id_modalidad: number | null;
  modalidad: string | null;
  cargo: string | null;
  vicepresidencia: string | null;
  flag_reposo: number;
  dias_reposo: number | null;
  fecha_desde: string | null;
  fecha_hasta: string | null;
  diagnosticos_resumen: string | null;
}

/** Consulta completa con su detalle (lo que devuelve `GET /consultas/:id`). */
export interface ConsultaDetalle {
  id_consulta: number;
  cedula: string;
  fecha_consulta: string;
  edad: number | null;
  id_cargo: number | null;
  id_vicepresidencia: number | null;
  tipo_nomina: string | null;
  id_modalidad: number | null;
  tension: string | null;
  tension_b: string | null;
  frecuencia: number | null;
  temperatura: string | number | null;
  respiracion: number | null;
  talla: string | number | null;
  peso: string | number | null;
  imc: string | number | null;
  flag_reposo: number;
  id_tipo_reposo: number | null;
  id_categoria_reposo: number | null;
  dias_reposo: number | null;
  fecha_desde: string | null;
  fecha_hasta: string | null;
  fecha_reintegro: string | null;
  email_contacto: string | null;
  telefono_contacto: string | null;
  contacto_emergencia: string | null;
  diagnosticos: Array<{
    id_diagnostico: number;
    id_patologia: number | null;
    id_especialidad: number | null;
  }>;
}

/** Datos del colaborador que precargan el formulario. */
export interface Colaborador {
  cedula: string;
  nombre: string;
  id_cargo: number | null;
  id_vicepresidencia: number | null;
  tipo_nomina: string | null;
  email: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  nombre_cargo: string | null;
  nombre_vicepresidencia: string | null;
  edad: number | null;
}

/** Cuerpo que se envía al crear o actualizar una consulta. */
export interface ConsultaPayload {
  cedula?: string | null;
  fechaConsulta?: string | null;
  edad?: number | null;
  cargo?: number | null;
  vicepresidencia?: number | null;
  tipoNomina?: string | null;
  modalidad?: number | null;
  tension?: string | null;
  tensionB?: string | null;
  frecuencia?: number | null;
  temperatura?: number | null;
  respiracion?: number | null;
  talla?: number | null;
  peso?: number | null;
  imc?: number | null;
  flagReposo?: boolean;
  idTipoReposo?: number | null;
  idCategoriaReposo?: number | null;
  diasReposo?: number | null;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  fechaReintegro?: string | null;
  email?: string | null;
  telefono?: string | null;
  contactoEmergencia?: string | null;
  diagnosticos?: Diagnostico[];
}

export interface FiltrosBusqueda {
  cedula?: string | null;
  idModalidad?: number | null;
  fechaConsulta?: string | null;
}
