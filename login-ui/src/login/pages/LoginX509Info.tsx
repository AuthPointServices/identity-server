import { BUTTON_PRIMARY, BUTTON_TEXT, Notice } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';
import { commonName } from '../x509';

/**
 * Entrar con el certificado del navegador: con qué cuenta, de quién es el certificado y, si hay otra forma, esa. Sin
 * certificado, o con uno que no es de ninguna cuenta activa, sólo queda seguir con otra forma (el mismo «login»).
 */
export default function LoginX509Info({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-x509-info.ftl' }>; i18n: I18n }) {
  const { url, x509 } = kcContext;
  const { msg, msgStr } = i18n;
  const { subjectDN, isUserEnabled, username } = x509.formData;
  const account = isUserEnabled && username ? username : undefined;
  return (
    <Template kcContext={kcContext} i18n={i18n} doUseDefaultCss={false} headerNode={msg('fcX509Title')} documentTitle={msgStr('fcX509Title')}>
      {!subjectDN ? (
        <Notice type="info">{msg('noCertificate')}</Notice>
      ) : (
        <dl className="flex flex-col gap-4">
          {account && (
            <div className="flex flex-col gap-1">
              <dt className="text-100 font-medium text-fg-muted">{msg('doX509Login')}</dt>
              <dd id="username" className="text-200 font-bold wrap-anywhere text-fg-strong">{account}</dd>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <dt className="text-100 font-medium text-fg-muted">{msg('clientCertificate')}</dt>
            <dd className="flex flex-col gap-1 text-100 text-fg">
              <span className="wrap-anywhere">{commonName(subjectDN)}</span>
              {!account && <span className="text-fg-muted">{msg('fcX509NoAccount')}</span>}
              {commonName(subjectDN) !== subjectDN && (
                <details className="group">
                  <summary className="inline-flex min-h-6 w-fit cursor-pointer items-center font-medium text-accent-content marker:content-none touch:min-h-11 [&::-webkit-details-marker]:hidden">{msg('fcX509Details')}</summary>
                  <p id="certificate_subjectDN" className="mt-1 wrap-anywhere text-fg-muted">{subjectDN}</p>
                </details>
              )}
            </dd>
          </div>
        </dl>
      )}
      <form id="kc-x509-login-info" action={url.loginAction} method="post" className="mt-3 flex flex-col gap-2">
        <button id="kc-login" type="submit" name="login" className={BUTTON_PRIMARY}>{account ? msg('doContinue') : msg('fcX509Other')}</button>
        {account && <button id="kc-cancel" type="submit" name="cancel" className={BUTTON_TEXT}>{msg('fcX509Other')}</button>}
      </form>
    </Template>
  );
}
