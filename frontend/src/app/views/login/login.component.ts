import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import {
  AlertComponent,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  ColComponent,
  ContainerComponent,
  FormControlDirective,
  FormDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  RowComponent,
  SpinnerComponent,
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [
    AlertComponent,
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    ColComponent,
    ContainerComponent,
    FormControlDirective,
    FormDirective,
    IconDirective,
    InputGroupComponent,
    InputGroupTextDirective,
    ReactiveFormsModule,
    RowComponent,
    SpinnerComponent,
  ],
})
export class LoginComponent {
  readonly #fb = inject(FormBuilder);
  readonly #auth = inject(AuthService);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);

  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  /** Controla si la contraseña se muestra en claro. */
  readonly verClave = signal(false);

  alternarClave(): void {
    this.verClave.update((visible) => !visible);
  }

  readonly formulario = this.#fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    // Si el interceptor cerró la sesión por un 401, se explica el motivo en
    // lugar de dejar al usuario con un login en blanco sin saber qué pasó.
    if (this.#route.snapshot.queryParamMap.get('sesion') === 'expirada') {
      this.error.set('Tu sesión se cerró. Puede haber expirado o haberse iniciado en otro dispositivo.');
    }
  }

  get email() {
    return this.formulario.controls.email;
  }

  get password() {
    return this.formulario.controls.password;
  }

  ingresar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const { email, password } = this.formulario.getRawValue();

    this.#auth.login(email, password).subscribe({
      next: () => {
        this.enviando.set(false);
        const destino = this.#route.snapshot.queryParamMap.get('retorno') ?? '/';
        this.#router.navigateByUrl(destino);
      },
      error: (error: HttpErrorResponse) => {
        this.enviando.set(false);
        this.error.set(this.mensajeDeError(error));
      },
    });
  }

  /**
   * Traduce la respuesta del backend a un mensaje para la persona.
   *
   * El backend devuelve el mismo texto para usuario inexistente y contraseña
   * incorrecta (a propósito, para no revelar qué cuentas existen), así que aquí
   * se respeta y no se intenta adivinar cuál de los dos casos fue.
   */
  private mensajeDeError(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'No se pudo contactar con el servidor. Verifica tu conexión e inténtalo de nuevo.';
    }
    if (error.status === 401) {
      return error.error?.message ?? 'Usuario o contraseña incorrectos.';
    }
    if (error.status === 403) {
      return error.error?.message ?? 'Tu cuenta no tiene permisos para acceder a este portal.';
    }
    if (error.status === 400) {
      return error.error?.message ?? 'Revisa los datos introducidos.';
    }
    return error.error?.message ?? 'Ocurrió un error inesperado. Inténtalo más tarde.';
  }
}
