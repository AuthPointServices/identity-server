import { Actions } from '../components/Actions';
import { ProfileFields } from '../components/ProfileFields';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Cambiar el correo: el nuevo, y Keycloak envía el enlace para confirmarlo. */
export default function UpdateEmail({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'update-email.ftl' }>; i18n: I18n }) {
  const { url, messagesPerField, isAppInitiatedAction } = kcContext;
  const { msg, msgStr } = i18n;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('updateEmailTitle')}
      documentTitle={msgStr('updateEmailTitle')}
      subtitle={msg('updateEmailMessage')}
      displayMessage={messagesPerField.exists('global')}
    >
      <form id="kc-update-email-form" action={url.loginAction} method="post" noValidate className="flex flex-col gap-5">
        <ProfileFields kcContext={kcContext} i18n={i18n} />
        <Actions submit={msg('doSubmit')} cancel={isAppInitiatedAction && msg('doCancel')} />
      </form>
    </Template>
  );
}
