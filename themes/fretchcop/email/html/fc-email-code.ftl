<#-- El código de un solo uso (providers/EmailCode.java): para entrar, para el segundo paso o para activarlos. -->
<#import "template.ftl" as layout>
<@layout.emailLayout>
<p>${kcSanitize(msg("fcEmailCode" + modeKey + "Intro", realmName))?no_esc}</p>
<#-- Como el código en las pantallas: en la caja gris de copiar, con cifras de ancho fijo. -->
<p style="margin:24px 0;padding:16px 20px;background:#f8f8f8;border-radius:8px;font:600 30px/36px ${layout.font};letter-spacing:6px;font-variant-numeric:tabular-nums;color:#131313">${code}</p>
<p>${kcSanitize(msg("fcEmailCode" + modeKey + "Outro", minutes))?no_esc}</p>
</@layout.emailLayout>
