import { useScript } from 'keycloakify/login/pages/LoginPassword.useScript';
import { useEffect, useRef, useState } from 'react';
import { PasskeyButton, PASSKEY_BUTTON } from '../components/Passkey';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, Divider, Field } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/**
 * Entrar, segundo paso. Con passkey, como en Adobe, va primero y la contraseña es otra forma más; sin ella, la
 * contraseña y, tras la raya, las otras formas.
 */
export default function LoginPassword({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-password.ftl' }>; i18n: I18n }) {
  const { realm, url, messagesPerField, message, enableWebAuthnConditionalUI, authenticators, auth } = kcContext;
  const emailCode = auth?.authenticationSelections?.find((s) => s.displayName === 'fc-email-code-display-name');
  const { msg, msgStr } = i18n;
  const [submitting, setSubmitting] = useState(false);
  useScript({ webAuthnButtonId: PASSKEY_BUTTON, kcContext, i18n });
  // El bloqueo por demasiados intentos llega en el campo del correo, que esta página no tiene: también va aquí.
  const fieldError = messagesPerField.existsError('password', 'username') ? messagesPerField.getFirstError('password', 'username') : undefined;
  const hasPasskey = enableWebAuthnConditionalUI === true && (authenticators?.authenticators.length ?? 0) > 0;
  const [view, setView] = useState<'passkey' | 'password'>(hasPasskey && !fieldError ? 'passkey' : 'password');
  const onPasskey = view === 'passkey';
  // Con passkey, un error sin campo es de la passkey (la cancelaste): sale arriba, en el aviso.
  const error = fieldError ?? (!hasPasskey && message?.type === 'error' ? message.summary : undefined);
  const switched = useRef(false);
  useEffect(() => {
    if (switched.current) document.getElementById('password')?.focus();
  }, [view]);
  const title = onPasskey ? 'fcPasskeyTitle' : 'fcPasswordTitle';

  const passwordForm = (
    <form key="password" id="kc-form-login" action={url.loginAction} method="post" hidden={onPasskey} onSubmit={() => setSubmitting(true)} className="flex flex-col gap-5">
      <Field
        id="password"
        type="password"
        label={msg('password')}
        autoComplete="current-password"
        autoFocus={!onPasskey}
        error={error}
        reveal={{ show: msgStr('showPassword'), hide: msgStr('hidePassword') }}
        labelAside={realm.resetPasswordAllowed && <a href={url.loginResetCredentialsUrl} className="-my-0.5 inline-flex min-h-6 items-center text-sm/5 pointer-coarse:-my-3 pointer-coarse:py-3">{msg('doForgotPassword')}</a>}
      />
      <button id="kc-login" name="login" type="submit" disabled={submitting} className={`${BUTTON_PRIMARY} mt-3`}>{msg('doLogIn')}</button>
    </form>
  );
  // Todo va en una sola lista con claves: al cambiar de vista React mueve el botón de la passkey sin recrearlo, y el
  // script de Keycloak, que lo engancha una vez, sigue funcionando.
  const passkey = enableWebAuthnConditionalUI && (
    <div key="passkey">
      <PasskeyButton loginAction={url.loginAction} credentialIds={authenticators?.authenticators.map((a) => a.credentialId) ?? []} label={msg(onPasskey ? 'fcPasskeyUse' : 'fcUsePasskey')} primary={onPasskey} />
    </div>
  );
  const usePassword = onPasskey && (
    <button key="use-password" type="button" onClick={() => { switched.current = true; setView('password'); }} className={`${BUTTON_SECONDARY} font-medium`}>{msg('fcEmailCodeUsePassword')}</button>
  );
  const code = emailCode && (
    <form key="code" action={url.loginAction} method="post">
      <input type="hidden" name="authenticationExecution" value={emailCode.authExecId} />
      <button id="fc-email-code" type="submit" className={`${BUTTON_SECONDARY} font-medium`}>{msg('fcEmailCodeInstead')}</button>
    </form>
  );
  const divider = (passkey || code) && <div key="or" className="my-3"><Divider>{msgStr('fcOrDivider')}</Divider></div>;
  const items = onPasskey ? [passkey, divider, usePassword, code, passwordForm] : [passwordForm, divider, code, passkey];

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg(title)}
      documentTitle={msgStr(title)}
      subtitle={onPasskey ? msg('fcPasskeyHint') : undefined}
      displayMessage={!error}
      tryAnotherWay={false}
    >
      <div className="flex flex-col gap-2">{items.filter(Boolean)}</div>
    </Template>
  );
}
