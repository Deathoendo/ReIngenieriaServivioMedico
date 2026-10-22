import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ButtonDirective,
  ColComponent,
  ContainerComponent,
  RowComponent,
} from '@coreui/angular';

@Component({
  selector: 'app-no-encontrado',
  template: `
    <div class="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <c-container>
        <c-row class="justify-content-center">
          <c-col md="6" class="text-center">
            <h1 class="display-1 fw-bold text-body-secondary mb-0">404</h1>
            <p class="fs-4 mb-2">Página no encontrada</p>
            <p class="text-body-secondary mb-4">
              La dirección a la que intentaste entrar no existe o fue movida.
            </p>
            <a cButton color="primary" routerLink="/">Volver al inicio</a>
          </c-col>
        </c-row>
      </c-container>
    </div>
  `,
  imports: [ButtonDirective, ColComponent, ContainerComponent, RouterLink, RowComponent],
})
export class NoEncontradoComponent {}
