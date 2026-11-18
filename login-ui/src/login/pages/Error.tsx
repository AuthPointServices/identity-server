import { BUTTON_PRIMARY, ServerText } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

type Key = Parameters<I18n['msgStr']>[0];
// Los errores de algo que caducó (la página o el enlace del correo): su título propio.
const PAGE_EXPIRED: Key[] = ['staleCodeMessage', 'expiredCodeMessage'];
const LINK_EXPIRED: Key[] = ['expiredActionMessage', 'expiredActionTokenNoSessionMessage', 'expiredActionTokenSessionExistsMessage'];

/**
 * Algo salió mal: qué pasó, con el texto del servidor justo bajo el título, y la vuelta a la app si se conoce. Los
 * errores frecuentes tienen título propio: las cookies (falta la de la sesión de acceso, con un botón que hace lo que
 * pide el texto: volver a empezar) y lo que caducó.
 */
export default function ErrorPage({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'error.ftl' }>; i18n: I18n }) {
  const { message, client, skipLink } = kcContext;
  const { msg, msgStr } = i18n;
  const is = (keys: Key[]) => keys.some((k) => message.summary === msgStr(k));
  const cookies = is(['cookieNotFoundMessage']);
  const title: Key = cookies ? 'fcCookiesTitle' : is(PAGE_EXPIRED) ? 'pageExpiredTitle' : is(LINK_EXPIRED) ? 'fcLinkExpiredTitle' : 'errorTitle';
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
