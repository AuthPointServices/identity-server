<#-- El marco de todos los correos, con los colores de @authpoint/ui. Los enlaces vienen dentro de los mensajes: su forma
     va en <style>, una regla por bloque porque un cliente que no entiende una tira el bloque entero. -->
<#assign font = "Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<#macro emailLayout>
<!doctype html>
<html lang="${locale.language}" dir="${(ltr)?then('ltr','rtl')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<style>.fc-card p{margin:0 0 16px}.fc-card a{color:#00794a;font-weight:600;text-decoration:underline}</style>
<#-- El enlace solo en su párrafo es la acción del correo: el botón verde de la Cuenta. -->
<style>.fc-card p>a:only-child{display:inline-block;padding:10px 20px;border-radius:999px;background:#00794a;color:#ffffff;text-decoration:none}</style>
<style>@media (max-width:480px){.fc-card{padding:24px 24px 8px!important}}</style>
</head>
<body style="margin:0;padding:0;background:#f8f8f8">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f8f8">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
<tr><td style="padding:0 0 20px;font:700 22px/28px ${font};letter-spacing:-0.02em;color:#131313">${realmName}</td></tr>
<tr><td class="fc-card" style="padding:32px 32px 16px;background:#ffffff;border:1px solid #e1e1e1;border-radius:10px;font:400 16px/24px ${font};color:#292929">
<#nested>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
</#macro>
