<#-- El código de un solo uso (providers/EmailCode.java): para entrar, para el segundo paso o para activarlos. -->
<#import "template.ftl" as layout>
<@layout.emailLayout>
<p>${kcSanitize(msg("fcEmailCode" + modeKey + "Intro", realmName))?no_esc}</p>
<p style="margin:24px 0;font-size:30px;line-height:36px;font-weight:600;letter-spacing:6px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace">${code}</p>
<p>${kcSanitize(msg("fcEmailCode" + modeKey + "Outro", minutes))?no_esc}</p>
</@layout.emailLayout>
