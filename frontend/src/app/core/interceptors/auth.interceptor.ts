import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Añade el token de sesión a cada petición y reacciona a la pérdida de sesión.
 *
 * El backend invalida el token anterior en cada login nuevo (sesión única), así
 * que un 401 no siempre significa "expiró": también ocurre cuando el usuario
 * entró desde otro dispositivo. En ambos casos la respuesta correcta es la misma,
 * cerrar la sesión local y volver al login.
 */

// Evita un bucle de redirecciones cuando varias peticiones fallan a la vez.
let cerrandoSesion = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();
  const peticion = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      // Un 401 en el propio login no debe redirigir: el login ya está en pantalla
      // y el formulario necesita mostrar el mensaje de credenciales incorrectas.
      const esLogin = req.url.includes('/auth/login');

      if (error.status === 401 && !esLogin && !cerrandoSesion) {
        cerrandoSesion = true;
        auth.limpiarSesion();
        router.navigate(['/login'], { queryParams: { sesion: 'expirada' } }).finally(() => {
          cerrandoSesion = false;
        });
      }

      return throwError(() => error);
    }),
  );
};
