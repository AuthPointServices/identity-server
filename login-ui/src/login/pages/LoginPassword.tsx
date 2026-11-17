import { useScript } from 'keycloakify/login/pages/LoginPassword.useScript';
import { useState } from 'react';
import { PasskeyButton, PASSKEY_BUTTON } from '../components/Passkey';
import { BUTTON_PRIMARY, Field } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/**
 * Entrar, segundo paso: la cuenta arriba (con «Cambiar de cuenta», del Template), la contraseña con «¿Olvidaste tu
 * contraseña?» al lado, y la passkey si la cuenta tiene una. Al volver a pedir la contraseña (borrar la cuenta…), el
 * aviso de Keycloak va como la frase bajo el título. Cualquier fallo es de la contraseña: va bajo su campo.
 */
export default function LoginPassword({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-password.ftl' }>; i18n: I18n }) {
  const { realm, url, messagesPerField, message, enableWebAuthnConditionalUI, authenticators } = kcContext;
  const { msg, msgStr } = i18n;
  const [submitting, setSubmitting] = useState(false);
  useScript({ webAuthnButtonId: PASSKEY_BUTTON, kcContext, i18n });
  const error = messagesPerField.existsError('password') ? messagesPerField.get('password') : message?.type === 'error' ? message.summary : undefined;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('fcPasswordTitle')}
      documentTitle={msgStr('fcPasswordTitle')}
      displayMessage={!error}
    >
      <form id="kc-form-login" action={url.loginAction} method="post" onSubmit={() => setSubmitting(true)} className="flex flex-col gap-5">
        <Field
          id="password"
          type="password"
          label={msg('password')}
          autoComplete="current-password"
          autoFocus
          error={error}
          reveal={{ show: msgStr('showPassword'), hide: msgStr('hidePassword') }}
          labelAside={realm.resetPasswordAllowed && <a href={url.loginResetCredentialsUrl} className="-my-0.5 inline-flex min-h-6 items-center text-sm/5 pointer-coarse:-my-3 pointer-coarse:py-3">{msg('doForgotPassword')}</a>}
        />
        <button id="kc-login" name="login" type="submit" disabled={submitting} className={`${BUTTON_PRIMARY} mt-3`}>{msg('doLogIn')}</button>
      </form>
      {enableWebAuthnConditionalUI && (
        <PasskeyButton loginAction={url.loginAction} credentialIds={authenticators?.authenticators.map((a) => a.credentialId) ?? []} label={msg('fcUsePasskey')} />
      )}
    </Template>
  );
}
