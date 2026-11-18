import { useState } from 'react';
import { Actions } from '../components/Actions';
import { IconCheck, IconCopy, IconDownload } from '../components/icons';
import { BUTTON_SECONDARY, Checkbox, Notice } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

type Ctx = Extract<KcContext, { pageId: 'login-recovery-authn-code-config.ftl' }>;

const grouped = (code: string) => code.match(/.{1,4}/g)?.join('-') ?? code;

/** Los códigos de recuperación recién generados: se muestran una sola vez. */
export default function LoginRecoveryAuthnCodeConfig({ kcContext, i18n }: { kcContext: Ctx; i18n: I18n }) {
  const { url, realm, recoveryAuthnCodesConfigBean: bean, isAppInitiatedAction } = kcContext;
  const { msg, msgStr, currentLanguage } = i18n;
  const [copied, setCopied] = useState(false);
  const codes = bean.generatedRecoveryAuthnCodesList.map(grouped);
  const list = codes.map((c, i) => `${i + 1}. ${c}`).join('\n');
  const brand = realm.displayName || realm.name;

  const copy = () => void navigator.clipboard.writeText(list).then(() => setCopied(true));
  const download = () => {
    const when = new Intl.DateTimeFormat(currentLanguage.languageTag, { dateStyle: 'long', timeStyle: 'short' }).format(bean.generatedAt);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([`${msgStr('fcRecoveryFileHeader', brand, when)}\n\n${list}\n`], { type: 'text/plain;charset=utf-8' }));
    a.download = msgStr('fcRecoveryFileName', brand.toLowerCase());
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href));
  };

  return (
    <Template kcContext={kcContext} i18n={i18n} doUseDefaultCss={false} headerNode={msg('fcRecoveryTitle')} documentTitle={msgStr('fcRecoveryTitle')} subtitle={msg('fcRecoveryIntro')}>
      <div className="flex flex-col gap-3">
        <Notice type="warning">{msg('fcRecoveryWarning')}</Notice>
        <ol aria-label={msgStr('fcRecoveryListLabel')} className="grid grid-cols-[repeat(auto-fill,minmax(8.75rem,1fr))] gap-x-4 gap-y-1 rounded-lg border border-border bg-layer-1 px-4 py-3">
          {codes.map((c, i) => (
            <li key={c} className="flex items-baseline gap-2">
              <span aria-hidden="true" className="w-4 shrink-0 text-right text-75 text-fg-muted tabular-nums">{i + 1}</span>
              <span className="font-mono text-100 text-fg">{c}</span>
            </li>
          ))}
        </ol>
        <div className="flex gap-2">
          <button type="button" onClick={copy} className={`${BUTTON_SECONDARY} flex-1`}>
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            <span aria-live="polite">{copied ? msg('fcRecoveryCopied') : msg('fcRecoveryCopy')}</span>
          </button>
          <button type="button" onClick={download} className={`${BUTTON_SECONDARY} flex-1`}>
            <IconDownload size={16} />
            {msg('fcRecoveryDownload')}
          </button>
        </div>
      </div>
      <form id="kc-recovery-codes-settings-form" action={url.loginAction} method="post" className="flex flex-col gap-5">
        <input type="hidden" name="generatedRecoveryAuthnCodes" value={bean.generatedRecoveryAuthnCodesAsString} />
        <input type="hidden" name="generatedAt" value={bean.generatedAt} />
        <input type="hidden" name="userLabel" value={msgStr('recovery-codes-label-default')} />
        <Checkbox id="fcRecoverySaved" label={msg('fcRecoverySaved')} required />
        <Actions submit={msg('fcRecoveryDone')} cancel={isAppInitiatedAction && msg('doCancel')} submitProps={{ id: 'saveRecoveryAuthnCodesBtn' }} />
      </form>
    </Template>
  );
}
