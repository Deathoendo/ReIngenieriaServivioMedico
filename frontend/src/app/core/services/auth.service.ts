import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiSuccess, Sesion, Usuario } from '../models/api.models';

const CLAVE_TOKEN = 'servmed.token';
const CLAVE_USUARIO = 'servmed.usuario';

/**
 * Sesión del usuario.
 *
 * El estado vive en señales para que la interfaz (por ejemplo el nombre en la
 * cabecera) reaccione sola al login y al logout, sin recargar la página.
 *
 * El token se guarda en `sessionStorage` y no en `localStorage`: la sesión debe
 * morir al cerrar la pestaña, que es el comportamiento esperado en un sistema
 * clínico compartido entre turnos.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #http = inject(HttpClient);

  readonly #token = signal<string | null>(sessionStorage.getItem(CLAVE_TOKEN));
  readonly #usuario = signal<Usuario | null>(leerUsuarioGuardado());

  readonly usuario = this.#usuario.asReadonly();
  readonly autenticado = computed(() => this.#token() !== null);
  readonly nombre = computed(() => this.#usuario()?.nombre ?? '');

  login(email: string, password: string): Observable<ApiSuccess<Sesion>> {
    return this.#http
      .post<ApiSuccess<Sesion>>(`${environment.apiBaseUrl}/auth/login`, { email, password })
      .pipe(
        tap((respuesta) => {
          sessionStorage.setItem(CLAVE_TOKEN, respuesta.data.token);
          sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.data.user));
          this.#token.set(respuesta.data.token);
          this.#usuario.set(respuesta.data.user);
        }),
      );
  }

  logout(): void {
    // Se avisa al servidor para que invalide el token; si falla, la sesión local
    // se cierra igual. No tiene sentido bloquear al usuario en un sistema
    // clínico porque el backend no respondió al cerrar sesión.
    this.#http.post(`${environment.apiBaseUrl}/auth/logout`, {}).subscribe({
      error: () => this.limpiarSesion(),
      complete: () => this.limpiarSesion(),
    });
  }

  /** Cierre local sin llamada al servidor. Lo usa el interceptor ante un 401. */
  limpiarSesion(): void {
    sessionStorage.removeItem(CLAVE_TOKEN);
    sessionStorage.removeItem(CLAVE_USUARIO);
    this.#token.set(null);
    this.#usuario.set(null);
  }

  getToken(): string | null {
    return this.#token();
  }
}

function leerUsuarioGuardado(): Usuario | null {
  const crudo = sessionStorage.getItem(CLAVE_USUARIO);
  if (!crudo) return null;
  try {
    return JSON.parse(crudo) as Usuario;
  } catch {
    // Dato corrupto en el almacenamiento: se descarta en vez de romper el arranque.
    sessionStorage.removeItem(CLAVE_USUARIO);
    return null;
  }
}
