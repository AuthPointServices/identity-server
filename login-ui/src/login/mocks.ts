import { createGetKcContextMock } from 'keycloakify/login/KcContext';
import type { DeepPartial } from 'keycloakify/tools/DeepPartial';
import { kcEnvDefaults, themeNames } from '../kc.gen';
import type { KcContext, KcContextExtension, KcContextExtensionPerPage } from './KcContext';

/* Contextos simulados para ver cada pantalla y estado sin Keycloak (`pnpm dev`, ?mock=<nombre>). Sólo en desarrollo:
   main.tsx los importa bajo import.meta.env.DEV. */
const kcContextExtension: KcContextExtension = { themeName: themeNames[0] ?? 'fretchcop', properties: { ...kcEnvDefaults, FC_ACCOUNT_URL: '#cuenta' } };
const kcContextExtensionPerPage: KcContextExtensionPerPage = {
  'register.ftl': { url: { loginResetCredentialsUrl: '#reset' } },
  'login-idp-link-email.ftl': { brokerContext: { email: 'ana@example.test' } },
  'login-config-totp.ftl': { totp: { username: 'ana@example.test' } },
  'login-password.ftl': { auth: { authenticationSelections: [] } },
  'fc-email-code.ftl': { fcEmailCode: { mode: 'login', email: 'ana@example.test', minutes: 10, resendIn: 0, active: true } },
};

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

// Las apps que Keycloak 26.8 ofrece con la política del realm, en su orden.
const totpApps = { supportedApplications: ['totpAppGoogleName', 'totpAppMicrosoftAuthenticatorName', 'totpAppFreeOTPName'] };

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

// El acceso en dos pasos: la cuenta que ya escribió el correo, y los dos proveedores del realm.
// Como los de Keycloak: 12 códigos de 12 caracteres, con W y M (los más anchos).
const codigosRecuperacion = ['WMQ4KZ7HXP2D', 'MWX8RT3NBQ6F', 'K7D2WHMX9PQA', 'Z3NBW8MKQ4TR', 'H9PXMW2DK7QZ', 'Q4TZ8NWMXB3K', 'B6KQWM3ZXH9P', 'X2MDW7QKZ4NT', 'T8ZQ3WMKXP6B', 'N4BXKM9WQZ2H', 'P7WQZ4MXKD8T', 'D3KMXW6QZB9N'];
const enDosPasos = { auth: { showUsername: true, attemptedUsername: 'ana@example.test' } };
// Las formas de entrar que Keycloak ofrece en el paso de la contraseña (AuthenticationSelectionOption).
const opcionContrasena = { authExecId: 'pw', displayName: 'password-display-name', helpText: 'password-help-text' };
const opcionCodigo = { authExecId: 'code', displayName: 'fc-email-code-display-name', helpText: 'fc-email-code-help-text' };
const realmSocial = { social: { providers: [google, facebook] }, enableWebAuthnConditionalUI: true };

export const mocks: Record<string, Mock> = {
  correo: { pageId: 'login-username.ftl', overrides: realmSocial },
  'correo-desconocido': { pageId: 'login-username.ftl', overrides: { ...realmSocial, login: { username: 'nadie@example.test' }, ...errors({ username: 'No hay ninguna cuenta con este correo.' }) } },
  'correo-proveedor': { pageId: 'login-username.ftl', overrides: { ...realmSocial, login: { username: 'ana@gmail.com' }, message: { type: 'info', summary: 'Esta cuenta entra con Google.' } } },
  'correo-cinco': { pageId: 'login-username.ftl', overrides: { social: { providers: [google, github, facebook, microsoft, apple] }, enableWebAuthnConditionalUI: true } },
  contrasena: { pageId: 'login-password.ftl', overrides: { ...enDosPasos, enableWebAuthnConditionalUI: true } },
  'contrasena-error': { pageId: 'login-password.ftl', overrides: { ...enDosPasos, ...errors({ password: 'La contraseña no es correcta.' }) } },
  'contrasena-codigo': { pageId: 'login-password.ftl', overrides: { ...enDosPasos, enableWebAuthnConditionalUI: true, auth: { ...enDosPasos.auth, authenticationSelections: [opcionContrasena, opcionCodigo] } } },
  codigo: { pageId: 'fc-email-code.ftl', overrides: { ...enDosPasos, auth: { ...enDosPasos.auth, authenticationSelections: [opcionContrasena, opcionCodigo] }, fcEmailCode: { mode: 'login', email: 'ana@example.test', minutes: 10, resendIn: 0, active: true } } },
  'codigo-espera': { pageId: 'fc-email-code.ftl', overrides: { ...enDosPasos, message: { type: 'success', summary: 'Te enviamos otro código.' }, fcEmailCode: { mode: 'login', email: 'ana@gmail.com', minutes: 10, resendIn: 27, active: true } } },
  'codigo-error': { pageId: 'fc-email-code.ftl', overrides: { ...enDosPasos, ...errors({ code: 'El código no es correcto. Revisa el último correo que te enviamos.' }), fcEmailCode: { mode: 'login', email: 'ana@example.test', minutes: 10, resendIn: 0, active: true } } },
  'codigo-segundo': { pageId: 'fc-email-code.ftl', overrides: { ...enDosPasos, fcEmailCode: { mode: 'second', email: 'ana@example.test', minutes: 10, resendIn: 12, active: true } } },
  'recuperacion-guardar': { pageId: 'login-recovery-authn-code-config.ftl', overrides: { isAppInitiatedAction: true, recoveryAuthnCodesConfigBean: { generatedRecoveryAuthnCodesList: codigosRecuperacion, generatedRecoveryAuthnCodesAsString: codigosRecuperacion.join(','), generatedAt: 1794938400000 } } },
  'recuperacion-entrar': { pageId: 'login-recovery-authn-code-input.ftl', overrides: { ...enDosPasos, recoveryAuthnCodesInputBean: { codeNumber: 3 } } },
  'recuperacion-error': { pageId: 'login-recovery-authn-code-input.ftl', overrides: { ...enDosPasos, ...errors({ recoveryCodeInput: 'El código no es correcto. Revisa que sea el número que se pide.' }), recoveryAuthnCodesInputBean: { codeNumber: 3 } } },
  'codigo-activar': { pageId: 'fc-email-code.ftl', overrides: { isAppInitiatedAction: true, fcEmailCode: { mode: 'setup', email: 'ana@example.test', minutes: 10, resendIn: 0, active: true } } },
  'contrasena-passkey': { pageId: 'login-password.ftl', overrides: { ...enDosPasos, enableWebAuthnConditionalUI: true, authenticators: { authenticators: [{ credentialId: 'pk1', label: 'iPhone 15', createdAt: '2026-11-01', transports: { displayNameProperties: [], iconClass: '' } }] }, auth: { ...enDosPasos.auth, authenticationSelections: [opcionContrasena, opcionCodigo] } } },
  'contrasena-bloqueo': { pageId: 'login-password.ftl', overrides: { ...enDosPasos, ...errors({ username: 'Hubo demasiados intentos con esta cuenta. Espera unos minutos y vuelve a probar.' }) } },
  'contrasena-reauth': { pageId: 'login-password.ftl', overrides: { ...enDosPasos, message: { type: 'info', summary: 'Por seguridad, vuelve a escribir tu contraseña.' } } },
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
  totp: { pageId: 'login-config-totp.ftl', overrides: { isAppInitiatedAction: true, totp: totpApps } },
  'totp-manual': { pageId: 'login-config-totp.ftl', overrides: { isAppInitiatedAction: true, mode: 'manual', totp: totpApps } },
  // Ya hay un dispositivo: pide el nombre. Sin error: el campo es obligatorio también en el navegador.
  'totp-segundo': { pageId: 'login-config-totp.ftl', overrides: { isAppInitiatedAction: true, totp: { ...totpApps, otpCredentials: [{ id: 'a', userLabel: 'Móvil de Ana' }] } } },
  'totp-nombre': { pageId: 'login-config-totp.ftl', overrides: { isAppInitiatedAction: true, totp: { ...totpApps, otpCredentials: [{ id: 'a', userLabel: 'Móvil de Ana' }] }, ...errors({ userLabel: 'Ponle un nombre al dispositivo.' }) } },
  'totp-error': { pageId: 'login-config-totp.ftl', overrides: { isAppInitiatedAction: true, totp: totpApps, ...errors({ totp: 'El código no es correcto. Escribe el que muestra ahora la app.' }) } },
  otp: { pageId: 'login-otp.ftl', overrides: { otpLogin: { userOtpCredentials: [{ id: 'a', userLabel: 'Móvil de Ana' }] } } },
  'otp-devices': { pageId: 'login-otp.ftl', overrides: { otpLogin: { userOtpCredentials: [{ id: 'a', userLabel: 'Móvil de Ana' }, { id: 'b', userLabel: 'Tableta' }], selectedCredentialId: 'a' } } },
  'conectar-google': { pageId: 'link-idp-action.ftl', overrides: { idpDisplayName: 'Google' } },
  'conectar-github': { pageId: 'link-idp-action.ftl', overrides: { idpDisplayName: 'GitHub' } },
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
