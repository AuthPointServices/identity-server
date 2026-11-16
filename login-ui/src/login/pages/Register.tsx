import { useLayoutEffect } from 'react';
import { Actions } from '../components/Actions';
import { ProfileFields } from '../components/ProfileFields';
import { BUTTON_PRIMARY, Checkbox, ServerText } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Crear la cuenta: los campos del perfil del realm. Con verificación de correo, la contraseña llega después. */
export default function Register({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'register.ftl' }>; i18n: I18n }) {
  const { messageHeader, url, messagesPerField, recaptchaRequired, recaptchaVisible, recaptchaSiteKey, recaptchaAction, termsAcceptanceRequired } = kcContext;
  const { msg, msgStr, advancedMsg } = i18n;
  const invisibleRecaptcha = recaptchaRequired && !recaptchaVisible && recaptchaAction !== undefined;

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
      displayMessage={messagesPerField.exists('global')}
      displayInfo
      infoNode={<span>{msg('fcHaveAccount')} <a href={url.loginUrl}>{msg('doLogIn')}</a></span>}
    >
      <form id="kc-register-form" action={url.registrationAction} method="post" noValidate className="flex flex-col gap-5">
        <ProfileFields kcContext={kcContext} i18n={i18n} />
        {termsAcceptanceRequired && (
          <div className="flex flex-col gap-2">
            <p className="text-sm/5 text-fg-muted">{msg('termsText')}</p>
            <Checkbox id="termsAccepted" label={msg('acceptTerms')} aria-invalid={messagesPerField.existsError('termsAccepted') || undefined} />
            {messagesPerField.existsError('termsAccepted') && <ServerText className="text-sm/5 text-danger" html={messagesPerField.get('termsAccepted')} />}
          </div>
        )}
        {recaptchaRequired && !invisibleRecaptcha && <div className="g-recaptcha" data-size="compact" data-sitekey={recaptchaSiteKey} data-action={recaptchaAction} />}
        {invisibleRecaptcha ? (
          // El reCAPTCHA invisible se engancha a la clase y los data- del botón.
          <button type="submit" className={`${BUTTON_PRIMARY} g-recaptcha mt-1`} data-sitekey={recaptchaSiteKey} data-callback="onSubmitRecaptcha" data-action={recaptchaAction}>
            {msg('doRegister')}
          </button>
        ) : (
          <Actions submit={msg('doRegister')} />
        )}
      </form>
    </Template>
  );
}
