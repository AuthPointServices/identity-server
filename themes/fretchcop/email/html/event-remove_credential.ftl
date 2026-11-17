<#import "template.ftl" as layout>
<@layout.emailLayout>
<#if (event.getDetail("credential_type")!"") == "fc-trusted-devices">
${kcSanitize(msg("fcEventForgetTrustedDevicesBodyHtml", event.date, event.ipAddress))?no_esc}
<#else>
${kcSanitize(msg("eventRemoveCredentialBodyHtml", event.getDetail("credential_type")!"unknown", event.date, event.ipAddress))?no_esc}
</#if>
</@layout.emailLayout>
