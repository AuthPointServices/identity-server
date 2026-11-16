<#--
  Copia de template.ftl de keycloak.v2 (Keycloak 26.8.2; scripts/check.sh avisa si la de serie cambia). El <head> es el
  de serie; cambian el cuerpo de la página (la tarjeta, la marca con el idioma y el pie) y el correo de quien entra.
  Estilos: utilidades de Tailwind (tailwind.css) y, para lo que pinta cada pantalla, resources/css/fretchcop.css.
-->
<#import "field.ftl" as field>
<#import "footer.ftl" as loginFooter>
<#import "theme-resources.ftl" as themeResourceTags>
<#-- Quien entra: el correo como texto y «Cambiar de cuenta» como enlace al lado. Sin campo de sólo lectura (recibía el
     foco sin nombre) ni aviso al pasar el cursor. -->
<#macro username>
  <div class="mb-6 flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 py-1.5 pr-1.5 pl-4">
    <span id="kc-attempted-username" class="min-w-0 truncate text-base/6 font-medium text-fg">${auth.attemptedUsername}</span>
    <a id="reset-login" href="${url.loginRestartFlowUrl}" class="shrink-0 rounded-lg px-3 py-2 text-sm/5 font-medium text-link-ink no-underline! hover:bg-accent/8 pointer-coarse:py-3">${msg("restartLoginTooltip")}</a>
  </div>
</#macro>

<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}" lang="${lang}"<#if realm.internationalizationEnabled> dir="${(locale.rtl)?then('rtl','ltr')}"</#if>>

<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="color-scheme" content="light${darkMode?then(' dark', '')}">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    <title>${title!}</title>
    <#if themeResources?? && themeResources.favicons?has_content>
        <@themeResourceTags.renderFavicons themeResources.favicons url.resourcesPath />
    <#else>
        <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />
    </#if>
    <#if themeResources?? && themeResources.stylesCommon?has_content>
        <@themeResourceTags.renderStyles themeResources.stylesCommon url.resourcesCommonPath />
    <#elseif properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if themeResources?? && themeResources.styles?has_content>
        <@themeResourceTags.renderStyles themeResources.styles url.resourcesPath />
    <#elseif properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <script type="importmap">
        {
            "imports": {
                "rfc4648": "${url.resourcesCommonPath}/vendor/rfc4648/rfc4648.js"
            }
        }
    </script>
    <#if darkMode>
      <script type="module" async blocking="render">
          <#outputformat "JavaScript">
          const DARK_MODE_CLASS = ${properties.kcDarkModeClass?c};
          const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

          updateDarkMode(mediaQuery.matches);
          mediaQuery.addEventListener("change", (event) => updateDarkMode(event.matches));

          function updateDarkMode(isEnabled) {
            const { classList } = document.documentElement;

            if (isEnabled) {
              classList.add(DARK_MODE_CLASS);
            } else {
              classList.remove(DARK_MODE_CLASS);
            }
          }
          </#outputformat>
      </script>
    </#if>
    <#if themeResources?? && themeResources.scripts?has_content>
        <@themeResourceTags.renderScripts themeResources.scripts url.resourcesPath "text/javascript" />
    <#elseif properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <script type="module" src="${url.resourcesPath}/js/passwordVisibility.js"></script>
    <script type="module">
        <#outputformat "JavaScript">
        import { startSessionPolling } from ${(url.resourcesPath + "/js/authChecker.js")?c};

        startSessionPolling(
            ${url.ssoLoginInOtherTabsUrl?c}
        );
        </#outputformat>
    </script>
    <script type="module">
        document.addEventListener("click", (event) => {
            const link = event.target.closest("a[data-once-link]");

            if (!link) {
                return;
            }

            if (link.getAttribute("aria-disabled") === "true") {
                event.preventDefault();
                return;
            }

            const { disabledClass } = link.dataset;

            if (disabledClass) {
                link.classList.add(...disabledClass.trim().split(/\s+/));
            }

            link.setAttribute("role", "link");
            link.setAttribute("aria-disabled", "true");
        });
    </script>
    <#if authenticationSession??>
        <script type="module">
             <#outputformat "JavaScript">
            import { checkAuthSession } from ${(url.resourcesPath + "/js/authChecker.js")?c};

            checkAuthSession(
                ${authenticationSession.authSessionIdHash?c}
            );
            </#outputformat>
        </script>
    </#if>
    <script>
      // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1404468
      const isFirefox = true;
    </script>
</head>

<body id="keycloak-bg" class="${properties.kcBodyClass!}" data-page-id="login-${pageId}">
<#--
  La página: una tarjeta de 440 px con la marca y el idioma arriba, el título, el formulario y, al pie tras una raya, lo
  que lleva a otra pantalla («¿No tienes cuenta?…»). Anclada arriba, para que la marca y el título no se muevan entre
  pantallas ni al salir un error; más arriba cuanto más baja es la ventana (16 px a 515, 70 a 900, 104 desde 1143),
  para que quepa en un portátil. En el teléfono no hay tarjeta: la página es la superficie.
-->
<div class="flex min-h-dvh justify-center bg-bg px-6 pt-[clamp(16px,calc(14vh-56px),104px)] pb-6 max-sm:bg-surface max-sm:p-0">
  <main class="h-fit w-full max-w-[440px] rounded-2xl border border-border bg-surface p-8 shadow-[0_1px_2px_rgb(16_24_40/0.04),0_16px_40px_-16px_rgb(16_24_40/0.14)] max-sm:max-w-none max-sm:rounded-none max-sm:border-0 max-sm:px-6 max-sm:pt-3 max-sm:shadow-none">
    <header class="flex h-10 items-center justify-between gap-4">
      <div id="kc-header-wrapper">${kcSanitize(msg("loginTitleHtml",(realm.displayNameHtml!'')))?no_esc}</div>
      <#if realm.internationalizationEnabled  && locale.supported?size gt 1>
        <#-- En el HTML va antes del formulario, como en la vista: el foco del teclado sigue el mismo orden. -->
        <div class="relative -mr-3 flex items-center">
          <select
            aria-label="${msg("languages")}"
            id="login-select-toggle"
            onchange="if (this.value) window.location.href=this.value"
            class="h-10 cursor-pointer appearance-none rounded-full border-0 bg-transparent pr-9 pl-3 text-sm/5 font-medium text-fg-muted transition-colors duration-quick hover:bg-container pointer-coarse:h-11"
          >
            <#list locale.supported?sort_by("label") as l>
              <option value="${l.url}" ${(l.languageTag == locale.currentLanguageTag)?then('selected','')}>${l.label}</option>
            </#list>
          </select>
          <span aria-hidden="true" class="pointer-events-none absolute right-3 size-4 bg-fg-muted [mask:url(../img/icons/chevron-down.svg)_center/16px_no-repeat] forced-colors:bg-[CanvasText] forced-colors:[forced-color-adjust:none]"></span>
        </div>
      </#if>
    </header>

    <h1 id="kc-page-title" class="mt-6 text-2xl/8 font-semibold tracking-[-0.02em] text-balance text-fg"><#nested "header"></h1>

    <div class="${properties.kcLoginMainBody!} mt-6">
        <#if displayRequiredFields>
            <div class="${properties.kcContentWrapperClass!}">
                <div class="${properties.kcLabelWrapperClass!} subtitle">
                    <span class="${properties.kcInputHelperTextItemTextClass!}">
                      <span class="${properties.kcInputRequiredClass!}">*</span> ${msg("requiredFields")}
                    </span>
                </div>
            </div>
        </#if>

        <#-- El aviso va antes que el correo de quien entra: «Por seguridad, vuelve a escribir tu contraseña.» explica la
             pantalla. Las acciones que pide la app no ven el aviso de que hay que completarlas. -->
        <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
            <div class="${properties.kcAlertClass!} pf-m-${(message.type = 'error')?then('danger', message.type)}">
                <div class="${properties.kcAlertIconClass!}">
                    <#if message.type = 'success'><span class="${properties.kcFeedbackSuccessIcon!}"></span></#if>
                    <#if message.type = 'warning'><span class="${properties.kcFeedbackWarningIcon!}"></span></#if>
                    <#if message.type = 'error'><span class="${properties.kcFeedbackErrorIcon!}"></span></#if>
                    <#if message.type = 'info'><span class="${properties.kcFeedbackInfoIcon!}"></span></#if>
                </div>
                <span class="${properties.kcAlertTitleClass!} kc-feedback-text">${message.summary}</span>
            </div>
        </#if>

        <#if auth?has_content && auth.showUsername() && !auth.showResetCredentials()>
            <#nested "show-username">
            <@username />
        </#if>

        <#nested "form">

        <#if auth?has_content && auth.showTryAnotherWayLink()>
          <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post" novalidate="novalidate">
              <input type="hidden" name="tryAnotherWay" value="on"/>
              <a id="try-another-way" href="javascript:document.forms['kc-select-try-another-way-form'].requestSubmit()"
                  class="${properties.kcButtonSecondaryClass} ${properties.kcButtonBlockClass} ${properties.kcMarginTopClass}">
                    ${msg("doTryAnotherWay")}
              </a>
          </form>
        </#if>

        <#if switchOrganizationEnabled?? && switchOrganizationEnabled>
          <form id="kc-switch-organization-form" action="${url.loginAction}" method="post" novalidate="novalidate">
              <input type="hidden" name="switchOrganization" value="true"/>
              <a id="switch-organization" href="javascript:document.forms['kc-switch-organization-form'].requestSubmit()"
                  class="${properties.kcButtonSecondaryClass} ${properties.kcButtonBlockClass} ${properties.kcMarginTopClass}">
                    ${msg("doSwitchOrganization")}
              </a>
          </form>
        </#if>

        <div class="${properties.kcLoginMainFooter!}">
            <#nested "socialProviders">

            <#if displayInfo>
                <#-- Al pie de la tarjeta (fretchcop.css, #kc-info): lo que lleva a otra pantalla. -->
                <div id="kc-info">
                    <div id="kc-info-wrapper">
                        <#nested "info">
                    </div>
                </div>
            </#if>
        </div>
    </div>

    <@loginFooter.content/>
  </main>
</div>
</body>
</html>
</#macro>
