import { useEffect, useState } from 'react';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

// Lo que se espera a una app antes de decir que no respondió.
const WAIT_MS = 8000;

/**
 * Cerrando la sesión en las apps que lo piden por el navegador (front-channel): cada una en un iframe oculto. Cuando
 * responden todas, a la dirección de salida si la hay; si no, el desenlace aquí. La que no responde a tiempo se nombra.
 */
export default function FrontchannelLogout({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'frontchannel-logout.ftl' }>; i18n: I18n }) {
  const { logout, properties } = kcContext;
  const { msg, msgStr } = i18n;
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(new Set());
  const [late, setLate] = useState(false);
  const done = loaded.size === logout.clients.length;
  const redirect = logout.logoutRedirectUri;
  useEffect(() => {
    const t = setTimeout(() => setLate(true), WAIT_MS);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (done && redirect) window.location.replace(redirect);
  }, [done, redirect]);
  const failed = late && !done;
  const title = failed ? 'fcFrontchannelLogoutPartial' : done && !redirect ? 'successLogout' : 'frontchannel-logout.title';
  const account = properties.FC_ACCOUNT_URL;
  return (
    <Template kcContext={kcContext} i18n={i18n} doUseDefaultCss={false} headerNode={msg(title)} documentTitle={msgStr(title)}>
      {logout.clients.length > 0 && (
        <div className="flex flex-col gap-2 text-200 text-fg">
          <p>{msg('frontchannel-logout.message')}</p>
          <ul className="flex list-disc flex-col gap-1 pl-5 marker:text-fg-muted">
            {logout.clients.map((c, i) => {
              const missing = failed && !loaded.has(i);
              return (
                <li key={c.name} className={`break-words ${missing ? 'marker:text-negative-900' : ''}`}>
                  {c.name}
                  {missing && <span className="text-fg-muted"> · {msg('fcFrontchannelNoResponse', c.name)}</span>}
                  <iframe src={c.frontChannelLogoutUrl} title={c.name} hidden onLoad={() => setLoaded((s) => new Set(s).add(i))} />
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {redirect ? (
        <a id="continue" href={redirect} className={`${BUTTON_PRIMARY} mt-3`}>{msg('doContinue')}</a>
      ) : (
        (done || failed) && account && <a href={account} className={`${BUTTON_SECONDARY} mt-3`}>{msg('fcGoToAccount')}</a>
      )}
    </Template>
  );
}
