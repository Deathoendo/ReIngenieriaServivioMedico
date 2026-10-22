import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';

import { ColorModeService } from '@coreui/angular';
import { IconSetService } from '@coreui/icons-angular';

import { iconSubset } from './icons/icon-subset';

@Component({
  selector: 'app-root',
  template: '<router-outlet />',
  imports: [RouterOutlet],
})
export class AppComponent implements OnInit {
  readonly #destroyRef = inject(DestroyRef);
  readonly #colorModeService = inject(ColorModeService);
  readonly #iconSetService = inject(IconSetService);

  constructor() {
    this.#iconSetService.icons = { ...iconSubset };

    // El tema se fuerza a claro: es un portal administrativo y el modo oscuro
    // añadiría contraste impredecible en un formulario clínico.
    this.#colorModeService.localStorageItemName.set('servmed.tema');
    this.#colorModeService.eventName.set('ColorSchemeChange');
    this.#colorModeService.colorMode.set('light');
  }

  ngOnInit(): void {
    this.#destroyRef.onDestroy(() => {
      // Sin lógica pendiente al desmontar; se deja el enganche explícito.
    });
  }
}
