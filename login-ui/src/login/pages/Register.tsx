import { useLayoutEffect } from 'react';
import { Actions } from '../components/Actions';
import { ProfileFields } from '../components/ProfileFields';
import { IconAlert } from '../components/icons';
import { BUTTON_PRIMARY, Checkbox, ServerText } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';
import { RESET_EMAIL_KEY } from './LoginResetPassword';

/** El correo que alguien escribió al entrar y no tenía cuenta, para no volver a escribirlo aquí (lo guarda LoginUsername). */
export const REGISTER_EMAIL_KEY = 'fc-register-email';

/**
 * Crear la cuenta: los campos del perfil del realm. Con verificación de correo la contraseña llega después, y la frase
 * bajo el título lo dice. Si el correo ya tiene cuenta, debajo va crear una contraseña nueva: es la salida también para
 * quien se registró y no abrió el enlace, porque abrir el de recuperar verifica el correo (providers/ de identity-server).
 */
export default function Register({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'register.ftl' }>; i18n: I18n }) {
  const { messageHeader, url, messagesPerField, passwordRequired, recaptchaRequired, recaptchaVisible, recaptchaSiteKey, recaptchaAction, termsAcceptanceRequired } = kcContext;
  const { msg, msgStr, advancedMsg } = i18n;
  const invisibleRecaptcha = recaptchaRequired && !recaptchaVisible && recaptchaAction !== undefined;
  const emailTaken = messagesPerField.get('email') === msgStr('emailExistsMessage');
  let carried: string | null = null;
  try {
    carried = sessionStorage.getItem(REGISTER_EMAIL_KEY);
  } catch {
    // Sin almacenamiento: se escribe a mano.
  }
  const rememberEmail = () => {
    try {
      sessionStorage.setItem(RESET_EMAIL_KEY, (document.getElementById('email') as HTMLInputElement | null)?.value ?? '');
    } catch {
      // Sin almacenamiento: en la otra pantalla se escribe a mano.
    }
  };

  // reCAPTCHA invisible: su script llama a esta función al terminar.
  useLayoutEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.onSubmitRecaptcha = () => (document.getElementById('kc-register-form') as HTMLFormElement | null)?.requestSubmit();
    return () => void delete w.onSubmitRecaptcha;
  }, []);

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={messageHeader !== undefined ? advancedMsg(messageHeader) : msg('registerTitle')}
      documentTitle={msgStr('registerTitle')}
      subtitle={passwordRequired ? undefined : msg('fcRegisterPasswordLater')}
      displayMessage={messagesPerField.exists('global')}
      displayInfo
      infoNode={<span>{msg('fcHaveAccount')} <a href={url.loginUrl}>{msg('doLogIn')}</a></span>}
    >
      <form id="kc-register-form" action={url.registrationAction} method="post" noValidate className="flex flex-col gap-5">
        <ProfileFields
          kcContext={kcContext}
          i18n={i18n}
          hints={emailTaken ? { email: <span>{msg('fcEmailTaken')} <a href={url.loginResetCredentialsUrl} onClick={rememberEmail}>{msg('fcEmailTakenAction')}</a></span> } : {}}
          initial={carried ? { email: carried } : undefined}
        />
        {termsAcceptanceRequired && (
          <div className="flex flex-col gap-2">
            {msgStr('termsText') && <p className="text-100 text-fg-muted">{msg('termsText')}</p>}
            <Checkbox id="termsAccepted" label={msg('acceptTerms')} aria-invalid={messagesPerField.existsError('termsAccepted') || undefined} />
            {messagesPerField.existsError('termsAccepted') && (
              <p className="flex items-start gap-1.5 text-75 leading-tight text-negative-900">
                <IconAlert size={14} className="mt-px shrink-0" />
                <ServerText html={messagesPerField.get('termsAccepted')} />
              </p>
            )}
          </div>
        )}
        {recaptchaRequired && !invisibleRecaptcha && <div className="g-recaptcha" data-size="compact" data-sitekey={recaptchaSiteKey} data-action={recaptchaAction} />}
        {invisibleRecaptcha ? (
          // El reCAPTCHA invisible se engancha a la clase y los data- del botón.
          <button type="submit" className={`${BUTTON_PRIMARY} g-recaptcha mt-3`} data-sitekey={recaptchaSiteKey} data-callback="onSubmitRecaptcha" data-action={recaptchaAction}>
            {msg('doRegister')}
          </button>
        ) : (
          <Actions submit={msg('doRegister')} />
        )}
      </form>
    </Template>
  );
}
