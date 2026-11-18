import { Actions } from '../components/Actions';
import { Field } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** El segundo paso con un código de recuperación. Keycloak pide uno concreto de la lista. */
export default function LoginRecoveryAuthnCodeInput({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-recovery-authn-code-input.ftl' }>; i18n: I18n }) {
  const { url, messagesPerField, recoveryAuthnCodesInputBean: bean } = kcContext;
  const { msg, msgStr } = i18n;
  const error = messagesPerField.existsError('recoveryCodeInput') ? messagesPerField.get('recoveryCodeInput') : undefined;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('fcRecoveryInputTitle')}
      documentTitle={msgStr('fcRecoveryInputTitle')}
      subtitle={msg('fcRecoveryInputHint', String(bean.codeNumber))}
      displayMessage={!error}
    >
      <form id="kc-recovery-code-login-form" action={url.loginAction} method="post" className="flex flex-col gap-5" onSubmit={(e) => {
        // Keycloak sólo quita los guiones: en minúsculas o con espacios no valdría.
        const input = e.currentTarget.elements.namedItem('recoveryCodeInput') as HTMLInputElement;
        input.value = input.value.toUpperCase().replace(/\s/g, '');
      }}>
        <Field
          id="recoveryCodeInput"
          label={msg('fcRecoveryInputLabel', String(bean.codeNumber))}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus
          error={error}
          className="font-mono text-300 tracking-[0.06em] uppercase"
        />
        <Actions submit={msg('doContinue')} submitProps={{ id: 'kc-login', name: 'login' }} />
      </form>
    </Template>
  );
}
