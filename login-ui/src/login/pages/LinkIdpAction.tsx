import { ProviderLogo } from '../components/icons';
import { BUTTON_SECONDARY, BUTTON_TEXT } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Conectar un proveedor desde la Cuenta (kc_action=idp_link:<alias>): se confirma antes de ir a su página. */
export default function LinkIdpAction({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'link-idp-action.ftl' }>; i18n: I18n }) {
  const { url, idpDisplayName: name } = kcContext;
  const { msg, msgStr } = i18n;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('fcLinkIdpTitle', name)}
      documentTitle={msgStr('fcLinkIdpTitle', name)}
      subtitle={msg('fcLinkIdpHint', name)}
      displayMessage={false}
    >
      <form id="kc-link-idp-form" action={url.loginAction} method="post" className="mt-3 flex flex-col gap-2">
        <button id="kc-continue" name="continue" type="submit" className={`${BUTTON_SECONDARY} font-medium`}>
          {/* Keycloak sólo da el nombre: «Google» → la marca de google. */}
          <ProviderLogo providerId={name.toLowerCase()} size={18} />
          {msg('fcContinueWith', name)}
        </button>
        <button id="kc-cancel" name="cancel-aia" value="true" type="submit" className={BUTTON_TEXT}>{msg('doCancel')}</button>
      </form>
    </Template>
  );
}
