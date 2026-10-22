import { INavData } from '@coreui/angular';

/** Menú lateral del portal. */
export const navItems: INavData[] = [
  {
    name: 'Inicio',
    url: '/',
    iconComponent: { name: 'cilHome' },
  },
  {
    name: 'Consultas médicas',
    iconComponent: { name: 'cilSpreadsheet' },
    children: [
      {
        name: 'Listado',
        url: '/consultas',
        iconComponent: { name: 'cilList' },
      },
      {
        name: 'Nueva consulta',
        url: '/consultas/nueva',
        iconComponent: { name: 'cilPlus' },
      },
    ],
  },
];
