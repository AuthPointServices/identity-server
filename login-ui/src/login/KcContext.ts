import type { ExtendKcContext } from 'keycloakify/login';
import type { KcEnvName, ThemeName } from '../kc.gen';

export type KcContextExtension = {
  themeName: ThemeName;
  properties: Record<KcEnvName, string>;
};

// Keycloak manda las mismas URLs a todas las páginas; Keycloakify declara en cada una sólo las que usa la suya.
export type KcContextExtensionPerPage = {
  'register.ftl': { url: { loginResetCredentialsUrl: string } };
  // BrokeredIdentityContext.getEmail: adónde mandó Keycloak el enlace para conectar la cuenta.
  'login-idp-link-email.ftl': { brokerContext: { email?: string } };
  // TotpBean.getUsername: el usuario, para armar el enlace otpauth:// (src/login/totp.ts).
  'login-config-totp.ftl': { totp: { username?: string } };
  // Las otras formas de entrar de este paso (AuthenticationContextBean): «Recibir un código por correo».
  'login-password.ftl': { auth: { authenticationSelections?: AuthenticationSelection[] } };
  // La página del código por correo (providers/EmailCode.java): para entrar, como segundo paso o para activarlo.
  'fc-email-code.ftl': {
    fcEmailCode: { mode: 'login' | 'second' | 'setup'; email: string; minutes: number; resendIn: number; active: boolean };
    auth?: { showUsername?: boolean; attemptedUsername?: string; showTryAnotherWayLink?: boolean; authenticationSelections?: AuthenticationSelection[] };
    isAppInitiatedAction?: boolean;
  };
};

export type AuthenticationSelection = { authExecId: string; displayName: string; helpText: string };

export type KcContext = ExtendKcContext<KcContextExtension, KcContextExtensionPerPage>;
