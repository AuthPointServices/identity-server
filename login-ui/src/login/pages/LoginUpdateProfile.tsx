import { Actions } from '../components/Actions';
import { ProfileFields } from '../components/ProfileFields';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Completar los datos que le faltan a la cuenta (al entrar con un proveedor, o si el realm pide uno nuevo). */
export default function LoginUpdateProfile({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-update-profile.ftl' }>; i18n: I18n }) {
  const { url, messagesPerField, isAppInitiatedAction } = kcContext;
  const { msg, msgStr } = i18n;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('loginProfileTitle')}
      documentTitle={msgStr('loginProfileTitle')}
      displayMessage={messagesPerField.exists('global')}
    >
      <form id="kc-update-profile-form" action={url.loginAction} method="post" noValidate className="flex flex-col gap-5">
        <ProfileFields kcContext={kcContext} i18n={i18n} />
        <Actions submit={msg('doSubmit')} cancel={isAppInitiatedAction && msg('doCancel')} />
      </form>
    </Template>
  );
}
