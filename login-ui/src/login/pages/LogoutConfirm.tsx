import { BUTTON_PRIMARY, BUTTON_TEXT } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** ¿Cerrar la sesión?: dónde se cierra, confirmar y, si se sabe de dónde viene, volver sin cerrarla. */
export default function LogoutConfirm({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'logout-confirm.ftl' }>; i18n: I18n }) {
  const { url, client, logoutConfirm, realm } = kcContext;
  const { msg, msgStr } = i18n;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('logoutConfirmTitle')}
      documentTitle={msgStr('logoutConfirmTitle')}
      subtitle={msg('fcLogoutHint', realm.displayName || realm.name)}
    >
      <form id="kc-logout-confirm" action={url.logoutConfirmAction} method="post" className="flex flex-col gap-2">
        <input type="hidden" name="session_code" value={logoutConfirm.code} />
        <button id="kc-logout" type="submit" name="confirmLogout" className={BUTTON_PRIMARY}>{msg('doLogout')}</button>
        {!logoutConfirm.skipLink && client.baseUrl && <a href={client.baseUrl} className={BUTTON_TEXT}>{msg('backToApplication')}</a>}
      </form>
    </Template>
  );
}
