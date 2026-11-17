import { createGetKcContextMock } from 'keycloakify/login/KcContext';
import type { DeepPartial } from 'keycloakify/tools/DeepPartial';
import { kcEnvDefaults, themeNames } from '../kc.gen';
import type { KcContext, KcContextExtension, KcContextExtensionPerPage } from './KcContext';

/* Contextos simulados para ver cada pantalla y estado sin Keycloak (`pnpm dev`, ?mock=<nombre>). Sólo en desarrollo:
   main.tsx los importa bajo import.meta.env.DEV. */
const kcContextExtension: KcContextExtension = { themeName: themeNames[0] ?? 'fretchcop', properties: { ...kcEnvDefaults, FC_ACCOUNT_URL: '#cuenta' } };
const kcContextExtensionPerPage: KcContextExtensionPerPage = { 'register.ftl': { url: { loginResetCredentialsUrl: '#reset' } } };

const { getKcContextMock } = createGetKcContextMock({
  kcContextExtension,
  kcContextExtensionPerPage,
  overrides: { realm: { displayName: 'Seedle', internationalizationEnabled: true }, locale: { currentLanguageTag: 'es' } },
  overridesPerPage: {},
});

const google = { alias: 'google', providerId: 'google', displayName: 'Google', loginUrl: '#google' };
const github = { alias: 'github', providerId: 'github', displayName: 'GitHub', loginUrl: '#github' };
const facebook = { alias: 'facebook', providerId: 'facebook', displayName: 'Facebook', loginUrl: '#facebook' };
const microsoft = { alias: 'microsoft', providerId: 'microsoft', displayName: 'Microsoft', loginUrl: '#microsoft' };
const apple = { alias: 'apple', providerId: 'apple', displayName: 'Apple', loginUrl: '#apple' };

type Mock = { [P in KcContext['pageId']]: { pageId: P; overrides?: DeepPartial<Extract<KcContext, { pageId: P }>> } }[KcContext['pageId']];

/** Un error de servidor en esos campos, como los devuelve Keycloak. */
const errors = (byField: Record<string, string>) => ({
  messagesPerField: {
    exists: (f: string) => f in byField,
    existsError: (...fs: string[]) => fs.some((f) => f in byField),
    get: (f: string) => byField[f] ?? '',
    getFirstError: (...fs: string[]) => fs.map((f) => byField[f]).find(Boolean) ?? '',
    printIfExists: () => undefined,
  },
});
const reauth = { usernameHidden: true, auth: { showUsername: true, attemptedUsername: 'ana@example.test', showResetCredentials: false }, message: { type: 'info' as const, summary: 'Por seguridad, vuelve a escribir tu contraseña.' } };

const registerRealm = {
  realm: { registrationEmailAsUsername: true },
  passwordRequired: false,
  profile: {
    attributesByName: {
      // Keycloakify trae «username» en su perfil de ejemplo; en el realm el correo es el usuario y no existe.
      username: { annotations: { inputType: 'hidden' } },
      email: { name: 'email', displayName: '${email}', required: true, readOnly: false, validators: {}, annotations: {}, autocomplete: 'email' },
      firstName: { name: 'firstName', displayName: '${firstName}', required: true, readOnly: false, validators: {}, annotations: {}, autocomplete: 'given-name' },
      lastName: { name: 'lastName', displayName: '${lastName}', required: true, readOnly: false, validators: {}, annotations: {}, autocomplete: 'family-name' },
    },
  },
} as const;

export const mocks: Record<string, Mock> = {
  login: { pageId: 'login.ftl' },
  'login-error': { pageId: 'login.ftl', overrides: { login: { username: 'ana@example.test' }, ...errors({ username: 'Correo o contraseña incorrectos.' }) } },
  'login-google': { pageId: 'login.ftl', overrides: { social: { providers: [google] } } },
  'login-dos': { pageId: 'login.ftl', overrides: { social: { providers: [google, github] } } },
  'login-tres': { pageId: 'login.ftl', overrides: { social: { providers: [google, github, facebook] } } },
  'login-cinco': { pageId: 'login.ftl', overrides: { social: { providers: [google, github, facebook, microsoft, apple] } } },
  'login-passkey': { pageId: 'login.ftl', overrides: { enableWebAuthnConditionalUI: true, social: { providers: [google, github, facebook] } } },
  'login-aviso': { pageId: 'login.ftl', overrides: { message: { type: 'success', summary: 'Si hay una cuenta con ese correo, en unos minutos te llegará el enlace.' } } },
  reauth: { pageId: 'login.ftl', overrides: reauth },
  'reauth-error': { pageId: 'login.ftl', overrides: { ...reauth, message: undefined, ...errors({ password: 'Correo o contraseña incorrectos.' }) } },
  // Como el realm: el correo es el usuario y, con la verificación del correo, la contraseña se pide después.
  register: { pageId: 'register.ftl', overrides: registerRealm },
  'register-errors': { pageId: 'register.ftl', overrides: { ...registerRealm, ...errors({ email: 'Ya hay una cuenta con este correo.', firstName: 'Rellena este campo.' }) } },
  reset: { pageId: 'login-reset-password.ftl' },
  'update-password': { pageId: 'login-update-password.ftl', overrides: { isAppInitiatedAction: true } },
  'update-password-error': { pageId: 'login-update-password.ftl', overrides: { isAppInitiatedAction: true, ...errors({ password: 'Usa al menos 12 caracteres.' }) } },
  totp: { pageId: 'login-config-totp.ftl', overrides: { isAppInitiatedAction: true } },
  'totp-manual': { pageId: 'login-config-totp.ftl', overrides: { isAppInitiatedAction: true, mode: 'manual' } },
  'totp-error': { pageId: 'login-config-totp.ftl', overrides: { isAppInitiatedAction: true, ...errors({ totp: 'El código no es correcto. Escribe el que muestra ahora la app.' }) } },
  otp: { pageId: 'login-otp.ftl', overrides: { otpLogin: { userOtpCredentials: [{ id: 'a', userLabel: 'Móvil de Ana' }] } } },
  'otp-devices': { pageId: 'login-otp.ftl', overrides: { otpLogin: { userOtpCredentials: [{ id: 'a', userLabel: 'Móvil de Ana' }, { id: 'b', userLabel: 'Tableta' }], selectedCredentialId: 'a' } } },
  'passkey-register': { pageId: 'webauthn-register.ftl', overrides: { isAppInitiatedAction: true } },
  'passkey-login': { pageId: 'webauthn-authenticate.ftl' },
  'verify-email': { pageId: 'login-verify-email.ftl', overrides: { user: { email: 'jhonatan.camilo@gmail.com' }, message: { type: 'warning', summary: 'Verifica tu correo para seguir.' } } },
  'verify-email-otro': { pageId: 'login-verify-email.ftl', overrides: { user: { email: 'maria-fernanda.gutierrez@empresa-de-ejemplo.example.test' } } },
  'verify-email-espera': { pageId: 'login-verify-email.ftl', overrides: { user: { email: 'jhonatan.camilo@gmail.com' }, message: { type: 'error', summary: 'Podrás reenviarlo en 27 segundos.' } } },
  'update-email': { pageId: 'update-email.ftl', overrides: { isAppInitiatedAction: true } },
  'update-profile': { pageId: 'login-update-profile.ftl' },
  'delete-account': { pageId: 'delete-account-confirm.ftl', overrides: { triggered_from_aia: true } },
  logout: { pageId: 'logout-confirm.ftl', overrides: { client: { baseUrl: '#app' } } },
  info: { pageId: 'info.ftl', overrides: { messageHeader: undefined, actionUri: undefined, message: { type: 'info', summary: 'Tu correo está verificado.' }, client: { baseUrl: '#app' } } },
  'info-actions': { pageId: 'info.ftl', overrides: { messageHeader: 'Para seguir, completa esto', requiredActions: ['UPDATE_PASSWORD'], actionUri: '#action', message: { type: 'info', summary: 'Tu cuenta necesita:' } } },
  // Sin actionUri, como en Keycloak: el de Keycloakify trae «#» y el botón diría «Continuar».
  'info-cuenta': { pageId: 'info.ftl', overrides: { messageHeader: 'accountUpdatedTitle', actionUri: undefined, message: { type: 'success', summary: 'Ya puedes iniciar sesión.' }, client: { baseUrl: '#app' } } },
  // Una página de entrar vieja, ya con la sesión abierta y sin saber de qué app venía: Keycloak no da salida.
  'ya-dentro': { pageId: 'info.ftl', overrides: { messageHeader: undefined, actionUri: undefined, skipLink: true, message: { type: 'success', summary: 'Ya iniciaste sesión.' }, client: { baseUrl: '' } } },
  // Cerrar la sesión desde Keycloak sin una app a la que volver.
  'sesion-cerrada': { pageId: 'info.ftl', overrides: { messageHeader: undefined, actionUri: undefined, skipLink: true, message: { type: 'success', summary: 'Cerraste la sesión' }, client: { baseUrl: '' } } },
  'enlace-usado': { pageId: 'info.ftl', overrides: { messageHeader: 'emailVerifiedAlreadyMessageHeader', actionUri: undefined, message: { type: 'info', summary: 'Tu correo ya estaba verificado.' }, client: { baseUrl: '#app' } } },
  'enlace-caducado': { pageId: 'error.ftl', overrides: { message: { type: 'error', summary: 'El enlace caducó. Vuelve a empezar desde la aplicación.' }, client: { baseUrl: '#app' } } },
  'error-cookies': { pageId: 'error.ftl', overrides: { message: { type: 'error', summary: 'El navegador borró o bloquea las cookies de esta página. Vuelve a empezar y, si se repite, permite las cookies de este sitio.' }, client: { baseUrl: '#app' } } },
  error: { pageId: 'error.ftl', overrides: { message: { type: 'error', summary: 'No reconocemos la aplicación desde la que llegaste. Vuelve a ella e inténtalo otra vez.' } } },
  expired: { pageId: 'login-page-expired.ftl' },
  'select-authenticator': { pageId: 'select-authenticator.ftl' },
  'idp-link': { pageId: 'login-idp-link-confirm.ftl', overrides: { idpAlias: 'Google' } },
  terms: { pageId: 'terms.ftl' },
};

export function getMock(name: string) {
  const mock = mocks[name];
  if (!mock) return undefined;
  return getKcContextMock({ pageId: mock.pageId, overrides: mock.overrides } as never);
}
