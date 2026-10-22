import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Protege las rutas internas.
 *
 * Comprueba que haya token, pero eso no basta para saber si la sesión sigue viva:
 * el token puede haber sido invalidado desde otro dispositivo. La comprobación
 * definitiva la hace el servidor en la primera petición, y el interceptor cierra
 * la sesión si responde 401. Este guard solo evita entrar con la pantalla vacía.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.autenticado()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { retorno: state.url } });
};

/** Evita que un usuario ya autenticado vuelva al formulario de login. */
export const publicoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.autenticado() ? router.createUrlTree(['/']) : true;
};
