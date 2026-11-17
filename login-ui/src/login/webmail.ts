/** El webmail del correo, para el botón «Abrir Gmail»: sólo los dominios de consumo más comunes; si no, nada. */
const WEBMAIL: [RegExp, string, string][] = [
  [/^(gmail|googlemail)\.com$/, 'Gmail', 'https://mail.google.com/'],
  [/^(outlook|hotmail|live|msn)\.[a-z.]+$/, 'Outlook', 'https://outlook.live.com/mail/'],
  [/^(yahoo|ymail)\.[a-z.]+$/, 'Yahoo Mail', 'https://mail.yahoo.com/'],
  [/^(icloud|me|mac)\.com$/, 'iCloud Mail', 'https://www.icloud.com/mail'],
  [/^(proton\.me|protonmail\.com|pm\.me)$/, 'Proton Mail', 'https://mail.proton.me/'],
];

export function webmailFor(email: string | undefined): { name: string; url: string } | undefined {
  const domain = email?.split('@')[1]?.toLowerCase();
  if (!domain) return undefined;
  const hit = WEBMAIL.find(([re]) => re.test(domain));
  return hit && { name: hit[1], url: hit[2] };
}
