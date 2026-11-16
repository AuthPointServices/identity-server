import { IconChevronDown } from '../components/icons';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Elegir cómo entrar: una fila por método, que se toca entera. */
export default function SelectAuthenticator({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'select-authenticator.ftl' }>; i18n: I18n }) {
  const { url, auth } = kcContext;
  const { msg, msgStr, advancedMsg } = i18n;
  return (
    <Template kcContext={kcContext} i18n={i18n} doUseDefaultCss={false} headerNode={msg('loginChooseAuthenticator')} documentTitle={msgStr('loginChooseAuthenticator')}>
      <form id="kc-select-credential-form" action={url.loginAction} method="post" className="flex flex-col gap-2">
        {auth.authenticationSelections.map((s) => (
          <button
            key={s.authExecId}
            type="submit"
            name="authenticationExecution"
            value={s.authExecId}
            className="flex w-full items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3 text-left transition-colors duration-quick hover:bg-surface-2"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[15px]/[22px] font-medium text-fg">{advancedMsg(s.displayName)}</span>
              <span className="block text-sm/5 text-fg-muted">{advancedMsg(s.helpText)}</span>
            </span>
            <IconChevronDown className="-rotate-90 shrink-0 text-fg-muted" />
          </button>
        ))}
      </form>
    </Template>
  );
}
