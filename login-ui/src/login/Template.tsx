import { nativeButtonClass } from '@authpoint/ui';
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
  /** Sin «Prueba otra forma»: la página ya ofrece cada otra forma con su nombre. */
  tryAnotherWay?: boolean;
};

/**
 * La página de acceso, a pantalla partida: a la izquierda la marca, el formulario en una columna de 400 px y el idioma;
 * a la derecha, desde 1024 px, el panel de la marca. El formulario va anclado arriba. En el teléfono sólo queda la
 * columna del formulario.
 */
export default function Template(props: LayoutProps) {
  const { kcContext, i18n, headerNode, subtitle, art, tryAnotherWay = true, children, socialProvidersNode, infoNode, documentTitle } = props;
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
    <div className="grid min-h-dvh bg-bg lg:grid-cols-[minmax(560px,5fr)_minmax(0,6fr)]">
      <div className="flex min-w-0 flex-col px-6 pt-5 pb-10 sm:px-12 sm:pt-8 lg:px-16 [@media(max-height:820px)]:pt-5">
        <header className="flex h-10 items-center justify-between gap-4 lg:justify-end">
          {/* Desde 1024 px el nombre ya está en el panel: aquí sólo en la columna sola. */}
          <p className="text-300 leading-tight font-bold text-fg-strong lg:hidden">{brand}</p>
          {enabledLanguages.length > 1 && (
            <div className="relative -mr-2 flex items-center">
              <select
                aria-label={msgStr('languages')}
                value={currentLanguage.languageTag}
                onChange={(e) => {
                  const href = enabledLanguages.find((l) => l.languageTag === e.target.value)?.href;
                  if (href) window.location.href = href;
                }}
                className="h-(--size-control-m) cursor-pointer appearance-none rounded-full bg-transparent pr-8 pl-3 text-100 font-medium text-fg-muted transition-colors duration-quick hover:bg-hover hover:text-fg-strong"
              >
                {enabledLanguages.map((l) => (
                  <option key={l.languageTag} value={l.languageTag}>{l.label}</option>
                ))}
              </select>
              <IconChevronDown size={16} className="pointer-events-none absolute right-2.5 text-fg-muted" />
            </div>
          )}
        </header>

        {/* El aire sobre el título depende sólo de la ventana: el título no se mueve con un error y lo que no cabe se
            desplaza (decisión del juez, ui/DESIGN.md). Redondeado a 4 px. */}
        <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col pt-6 md:pt-[round(down,clamp(32px,13svh,160px),4px)]">
          <h1 className="text-700 leading-tight font-bold text-balance text-fg-strong">{headerNode}</h1>
          {(subtitle || infoAsSubtitle) && (
            <p className="mt-2 text-200 text-pretty text-fg-muted">{infoAsSubtitle ? <ServerText html={message.summary} /> : subtitle}</p>
          )}

          <div className="mt-8 flex flex-col gap-5 max-sm:mt-6">
            {showMessage && !infoAsSubtitle && <Notice type={message.type} html={message.summary} />}
            {art && <div className="flex justify-center py-2">{art}</div>}

            {/* Quien entra, cuando Keycloak ya lo sabe (al volver a pedir la contraseña, en los dos pasos…). */}
            {auth?.showUsername && !auth.showResetCredentials && (
              <div className="flex items-center justify-between gap-3 rounded-lg border-(length:--border-1) border-border bg-layer-1 py-1 pr-1 pl-4">
                <span title={auth.attemptedUsername} className="min-w-0 truncate text-200 font-medium text-fg-strong">{auth.attemptedUsername}</span>
                <a href={url.loginRestartFlowUrl} className={`${nativeButtonClass({ variant: 'quiet' })} text-accent-content! no-underline!`}>
                  {msg('restartLoginTooltip')}
                </a>
              </div>
            )}

            {children}

            {tryAnotherWay && auth?.showTryAnotherWayLink && (
              <form id="kc-select-try-another-way-form" action={url.loginAction} method="post">
                <input type="hidden" name="tryAnotherWay" value="on" />
                <button type="submit" className={BUTTON_SECONDARY}>{msg('doTryAnotherWay')}</button>
              </form>
            )}

            {socialProvidersNode}
          </div>

          {displayInfo && infoNode && <div className="mt-8 text-100 text-fg-muted">{infoNode}</div>}
        </main>
      </div>

      <BrandPanel brand={brand} />
    </div>
  );
}

/**
 * El panel de la marca, desde 1024 px: el shader de fuego y el nombre grande abajo, en blanco. Debajo del shader va un
 * fotograma suyo (assets/fire.webp, 50 KB): es lo que se ve sin WebGL (aceleración gráfica apagada) o mientras carga.
 * Mide la ventana y no se desplaza con el formulario.
 */
function BrandPanel({ brand }: { brand: string }) {
  return (
    <aside aria-hidden="true" style={{ backgroundImage: `url(${fireStill})` }} className="sticky top-0 hidden h-dvh self-start overflow-hidden bg-black bg-cover bg-center lg:block forced-colors:hidden">
      <FireField className="absolute inset-0" />
      <p className="absolute bottom-14 left-14 text-[clamp(56px,6vw,88px)]/[0.95] font-bold tracking-[-0.045em] text-white">{brand}</p>
    </aside>
  );
}
