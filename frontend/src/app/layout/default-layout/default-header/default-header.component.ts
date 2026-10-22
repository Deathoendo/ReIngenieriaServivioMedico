import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, inject, Input, OnInit, Renderer2 } from '@angular/core';

import {
  AvatarComponent,
  BreadcrumbModule,
  DropdownDividerDirective,
  DropdownHeaderDirective,
  DropdownItemDirective,
  DropdownMenuDirective,
  DropdownModule,
  DropdownToggleDirective,
  GridModule,
  HeaderComponent,
  HeaderModule,
  NavModule,
  SidebarModule,
} from '@coreui/angular';
import { IconModule } from '@coreui/icons-angular';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-default-header',
  templateUrl: './default-header.component.html',
  styleUrls: ['./default-header.component.scss'],
  standalone: true,
  imports: [
    AvatarComponent,
    BreadcrumbModule,
    CommonModule,
    DropdownDividerDirective,
    DropdownHeaderDirective,
    DropdownItemDirective,
    DropdownMenuDirective,
    DropdownModule,
    DropdownToggleDirective,
    GridModule,
    HeaderModule,
    IconModule,
    NavModule,
    SidebarModule,
  ],
})
export class DefaultHeaderComponent extends HeaderComponent implements OnInit {
  readonly #document = inject(DOCUMENT);
  readonly #renderer = inject(Renderer2);
  readonly auth = inject(AuthService);

  @Input() sidebarId = 'sidebar';

  constructor() {
    super();
  }

  ngOnInit(): void {
    // El portal se fija en tema claro: en un formulario clínico el contraste no
    // debe depender de la preferencia del sistema operativo.
    this.#renderer.setAttribute(this.#document.body, 'data-coreui-theme', 'light');
  }

  cerrarSesion(): void {
    this.auth.logout();
  }
}
