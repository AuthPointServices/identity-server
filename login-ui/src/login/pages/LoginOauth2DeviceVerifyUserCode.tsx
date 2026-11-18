import { Actions } from '../components/Actions';
import { Field, Notice } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Conectar un aparato sin teclado cómodo (una tele, una consola): el código que enseña su pantalla. */
export default function LoginOauth2DeviceVerifyUserCode({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-oauth2-device-verify-user-code.ftl' }>; i18n: I18n }) {
  const { url, message } = kcContext;
  const { msg, msgStr } = i18n;
  // Keycloak lo devuelve todo como aviso de página. Sólo el código mal escrito es del campo; caducado o rechazado no lo
  // son: van arriba, y el rechazo, que lo eligió la persona, en neutro.
  const wrongCode = message?.summary === msgStr('oauth2DeviceInvalidUserCodeMessage') ? message.summary : undefined;
  const notice = message && !wrongCode ? { ...message, type: message.summary === msgStr('oauth2DeviceConsentDeniedMessage') ? ('info' as const) : message.type } : undefined;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('oauth2DeviceVerificationTitle')}
      documentTitle={msgStr('oauth2DeviceVerificationTitle')}
      subtitle={msg('verifyOAuth2DeviceUserCode')}
      displayMessage={false}
    >
      {notice && <Notice type={notice.type} html={notice.summary} />}
      <form id="kc-user-verify-device-user-code-form" action={url.oauth2DeviceVerificationAction} method="post" className="flex flex-col gap-5">
        <Field
          id="device-user-code"
          name="device_user_code"
          label={msg('fcDeviceCode')}
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          // Los códigos de Keycloak van en mayúsculas: se escriben como se ven en el dispositivo.
          onInput={(e) => void (e.currentTarget.value = e.currentTarget.value.toUpperCase())}
          autoFocus
          error={wrongCode}
          className="text-300 font-medium tracking-[0.16em] tabular-nums"
        />
        <Actions submit={msg('doContinue')} />
      </form>
    </Template>
  );
}
