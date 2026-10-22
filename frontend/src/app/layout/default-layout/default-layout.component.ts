import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NgScrollbar } from 'ngx-scrollbar';

import {
  BreadcrumbModule,
  DropdownModule,
  GridModule,
  HeaderModule,
  NavModule,
  SidebarModule,
  UtilitiesModule,
} from '@coreui/angular';

import { IconModule } from '@coreui/icons-angular';

import { DefaultHeaderComponent } from './default-header/default-header.component';
import { navItems } from './_nav';

/**
 * Armazón del portal: barra lateral, cabecera y el contenedor donde se montan
 * las vistas.
 *
 * Aquí solo vive la estructura; el menú se declara en `_nav.ts` para que
 * añadir una pantalla no obligue a tocar el componente.
 */
@Component({
  selector: 'app-default-layout',
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
  standalone: true,
  imports: [
    BreadcrumbModule,
    DefaultHeaderComponent,
    DropdownModule,
    GridModule,
    HeaderModule,
    IconModule,
    NavModule,
    NgScrollbar,
    RouterOutlet,
    SidebarModule,
    UtilitiesModule,
  ],
})
export class DefaultLayoutComponent {
  readonly navItems = navItems;
}
