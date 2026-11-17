import { BUTTON_PRIMARY, ServerText } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/**
 * Algo salió mal: qué pasó, con el texto del servidor justo bajo el título, y la vuelta a la app si se conoce. El error
 * más común, el de las cookies (falta la de la sesión de acceso), tiene su propio título y un botón que hace lo que pide
 * el texto: volver a empezar desde la app.
 */
export default function ErrorPage({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'error.ftl' }>; i18n: I18n }) {
  const { message, client, skipLink } = kcContext;
  const { msg, msgStr } = i18n;
  const cookies = message.summary === msgStr('cookieNotFoundMessage');
  const title = cookies ? 'fcCookiesTitle' : 'errorTitle';
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      displayMessage={false}
      headerNode={msg(title)}
      documentTitle={msgStr(title)}
      subtitle={<ServerText id="kc-error-message" html={message.summary} />}
    >
      {!skipLink && client?.baseUrl && (
        <a id="backToApplication" href={client.baseUrl} className={BUTTON_PRIMARY}>{msg(cookies ? 'fcExpiredRestart' : 'backToApplication')}</a>
      )}
    </Template>
  );
}
