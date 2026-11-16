<#--
  Copia de login-config-totp.ftl de keycloak.v2 (Keycloak 26.8.2; scripts/check.sh avisa si la de serie cambia).
  Cambia lo de encima del formulario: el código QR con una frase al lado, o la clave a mano, sin pasos numerados. El
  nombre del dispositivo sólo se pide cuando Keycloak lo exige (ya hay otro), porque es entonces cuando sirve para
  elegir. Y las etiquetas, que en la de serie apuntan a un id que no existe, nombran sus campos.
  Estilos: utilidades de Tailwind (tailwind.css) para lo nuevo y las clases de keycloak.v2 para el formulario.
-->
<#import "template.ftl" as layout>
<#import "field.ftl" as field>
<#import "buttons.ftl" as buttons>
<#import "password-commons.ftl" as passwordCommons>
<#-- Qué hacer con el QR y qué apps sirven, en una frase: los nombres van sin partirse y el último, tras «o». -->
<#macro scanWith>
    <#assign apps = totp.supportedApplications>
    <p>${msg("fcTotpScanWith")} <#list apps as app><span class="whitespace-nowrap">${msg(app)}</span><#if app?has_next><#if app?index == apps?size - 2> ${msg("fcOr")} <#else>, </#if></#if></#list>.</p>
</#macro>
<@layout.registrationLayout displayRequiredFields=false displayMessage=!messagesPerField.existsError('totp','userLabel'); section>
<!-- template: login-config-totp.ftl (fretchcop) -->

    <#if section = "header">
        ${msg("loginTotpTitle")}
    <#elseif section = "form">
        <#assign manual = mode?? && mode = "manual">

        <#if manual>
            <#-- La frase va a 8 px del título, como la descripción de una página de la Cuenta. -->
            <p class="-mt-6 mb-8 text-base/6 text-pretty text-fg-muted">${msg("loginTotpManualStep2")}</p>
            <div class="mb-8 flex flex-col gap-3 text-sm/5 text-fg-muted">
                <#-- La clave se parte sólo entre sus grupos de cuatro, y un clic la selecciona entera. -->
                <p id="kc-totp-secret-key" class="rounded-xl bg-container px-4 py-3 text-base/6 font-medium tracking-wider text-balance text-fg tabular-nums select-all">${totp.totpSecretEncoded}</p>
                <#-- Los datos de la clave sólo hacen falta si no son los que toda app usa sin preguntar. -->
                <#assign p = totp.policy>
                <#if p.type != "totp" || p.getAlgorithmKey() != "SHA1" || p.digits != 6 || p.period != 30>
                    <p>${msg("loginTotpManualStep3")}</p>
                    <dl class="-mt-2 grid grid-cols-[auto_1fr] gap-x-4 tabular-nums">
                        <dt>${msg("loginTotpType")}</dt><dd class="text-fg">${msg("loginTotp." + p.type)}</dd>
                        <dt>${msg("loginTotpAlgorithm")}</dt><dd class="text-fg">${p.getAlgorithmKey()}</dd>
                        <dt>${msg("loginTotpDigits")}</dt><dd class="text-fg">${p.digits}</dd>
                        <#if p.type = "totp">
                            <dt>${msg("loginTotpInterval")}</dt><dd class="text-fg">${p.period}</dd>
                        <#elseif p.type = "hotp">
                            <dt>${msg("loginTotpCounter")}</dt><dd class="text-fg">${p.initialCounter}</dd>
                        </#if>
                    </dl>
                </#if>
                <a href="${totp.qrUrl}" id="mode-barcode" class="self-start font-medium text-link-ink pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center">${msg("loginTotpScanBarcode")}</a>
            </div>
        <#else>
            <#-- El código sobre blanco también en oscuro, que es lo que leen las cámaras. Keycloak lo da en 246 px: a la mitad
                 exacta y sin suavizar, cada módulo cae en píxeles enteros y sale nítido. Al lado, qué hacer con él y la salida
                 si no se puede escanear, en la línea del borde de abajo del código. -->
            <#-- Si al lado no le quedan 160 px (en 320), la frase baja bajo el código en vez de desbordar. -->
            <div class="mb-8 flex flex-wrap items-stretch gap-5">
                <img id="kc-totp-secret-qr-code" src="data:image/png;base64, ${totp.totpSecretQrCode}" alt="${msg("fcTotpQrAlt")}"
                     class="box-content size-[123px] shrink-0 rounded-xl border border-border bg-white p-2 [image-rendering:pixelated]">
                <div class="flex min-w-40 flex-1 flex-col justify-between gap-3 text-sm/5 text-pretty text-fg">
                    <@scanWith/>
                    <a href="${totp.manualUrl}" id="mode-manual" class="self-start font-medium text-link-ink pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center">${msg("loginTotpUnableToScan")}</a>
                </div>
            </div>
        </#if>

        <form action="${url.loginAction}" class="${properties.kcFormClass!}" id="kc-totp-settings-form" method="post" novalidate="novalidate">
            <div class="${properties.kcFormGroupClass!}">
                <div class="${properties.kcLabelClass!}">
                    <label class="pf-v5-c-form__label" for="totp">
                        <span class="pf-v5-c-form__label-text">${msg("authenticatorCode")}</span>&nbsp;<span class="pf-v5-c-form__label-required" aria-hidden="true">&#42;</span>
                    </label>
                </div>
                <div class="${properties.kcInputClass!} <#if messagesPerField.existsError('totp')>pf-m-error</#if>">
                    <input type="text" required id="totp" name="totp" autocomplete="one-time-code"
                           aria-invalid="<#if messagesPerField.existsError('totp')>true</#if>"
                           <#-- Tras un error, el foco vuelve al campo: el aviso de una página recién cargada no se anuncia solo. -->
                           <#if messagesPerField.existsError('totp')>aria-describedby="input-error-otp-code" autofocus</#if>
                           inputmode="numeric"
                    />

                    <@field.errorIcon error=messagesPerField.get('totp')/>
                </div>
                <#if messagesPerField.existsError('totp')>
                    <span id="input-error-otp-code" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                        ${messagesPerField.get('totp')}
                    </span>
                </#if>
                <input type="hidden" id="totpSecret" name="totpSecret" value="${totp.totpSecret}" />
                <#if mode??><input type="hidden" id="mode" name="mode" value="${mode}"/></#if>
            </div>
            <#if totp.otpCredentials?size gte 1 || messagesPerField.existsError('userLabel')>
                <div class="${properties.kcFormGroupClass!}">
                    <div class="${properties.kcLabelClass!}">
                        <label class="pf-v5-c-form__label" for="userLabel">
                            <span class="pf-v5-c-form__label-text">${msg("loginTotpDeviceName")}</span><#if totp.otpCredentials?size gte 1>&nbsp;<span class="pf-v5-c-form__label-required" aria-hidden="true">&#42;</span></#if>
                        </label>
                    </div>

                    <div class="${properties.kcInputClass!} <#if messagesPerField.existsError('userLabel')>pf-m-error</#if>">
                        <input type="text" id="userLabel" name="userLabel" autocomplete="off"
                               aria-invalid="<#if messagesPerField.existsError('userLabel')>true</#if>"
                               aria-describedby="${messagesPerField.existsError('userLabel')?then('input-error-otp-label', 'userLabel-help')}"
                        />

                        <@field.errorIcon error=messagesPerField.get('userLabel')/>
                    </div>
                    <#if messagesPerField.existsError('userLabel')>
                        <span id="input-error-otp-label" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                            ${messagesPerField.get('userLabel')}
                        </span>
                    <#else>
                        <p id="userLabel-help" class="mt-2 text-sm/5 text-fg-muted">${msg("loginTotpStep3DeviceName")}</p>
                    </#if>
                </div>
            </#if>

            <div class="${properties.kcFormGroupClass!}">
                <@passwordCommons.logoutOtherSessions/>
            </div>

            <#if isAppInitiatedAction??>
                <@buttons.actionGroup horizontal=true>
                    <@buttons.button id="saveTOTPBtn" label="doSubmit" />
                    <@buttons.button id="cancelTOTPBtn" name="cancel-aia" label="doCancel" type="secondary" value="true" />
                </@buttons.actionGroup>
            <#else>
                <@buttons.actionGroup>
                    <@buttons.button id="saveTOTPBtn" label="doSubmit" />
                </@buttons.actionGroup>
            </#if>
        </form>
    </#if>
</@layout.registrationLayout>
