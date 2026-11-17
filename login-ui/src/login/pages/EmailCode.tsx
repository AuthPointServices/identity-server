import { useEffect, useState } from 'react';
import { IconExternal } from '../components/icons';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_TEXT, Field } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';
import { webmailFor } from '../webmail';

/** La opción «Contraseña» de este paso, para volver a ella (AuthenticationSelectionOption de Keycloak). */
const PASSWORD_OPTION = 'password-display-name';

/**
 * El código por correo, como en Adobe (providers/EmailCode.java): para entrar sin contraseña, como segundo paso o para
 * activarlo. A qué correo fue y cuánto vale, el código, el botón al buzón y reenviarlo (con su espera de 30 s a la
 * vista). Al entrar, si la cuenta tiene contraseña, se puede volver a ella.
 */
export default function EmailCode({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'fc-email-code.ftl' }>; i18n: I18n }) {
  const { url, fcEmailCode: code, messagesPerField, auth, isAppInitiatedAction, properties } = kcContext;
  const { msg, msgStr } = i18n;
  const [submitting, setSubmitting] = useState(false);
  const [wait, setWait] = useState(code.resendIn);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const error = messagesPerField.existsError('code') ? messagesPerField.get('code') : undefined;
  const title = code.mode === 'login' ? 'fcEmailCodeLoginTitle' : code.mode === 'second' ? 'fcOtpTitle' : 'fcEmailCodeSetupTitle';
  // Con la fila de la cuenta a la vista (Template), el correo no se repite en la frase.
  const row = auth?.showUsername === true;
  // Al activarlo no hay fila de la cuenta: el correo va solo en su línea, como en «Revisa tu correo» (si no cabe, se
  // corta donde llegue al borde y no en un guion).
  const sent =
    code.mode === 'setup' ? (
      <>
        {msg('fcEmailCodeSetupSentTo')}
        <span className="my-0.5 block font-medium break-all text-fg">{code.email}</span>
        {msg('fcEmailCodeSetupHint', String(code.minutes))}
      </>
    ) : row ? (
      msg('fcEmailCodeSentRow', String(code.minutes))
    ) : (
      msg('fcEmailCodeSent', code.email, String(code.minutes))
    );
  const password = code.mode === 'login' ? auth?.authenticationSelections?.find((s) => s.displayName === PASSWORD_OPTION) : undefined;
  const devInbox = properties.FC_DEV_INBOX_URL;
  const inbox = devInbox ? { name: msgStr('fcDevInbox'), url: devInbox } : webmailFor(code.email);
  const submit = code.mode === 'login' ? msg('doLogIn') : code.mode === 'second' ? msg('doContinue') : msg('fcEmailCodeActivate');

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg(title)}
      documentTitle={msgStr(title)}
      subtitle={code.active ? sent : msg('fcEmailCodeNone', code.email)}
      displayMessage={!error}
      // Al entrar, la otra forma es la contraseña y va con su nombre; como segundo paso, la app, con «Prueba otra forma».
      tryAnotherWay={code.mode === 'second'}
    >
      <form id="kc-email-code-form" action={url.loginAction} method="post" onSubmit={(e) => {
        // «Reenviar» también envía este formulario: sólo bloquea el botón principal.
        if ((e.nativeEvent as SubmitEvent).submitter?.getAttribute('name') !== 'resend') setSubmitting(true);
      }} className="flex flex-col gap-5">
        <Field
          id="code"
          label={msg('fcEmailCodeLabel')}
          autoComplete="one-time-code"
          inputMode="numeric"
          autoFocus
          error={error}
          // Sólo cifras y no más de seis: pegar «123 456» o «123-456» también vale.
          onInput={(e) => void (e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 6))}
          className="text-lg/6 font-medium tracking-[0.16em] tabular-nums"
        />
        <button id="kc-login" type="submit" disabled={submitting} className={`${BUTTON_PRIMARY} mt-3`}>{submit}</button>
        <div className="-mt-3 flex flex-col gap-2">
          {inbox && (
            <a href={inbox.url} target="_blank" rel="noopener noreferrer" className={BUTTON_SECONDARY}>
              {msgStr('fcOpenInbox', inbox.name)}
              <IconExternal size={16} />
            </a>
          )}
          <button type="submit" name="resend" value="true" formNoValidate disabled={wait > 0} className={`${BUTTON_TEXT} disabled:cursor-default disabled:opacity-100 disabled:text-fg-muted disabled:hover:bg-transparent`}>
            {wait > 0 ? msg('fcEmailCodeResendIn', String(wait)) : msg('fcEmailCodeResend')}
          </button>
          {/* Activarlo lo pidió la app: se puede dejar sin activar (Keycloak lo lee por su nombre, cancel-aia). */}
          {code.mode === 'setup' && isAppInitiatedAction && (
            <button type="submit" name="cancel-aia" value="true" formNoValidate className={BUTTON_TEXT}>{msg('doCancel')}</button>
          )}
        </div>
      </form>
      {password && (
        <form action={url.loginAction} method="post">
          <input type="hidden" name="authenticationExecution" value={password.authExecId} />
          <button type="submit" className={BUTTON_SECONDARY}>{msg('fcEmailCodeUsePassword')}</button>
        </form>
      )}
    </Template>
  );
}
