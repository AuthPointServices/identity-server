import { IconExternal, IconMail } from '../components/icons';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, Notice } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';
import { webmailFor } from '../webmail';

/**
 * Revisa tu correo: a qué dirección fue el enlace, un botón al buzón (el webmail del correo, o Mailpit en desarrollo),
 * reenviarlo y cuánto dura. El aviso de Keycloak «Verifica tu correo para seguir» no se pinta: lo dice la pantalla.
 */
export default function LoginVerifyEmail({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-verify-email.ftl' }>; i18n: I18n }) {
  const { url, user, message, properties } = kcContext;
  const { msg, msgStr } = i18n;
  const email = user?.email;
  const devInbox = properties.FC_DEV_INBOX_URL;
  const inbox = devInbox ? { name: msgStr('fcDevInbox'), url: devInbox } : webmailFor(email);
  // El aviso de esperar para reenviar, o el de que salió otra vez, sí se muestran; el recordatorio genérico, no.
  const notice = message && message.summary !== msgStr('verifyEmailMessage') && message.type !== 'info' ? message : undefined;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      displayMessage={false}
      lead={
        <span className="grid size-12 place-items-center rounded-2xl bg-accent-subtle text-accent-ink">
          <IconMail size={24} />
        </span>
      }
      headerNode={msg('fcCheckInboxTitle')}
      documentTitle={msgStr('fcCheckInboxTitle')}
      subtitle={
        <>
          {msg('fcVerifySentTo')}
          {/* La dirección, sola en su línea: si no cabe, se corta donde llegue al borde y no en un guion. */}
          <span className="mt-0.5 block font-medium break-all text-fg">{email}</span>
        </>
      }
      displayInfo
      infoNode={<span>{msg('fcWrongEmail')} <a href={url.loginRestartFlowUrl}>{msg('fcStartOver')}</a></span>}
    >
      {/* El único error que Keycloak pinta aquí es el de esperar para reenviar: no es un fallo, va en neutro. */}
      {notice && <Notice type={notice.type === 'error' ? 'info' : notice.type} html={notice.summary} />}
      <div className="flex flex-col gap-2">
        {inbox && (
          <a href={inbox.url} target="_blank" rel="noopener noreferrer" className={BUTTON_PRIMARY}>
            {msgStr('fcOpenInbox', inbox.name)}
            <IconExternal size={16} />
          </a>
        )}
        <a href={url.loginAction} className={BUTTON_SECONDARY}>{msg('fcResendEmail')}</a>
      </div>
      {/* 30 minutos: actionTokenGeneratedByUserLifespan de config/realm.yaml. */}
      <p className="text-sm/5 text-pretty text-fg-muted">{msg('fcVerifyHelp')}</p>
    </Template>
  );
}
