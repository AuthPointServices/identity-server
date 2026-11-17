import { Art, type ArtKind } from '../components/Art';
import { BUTTON_PRIMARY, ServerText } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

type InfoContext = Extract<KcContext, { pageId: 'info.ftl' }>;

/**
 * Qué aviso es, por su texto (Keycloak sólo manda el texto ya traducido): su ilustración, la frase que lo explica y,
 * cuando no sabe de qué app venías, adónde ir. Los demás avisos se pintan como llegan.
 */
function kindOf({ messageHeader, message, requiredActions }: InfoContext, { msgStr }: I18n): { art?: ArtKind; hint?: string; fallback?: 'account' | 'login' } {
  const is = (key: Parameters<I18n['msgStr']>[0]) => message.summary === msgStr(key);
  if (requiredActions?.length) return {};
  if (is('alreadyLoggedIn')) return { art: 'signed-in', hint: msgStr('fcAlreadyInHint'), fallback: 'account' };
  if (is('successLogout')) return { art: 'signed-out', hint: msgStr('fcSignedOutHint'), fallback: 'login' };
  if (is('emailVerifiedMessage')) return { art: 'email-ok', hint: messageHeader ? undefined : msgStr('fcEmailVerifiedHint'), fallback: 'account' };
  if (is('emailVerifiedAlreadyMessage')) return { art: 'email-ok', fallback: 'account' };
  if (messageHeader === 'accountUpdatedTitle') return { art: 'account-ok', fallback: 'login' };
  return {};
}

/**
 * Los avisos de Keycloak (correo verificado, sesión cerrada, acciones pendientes…). Sin un título propio, el aviso hace
 * de título y no se repite debajo; con título, el aviso va justo bajo él, como en las demás pantallas. Los de estado
 * llevan su ilustración. La única salida va como botón principal; si Keycloak no da ninguna (no sabe de qué app
 * venías), lleva a la Cuenta (FC_ACCOUNT_URL), que pide entrar si hace falta.
 */
export default function Info({ kcContext, i18n }: { kcContext: InfoContext; i18n: I18n }) {
  const { messageHeader, message, requiredActions, skipLink, pageRedirectUri, actionUri, client, properties } = kcContext;
  const { msg, advancedMsgStr } = i18n;
  const kind = kindOf(kcContext, i18n);
  // Un aviso de una sola frase que hace de título pierde el punto final: los títulos no lo llevan.
  const header = messageHeader ? advancedMsgStr(messageHeader) : message.summary.replace(/^([^.]*)\.$/, '$1');
  const actions = requiredActions?.map((a) => advancedMsgStr(`requiredAction.${a}`)).join(', ');
  // «Tu cuenta está lista» sale al terminar lo pedido desde un enlace de correo abierto en otro navegador: Keycloak no
  // deja la sesión abierta, así que la app pide entrar. El botón lo dice.
  const back = messageHeader === 'accountUpdatedTitle' ? msg('doLogIn') : msg('backToApplication');
  const account = properties.FC_ACCOUNT_URL;
  const fallback = account && kind.fallback ? { href: account, label: kind.fallback === 'login' ? msg('fcBackToLogin') : msg('fcGoToAccount') } : undefined;
  const exit = skipLink ? fallback : pageRedirectUri ? { href: pageRedirectUri, label: back } : actionUri ? { href: actionUri, label: msg('proceedWithAction') } : client?.baseUrl ? { href: client.baseUrl, label: back } : fallback;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      displayMessage={false}
      art={kind.art && <Art kind={kind.art} />}
      headerNode={<ServerText html={header} />}
      documentTitle={header.replace(/<[^>]*>/g, '')}
      subtitle={
        messageHeader || actions ? (
          <span id="kc-info-message" className="whitespace-pre-line">
            {messageHeader && <ServerText html={message.summary} />}
            {actions && <> <strong className="font-semibold text-fg">{actions}</strong></>}
          </span>
        ) : (
          kind.hint
        )
      }
    >
      {exit && <a href={exit.href} className={BUTTON_PRIMARY}>{exit.label}</a>}
    </Template>
  );
}
