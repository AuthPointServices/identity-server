import { useScript } from 'keycloakify/login/pages/WebauthnAuthenticate.useScript';
import { IconFingerprint } from '../components/icons';
import { BUTTON_PRIMARY } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

const AUTH_BUTTON = 'authenticateWebAuthnButton';

/** Entrar con la passkey: el botón que abre el aviso del navegador y, si hay varias, cuáles sirven. */
export default function WebauthnAuthenticate({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'webauthn-authenticate.ftl' }>; i18n: I18n }) {
  const { url, realm, registrationDisabled, authenticators, shouldDisplayAuthenticators } = kcContext;
  const { msg, msgStr } = i18n;
  useScript({ authButtonId: AUTH_BUTTON, kcContext, i18n });
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('webauthn-login-title')}
      documentTitle={msgStr('webauthn-login-title')}
      subtitle={msg('webauthn-help-text')}
      displayInfo={realm.registrationAllowed && !registrationDisabled}
      infoNode={<span>{msg('noAccount')} <a href={url.registrationUrl}>{msg('doRegister')}</a></span>}
    >
      <form id="webauth" action={url.loginAction} method="post" hidden>
        {['clientDataJSON', 'authenticatorData', 'signature', 'credentialId', 'userHandle', 'error'].map((n) => <input key={n} type="hidden" id={n} name={n} />)}
      </form>
      {authenticators && authenticators.authenticators.length > 0 && (
        <form id="authn_select" hidden>
          {authenticators.authenticators.map((a) => <input key={a.credentialId} type="hidden" name="authn_use_chk" readOnly value={a.credentialId} />)}
        </form>
      )}
      {shouldDisplayAuthenticators && authenticators && authenticators.authenticators.length > 1 && (
        <ul className="flex flex-col gap-2">
          {authenticators.authenticators.map((a) => (
            <li key={a.credentialId} className="rounded-md border border-border px-4 py-3">
              <p className="text-200 font-medium text-fg">{a.label}</p>
              <p className="text-100 text-fg-muted">{msg('webauthn-createdAt-label')} {a.createdAt}</p>
            </li>
          ))}
        </ul>
      )}
      <button id={AUTH_BUTTON} type="button" autoFocus className={`${BUTTON_PRIMARY} mt-3`}>
        <IconFingerprint size={18} />
        {msg('webauthn-doAuthenticate')}
      </button>
    </Template>
  );
}
