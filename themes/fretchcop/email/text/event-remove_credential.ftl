<#ftl output_format="plainText">
<#if (event.getDetail("credential_type")!"") == "fc-trusted-devices">
${msg("fcEventForgetTrustedDevicesBody", event.date, event.ipAddress)}
<#else>
${msg("eventRemoveCredentialBody", event.getDetail("credential_type")!"unknown", event.date, event.ipAddress)}
</#if>
