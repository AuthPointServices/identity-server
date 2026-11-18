import { BUTTON_PRIMARY, BUTTON_TEXT, Choices } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/**
 * Al recuperar la cuenta con varios dispositivos de los dos pasos: cuál se quita (Keycloak pide configurar otro
 * después). Ninguno llega marcado: quitar no se hace por omisión; sin elegir, Keycloak vuelve con su error.
 */
export default function LoginResetOtp({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-reset-otp.ftl' }>; i18n: I18n }) {
  const { url, messagesPerField, configuredOtpCredentials } = kcContext;
  const { msg, msgStr } = i18n;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('fcResetOtpTitle')}
      documentTitle={msgStr('fcResetOtpTitle')}
      subtitle={msg('otp-reset-description')}
      displayMessage={!messagesPerField.existsError('totp')}
    >
      <form id="kc-otp-reset-form" action={url.loginAction} method="post" className="flex flex-col gap-5">
        <Choices
          legend={msg('fcChooseDevice')}
          name="selectedCredentialId"
          hideLegend
          options={configuredOtpCredentials.userOtpCredentials.map((c, i) => ({ id: `kc-otp-credential-${i}`, value: c.id, label: c.userLabel }))}
        />
        <div className="mt-3 flex flex-col gap-2">
          <button id="kc-otp-reset-form-submit" type="submit" className={BUTTON_PRIMARY}>{msg('fcRemove')}</button>
          {/* Salir sin quitar ninguno: la contraseña nueva ya quedó guardada. */}
          <a href={url.loginRestartFlowUrl} className={BUTTON_TEXT}>{msg('fcBackToLogin')}</a>
        </div>
      </form>
    </Template>
  );
}
