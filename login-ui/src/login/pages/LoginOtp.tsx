import { Actions } from '../components/Actions';
import { Checkbox, Choices, Field } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** El código de la app al entrar; con varios dispositivos, primero se elige cuál. */
export default function LoginOtp({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-otp.ftl' }>; i18n: I18n }) {
  const { otpLogin, url, messagesPerField } = kcContext;
  const { msg, msgStr } = i18n;
  const devices = otpLogin.userOtpCredentials;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('fcOtpTitle')}
      documentTitle={msgStr('fcOtpTitle')}
      subtitle={msg('fcLoginOtpHint')}
      displayMessage={!messagesPerField.existsError('totp')}
    >
      <form id="kc-otp-login-form" action={url.loginAction} method="post" className="flex flex-col gap-5">
        {devices.length > 1 && (
          <Choices
            legend={msg('fcChooseDevice')}
            name="selectedCredentialId"
            options={devices.map((d, i) => ({ id: `kc-otp-credential-${i}`, value: d.id, label: d.userLabel }))}
            defaultValue={otpLogin.selectedCredentialId}
          />
        )}
        <Field
          id="otp"
          label={msg('loginOtpOneTime')}
          autoComplete="one-time-code"
          inputMode="numeric"
          autoFocus
          error={messagesPerField.existsError('totp') ? messagesPerField.get('totp') : undefined}
          className="text-300 font-medium tracking-[0.16em] tabular-nums"
        />
        <Checkbox id="fcTrustDevice" label={msg('fcTrustDevice')} />
        <Actions submit={msg('doLogInWithOtp')} submitProps={{ id: 'kc-login', name: 'login' }} />
      </form>
    </Template>
  );
}
