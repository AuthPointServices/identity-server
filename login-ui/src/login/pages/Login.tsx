import { useScript } from 'keycloakify/login/pages/Login.useScript';
import { useState } from 'react';
import { PasskeyButton, PASSKEY_BUTTON } from '../components/Passkey';
import { SocialProviders } from '../components/SocialProviders';
import { BUTTON_PRIMARY, Checkbox, Field } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/**
 * Entrar con correo y contraseña juntos (login.ftl). El acceso normal va en dos pasos (LoginUsername, LoginPassword);
 * esta queda para volver a entrar al vincular una cuenta de un proveedor. Mismo orden que el correo: el formulario, y
 * tras la raya los proveedores y la passkey.
 */
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
      // Como en el paso del correo, crear una cuenta va bajo el título. Al volver a pedir la contraseña la cuenta ya es
      // conocida: no se ofrece crear otra.
      subtitle={
        realm.password && realm.registrationAllowed && !registrationDisabled && !usernameHidden && (
          <>
            {msg('noAccount')} <a href={url.registrationUrl}>{msg('doRegister')}</a>
          </>
        )
      }
    >
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
            labelAside={realm.resetPasswordAllowed && <a href={url.loginResetCredentialsUrl} className="-my-0.5 inline-flex min-h-6 items-center text-100 touch:-my-3 touch:py-3">{msg('doForgotPassword')}</a>}
          />
          {realm.rememberMe && !usernameHidden && <Checkbox id="rememberMe" label={msg('rememberMe')} defaultChecked={!!login.rememberMe} />}
          <input type="hidden" id="id-hidden-input" name="credentialId" value={auth.selectedCredential ?? ''} />
          <button id="kc-login" name="login" type="submit" disabled={submitting} className={`${BUTTON_PRIMARY} mt-3`}>{msg('doLogIn')}</button>
        </form>
      )}

      <SocialProviders
        providers={providers}
        extra={enableWebAuthnConditionalUI ? [<PasskeyButton key="passkey" loginAction={url.loginAction} credentialIds={authenticators?.authenticators.map((a) => a.credentialId) ?? []} label={msg('passkey-doAuthenticate')} />] : []}
        continueWith={(name) => msgStr('fcContinueWith', name)}
        or={realm.password && msgStr('fcOrDivider')}
        more={msgStr('fcMoreSignInOptions')}
      />
    </Template>
  );
}
