import { BUTTON_PRIMARY, BUTTON_TEXT } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Las condiciones, en una caja que se desplaza sola, y aceptar o rechazar. */
export default function Terms({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'terms.ftl' }>; i18n: I18n }) {
  const { url } = kcContext;
  const { msg, msgStr } = i18n;
  return (
    <Template kcContext={kcContext} i18n={i18n} doUseDefaultCss={false} displayMessage={false} headerNode={msg('termsTitle')} documentTitle={msgStr('termsTitle')}>
      <div id="kc-terms-text" tabIndex={0} className="max-h-72 overflow-y-auto rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm/6 text-fg">{msg('termsText')}</div>
      <form action={url.loginAction} method="post" className="mt-1 flex flex-col gap-2">
        <button id="kc-accept" type="submit" name="accept" className={BUTTON_PRIMARY}>{msgStr('doAccept')}</button>
        <button id="kc-decline" type="submit" name="cancel" className={BUTTON_TEXT}>{msgStr('doDecline')}</button>
      </form>
    </Template>
  );
}
