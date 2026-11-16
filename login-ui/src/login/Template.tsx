import { useInitialize } from 'keycloakify/login/Template.useInitialize';
import type { TemplateProps } from 'keycloakify/login/TemplateProps';
import { useEffect, type ReactNode } from 'react';
import { IconChevronDown } from './components/icons';
import { BUTTON_SECONDARY, Notice, ServerText } from './components/ui';
import type { I18n } from './i18n';
import type { KcContext } from './KcContext';

export type LayoutProps = TemplateProps<KcContext, I18n> & {
  /** Una frase bajo el título que explica la pantalla. */
  subtitle?: ReactNode;
};

/**
 * La página de acceso: una tarjeta de 440 px con la marca y el idioma arriba, el título, el contenido y, al pie tras
 * una raya, lo que lleva a otra pantalla. Anclada arriba (más cerca cuanto más baja es la ventana) para que la marca y
 * el título no se muevan entre pantallas ni al salir un error. En una ventana de menos de 760 px de alto (un portátil
 * con el navegador) todo se aprieta un poco para no desplazar. En el teléfono no hay tarjeta.
 */
export default function Template(props: LayoutProps) {
  const { kcContext, i18n, headerNode, subtitle, children, socialProvidersNode, infoNode, documentTitle } = props;
  const { displayInfo = false, displayMessage = true } = props;
  const { realm, auth, url, message, isAppInitiatedAction } = kcContext;
  const { msg, msgStr, currentLanguage, enabledLanguages } = i18n;
  // La marca es el nombre del realm (BRAND_NAME en identity-server/.env): se cambia en un solo sitio.
  const brand = realm.displayName || realm.name;

  useEffect(() => {
    document.title = documentTitle ? `${documentTitle} · ${brand}` : brand;
  }, [documentTitle, brand]);

  useEffect(() => {
    document.documentElement.lang = currentLanguage.languageTag;
  }, [currentLanguage.languageTag]);

  const { isReadyToRender } = useInitialize({ kcContext, doUseDefaultCss: false });
  if (!isReadyToRender) return null;

  // Las acciones que pide la propia app no ven el aviso de que hay que completarlas.
  const showMessage = displayMessage && message !== undefined && (message.type !== 'warning' || !isAppInitiatedAction);
  // Un aviso informativo sin descripción propia («Por seguridad, vuelve a escribir tu contraseña.») explica la
  // pantalla: va como la frase bajo el título, no en una caja.
  const infoAsSubtitle = showMessage && message.type === 'info' && !subtitle;

  return (
    <div className="flex min-h-dvh justify-center px-6 pt-[clamp(16px,calc(14vh-56px),104px)] pb-6 max-sm:p-0 [@media(max-height:760px)]:pt-4 [@media(max-height:760px)]:pb-4">
      <main className="h-fit w-full max-w-[440px] rounded-2xl border border-border bg-surface p-8 [@media(max-height:760px)]:py-6 shadow-[0_1px_2px_rgb(16_24_40/0.04),0_16px_40px_-16px_rgb(16_24_40/0.14)] max-sm:max-w-none max-sm:rounded-none max-sm:border-0 max-sm:px-6 max-sm:pt-3 max-sm:shadow-none">
        <header className="flex h-10 items-center justify-between gap-4">
          <p className="text-lg/6 font-semibold tracking-[-0.015em] text-fg">{brand}</p>
          {enabledLanguages.length > 1 && (
            <div className="relative -mr-2 flex items-center">
              <select
                aria-label={msgStr('languages')}
                value={currentLanguage.languageTag}
                onChange={(e) => {
                  const href = enabledLanguages.find((l) => l.languageTag === e.target.value)?.href;
                  if (href) window.location.href = href;
                }}
                className="h-10 cursor-pointer appearance-none rounded-lg bg-transparent pr-8 pl-2.5 text-sm/5 font-medium text-fg-muted transition-colors duration-quick hover:bg-container hover:text-fg pointer-coarse:h-11"
              >
                {enabledLanguages.map((l) => (
                  <option key={l.languageTag} value={l.languageTag}>{l.label}</option>
                ))}
              </select>
              <IconChevronDown size={16} className="pointer-events-none absolute right-2.5 text-fg-muted" />
            </div>
          )}
        </header>

        <h1 className="mt-6 text-2xl/8 [@media(max-height:760px)]:mt-4 font-semibold tracking-[-0.02em] text-balance text-fg">{headerNode}</h1>
        {(subtitle || infoAsSubtitle) && (
          <p className="mt-2 text-[15px]/[22px] text-pretty text-fg-muted">{infoAsSubtitle ? <ServerText html={message.summary} /> : subtitle}</p>
        )}

        <div className="mt-6 flex flex-col gap-5">
          {showMessage && !infoAsSubtitle && <Notice type={message.type} html={message.summary} />}

          {/* Quien entra, cuando Keycloak ya lo sabe (al volver a pedir la contraseña, en los dos pasos…). */}
          {auth?.showUsername && !auth.showResetCredentials && (
            <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 py-1.5 pr-1.5 pl-4">
              <span className="min-w-0 truncate text-[15px]/[22px] font-medium text-fg">{auth.attemptedUsername}</span>
              <a href={url.loginRestartFlowUrl} className="shrink-0 rounded-lg px-3 py-2 text-sm/5 no-underline! hover:bg-accent/8 pointer-coarse:py-3">
                {msg('restartLoginTooltip')}
              </a>
            </div>
          )}

          {children}

          {auth?.showTryAnotherWayLink && (
            <form id="kc-select-try-another-way-form" action={url.loginAction} method="post">
              <input type="hidden" name="tryAnotherWay" value="on" />
              <button type="submit" className={BUTTON_SECONDARY}>{msg('doTryAnotherWay')}</button>
            </form>
          )}

          {socialProvidersNode}
        </div>

        {displayInfo && infoNode && (
          <div className="-mx-8 mt-8 border-t border-border px-8 pt-6 text-center text-sm/5 text-fg-muted max-sm:-mx-6 max-sm:px-6">{infoNode}</div>
        )}
      </main>
    </div>
  );
}
