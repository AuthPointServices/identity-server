import { Actions } from '../components/Actions';
import { Checkbox, Field } from '../components/ui';
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
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm/5 font-medium text-fg">{msg('fcChooseDevice')}</legend>
            {devices.map((d) => (
              <label key={d.id} className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-border px-4 py-3 text-[15px]/[22px] text-fg has-checked:border-accent has-checked:bg-accent-subtle/40">
                <input type="radio" name="selectedCredentialId" value={d.id} defaultChecked={d.id === otpLogin.selectedCredentialId} className="size-[18px] accent-accent" />
                {d.userLabel}
              </label>
            ))}
          </fieldset>
        )}
        <Field
          id="otp"
          label={msg('loginOtpOneTime')}
          autoComplete="one-time-code"
          inputMode="numeric"
          autoFocus
          error={messagesPerField.existsError('totp') ? messagesPerField.get('totp') : undefined}
          className="text-lg/6 font-medium tracking-[0.16em] tabular-nums"
        />
        <Checkbox id="fcTrustDevice" label={msg('fcTrustDevice')} />
        <Actions submit={msg('doLogInWithOtp')} submitProps={{ id: 'kc-login', name: 'login' }} />
      </form>
    </Template>
  );
}
