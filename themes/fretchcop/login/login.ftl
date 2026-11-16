<#--
  Copia de login.ftl de keycloak.v2 (Keycloak 26.8.2; scripts/check.sh avisa si la de serie cambia). Cambia el campo de
  la contraseña: «¿Olvidaste tu contraseña?» va en la fila de su etiqueta, y «Mantener la sesión iniciada», sola debajo.
-->
<#import "template.ftl" as layout>
<#import "field.ftl" as field>
<#import "buttons.ftl" as buttons>
<#import "social-providers.ftl" as identityProviders>
<#import "passkeys.ftl" as passkeys>
<#-- La contraseña como field.password, con el enlace en la fila de la etiqueta y la casilla fuera del campo. -->
<#macro passwordField error="" autofocus=false>
  <div class="${properties.kcFormGroupClass}">
    <div class="${properties.kcFormGroupLabelClass} flex items-baseline justify-between gap-4">
      <label for="password" class="${properties.kcFormLabelClass}"><span class="${properties.kcFormLabelTextClass}">${msg("password")}</span></label>
      <#if realm.resetPasswordAllowed>
        <a href="${url.loginResetCredentialsUrl}" class="text-sm/5 pointer-coarse:-my-3 pointer-coarse:py-3">${msg("doForgotPassword")}</a>
      </#if>
    </div>
    <div class="${properties.kcInputGroup}">
      <div class="${properties.kcInputGroupItemClass} ${properties.kcFill}">
        <span class="${properties.kcInputClass} <#if error?has_content>${properties.kcError}</#if>">
          <input id="password" name="password" value="" type="password" autocomplete="current-password" <#if autofocus>autofocus</#if>
                 aria-invalid="<#if error?has_content>true</#if>" <#if error?has_content>aria-describedby="input-error-password"</#if>/>
          <@field.errorIcon error=error/>
        </span>
      </div>
      <div class="${properties.kcInputGroupItemClass}">
        <button class="${properties.kcFormPasswordVisibilityButtonClass}" type="button" aria-label="${msg('showPassword')}"
                aria-controls="password" data-password-toggle
                data-icon-show="${properties.kcFormPasswordVisibilityIconShow}" data-icon-hide="${properties.kcFormPasswordVisibilityIconHide}"
                data-label-show="${msg('showPassword')}" data-label-hide="${msg('hidePassword')}" id="password-show-password">
            <i class="${properties.kcFormPasswordVisibilityIconShow}" aria-hidden="true"></i>
        </button>
      </div>
    </div>
    <div id="input-error-container-password">
      <#if error?has_content>
        <div class="${properties.kcFormHelperTextClass}" aria-live="polite">
          <div class="${properties.kcInputHelperTextClass}">
            <div class="${properties.kcInputHelperTextItemClass} ${properties.kcError}" id="input-error-password">
              <span class="${properties.kcInputErrorMessageClass}">${error}</span>
            </div>
          </div>
        </div>
      </#if>
    </div>
  </div>
  <#if realm.rememberMe && !usernameHidden??>
    <@field.checkbox name="rememberMe" label=msg("rememberMe") value=login.rememberMe?? />
  </#if>
</#macro>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
<!-- template: login.ftl -->

    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "form">
        <div id="kc-form">
          <div id="kc-form-wrapper">
            <#if realm.password>
                <form id="kc-form-login" class="${properties.kcFormClass!}" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post" novalidate="novalidate">
                    <#if !usernameHidden??>
                        <#assign label>
                            <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
                        </#assign>
                        <@field.input name="username" label=label error=messagesPerField.getFirstError('username','password')
                            autofocus=true autocomplete="${(enableWebAuthnConditionalUI?has_content)?then('username webauthn', 'username')}" value=login.username!'' />
                        <@passwordField />
                    <#else>
                        <@passwordField error=messagesPerField.get('password') autofocus=true />
                    </#if>

                    <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                    <@buttons.loginButton />
                </form>
            </#if>
            </div>
        </div>
        <@passkeys.conditionalUIData />
    <#elseif section = "socialProviders" >
        <#if realm.password && social.providers?? && social.providers?has_content>
            <@identityProviders.show social=social/>
        </#if>
    <#elseif section = "info" >
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div id="kc-registration-container">
                <div id="kc-registration">
                    <span>${msg("noAccount")} <a href="${url.registrationUrl}">${msg("doRegister")}</a></span>
                </div>
            </div>
        </#if>
    </#if>

</@layout.registrationLayout>
