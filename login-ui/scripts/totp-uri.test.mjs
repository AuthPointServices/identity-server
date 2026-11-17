// El enlace otpauth:// que arma src/login/totp.ts, contra el que lleva el QR de Keycloak 26.8.2 (decodificado con
// zbarimg de una pantalla real). Si no coinciden, nuestro QR daría a la app otra cuenta u otro emisor.
import assert from 'node:assert/strict';
import { keyUri } from '../src/login/totp.ts';

const base = { type: 'totp', algorithm: 'SHA1', digits: 6, period: 30 };
assert.equal(
  keyUri({ ...base, issuer: 'Seedle', account: 'fc-totp-1794890911608@example.test', secret: 'NRVH ONDS ORIE C2JV KRKT QRDS JI3G S4CS' }),
  'otpauth://totp/Seedle:fc-totp-1794890911608%40example.test?secret=NRVHONDSORIEC2JVKRKTQRDSJI3GS4CS&digits=6&algorithm=SHA1&issuer=Seedle&period=30',
);
// Lo que URLEncoder de Java hace distinto: el espacio del emisor va como %20, los dos puntos se cambian por un espacio,
// y ! ' ( ) ~ se codifican.
assert.equal(
  keyUri({ ...base, issuer: 'Mi Empresa: Cuenta', account: "o'brien (test)!~@x.es", secret: 'AAAA BBBB' }),
  "otpauth://totp/Mi%20Empresa%20%20Cuenta:o%27brien+%28test%29%21%7E%40x.es?secret=AAAABBBB&digits=6&algorithm=SHA1&issuer=Mi%20Empresa%20%20Cuenta&period=30",
);
assert.equal(keyUri({ type: 'hotp', counter: 3, algorithm: 'SHA1', digits: 6, issuer: 'S', account: 'a', secret: 'A' }), 'otpauth://hotp/S:a?secret=A&digits=6&algorithm=SHA1&issuer=S&counter=3');
