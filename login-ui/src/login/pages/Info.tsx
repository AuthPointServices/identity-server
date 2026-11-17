import { BUTTON_PRIMARY, ServerText } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/**
 * Los avisos de Keycloak (correo verificado, sesión cerrada, acciones pendientes…). Sin un título propio, el aviso hace
 * de título y no se repite debajo; con título, el aviso va justo bajo él, como en las demás pantallas. La única salida va
 * como botón principal.
 */
export default function Info({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'info.ftl' }>; i18n: I18n }) {
  const { messageHeader, message, requiredActions, skipLink, pageRedirectUri, actionUri, client } = kcContext;
  const { msg, advancedMsgStr } = i18n;
  // Un aviso de una sola frase que hace de título pierde el punto final: los títulos no lo llevan.
  const header = messageHeader ? advancedMsgStr(messageHeader) : message.summary.replace(/^([^.]*)\.$/, '$1');
  const actions = requiredActions?.map((a) => advancedMsgStr(`requiredAction.${a}`)).join(', ');
  // «Tu cuenta está lista» sale al terminar lo pedido desde un enlace de correo abierto en otro navegador: Keycloak no
  // deja la sesión abierta, así que la app pide entrar. El botón lo dice.
  const back = messageHeader === 'accountUpdatedTitle' ? msg('doLogIn') : msg('backToApplication');
  const exit = skipLink ? undefined : pageRedirectUri ? { href: pageRedirectUri, label: back } : actionUri ? { href: actionUri, label: msg('proceedWithAction') } : client.baseUrl ? { href: client.baseUrl, label: back } : undefined;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      displayMessage={false}
      headerNode={<ServerText html={header} />}
      documentTitle={header.replace(/<[^>]*>/g, '')}
      subtitle={
        (messageHeader || actions) && (
          <span id="kc-info-message" className="whitespace-pre-line">
            {messageHeader && <ServerText html={message.summary} />}
            {actions && <> <strong className="font-semibold text-fg">{actions}</strong></>}
          </span>
        )
      }
    >
      {exit && <a href={exit.href} className={BUTTON_PRIMARY}>{exit.label}</a>}
    </Template>
  );
}
