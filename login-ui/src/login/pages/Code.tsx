import { CopyValue, ServerText } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/** El código para pegar en una app sin navegador, o por qué no lo hay. */
export default function Code({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'code.ftl' }>; i18n: I18n }) {
  const { code } = kcContext;
  const { msg, msgStr } = i18n;
  const title = code.success ? msgStr('codeSuccessTitle') : msgStr('fcCodeErrorTitle');
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={title}
      documentTitle={title}
      subtitle={code.success ? msg('copyCodeInstruction') : msg('fcCodeErrorHint')}
    >
      {code.success ? (
        <CopyValue id="code" value={code.code ?? ''} copyLabel={msgStr('fcCopyCode')} copiedLabel={msgStr('fcCodeCopied')} />
      ) : (
        // El código de OAuth (access_denied…), para quien da soporte; lo que hacer ya lo dice el subtítulo.
        code.error && <p id="error" className="text-75 text-fg-muted select-all">{msg('fcCodeErrorDetail')} <ServerText html={code.error} /></p>
      )}
    </Template>
  );
}
