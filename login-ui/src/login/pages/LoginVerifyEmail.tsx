import { IconMail } from '../components/icons';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Verifica tu correo: a qué dirección fue el enlace y, al pie, reenviarlo. */
export default function LoginVerifyEmail({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-verify-email.ftl' }>; i18n: I18n }) {
  const { url, user } = kcContext;
  const { msg, msgStr } = i18n;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('emailVerifyTitle')}
      documentTitle={msgStr('emailVerifyTitle')}
      displayInfo
      infoNode={<span>{msg('emailVerifyInstruction2')} <a href={url.loginAction}>{msg('fcResendEmail')}</a></span>}
    >
      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3.5">
        <IconMail className="mt-0.5 shrink-0 text-fg-muted" />
        <div className="min-w-0 text-[15px]/[22px]">
          <p className="text-fg-muted">{msg('fcVerifySent')}</p>
          {/* La dirección va sola en su línea y sólo se parte si no cabe entera. */}
          <p className="font-semibold [overflow-wrap:anywhere] text-fg">{user?.email}</p>
          <p className="mt-2 text-sm/5 text-fg-muted">{msg('fcVerifyOpen')}</p>
        </div>
      </div>
    </Template>
  );
}
