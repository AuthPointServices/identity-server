import { BUTTON_PRIMARY, BUTTON_TEXT } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

// Sólo direcciones web: van a un href que pone el administrador de la app.
const web = (s: string | undefined) => (s && /^https?:\/\//i.test(s) ? s : undefined);
// «offline_access» no es un dato más: cambia cuándo puede ver todos los demás.
const OFFLINE = '${offlineAccessScopeConsentText}';
const INLINE_LINK = 'font-medium text-accent-content underline decoration-1 underline-offset-2';

/** ¿Dar acceso a una app de fuera?: qué podrá ver, desde cuándo y, si las tiene, sus condiciones y su privacidad. */
export default function LoginOauthGrant({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-oauth-grant.ftl' }>; i18n: I18n }) {
  const { url, oauth, client } = kcContext;
  const { msg, msgStr, advancedMsg, advancedMsgStr } = i18n;
  const app = client.name ? advancedMsgStr(client.name) : client.clientId;
  const requested = oauth.clientScopesRequested.filter((s) => s.consentScreenText);
  const scopes = requested.filter((s) => s.consentScreenText !== OFFLINE);
  const offline = scopes.length < requested.length;
  const tos = web(client.attributes.tosUri);
  const policy = web(client.attributes.policyUri);
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('oauthGrantTitle', app)}
      documentTitle={msgStr('oauthGrantTitle', app)}
      subtitle={requested.length === 0 ? msg('fcOauthGrantNothing') : undefined}
    >
      {requested.length > 0 && (
        <div className="flex flex-col gap-2 text-200 text-fg">
          {scopes.length > 0 && (
            <>
              <p>{msg('oauthGrantRequest')}</p>
              <ul className="flex list-disc flex-col gap-1 pl-5 marker:text-fg-muted">
                {scopes.map((s) => (
                  <li key={s.consentScreenText + (s.dynamicScopeParameter ?? '')} className="break-words">
                    {advancedMsg(s.consentScreenText)}
                    {s.dynamicScopeParameter && ` «${s.dynamicScopeParameter}»`}
                  </li>
                ))}
              </ul>
            </>
          )}
          {offline && <p>{msg(scopes.length > 0 ? 'fcOauthGrantOffline' : 'offlineAccessScopeConsentText')}</p>}
        </div>
      )}
      {(tos || policy) && (
        <p className="text-100 text-pretty text-fg-muted">
          {msg('fcOauthGrantReview')}{' '}
          {tos && <a href={tos} target="_blank" rel="noopener noreferrer" className={INLINE_LINK}>{msg('oauthGrantTos')}</a>}
          {tos && policy && ` ${msgStr('fcAnd')} `}
          {policy && <a href={policy} target="_blank" rel="noopener noreferrer" className={INLINE_LINK}>{msg('oauthGrantPolicy')}</a>}.
        </p>
      )}
      <form action={url.oauthAction} method="post" className="mt-3 flex flex-col gap-2">
        <input type="hidden" name="code" value={oauth.code} />
        <button id="kc-login" type="submit" name="accept" className={BUTTON_PRIMARY}>{msg('fcOauthGrantAllow')}</button>
        <button id="kc-cancel" type="submit" name="cancel" className={BUTTON_TEXT}>{msg('fcOauthGrantDeny')}</button>
      </form>
    </Template>
  );
}
