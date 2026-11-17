import type { ExtendKcContext } from 'keycloakify/login';
import type { KcEnvName, ThemeName } from '../kc.gen';

export type KcContextExtension = {
  themeName: ThemeName;
  properties: Record<KcEnvName, string>;
};

// Keycloak manda las mismas URLs a todas las páginas; Keycloakify declara en cada una sólo las que usa la suya.
export type KcContextExtensionPerPage = {
  'register.ftl': { url: { loginResetCredentialsUrl: string } };
  // TotpBean.getUsername: el usuario, para armar el enlace otpauth:// (src/login/totp.ts).
  'login-config-totp.ftl': { totp: { username?: string } };
};

export type KcContext = ExtendKcContext<KcContextExtension, KcContextExtensionPerPage>;
