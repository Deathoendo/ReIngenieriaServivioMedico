import { config } from '../config.js';
import * as localProvider from './providers/local.provider.js';
import * as ldapProvider from './providers/ldap.provider.js';

const providers = {
  local: localProvider,
  ldap: ldapProvider,
};

/**
 * Devuelve el proveedor de identidad activo.
 *
 * Se resuelve por petición (y no al importar) para que los tests puedan cambiar
 * AUTH_PROVIDER sin recargar módulos.
 */
export function getProvider(override) {
  const key = (override || config.auth.provider).toLowerCase();
  const provider = providers[key];
  if (!provider) {
    throw new Error(`Proveedor de autenticación desconocido: ${key}`);
  }
  return provider;
}

export const availableProviders = Object.keys(providers);
