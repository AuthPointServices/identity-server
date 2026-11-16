import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Al entrar con un proveedor cuyo correo ya tiene cuenta: unirlos o revisar los datos. */
export default function LoginIdpLinkConfirm({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-idp-link-confirm.ftl' }>; i18n: I18n }) {
  const { url, idpAlias } = kcContext;
  const { msg, msgStr } = i18n;
  return (
    <Template kcContext={kcContext} i18n={i18n} doUseDefaultCss={false} headerNode={msg('confirmLinkIdpTitle')} documentTitle={msgStr('confirmLinkIdpTitle')}>
      <form id="kc-register-form" action={url.loginAction} method="post" className="mt-1 flex flex-col gap-2">
        <button id="linkAccount" type="submit" name="submitAction" value="linkAccount" className={BUTTON_PRIMARY}>{msg('confirmLinkIdpContinue', idpAlias)}</button>
        <button id="updateProfile" type="submit" name="submitAction" value="updateProfile" className={BUTTON_SECONDARY}>{msg('confirmLinkIdpReviewProfile')}</button>
      </form>
    </Template>
  );
}
