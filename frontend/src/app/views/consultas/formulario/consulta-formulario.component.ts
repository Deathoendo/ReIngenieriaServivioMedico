import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import {
  BadgeComponent,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  ContainerComponent,
  FormCheckComponent,
  FormCheckInputDirective,
  FormCheckLabelDirective,
  FormControlDirective,
  FormSelectDirective,
  InputGroupComponent,
  RowComponent,
  SpinnerComponent,
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';

import { ConsultaService } from '../../../core/services/consulta.service';
import {
  Catalogos,
  Colaborador,
  ConsultaDetalle,
  ConsultaPayload,
  Diagnostico,
  Opcion,
} from '../../../core/models/api.models';

type FilaDiagnostico = FormGroup<{
  diagnostico: FormControl<number | null>;
  patologia: FormControl<number | null>;
  especialidad: FormControl<number | null>;
}>;

/**
 * Formulario de consulta, para crear y para editar.
 *
 * El mismo componente sirve a las dos rutas (`/consultas/nueva` y
 * `/consultas/:id`): el modo se decide por la presencia del parámetro `id`, así
 * que las reglas de captura viven en un solo lugar y no pueden divergir entre
 * alta y edición.
 */
@Component({
  selector: 'app-consulta-formulario',
  templateUrl: './consulta-formulario.component.html',
  imports: [
    BadgeComponent,
    ButtonDirective,
    CardBodyComponent,
    CardComponent,
    CardHeaderComponent,
    ColComponent,
    ContainerComponent,
    FormCheckComponent,
    FormCheckInputDirective,
    FormCheckLabelDirective,
    FormControlDirective,
    FormSelectDirective,
    IconDirective,
    InputGroupComponent,
    ReactiveFormsModule,
    RouterLink,
    RowComponent,
    SpinnerComponent,
  ],
})
export class ConsultaFormularioComponent {
  readonly #fb = inject(FormBuilder);
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #consultas = inject(ConsultaService);

  readonly idConsulta = signal<number | null>(null);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly buscandoColaborador = signal(false);
  readonly error = signal<string | null>(null);
  readonly aviso = signal<string | null>(null);
  readonly colaborador = signal<Colaborador | null>(null);
  readonly catalogos = signal<Catalogos | null>(null);

  readonly formulario = this.#fb.group({
    cedula: ['', [Validators.required]],
    fechaConsulta: [new Date().toISOString().slice(0, 10), [Validators.required]],
    edad: [null as number | null],
    cargo: [null as number | null],
    vicepresidencia: [null as number | null],
    tipoNomina: [''],
    modalidad: [null as number | null],

    tension: [''],
    tensionB: [''],
    frecuencia: [null as number | null],
    temperatura: [null as number | null],
    respiracion: [null as number | null],
    talla: [null as number | null],
    peso: [null as number | null],
    imc: [null as number | null],

    flagReposo: [false],
    idTipoReposo: [null as number | null],
    idCategoriaReposo: [null as number | null],
    diasReposo: [null as number | null],
    fechaDesde: [''],
    fechaHasta: [''],
    fechaReintegro: [''],

    email: [''],
    telefono: [''],
    contactoEmergencia: [''],

    diagnosticos: this.#fb.array<FilaDiagnostico>([]),
  });

  constructor() {
    const id = Number(this.#route.snapshot.paramMap.get('id'));
    this.idConsulta.set(Number.isFinite(id) && id > 0 ? id : null);

    this.cargarCatalogos();
    this.engancharCalculoImc();

    if (this.idConsulta()) {
      this.cargarConsulta(this.idConsulta()!);
    } else {
      this.agregarDiagnostico();
      this.cargando.set(false);
    }
  }

  get esEdicion(): boolean {
    return this.idConsulta() !== null;
  }

  get diagnosticos(): FormArray<FilaDiagnostico> {
    return this.formulario.controls.diagnosticos;
  }

  private cargarCatalogos(): void {
    this.#consultas.catalogos().subscribe({
      next: (respuesta) => {
        this.catalogos.set(respuesta.data);
        if (respuesta.data.modalidad?.length && !this.esEdicion) {
          this.formulario.controls.modalidad.setValue(respuesta.data.modalidad[0].id);
        }
      },
      error: () => {
        this.error.set('No se pudieron cargar los catálogos. Recarga la página.');
        this.cargando.set(false);
      },
    });
  }

  private cargarConsulta(id: number): void {
    this.#consultas.obtener(id).subscribe({
      next: (respuesta) => {
        this.aplicarConsulta(respuesta.data);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          error.status === 404
            ? 'La consulta solicitada no existe.'
            : 'No se pudo cargar la consulta.',
        );
        this.cargando.set(false);
      },
    });
  }

  private aplicarConsulta(consulta: ConsultaDetalle): void {
    this.formulario.patchValue({
      cedula: consulta.cedula,
      fechaConsulta: consulta.fecha_consulta,
      edad: consulta.edad,
      cargo: consulta.id_cargo,
      vicepresidencia: consulta.id_vicepresidencia,
      tipoNomina: consulta.tipo_nomina ?? '',
      modalidad: consulta.id_modalidad,
      tension: consulta.tension ?? '',
      tensionB: consulta.tension_b ?? '',
      frecuencia: consulta.frecuencia,
      temperatura: numero(consulta.temperatura),
      respiracion: consulta.respiracion,
      talla: numero(consulta.talla),
      peso: numero(consulta.peso),
      imc: numero(consulta.imc),
      flagReposo: consulta.flag_reposo === 1,
      idTipoReposo: consulta.id_tipo_reposo,
      idCategoriaReposo: consulta.id_categoria_reposo,
      diasReposo: consulta.dias_reposo,
      fechaDesde: consulta.fecha_desde ?? '',
      fechaHasta: consulta.fecha_hasta ?? '',
      fechaReintegro: consulta.fecha_reintegro ?? '',
      email: consulta.email_contacto ?? '',
      telefono: consulta.telefono_contacto ?? '',
      contactoEmergencia: consulta.contacto_emergencia ?? '',
    });

    this.diagnosticos.clear();
    for (const item of consulta.diagnosticos) {
      this.diagnosticos.push(this.filaDiagnostico(item.id_diagnostico, item.id_patologia, item.id_especialidad));
    }
    if (this.diagnosticos.length === 0) this.agregarDiagnostico();

    // Los datos del colaborador se recuperan aparte porque la consulta guarda
    // una copia histórica del cargo, no la referencia viva del colaborador.
    this.buscarColaborador(false);
  }

  /**
   * Recalcula el IMC cuando cambian talla o peso.
   *
   * El backend rechaza un IMC que no cuadre con sus insumos, así que calcularlo
   * aquí evita un error de validación por un dato que la propia pantalla puede
   * deducir. `emitEvent: false` corta la recursión entre talla, peso e imc.
   */
  private engancharCalculoImc(): void {
    const { talla, peso } = this.formulario.controls;

    const recalcular = () => {
      const t = Number(talla.value);
      const p = Number(peso.value);
      const imc = t > 0 && p > 0 ? Number((p / (t * t)).toFixed(2)) : null;
      this.formulario.controls.imc.setValue(imc, { emitEvent: false });
    };

    talla.valueChanges.pipe(takeUntilDestroyed()).subscribe(recalcular);
    peso.valueChanges.pipe(takeUntilDestroyed()).subscribe(recalcular);
  }

  buscarColaborador(mostrarAviso = true): void {
    const cedula = (this.formulario.controls.cedula.value ?? '').trim();
    if (!cedula) {
      if (mostrarAviso) this.aviso.set('Escribe una cédula para buscar al colaborador.');
      return;
    }

    this.buscandoColaborador.set(true);
    this.aviso.set(null);

    this.#consultas.colaborador(cedula).subscribe({
      next: (respuesta) => {
        const datos = respuesta.data;
        this.colaborador.set(datos);

        // Solo se rellenan los campos que el usuario no haya tocado en modo alta:
        // al editar una consulta histórica, los valores guardados mandan.
        if (!this.esEdicion) {
          this.formulario.patchValue({
            edad: datos.edad,
            cargo: datos.id_cargo,
            vicepresidencia: datos.id_vicepresidencia,
            tipoNomina: datos.tipo_nomina ?? '',
            email: datos.email ?? '',
            telefono: datos.telefono ?? '',
          });
        }

        this.buscandoColaborador.set(false);
        if (mostrarAviso) {
          this.aviso.set(`Colaborador encontrado: ${datos.nombre}`);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.colaborador.set(null);
        this.buscandoColaborador.set(false);
        this.aviso.set(
          error.status === 404
            ? 'No existe un colaborador activo con esa cédula.'
            : 'No se pudieron obtener los datos del colaborador.',
        );
      },
    });
  }

  agregarDiagnostico(): void {
    if (this.diagnosticos.length >= 20) return;
    this.diagnosticos.push(this.filaDiagnostico());
  }

  quitarDiagnostico(indice: number): void {
    this.diagnosticos.removeAt(indice);
  }

  private filaDiagnostico(
    diagnostico: number | null = null,
    patologia: number | null = null,
    especialidad: number | null = null,
  ): FilaDiagnostico {
    return this.#fb.group({
      diagnostico: this.#fb.control<number | null>(diagnostico, [Validators.required]),
      patologia: this.#fb.control<number | null>(patologia),
      especialidad: this.#fb.control<number | null>(especialidad),
    }) as FilaDiagnostico;
  }

  guardar(): void {
    this.error.set(null);
    this.aviso.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Revisa los campos marcados antes de guardar.');
      return;
    }

    const valor = this.formulario.getRawValue();

    // Los diagnósticos se construyen con un bucle explícito en vez de `filter` +
    // `map`: el formulario permite filas incompletas (una recién añadida) y aquí
    // queda claro que se descartan, en lugar de depender de un type guard.
    const diagnosticos: Diagnostico[] = [];
    for (const fila of valor.diagnosticos) {
      if (fila.diagnostico === null) continue;
      diagnosticos.push({
        diagnostico: fila.diagnostico,
        patologia: fila.patologia,
        especialidad: fila.especialidad,
      });
    }

    const payload: ConsultaPayload = {
      cedula: (valor.cedula ?? '').trim(),
      fechaConsulta: valor.fechaConsulta ?? '',
      edad: valor.edad,
      cargo: valor.cargo,
      vicepresidencia: valor.vicepresidencia,
      tipoNomina: textoOpcional(valor.tipoNomina),
      modalidad: valor.modalidad,
      tension: textoOpcional(valor.tension),
      tensionB: textoOpcional(valor.tensionB),
      frecuencia: valor.frecuencia,
      temperatura: valor.temperatura,
      respiracion: valor.respiracion,
      talla: valor.talla,
      peso: valor.peso,
      imc: valor.imc,
      flagReposo: valor.flagReposo === true,
      idTipoReposo: valor.idTipoReposo,
      idCategoriaReposo: valor.idCategoriaReposo,
      diasReposo: valor.diasReposo,
      fechaDesde: textoOpcional(valor.fechaDesde),
      fechaHasta: textoOpcional(valor.fechaHasta),
      fechaReintegro: textoOpcional(valor.fechaReintegro),
      email: textoOpcional(valor.email),
      telefono: textoOpcional(valor.telefono),
      contactoEmergencia: textoOpcional(valor.contactoEmergencia),
      diagnosticos,
    };

    this.guardando.set(true);
    // Se anota como `Observable<unknown>` porque las dos ramas devuelven
    // respuestas distintas (`idConsulta` al crear, sin cuerpo al actualizar); sin
    // la anotación la unión de tipos no es suscribible.
    const peticion: Observable<unknown> = this.esEdicion
      ? this.#consultas.actualizar(this.idConsulta()!, payload)
      : this.#consultas.crear(payload);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.#router.navigate(['/consultas']);
      },
      error: (error: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(this.mensajeDeError(error));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  }

  private mensajeDeError(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'No se pudo contactar con el servidor. Verifica tu conexión.';
    }
    return error.error?.message ?? 'No se pudo guardar la consulta.';
  }
}

/** MySQL devuelve los DECIMAL como cadena para no perder precisión. */
function numero(valor: string | number | null): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/**
 * Convierte una cadena del formulario en `null` si está vacía.
 * El backend distingue "sin dato" de "cadena vacía"; enviar `''` haría que
 * validadores como el de correo recibieran un valor que no es ni vacío ni válido.
 */
function textoOpcional(valor: string | null): string | null {
  const limpio = (valor ?? '').trim();
  return limpio === '' ? null : limpio;
}
