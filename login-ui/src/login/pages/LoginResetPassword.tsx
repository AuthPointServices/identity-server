import { Actions } from '../components/Actions';
import { Field } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** El correo con el que alguien intentó registrarse, para no volver a escribirlo aquí (lo guarda Register). */
export const RESET_EMAIL_KEY = 'fc-reset-email';

/** ¿Olvidaste tu contraseña?: el correo, y Keycloak envía el enlace. */
export default function LoginResetPassword({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-reset-password.ftl' }>; i18n: I18n }) {
  const { url, realm, auth, messagesPerField } = kcContext;
  const { msg, msgStr } = i18n;
  let remembered: string | null = null;
  try {
    remembered = sessionStorage.getItem(RESET_EMAIL_KEY);
  } catch {
    // Sin almacenamiento (el navegador lo bloquea): se escribe a mano.
  }
  const label = !realm.loginWithEmailAllowed ? msg('username') : !realm.registrationEmailAsUsername ? msg('usernameOrEmail') : msg('email');
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('emailForgotTitle')}
      documentTitle={msgStr('emailForgotTitle')}
      subtitle={realm.duplicateEmailsAllowed ? msg('emailInstructionUsername') : msg('emailInstruction')}
      displayMessage={!messagesPerField.existsError('username')}
      displayInfo
      infoNode={<a href={url.loginUrl}>{msg('backToLogin')}</a>}
    >
      <form id="kc-reset-password-form" action={url.loginAction} method="post" className="flex flex-col gap-5">
        <Field
          id="username"
          label={label}
          type="email"
          autoFocus
          autoComplete="username"
          spellCheck={false}
          defaultValue={auth.attemptedUsername ?? remembered ?? ''}
          error={messagesPerField.existsError('username') ? messagesPerField.get('username') : undefined}
        />
        <Actions submit={msg('doSubmit')} />
      </form>
    </Template>
  );
}
