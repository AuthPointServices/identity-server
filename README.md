# identity-server

El servidor de identidad de la empresa: Keycloak con la configuración como código. Emite los tokens OpenID Connect
de todos los productos (Orange, letgrid, …) y guarda las cuentas, las sesiones y los factores de acceso.

- `auth.fretchcop.space`: este servidor (inicio de sesión, registro, recuperación).
- `accounts.fretchcop.space`: la gestión de la cuenta, en `accounts-frontend` y `accounts-backend`.

Cada producto es un cliente OIDC del realm, esté en un subdominio o en un dominio propio.

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
| `login-ui/` | Las pantallas de acceso, hechas por nosotros en React, TypeScript y Tailwind con [Keycloakify](https://www.keycloakify.dev): una página propia por pantalla (`src/login/pages`), los tokens y la letra de la Cuenta y los textos de tú (`src/login/i18n.ts`). Keycloakify las empaqueta en `dist_keycloak/fretchcop-login.jar`, el tema `fretchcop` de Keycloak |
| `themes/fretchcop/email` | Los correos en español, de tú, con la marca |
| `providers/` | Pasos de flujo propios en Java, compilados por `scripts/dev.sh` contra el Keycloak fijado: abrir el enlace de recuperar la contraseña verifica el correo |
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
botones de Google, GitHub, Facebook, Microsoft y Apple salen solos cuando el proveedor se configura en el realm; hoy no
hay ninguno, y en la vista previa se ven con `?mock=login-tres` o `?mock=login-cinco`. El registro no pide contraseña:
con `verifyEmail`, Keycloak la pide después de verificar el correo (así nadie deja una contraseña en una cuenta con
un correo ajeno). Quien no abre ese enlace sale con «¿Olvidaste tu contraseña?» y un solo correo: abrir el enlace de
recuperar también verifica el correo (`providers/`, en el flujo `reset credentials verify email`).

Keycloak avisa por correo de los cambios de seguridad (contraseña, dos pasos, passkeys). Los intentos fallidos no se
avisan uno por uno: el arranque lleva `--spi-events-listener--email--exclude-events=LOGIN_ERROR`. La consola de
cuenta de Keycloak está apagada; sus enlaces llevan a la Cuenta.

Desde Keycloak 26.8.2 la API de administración sólo acepta tokens con el scope `kc-admin-api`; los clientes que la
usan lo tienen como opcional y lo piden al sacar el token.
