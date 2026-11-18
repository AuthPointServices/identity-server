import { ProgressCircle } from '@authpoint/ui';
import { useEffect, useRef, useState } from 'react';
import { BUTTON_PRIMARY } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

// Lo que se espera al envío automático antes de ofrecer «Continuar».
const WAIT_MS = 8000;

/**
 * El paso a una app SAML: el navegador envía solo el formulario. Si a los 8 s sigue aquí, o se vuelve atrás a esta
 * página, «Continuar» lo envía a mano; sin JavaScript, el botón está desde el principio.
 */
export default function SamlPostForm({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'saml-post-form.ftl' }>; i18n: I18n }) {
  const { samlPost } = kcContext;
  const { msg, msgStr } = i18n;
  const form = useRef<HTMLFormElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    // «#» es la dirección de los mocks: enviarlo recargaría la página sin fin.
    if (samlPost.url !== '#') form.current?.requestSubmit();
    const t = setTimeout(() => setStuck(true), WAIT_MS);
    const back = (e: PageTransitionEvent) => void (e.persisted && setStuck(true));
    addEventListener('pageshow', back);
    return () => { clearTimeout(t); removeEventListener('pageshow', back); };
  }, [samlPost.url]);
  return (
    <Template kcContext={kcContext} i18n={i18n} doUseDefaultCss={false} displayMessage={false} headerNode={msg('saml.post-form.title')} documentTitle={msgStr('saml.post-form.title')}>
      <form ref={form} name="saml-post-binding" method="post" action={samlPost.url}>
        {samlPost.SAMLRequest && <input type="hidden" name="SAMLRequest" value={samlPost.SAMLRequest} />}
        {samlPost.SAMLResponse && <input type="hidden" name="SAMLResponse" value={samlPost.SAMLResponse} />}
        {samlPost.relayState && <input type="hidden" name="RelayState" value={samlPost.relayState} />}
        {stuck ? (
          <button type="submit" className={BUTTON_PRIMARY}>{msg('doContinue')}</button>
        ) : (
          <span className="text-fg-muted"><ProgressCircle aria-label={msgStr('saml.post-form.title')} /></span>
        )}
        <noscript>
          <p className="mb-5 text-100 text-fg-muted">{msg('saml.post-form.js-disabled')}</p>
          <button type="submit" className={BUTTON_PRIMARY}>{msg('doContinue')}</button>
        </noscript>
      </form>
    </Template>
  );
}
