// El titular de un certificado X.509 para la pantalla de entrar con él (src/login/x509.ts).
import assert from 'node:assert/strict';
import { commonName } from '../src/login/x509.ts';

assert.equal(commonName('CN=Ana Pérez, OU=Contabilidad, O=Empresa, C=CO'), 'Ana Pérez');
assert.equal(commonName('EMAILADDRESS=ana@x.test, CN=María Fernanda, O=Empresa'), 'María Fernanda');
assert.equal(commonName('CN=Pérez\\, Ana,O=Empresa'), 'Pérez, Ana');
assert.equal(commonName('O=Empresa, C=CO'), 'O=Empresa, C=CO');
// Un «CN=» dentro de otro valor no es el CN.
assert.equal(commonName('O=Empresa CN=falso, CN=Ana'), 'Ana');
