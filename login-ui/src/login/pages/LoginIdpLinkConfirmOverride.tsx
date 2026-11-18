import { BUTTON_PRIMARY, BUTTON_TEXT, ServerText } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import { providerName } from '../providers';
import Template from '../Template';

/**
 * La cuenta ya está conectada a otra cuenta de ese proveedor: usar la nueva o mantener la anterior. Keycloak manda la
 * explicación con los dos nombres como aviso de error (federatedIdentityConfirmOverrideMessage); aquí es el subtítulo.
 */
export default function LoginIdpLinkConfirmOverride({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-idp-link-confirm-override.ftl' }>; i18n: I18n }) {
  const { url, idpDisplayName, message } = kcContext;
  const { msg, msgStr } = i18n;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      displayMessage={false}
      headerNode={msg('confirmOverrideIdpTitle')}
      documentTitle={msgStr('confirmOverrideIdpTitle')}
      subtitle={message ? <ServerText html={message.summary} /> : msg('fcConfirmOverrideIdpHint', providerName(idpDisplayName))}
    >
      <form id="kc-register-form" action={url.loginAction} method="post" className="mt-3 flex flex-col gap-2">
        <button id="confirmOverride" type="submit" name="submitAction" value="confirmOverride" className={BUTTON_PRIMARY}>{msg('confirmOverrideIdpContinue')}</button>
        <a id="loginRestartLink" href={url.loginRestartFlowUrl} className={BUTTON_TEXT}>{msg('fcKeepPreviousIdp')}</a>
      </form>
    </Template>
  );
}
