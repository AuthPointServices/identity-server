import { useScript } from 'keycloakify/login/pages/WebauthnRegister.useScript';
import { IconFingerprint } from '../components/icons';
import { BUTTON_PRIMARY, BUTTON_TEXT } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

const REGISTER_BUTTON = 'registerWebAuthn';

/** Añadir una passkey: qué es en una frase y el botón que abre el aviso del navegador. */
export default function WebauthnRegister({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'webauthn-register.ftl' }>; i18n: I18n }) {
  const { url, isSetRetry, isAppInitiatedAction } = kcContext;
  const { msg, msgStr } = i18n;
  useScript({ authButtonId: REGISTER_BUTTON, kcContext, i18n });
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('webauthn-registration-title')}
      documentTitle={msgStr('webauthn-registration-title')}
      subtitle={msg('fcPasskeyIntro')}
    >
      <form id="register" action={url.loginAction} method="post" hidden>
        {['clientDataJSON', 'attestationObject', 'publicKeyCredentialId', 'authenticatorLabel', 'transports', 'authenticatorAttachment', 'error'].map((n) => (
          <input key={n} type="hidden" id={n} name={n} />
        ))}
      </form>
      <div className="mt-3 flex flex-col gap-2">
        <button id={REGISTER_BUTTON} type="button" className={BUTTON_PRIMARY}>
          <IconFingerprint />
          {msg('doRegisterSecurityKey')}
        </button>
        {!isSetRetry && isAppInitiatedAction && (
          <form id="kc-webauthn-settings-form" action={url.loginAction} method="post">
            <button id="cancelWebAuthnAIA" type="submit" name="cancel-aia" value="true" className={BUTTON_TEXT}>{msg('doCancel')}</button>
          </form>
        )}
      </div>
    </Template>
  );
}
