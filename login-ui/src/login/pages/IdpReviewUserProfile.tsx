import { BUTTON_PRIMARY, BUTTON_TEXT } from '../components/ui';
import { ProfileFields } from '../components/ProfileFields';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Al entrar por primera vez con un proveedor (Google…): los datos que trajo, para revisarlos antes de crear la cuenta. */
export default function IdpReviewUserProfile({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'idp-review-user-profile.ftl' }>; i18n: I18n }) {
  const { url, messagesPerField, profile } = kcContext;
  const { msg, msgStr } = i18n;
  // Si el proveedor no compartió nada, la pantalla no es revisar: es completar.
  const shared = Object.values(profile.attributesByName).some((a) => a.annotations?.inputType !== 'hidden' && (a.value || a.values?.length));
  const title = shared ? 'loginIdpReviewProfileTitle' : 'fcIdpCompleteProfileTitle';
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg(title)}
      documentTitle={msgStr(title)}
      subtitle={msg(shared ? 'fcIdpReviewProfileHint' : 'fcIdpCompleteProfileHint')}
      displayMessage={messagesPerField.exists('global')}
    >
      <form id="kc-idp-review-profile-form" action={url.loginAction} method="post" noValidate className="flex flex-col gap-5">
        <ProfileFields kcContext={kcContext} i18n={i18n} />
        <div className="mt-3 flex flex-col gap-2">
          <button type="submit" className={BUTTON_PRIMARY}>{msg('doSubmit')}</button>
          {/* Si no era esta la cuenta: el proveedor queda sin conectar. */}
          <a href={url.loginRestartFlowUrl} className={BUTTON_TEXT}>{msg('restartLoginTooltip')}</a>
        </div>
      </form>
    </Template>
  );
}
