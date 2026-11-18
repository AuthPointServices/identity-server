import { Actions } from '../components/Actions';
import { BUTTON_DANGER, Notice } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Borrar la cuenta: qué pasa, en dos líneas, y el único botón rojo del tema. */
export default function DeleteAccountConfirm({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'delete-account-confirm.ftl' }>; i18n: I18n }) {
  const { url, triggered_from_aia } = kcContext;
  const { msg, msgStr } = i18n;
  return (
    <Template kcContext={kcContext} i18n={i18n} doUseDefaultCss={false} headerNode={msg('deleteAccountConfirm')} documentTitle={msgStr('deleteAccountConfirm')}>
      <Notice type="warning">{msg('irreversibleAction')}</Notice>
      <div className="text-200 text-fg">
        <p>{msg('deletingImplies')}</p>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 marker:text-fg-muted">
          <li>{msg('loggingOutImmediately')}</li>
          <li>{msg('errasingData')}</li>
        </ul>
      </div>
      <form id="kc-deleteaccount-form" action={url.loginAction} method="post">
        <Actions submit={msg('doConfirmDelete')} submitClassName={BUTTON_DANGER} cancel={triggered_from_aia && msgStr('doCancel')} />
      </form>
    </Template>
  );
}
