import { useScript } from 'keycloakify/login/pages/LoginPasskeysConditionalAuthenticate.useScript';
import { PASSKEY_BUTTON, PasskeyButton } from '../components/Passkey';
import { Field } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/**
 * Entrar con una passkey desde el campo del correo (el navegador la ofrece al tocarlo). El script de Keycloak muestra el
 * campo si el navegador sabe hacerlo y, si no, el botón: los dos empiezan ocultos.
 */
export default function LoginPasskeysConditionalAuthenticate({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-passkeys-conditional-authenticate.ftl' }>; i18n: I18n }) {
  const { messagesPerField, login, url, usernameHidden, shouldDisplayAuthenticators, authenticators, registrationDisabled, realm } = kcContext;
  const { msg, msgStr } = i18n;
  useScript({ authButtonId: PASSKEY_BUTTON, kcContext, i18n });
  const list = authenticators?.authenticators ?? [];
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('passkey-login-title')}
      documentTitle={msgStr('passkey-login-title')}
      displayInfo={realm.registrationAllowed && !registrationDisabled}
      infoNode={<span>{msg('noAccount')} <a href={url.registrationUrl}>{msg('doRegister')}</a></span>}
    >
      {shouldDisplayAuthenticators && list.length > 1 && (
        <ul aria-label={msgStr('passkey-available-authenticators')} className="flex flex-col gap-2">
          {list.map((a) => (
            <li key={a.credentialId} className="rounded-md border border-border px-4 py-3">
              <p className="text-200 font-medium text-fg">{a.label}</p>
              <p className="text-100 text-fg-muted">{msg('passkey-createdAt-label')} {a.createdAt}</p>
            </li>
          ))}
        </ul>
      )}
      {realm.password && (
        <form id="kc-form-login" action={url.loginAction} method="post" style={{ display: 'none' }}>
          {!usernameHidden && (
            <Field
              id="username"
              label={realm.registrationEmailAsUsername ? msg('email') : msg('username')}
              defaultValue={login.username ?? ''}
              autoComplete="username webauthn"
              autoFocus
              error={messagesPerField.existsError('username') ? messagesPerField.get('username') : undefined}
            />
          )}
        </form>
      )}
      <div id="kc-form-passkey-button" style={{ display: 'none' }}>
        <PasskeyButton loginAction={url.loginAction} credentialIds={list.map((a) => a.credentialId)} label={msg('passkey-doAuthenticate')} primary />
      </div>
    </Template>
  );
}
