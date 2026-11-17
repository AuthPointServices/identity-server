import { useScript } from 'keycloakify/login/pages/LoginUsername.useScript';
import { useState } from 'react';
import { PasskeyButton, PASSKEY_BUTTON } from '../components/Passkey';
import { SocialProviders } from '../components/SocialProviders';
import { ProviderLogo } from '../components/icons';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, Checkbox, Field, ServerText } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';
import { REGISTER_EMAIL_KEY } from './Register';

/**
 * Entrar, primer paso, como en Adobe: crear una cuenta bajo el título, sólo el correo y «Continuar», y debajo de la raya
 * las otras formas (proveedores y passkey; la passkey también la ofrece el navegador al tocar el correo). Si el correo
 * no tiene cuenta lo dice y ofrece crearla con él; si la cuenta entra con un proveedor (providers/EmailFirstForm.java),
 * lo dice con su botón, y seguir le manda un código por correo.
 */
export default function LoginUsername({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-username.ftl' }>; i18n: I18n }) {
  const { social, realm, url, login, registrationDisabled, messagesPerField, message, enableWebAuthnConditionalUI, authenticators } = kcContext;
  const { msg, msgStr } = i18n;
  const [submitting, setSubmitting] = useState(false);
  useScript({ webAuthnButtonId: PASSKEY_BUTTON, kcContext, i18n });

  const error = messagesPerField.existsError('username') ? messagesPerField.getFirstError('username') : undefined;
  const canRegister = realm.registrationAllowed && !registrationDisabled;
  const unknown = error === msgStr('invalidUsernameOrEmailMessage') || error === msgStr('invalidUsernameMessage');
  // Los avisos de EmailFirstForm: la cuenta existe pero no entra con contraseña.
  const providers = realm.password ? (social?.providers ?? []) : [];
  const usesProvider = message?.type === 'info' && message.summary.startsWith(msgStr('fcAccountUsesProvider', '').replace(/\.$/, '').trim());
  const hinted = usesProvider ? providers.filter((p) => message.summary.includes(p.displayName)) : [];
  const label = !realm.loginWithEmailAllowed ? msg('username') : msg('email');
  const rememberEmail = () => {
    try {
      sessionStorage.setItem(REGISTER_EMAIL_KEY, (document.getElementById('username') as HTMLInputElement | null)?.value ?? '');
    } catch {
      // Sin almacenamiento: en el registro se escribe a mano.
    }
  };

  const hint = unknown && canRegister ? (
    <a href={url.registrationUrl} onClick={rememberEmail}>{msg('fcCreateWithEmail')}</a>
  ) : usesProvider ? (
    <ServerText className="text-fg" html={message.summary} />
  ) : undefined;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('loginAccountTitle')}
      documentTitle={msgStr('loginAccountTitle')}
      subtitle={
        canRegister && (
          <>
            {msg('noAccount')} <a href={url.registrationUrl}>{msg('doRegister')}</a>
          </>
        )
      }
      displayMessage={!error && !usesProvider}
    >
      {realm.password && (
        <form id="kc-form-login" action={url.loginAction} method="post" onSubmit={() => setSubmitting(true)} className="flex flex-col gap-5">
          <Field
            id="username"
            label={label}
            type="email"
            defaultValue={login.username ?? ''}
            autoFocus
            autoComplete={enableWebAuthnConditionalUI ? 'username webauthn' : 'username'}
            spellCheck={false}
            error={error}
            hint={hint}
          />
          {/* La cuenta entra con un proveedor: su botón, aquí mismo, y «Continuar» pasa a segundo plano (sólo sirve si se
              cambia el correo). */}
          {hinted.length > 0 && (
            <div className="-mt-1 flex flex-col gap-2">
              {hinted.map((p) => (
                <a key={p.alias} id={`social-${p.alias}`} href={p.loginUrl} className={`${BUTTON_SECONDARY} border-fg font-medium`}>
                  <ProviderLogo providerId={p.providerId} size={18} />
                  {msgStr('fcContinueWith', p.displayName)}
                </a>
              ))}
            </div>
          )}
          {realm.rememberMe && <Checkbox id="rememberMe" label={msg('rememberMe')} defaultChecked={!!login.rememberMe} />}
          {/* Tras el aviso del proveedor, seguir es entrar con un código por correo (EmailFirstForm.FIELD_PROCEED). */}
          {hinted.length > 0 && <input type="hidden" name="fcProceed" value="true" />}
          <button id="kc-login" name="login" type="submit" disabled={submitting} className={`${hinted.length > 0 ? BUTTON_SECONDARY : BUTTON_PRIMARY} mt-3`}>
            {hinted.length > 0 ? msg('fcEmailCodeInstead') : msg('doContinue')}
          </button>
        </form>
      )}

      <SocialProviders
        providers={providers.filter((p) => !hinted.includes(p))}
        extra={enableWebAuthnConditionalUI ? [<PasskeyButton key="passkey" loginAction={url.loginAction} credentialIds={authenticators?.authenticators.map((a) => a.credentialId) ?? []} label={msg('passkey-doAuthenticate')} />] : []}
        continueWith={(name) => msgStr('fcContinueWith', name)}
        or={realm.password && msgStr('fcOrDivider')}
        more={msgStr('fcMoreSignInOptions')}
      />
    </Template>
  );
}
