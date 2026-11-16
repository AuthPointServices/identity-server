import { useScript } from 'keycloakify/login/pages/Login.useScript';
import { useState } from 'react';
import { IconFingerprint } from '../components/icons';
import { SocialProviders } from '../components/SocialProviders';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, Checkbox, Field } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

const PASSKEY_BUTTON = 'authenticateWebAuthnButton';

/** Entrar: los proveedores arriba, el correo y la contraseña, y la passkey como otra forma de entrar. */
export default function Login({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login.ftl' }>; i18n: I18n }) {
  const { social, realm, url, usernameHidden, login, auth, registrationDisabled, messagesPerField, enableWebAuthnConditionalUI, authenticators } = kcContext;
  const { msg, msgStr } = i18n;
  const [submitting, setSubmitting] = useState(false);
  useScript({ webAuthnButtonId: PASSKEY_BUTTON, kcContext, i18n });

  const hasError = messagesPerField.existsError('username', 'password');
  let error = hasError ? messagesPerField.getFirstError('username', 'password') : undefined;
  // Al volver a pedir la contraseña el correo ya está puesto: el fallo sólo puede ser de la contraseña.
  if (usernameHidden && error === msgStr('invalidUserMessage')) error = msgStr('invalidPasswordMessage');
  const providers = realm.password && !usernameHidden ? (social?.providers ?? []) : [];
  const emailLabel = !realm.loginWithEmailAllowed ? msg('username') : !realm.registrationEmailAsUsername ? msg('usernameOrEmail') : msg('email');

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('loginAccountTitle')}
      documentTitle={msgStr('loginAccountTitle')}
      displayMessage={!hasError}
      // Al volver a pedir la contraseña la cuenta ya es conocida: no se ofrece crear otra.
      displayInfo={realm.password && realm.registrationAllowed && !registrationDisabled && !usernameHidden}
      infoNode={
        <span>
          {msg('noAccount')} <a href={url.registrationUrl}>{msg('doRegister')}</a>
        </span>
      }
    >
      <SocialProviders providers={providers} continueWith={(name) => msgStr('fcContinueWith', name)} or={realm.password && msgStr('fcOrDivider')} />

      {realm.password && (
        <form id="kc-form-login" action={url.loginAction} method="post" onSubmit={() => setSubmitting(true)} className="flex flex-col gap-5">
          {!usernameHidden && (
            <Field
              id="username"
              label={emailLabel}
              defaultValue={login.username ?? ''}
              autoFocus
              autoComplete={enableWebAuthnConditionalUI ? 'username webauthn' : 'username'}
              inputMode="email"
              spellCheck={false}
              error={error}
            />
          )}
          <Field
            id="password"
            type="password"
            label={msg('password')}
            autoComplete="current-password"
            autoFocus={usernameHidden}
            error={usernameHidden ? error : undefined}
            aria-invalid={hasError || undefined}
            reveal={{ show: msgStr('showPassword'), hide: msgStr('hidePassword') }}
            labelAside={realm.resetPasswordAllowed && <a href={url.loginResetCredentialsUrl} className="text-sm/5 pointer-coarse:-my-3 pointer-coarse:py-3">{msg('doForgotPassword')}</a>}
          />
          {realm.rememberMe && !usernameHidden && <Checkbox id="rememberMe" label={msg('rememberMe')} defaultChecked={!!login.rememberMe} />}
          <input type="hidden" id="id-hidden-input" name="credentialId" value={auth.selectedCredential ?? ''} />
          <button id="kc-login" name="login" type="submit" disabled={submitting} className={`${BUTTON_PRIMARY} mt-1`}>{msg('doLogIn')}</button>
        </form>
      )}

      {enableWebAuthnConditionalUI && (
        <>
          <form id="webauth" action={url.loginAction} method="post" hidden>
            {['clientDataJSON', 'authenticatorData', 'signature', 'credentialId', 'userHandle', 'error'].map((n) => <input key={n} type="hidden" id={n} name={n} />)}
          </form>
          {authenticators && authenticators.authenticators.length > 0 && (
            <form id="authn_select" hidden>
              {authenticators.authenticators.map((a) => <input key={a.credentialId} type="hidden" name="authn_use_chk" readOnly value={a.credentialId} />)}
            </form>
          )}
          <button id={PASSKEY_BUTTON} type="button" className={`${BUTTON_SECONDARY} -mt-2`}>
            <IconFingerprint />
            {msg('passkey-doAuthenticate')}
          </button>
        </>
      )}
    </Template>
  );
}
