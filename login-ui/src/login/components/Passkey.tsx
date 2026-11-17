import type { ReactNode } from 'react';
import { IconFingerprint } from './icons';
import { BUTTON_SECONDARY } from './ui';

/** El id del botón: lo buscan los scripts de passkeys de Keycloak (useScript de cada página). */
export const PASSKEY_BUTTON = 'authenticateWebAuthnButton';

/**
 * Entrar con una passkey: los formularios ocultos que rellenan los scripts de Keycloak al terminar la passkey y el
 * botón que la pide. Lo comparten la página del correo, la de la contraseña y la de entrar de antes.
 */
export function PasskeyButton({ loginAction, credentialIds, label }: { loginAction: string; credentialIds: string[]; label: ReactNode }) {
  return (
    <>
      <form id="webauth" action={loginAction} method="post" hidden>
        {['clientDataJSON', 'authenticatorData', 'signature', 'credentialId', 'userHandle', 'error'].map((n) => <input key={n} type="hidden" id={n} name={n} />)}
      </form>
      {credentialIds.length > 0 && (
        <form id="authn_select" hidden>
          {credentialIds.map((id) => <input key={id} type="hidden" name="authn_use_chk" readOnly value={id} />)}
        </form>
      )}
      <button id={PASSKEY_BUTTON} type="button" className={`${BUTTON_SECONDARY} font-medium`}>
        <IconFingerprint />
        {label}
      </button>
    </>
  );
}
