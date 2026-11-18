import { IconChevronRight } from '../components/icons';
import { ROW_BUTTON } from '../components/ui';
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
            className={ROW_BUTTON}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-200 font-medium text-fg">{advancedMsg(s.displayName)}</span>
              <span className="block text-100 text-fg-muted">{advancedMsg(s.helpText)}</span>
            </span>
            <IconChevronRight size={20} className="shrink-0 text-fg-muted" />
          </button>
        ))}
      </form>
    </Template>
  );
}
