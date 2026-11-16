import { Actions } from '../components/Actions';
import { Checkbox, Field } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Elegir la contraseña (al recuperarla, la primera vez o al cambiarla desde la Cuenta). */
export default function LoginUpdatePassword({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-update-password.ftl' }>; i18n: I18n }) {
  const { url, messagesPerField, isAppInitiatedAction } = kcContext;
  const { msg, msgStr } = i18n;
  const reveal = { show: msgStr('showPassword'), hide: msgStr('hidePassword') };
  const err = (f: string) => (messagesPerField.existsError(f) ? messagesPerField.get(f) : undefined);
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('updatePasswordTitle')}
      documentTitle={msgStr('updatePasswordTitle')}
      displayMessage={!messagesPerField.existsError('password', 'password-confirm')}
    >
      <form id="kc-passwd-update-form" action={url.loginAction} method="post" className="flex flex-col gap-5">
        <Field id="password-new" name="password-new" type="password" label={msg('passwordNew')} autoFocus autoComplete="new-password" error={err('password')} reveal={reveal} />
        <Field id="password-confirm" name="password-confirm" type="password" label={msg('passwordConfirm')} autoComplete="new-password" error={err('password-confirm')} reveal={reveal} />
        <Checkbox id="logout-sessions" name="logout-sessions" value="on" label={msg('logoutOtherSessions')} />
        <Actions submit={msg('doSubmit')} cancel={isAppInitiatedAction && msg('doCancel')} />
      </form>
    </Template>
  );
}
