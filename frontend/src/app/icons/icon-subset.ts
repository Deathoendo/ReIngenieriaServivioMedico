/**
 * Iconos que se registran en el arranque de la aplicación.
 *
 * CoreUI trae cientos de iconos y el registro por defecto los incluye todos.
 * Aquí se declara solo la lista que las pantallas usan de verdad: cualquier
 * icono que se agregue a una plantilla y no esté en esta lista se verá en
 * blanco, así que conviene mantenerla al día.
 *
 * Antes incluía el enum `IconSubset` con la misma lista repetida; se eliminó
 * porque nadie lo consumía y era una tercera copia que podía quedar obsoleta.
 */
import {
  cilAccountLogout,
  cilCalendar,
  cilEnvelopeClosed,
  cilHome,
  cilInfo,
  cilList,
  cilLockLocked,
  cilLockUnlocked,
  cilLowVision,
  cilMedicalCross,
  cilMenu,
  cilPencil,
  cilPlus,
  cilSearch,
  cilSpreadsheet,
  cilTrash,
  cilWarning,
} from '@coreui/icons';

import { logo } from './logo';
import { signet } from './signet';

export const iconSubset = {
  cilAccountLogout,
  cilCalendar,
  cilEnvelopeClosed,
  cilHome,
  cilInfo,
  cilList,
  cilLockLocked,
  cilLockUnlocked,
  cilLowVision,
  cilMedicalCross,
  cilMenu,
  cilPencil,
  cilPlus,
  cilSearch,
  cilSpreadsheet,
  cilTrash,
  cilWarning,
  logo,
  signet,
};
