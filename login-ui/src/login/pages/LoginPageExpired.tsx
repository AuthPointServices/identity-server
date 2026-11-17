import { Art } from '../components/Art';
import { BUTTON_PRIMARY, BUTTON_TEXT } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** Esta página caducó: por qué, y seguir donde ibas o volver a empezar, cada uno con su nombre. */
export default function LoginPageExpired({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-page-expired.ftl' }>; i18n: I18n }) {
  const { url } = kcContext;
  const { msg, msgStr } = i18n;
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      art={<Art kind="expired" />}
      headerNode={msg('pageExpiredTitle')}
      documentTitle={msgStr('pageExpiredTitle')}
      subtitle={msg('fcPageExpiredHint')}
    >
      <div className="flex flex-col gap-2">
        <a id="loginContinueLink" href={url.loginAction} className={BUTTON_PRIMARY}>{msg('fcExpiredContinue')}</a>
        <a id="loginRestartLink" href={url.loginRestartFlowUrl} className={BUTTON_TEXT}>{msg('fcExpiredRestart')}</a>
      </div>
    </Template>
  );
}
