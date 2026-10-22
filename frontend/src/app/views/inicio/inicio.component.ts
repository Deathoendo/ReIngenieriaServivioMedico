import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  BadgeComponent,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  ContainerComponent,
  RowComponent,
  SpinnerComponent,
  TableDirective,
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';

import { AuthService } from '../../core/services/auth.service';
import { ConsultaService } from '../../core/services/consulta.service';
import { ConsultaResumen } from '../../core/models/api.models';

/**
 * Pantalla de inicio: identidad de la sesión y las consultas del día.
 *
 * Se resolvió con la llamada a `/consultas/buscar` sin filtros y contando en el
 * cliente, en lugar de añadir un endpoint de estadísticas para un dato que el
 * listado ya devuelve. El límite de 500 filas del backend lo hace suficiente.
 */
@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  imports: [
    BadgeComponent,
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    ColComponent,
    ContainerComponent,
    IconDirective,
    RouterLink,
    RowComponent,
    SpinnerComponent,
    TableDirective,
  ],
})
export class InicioComponent {
  readonly auth = inject(AuthService);
  readonly #consultas = inject(ConsultaService);

  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly recientes = signal<ConsultaResumen[]>([]);
  readonly total = signal(0);
  readonly conReposo = signal(0);
  readonly hoy = signal(0);

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.#consultas.buscar({}).subscribe({
      next: (respuesta) => {
        const datos = respuesta.data ?? [];
        const fechaHoy = new Date().toISOString().slice(0, 10);

        this.total.set(datos.length);
        this.conReposo.set(datos.filter((c) => c.flag_reposo === 1).length);
        this.hoy.set(datos.filter((c) => c.fecha_consulta === fechaHoy).length);
        this.recientes.set(datos.slice(0, 5));
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las consultas recientes.');
        this.cargando.set(false);
      },
    });
  }

  readonly tarjetas = [
    { clave: 'total', titulo: 'Consultas registradas', color: 'primary', icono: 'cilSpreadsheet' },
    { clave: 'hoy', titulo: 'Registradas hoy', color: 'info', icono: 'cilCalendar' },
    { clave: 'reposo', titulo: 'Con reposo emitido', color: 'warning', icono: 'cilMedicalCross' },
  ];

  valor(clave: string): number {
    if (clave === 'total') return this.total();
    if (clave === 'hoy') return this.hoy();
    return this.conReposo();
  }
}
