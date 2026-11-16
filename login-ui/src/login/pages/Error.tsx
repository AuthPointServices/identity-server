import { BUTTON_PRIMARY, ServerText } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Algo salió mal: qué pasó, con el texto del servidor, y la vuelta a la app si se conoce. */
export default function ErrorPage({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'error.ftl' }>; i18n: I18n }) {
  const { message, client, skipLink } = kcContext;
  const { msg, msgStr } = i18n;
  return (
    <Template kcContext={kcContext} i18n={i18n} doUseDefaultCss={false} displayMessage={false} headerNode={msg('errorTitle')} documentTitle={msgStr('errorTitle')}>
      <p id="kc-error-message" className="text-[15px]/[22px] text-pretty text-fg"><ServerText html={message.summary} /></p>
      {!skipLink && client?.baseUrl && <a id="backToApplication" href={client.baseUrl} className={`${BUTTON_PRIMARY} mt-1`}>{msg('backToApplication')}</a>}
    </Template>
  );
}
