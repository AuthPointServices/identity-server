/*
 * El enlace otpauth:// de la clave, letra por letra como lo arma Keycloak (OTPPolicy.getKeyURI en 26.8.2), para dibujar
 * nuestro propio código QR con lo mismo que lleva el suyo. Keycloak codifica con URLEncoder de Java: como
 * encodeURIComponent, pero también ! ' ( ) ~, y el espacio como «+». scripts/totp-uri.test.mjs lo compara con un QR real.
 */

const javaEncode = (s: string) =>
  encodeURIComponent(s)
    .replace(/[!'()~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, '+');

export type KeyUriParams = {
  /** El nombre del realm que se ve (realm.displayName), o su nombre. */
  issuer: string;
  /** El usuario de la cuenta (el correo, en este realm). */
  account: string;
  /** La clave en base32, tal como la muestra Keycloak (en grupos de cuatro). */
  secret: string;
  algorithm: string;
  digits: number;
} & ({ type: 'totp'; period: number } | { type: 'hotp'; counter: number });

export function keyUri(k: KeyUriParams) {
  const { issuer, account, secret, algorithm, digits } = k;
  // Los dos puntos separan emisor y cuenta en la etiqueta: Keycloak los cambia por un espacio en el emisor.
  const iss = javaEncode(issuer.replace(/:/g, ' ')).replace(/\+/g, '%20');
  const params = `secret=${secret.replace(/\s+/g, '')}&digits=${digits}&algorithm=${algorithm}&issuer=${iss}`;
  const tail = k.type === 'hotp' ? `&counter=${k.counter}` : `&period=${k.period}`;
  return `otpauth://${k.type}/${iss}:${javaEncode(account)}?${params}${tail}`;
}
