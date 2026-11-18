import { Actions } from '../components/Actions';
import { BUTTON_DANGER } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Quitar una forma de entrar que pidió una app (kc_action=delete_credential): cuál, qué pasa, y cancelar. */
export default function DeleteCredential({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'delete-credential.ftl' }>; i18n: I18n }) {
  const { url, credentialLabel } = kcContext;
  const { msg, msgStr } = i18n;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      displayMessage={false}
      headerNode={msg('deleteCredentialTitle')}
      documentTitle={msgStr('deleteCredentialTitle')}
      // El nombre lo pone la persona (hasta 255 caracteres): va una vez, en el cuerpo, y se parte donde haga falta.
      subtitle={<><strong className="font-bold wrap-anywhere text-fg-strong">{credentialLabel}</strong> {msg('fcDeleteCredentialConsequence')}</>}
    >
      <form action={url.loginAction} method="post">
        <Actions submit={msg('fcRemove')} submitClassName={BUTTON_DANGER} submitProps={{ id: 'kc-accept', name: 'accept' }} cancel={msg('doCancel')} />
      </form>
    </Template>
  );
}
