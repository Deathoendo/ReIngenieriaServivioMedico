import { config } from '../config.js';
import { getProvider } from '../auth/provider.js';
import { issueToken } from '../auth/tokens.js';
import * as usuarios from '../repositories/usuario.repository.js';
import { forbidden, unauthorized } from '../errors.js';

/**
 * Orquesta el login:
 *   identidad (proveedor)  ->  autorización (grupos o rol)  ->  sesión (JWT)
 *
 * La separación importa: autenticar responde "¿quién eres?" y autorizar responde
 * "¿puedes entrar?". Son dos preguntas distintas y mezclarlas es lo que suele
 * producir agujeros de permisos.
 */
export async function login(email, password) {
  const usuario = await usuarios.findByEmail(email);

  // Mensaje idéntico para usuario inexistente y contraseña incorrecta: si el error
  // distinguiera los casos, permitiría enumerar qué correos existen en la empresa.
  const credencialesInvalidas = () => unauthorized('Usuario o contraseña incorrectos');

  if (!usuario) throw credencialesInvalidas();

  const provider = getProvider();
  const identity = await provider.authenticate({ user: usuario, password });

  if (!identity.authenticated) {
    // Se registra el motivo real en el servidor, nunca en la respuesta.
    console.warn(
      `[auth] Fallo de autenticación (${provider.name}) para ${email}: ${identity.reason}`,
    );
    throw credencialesInvalidas();
  }

  assertAuthorized({ usuario, identity, provider: provider.name });

  const token = issueToken(usuario);
  await usuarios.setActiveToken(usuario.id_usuario, token);

  return {
    token,
    expiresIn: config.auth.jwtExpiresIn,
    user: {
      id: usuario.id_usuario,
      email: usuario.email_usuario,
      nombre: usuario.nombre_usuario,
      rol: usuario.id_rol,
    },
    authProvider: provider.name,
  };
}

/**
 * Decide si una identidad ya verificada puede entrar al portal.
 *
 * - LDAP: la pertenencia a los grupos del directorio es la que manda. Es la fuente
 *   de verdad en la empresa, así que se exige intersección con `allowedGroups`.
 * - Local: el directorio no interviene, la autorización se resuelve por rol.
 */
function assertAuthorized({ usuario, identity, provider }) {
  if (provider === 'ldap') {
    const permitidos = config.auth.allowedGroups;
    if (permitidos.length === 0) {
      console.warn(
        '[auth] AUTH_PROVIDER=ldap sin grupos configurados: se admite cualquier ' +
          'usuario que autentique. Define GROUP_* en el .env para restringir el acceso.',
      );
      return;
    }

    const grupos = identity.groups.map((group) => group.toUpperCase());
    const autorizado = permitidos.some((group) => grupos.includes(group.toUpperCase()));

    if (!autorizado) {
      throw forbidden('Tu cuenta no tiene permisos para acceder a este portal.');
    }
    return;
  }

  if (!usuario.activo) {
    throw forbidden('Tu cuenta está desactivada.');
  }
}

export async function logout(idUsuario) {
  await usuarios.clearActiveToken(idUsuario);
}
