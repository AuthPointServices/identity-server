<#--
  Copia de login-config-totp.ftl de keycloak.v2 (Keycloak 26.8.2). Cambia lo de encima del formulario: una frase, el
  código QR con las apps al lado o la clave a mano (quien la escribe ya tiene la app abierta), sin pasos numerados. Y las etiquetas, que en la de serie apuntan a
  un id que no existe, nombran sus campos. El resto es el de serie: al actualizar Keycloak, comparar con su versión.
  Estilos: utilidades de Tailwind (tailwind.css) para lo nuevo y las clases de keycloak.v2 para el formulario.
-->
<#import "template.ftl" as layout>
<#import "field.ftl" as field>
<#import "buttons.ftl" as buttons>
<#import "password-commons.ftl" as passwordCommons>
<#-- Qué apps sirven, en una frase: los nombres, separados por comas y sin partirse. -->
<#macro apps>
    <p>${msg("loginTotpStep1")} <#list totp.supportedApplications as app><span class="whitespace-nowrap">${msg(app)}</span><#sep>, </#sep></#list>.</p>
</#macro>
<@layout.registrationLayout displayRequiredFields=false displayMessage=!messagesPerField.existsError('totp','userLabel'); section>
<!-- template: login-config-totp.ftl (fretchcop) -->

    <#if section = "header">
        ${msg("loginTotpTitle")}
    <#elseif section = "form">
        <#assign manual = mode?? && mode = "manual">

        <#-- La frase va a 8 px del título, como la descripción de una página de la Cuenta. -->
        <p class="-mt-6 mb-8 text-base/6 text-pretty text-fg-muted">${msg(manual?then("loginTotpManualStep2", "loginTotpStep2"))}</p>

        <#if manual>
            <div class="mb-8 flex flex-col gap-3 text-sm/5 text-fg-muted">
                <#-- La clave se parte sólo entre sus grupos de cuatro, y un clic la selecciona entera. -->
                <p id="kc-totp-secret-key" class="rounded-xl bg-container px-4 py-3 text-base/6 font-medium tracking-wider text-balance text-fg tabular-nums select-all">${totp.totpSecretEncoded}</p>
                <p>
                    ${msg("loginTotpManualStep3")}
                    <span class="tabular-nums">${msg("loginTotpType")}: ${msg("loginTotp." + totp.policy.type)} · ${msg("loginTotpAlgorithm")}: ${totp.policy.getAlgorithmKey()} · ${msg("loginTotpDigits")}: ${totp.policy.digits} ·
                    <#if totp.policy.type = "totp">${msg("loginTotpInterval")}: ${totp.policy.period}<#elseif totp.policy.type = "hotp">${msg("loginTotpCounter")}: ${totp.policy.initialCounter}</#if></span>
                </p>
                <a href="${totp.qrUrl}" id="mode-barcode" class="self-start font-medium text-link-ink pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center">${msg("loginTotpScanBarcode")}</a>
            </div>
        <#else>
            <#-- El código, a 152 px y sobre blanco también en oscuro (es lo que leen las cámaras); al lado, qué app sirve y la
                 salida si no se puede escanear, en la línea del borde de abajo del código. -->
            <div class="mb-8 flex items-stretch gap-5">
                <img id="kc-totp-secret-qr-code" src="data:image/png;base64, ${totp.totpSecretQrCode}" alt="${msg("loginTotpStep2")}"
                     class="size-38 shrink-0 rounded-xl border border-border bg-white p-2">
                <div class="flex min-w-0 flex-col justify-between gap-3 text-sm/5 text-fg-muted">
                    <@apps/>
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
                           <#if messagesPerField.existsError('totp')>aria-describedby="input-error-otp-code"</#if>
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
