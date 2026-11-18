import { BUTTON_PRIMARY, BUTTON_TEXT } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** La passkey falló: el motivo lo trae el aviso de Keycloak; volver a intentarlo o, si lo pidió la app, cancelar. */
export default function WebauthnError({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'webauthn-error.ftl' }>; i18n: I18n }) {
  const { url, isAppInitiatedAction, execution } = kcContext;
  const { msg, msgStr } = i18n;
  // Pedida por la app es añadirla desde la Cuenta; si no, al entrar.
  const title = isAppInitiatedAction ? 'fcPasskeyAddFailed' : 'webauthn-error-title';
  return (
    <Template kcContext={kcContext} i18n={i18n} doUseDefaultCss={false} headerNode={msg(title)} documentTitle={msgStr(title)}>
      {/* Keycloak reintenta este paso con isSetRetry=retry; Cancelar (cancel-aia) lo atiende antes y no los mira. */}
      <form id="kc-error-credential-form" action={url.loginAction} method="post" className="flex flex-col gap-2">
        <input type="hidden" name="authenticationExecution" value={execution} />
        <input type="hidden" name="isSetRetry" value="retry" />
        <button id="kc-try-again" type="submit" className={BUTTON_PRIMARY}>{msg('doTryAgain')}</button>
        {isAppInitiatedAction && <button id="cancelWebAuthnAIA" type="submit" name="cancel-aia" value="true" className={BUTTON_TEXT}>{msg('doCancel')}</button>}
      </form>
    </Template>
  );
}
