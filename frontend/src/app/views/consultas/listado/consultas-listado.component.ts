import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import {
  BadgeComponent,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  ContainerComponent,
  FormControlDirective,
  FormSelectDirective,
  RowComponent,
  SpinnerComponent,
  TableDirective,
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';

import { ConsultaService } from '../../../core/services/consulta.service';
import { Catalogos, ConsultaResumen, Opcion } from '../../../core/models/api.models';

/**
 * Listado de consultas con filtros.
 *
 * Los catálogos se cargan una sola vez al entrar y se reutilizan tanto en los
 * filtros como en el formulario. Se piden en una única llamada a `/catalogos`
 * en lugar de una por combo.
 */
@Component({
  selector: 'app-consultas-listado',
  templateUrl: './consultas-listado.component.html',
  imports: [
    BadgeComponent,
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    ColComponent,
    ContainerComponent,
    FormControlDirective,
    FormSelectDirective,
    IconDirective,
    ReactiveFormsModule,
    RouterLink,
    RowComponent,
    SpinnerComponent,
    TableDirective,
  ],
})
export class ConsultasListadoComponent {
  readonly #fb = inject(FormBuilder);
  readonly #consultas = inject(ConsultaService);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly resultados = signal<ConsultaResumen[]>([]);
  readonly modalidades = signal<Opcion[]>([]);
  readonly eliminando = signal<number | null>(null);
  readonly buscado = signal(false);

  readonly filtros = this.#fb.nonNullable.group({
    cedula: [''],
    idModalidad: [0],
    fechaConsulta: [''],
  });

  constructor() {
    this.cargarModalidades();
    this.buscar();
  }

  private cargarModalidades(): void {
    this.#consultas.catalogos().subscribe({
      next: (respuesta: { data: Catalogos }) => this.modalidades.set(respuesta.data.modalidad ?? []),
      // Los filtros siguen siendo utilizables sin el combo de modalidad: no se
      // bloquea la pantalla por un catálogo que es un filtro secundario.
      error: () => this.modalidades.set([]),
    });
  }

  buscar(): void {
    const { cedula, idModalidad, fechaConsulta } = this.filtros.getRawValue();

    this.cargando.set(true);
    this.error.set(null);

    this.#consultas
      .buscar({
        cedula: cedula.trim() || null,
        idModalidad: idModalidad || null,
        fechaConsulta: fechaConsulta || null,
      })
      .subscribe({
        next: (respuesta) => {
          this.resultados.set(respuesta.data ?? []);
          this.buscado.set(true);
          this.cargando.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(error.error?.message ?? 'No se pudieron obtener las consultas.');
          this.resultados.set([]);
          this.cargando.set(false);
        },
      });
  }

  limpiar(): void {
    this.filtros.reset({ cedula: '', idModalidad: 0, fechaConsulta: '' });
    this.buscar();
  }

  eliminar(consulta: ConsultaResumen): void {
    const etiqueta = consulta.nombre_colaborador ?? consulta.cedula;
    const confirmado = window.confirm(
      `¿Eliminar la consulta de ${etiqueta} del ${consulta.fecha_consulta}?\n\n` +
        'Se borrarán también sus diagnósticos. Esta acción no se puede deshacer.',
    );
    if (!confirmado) return;

    this.eliminando.set(consulta.id_consulta);
    this.#consultas.eliminar(consulta.id_consulta).subscribe({
      next: () => {
        this.eliminando.set(null);
        // Se vuelve a consultar al servidor en vez de quitar la fila de la lista:
        // así la pantalla refleja el estado real y no una suposición del cliente.
        this.buscar();
      },
      error: (error: HttpErrorResponse) => {
        this.eliminando.set(null);
        this.error.set(error.error?.message ?? 'No se pudo eliminar la consulta.');
      },
    });
  }

  readonly columnas = [
    'Fecha',
    'Colaborador',
    'Modalidad',
    'Cargo',
    'Diagnóstico',
    'Reposo',
    '',
  ];
}
