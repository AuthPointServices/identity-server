import { useInitialize } from 'keycloakify/login/Template.useInitialize';
import type { TemplateProps } from 'keycloakify/login/TemplateProps';
import { useEffect, type ReactNode } from 'react';
import fireStill from './assets/fire.webp';
import { FireField } from './components/FireField';
import { IconChevronDown } from './components/icons';
import { BUTTON_SECONDARY, Notice, ServerText } from './components/ui';
import type { I18n } from './i18n';
import type { KcContext } from './KcContext';

export type LayoutProps = TemplateProps<KcContext, I18n> & {
  /** Una frase bajo el título que explica la pantalla. */
  subtitle?: ReactNode;
  /** La ilustración de una pantalla de estado (components/Art): centrada, entre el texto y los botones. */
  art?: ReactNode;
};

/**
 * La página de acceso, a pantalla partida: a la izquierda la marca, el formulario en una columna de 400 px y el idioma;
 * a la derecha, desde 1024 px, el panel de la marca. El formulario va anclado arriba, para que el título no se mueva al
 * salir un error. En el teléfono sólo queda la columna del formulario.
 */
export default function Template(props: LayoutProps) {
  const { kcContext, i18n, headerNode, subtitle, art, children, socialProvidersNode, infoNode, documentTitle } = props;
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

  // Mete los scripts de Keycloak (la sesión en otras pestañas). Su «isReadyToRender» espera las hojas de PatternFly, que
  // aquí no hay: esperarlo pintaba la página vacía antes de cada pantalla.
  useInitialize({ kcContext, doUseDefaultCss: false });

  // Las acciones que pide la propia app no ven el aviso de que hay que completarlas.
  const showMessage = displayMessage && message !== undefined && (message.type !== 'warning' || !isAppInitiatedAction);
  // Un aviso informativo sin descripción propia («Por seguridad, vuelve a escribir tu contraseña.») explica la
  // pantalla: va como la frase bajo el título, no en una caja.
  const infoAsSubtitle = showMessage && message.type === 'info' && !subtitle;

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(560px,5fr)_minmax(0,6fr)]">
      <div className="flex min-w-0 flex-col px-6 pt-5 pb-6 sm:px-12 sm:pt-8 lg:px-16 [@media(max-height:760px)]:pt-5">
        <header className="flex h-10 items-center justify-between gap-4 lg:justify-end">
          {/* Desde 1024 px el nombre ya está en el panel: aquí sólo en la columna sola. */}
          <p className="text-lg/6 font-semibold tracking-[-0.02em] text-fg lg:hidden">{brand}</p>
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

        {/* En pantallas bajas (un portátil de 720 px), menos aire arriba y abajo: el formulario entero cabe sin desplazar. */}
        <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col pt-[clamp(32px,calc(18vh-48px),136px)] pb-10 max-sm:pt-8 [@media(max-height:760px)]:pt-6 [@media(max-height:760px)]:pb-4">
          <h1 className="text-[30px]/[38px] font-semibold tracking-[-0.025em] text-balance text-fg max-sm:text-[26px]/[34px]">{headerNode}</h1>
          {(subtitle || infoAsSubtitle) && (
            <p className="mt-2 text-base/6 text-pretty text-fg-muted">{infoAsSubtitle ? <ServerText html={message.summary} /> : subtitle}</p>
          )}

          <div className="mt-8 flex flex-col gap-5 max-sm:mt-6">
            {showMessage && !infoAsSubtitle && <Notice type={message.type} html={message.summary} />}
            {art && <div className="flex justify-center py-2">{art}</div>}

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

          {displayInfo && infoNode && <div className="mt-8 text-sm/5 text-fg-muted">{infoNode}</div>}
        </main>
      </div>

      <BrandPanel brand={brand} />
    </div>
  );
}

/**
 * El panel de la marca, desde 1024 px: el shader de fuego y el nombre grande abajo, en blanco. Debajo del shader va un
 * fotograma suyo (assets/fire.webp, 50 KB): es lo que se ve sin WebGL (aceleración gráfica apagada) o mientras carga.
 */
function BrandPanel({ brand }: { brand: string }) {
  return (
    <aside aria-hidden="true" style={{ backgroundImage: `url(${fireStill})` }} className="relative hidden overflow-hidden bg-black bg-cover bg-center lg:block forced-colors:hidden">
      <FireField className="absolute inset-0" />
      <p className="absolute bottom-14 left-14 text-[clamp(56px,6vw,88px)]/[0.95] font-semibold tracking-[-0.045em] text-white">{brand}</p>
    </aside>
  );
}
