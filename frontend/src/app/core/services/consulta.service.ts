import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiSuccess,
  Catalogos,
  Colaborador,
  ConsultaDetalle,
  ConsultaPayload,
  ConsultaResumen,
  FiltrosBusqueda,
  Opcion,
} from '../models/api.models';

/**
 * Acceso al módulo de consultas médicas.
 *
 * Los métodos devuelven el tipo concreto y no `any`: si la API cambia la forma de
 * una respuesta, el compilador lo señala en lugar de dejar un `undefined` en
 * pantalla.
 */
@Injectable({ providedIn: 'root' })
export class ConsultaService {
  readonly #http = inject(HttpClient);
  readonly #base = `${environment.apiBaseUrl}/consultas`;

  buscar(filtros: FiltrosBusqueda): Observable<ApiSuccess<ConsultaResumen[]>> {
    let params = new HttpParams();

    // Solo se envían los filtros con valor: mandar cadenas vacías obliga al
    // backend a distinguir "sin filtro" de "filtro vacío" sin necesidad.
    if (filtros.cedula) params = params.set('cedula', filtros.cedula);
    if (filtros.idModalidad) params = params.set('idModalidad', String(filtros.idModalidad));
    if (filtros.fechaConsulta) params = params.set('fechaConsulta', filtros.fechaConsulta);

    return this.#http.get<ApiSuccess<ConsultaResumen[]>>(`${this.#base}/buscar`, { params });
  }

  obtener(idConsulta: number): Observable<ApiSuccess<ConsultaDetalle>> {
    return this.#http.get<ApiSuccess<ConsultaDetalle>>(`${this.#base}/${idConsulta}`);
  }

  crear(payload: ConsultaPayload): Observable<ApiSuccess<{ idConsulta: number }>> {
    return this.#http.post<ApiSuccess<{ idConsulta: number }>>(this.#base, payload);
  }

  actualizar(idConsulta: number, payload: ConsultaPayload): Observable<ApiSuccess<null>> {
    return this.#http.put<ApiSuccess<null>>(`${this.#base}/${idConsulta}`, payload);
  }

  eliminar(idConsulta: number): Observable<ApiSuccess<null>> {
    return this.#http.delete<ApiSuccess<null>>(`${this.#base}/${idConsulta}`);
  }

  colaborador(cedula: string): Observable<ApiSuccess<Colaborador>> {
    return this.#http.get<ApiSuccess<Colaborador>>(`${this.#base}/colaborador/${cedula}`);
  }

  catalogos(): Observable<ApiSuccess<Catalogos>> {
    return this.#http.get<ApiSuccess<Catalogos>>(`${this.#base}/catalogos`);
  }

  medicamentos(): Observable<ApiSuccess<Opcion[]>> {
    return this.#http.get<ApiSuccess<Opcion[]>>(`${this.#base}/medicamentos`);
  }

  lotes(): Observable<ApiSuccess<Opcion[]>> {
    return this.#http.get<ApiSuccess<Opcion[]>>(`${this.#base}/lotes`);
  }
}
