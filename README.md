# identity-server

El servidor de identidad de la empresa: Keycloak con la configuración como código. Emite los tokens OpenID Connect
de todos los productos (Orange, letgrid, …) y guarda las cuentas, las sesiones y los factores de acceso.

- `auth.fretchcop.space`: este servidor (inicio de sesión, registro, recuperación).
- `accounts.fretchcop.space`: la gestión de la cuenta, en `accounts-frontend` y `accounts-backend`.

Cada producto es un cliente OIDC del realm, esté en un subdominio o en un dominio propio. Orange y letgrid ya lo son (`config/clients.yaml`):
confidenciales, por redirección con PKCE y `auth-go`, con su vuelta en `/auth/callback`, su secreto en `.env` y el cierre de
sesión por el canal trasero. Hoy siguen entrando con su Keycloak anterior; el cliente queda listo para cuando migren.

## Requisitos

- Java 21 (Keycloak y keycloak-config-cli)
- PostgreSQL 16 o superior, y `psql`
- `curl` y `python3` para los scripts

## Desarrollo

```sh
cp .env.example .env
scripts/mail.sh     # Mailpit en otra terminal: SMTP en :1025, bandeja en http://127.0.0.1:8025
scripts/dev.sh      # descarga y verifica Keycloak, crea la base y lo arranca en http://localhost:8180
scripts/apply.sh    # aplica config/ (se puede repetir: sólo cambia lo que difiere)
scripts/check.sh    # comprueba el realm y los clientes
```

La consola queda en http://localhost:8180/admin con el usuario temporal de `.env`. No se edita a mano: lo que
cambie ahí se pierde en el próximo `apply.sh`. Los cambios van en `config/`.

## Configuración

| Archivo | Qué tiene |
|---|---|
| `config/realm.yaml` | El realm: registro, contraseñas, bloqueos, sesiones, eventos, passkeys y correo |
| `config/clients.yaml` | Un cliente OIDC por producto, con sus redirecciones y sus permisos |
| `login-ui/` | Las pantallas de acceso, hechas por nosotros en React, TypeScript y Tailwind con [Keycloakify](https://www.keycloakify.dev): una página propia por pantalla (`src/login/pages`) sobre `@authpoint/ui` (`../ui`, el sistema de diseño de la Cuenta) y los textos de tú (`src/login/i18n.ts`). Las poco frecuentes quedan con la página de Keycloakify y las clases de `src/login/classes.ts`. Keycloakify las empaqueta en `dist_keycloak/fretchcop-login.jar`, el tema `fretchcop` de Keycloak |
| `themes/fretchcop/email` | Los correos en español, de tú, con la marca y el aspecto de la Cuenta (`html/template.ftl`) |
| `providers/` | Pasos de flujo propios en Java, compilados por `scripts/dev.sh` contra el Keycloak fijado: el paso del correo de entrar (`EmailFirstForm`), el código por correo (`EmailCode*`, `ConfigureEmailCode`) y que abrir el enlace de recuperar la contraseña verifique el correo |
| `versions.env` | Versiones fijadas de Keycloak, keycloak-config-cli y Mailpit, con su SHA-256 |

Ninguna plantilla de Keycloak ni PatternFly: Keycloak sigue mostrando el acceso (lo exigen las passkeys, los dos pasos
y la protección contra fuerza bruta), pero lo que pinta es nuestra app. Para trabajar en ella:

```
pnpm --dir login-ui install
pnpm --dir login-ui dev        # http://localhost:5173/?mock=<pantalla>, con datos simulados (src/login/mocks.ts)
pnpm --dir login-ui check      # tipos y lint
pnpm --dir login-ui build      # el jar; hace falta Maven (mvn) en el PATH
```

El código QR de los dos pasos lo dibuja la app (`src/login/qr.ts`) con el mismo enlace `otpauth://` que el de Keycloak
(`src/login/totp.ts`, comprobado en `pnpm check`). Tras tocar sus formas, `node login-ui/scripts/qr-check.mjs` lo lee
como una cámara (lejos, desenfocado, en ángulo, con poco contraste) con zbarimg y, con `ZXING_PYTHON`, con ZXing.

`scripts/dev.sh` copia el jar en Keycloak al arrancar: tras cambiar una pantalla, construirlo y reiniciar Keycloak. Los
proveedores de acceso (Google, Facebook y GitHub) están en `config/realm.yaml` y sus credenciales, en `.env`: el que
no tiene `CLIENT_ID` queda apagado y su botón no sale. Microsoft y Apple se ven en la vista previa con
`?mock=login-cinco`. El registro no pide contraseña:
con `verifyEmail`, Keycloak la pide después de verificar el correo (así nadie deja una contraseña en una cuenta con
un correo ajeno). Quien no abre ese enlace sale con «¿Olvidaste tu contraseña?» y un solo correo: abrir el enlace de
recuperar también verifica el correo (`providers/`, en el flujo `reset credentials verify email`).

Entrar va en dos pasos, como en Adobe: primero el correo y luego la contraseña, un código por correo o la passkey (que
el navegador también ofrece al tocar el correo). El flujo es `browser identifier first` (`config/realm.yaml`). Si el
correo no tiene cuenta, lo dice y ofrece crearla con él; si la cuenta no tiene contraseña, va directo al código, y si
entra con un proveedor (Google…), `EmailFirstForm` lo dice y ofrece su botón o el código.

El código por correo es nuestro (Keycloak no trae uno): 6 cifras, vale 10 minutos y 5 intentos, y se reenvía cada
30 segundos como mucho. Sólo se guarda su hash, atado a la sesión y al uso, así que el de entrar no sirve para los dos
pasos. Escribirlo bien verifica el correo. Sirve para tres cosas:

- entrar (`fc-email-code`, alternativa a la contraseña);
- los dos pasos (`fc-email-code-2fa`, alternativa a la app de códigos), si la persona lo activó; quien entró con un
  código no lo vuelve a recibir;
- activarlo: la acción `fc-configure-email-code` (`kc_action=fc-configure-email-code`) manda un código y, al
  escribirlo, guarda la credencial.

La página es `src/login/pages/EmailCode.tsx` y el correo, `themes/fretchcop/email/{html,text}/fc-email-code.ftl`.

Si se pierden la app y el correo, quedan los códigos de recuperación de Keycloak: 12, de un solo uso, que la Cuenta genera
con `kc_action=CONFIGURE_RECOVERY_AUTHN_CODES` y que el segundo paso acepta como alternativa. Las pantallas son
`src/login/pages/LoginRecoveryAuthnCode{Config,Input}.tsx`. Ojo: con sólo los códigos, Keycloak pide uno en cada
inicio de sesión, así que la Cuenta los quita al desactivar los dos pasos.

En el segundo paso, «No volver a pedirlo en este dispositivo» deja una cookie firmada por el realm
(`providers/TrustedDevice.java`): 30 días, para esa cuenta y ese navegador, mientras exista su credencial
`fc-trusted-devices`. La Cuenta la quita con «Olvidar» (y al desactivar los dos pasos), y eso anula todos a la vez; el
correo de aviso lo dice así (`themes/fretchcop/email/*/event-remove_credential.ftl`). Con passkey, entrar empieza por ella; la contraseña queda a un toque.

Keycloak avisa por correo de los cambios de seguridad (contraseña, dos pasos, passkeys). Los intentos fallidos no se
avisan uno por uno: el arranque lleva `--spi-events-listener--email--exclude-events=LOGIN_ERROR`. La consola de
cuenta de Keycloak está apagada; sus enlaces llevan a la Cuenta.

Desde Keycloak 26.8.2 la API de administración sólo acepta tokens con el scope `kc-admin-api`; los clientes que la
usan lo tienen como opcional y lo piden al sacar el token.
