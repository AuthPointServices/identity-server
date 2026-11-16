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
| `themes/fretchcop/login` | Las pantallas de acceso: las plantillas de `keycloak.v2` con el estilo y los textos de la Cuenta (`accounts-frontend/DESIGN.md`). Una página más de la Cuenta, sin tarjeta: la barra de 64 px con la marca y el idioma, y una columna de 400 px sobre el fondo de la Cuenta; Geist servida desde el tema (OFL, `resources/fonts`) e iconos de Lucide en `resources/img/icons` en lugar de Font Awesome |
| `themes/fretchcop/email` | Los correos en español, de tú, con la marca |
| `versions.env` | Versiones fijadas de Keycloak, keycloak-config-cli y Mailpit, con su SHA-256 |

El tema cambia CSS y textos, y sólo una plantilla: `login-config-totp.ftl`, la de activar los dos pasos, porque la de
serie necesitaba otro marcado. Al actualizar Keycloak, esa plantilla se compara con la nueva de `keycloak.v2`. Lo que
lleva su marcado se estiliza con Tailwind y los tokens del tema (`themes/fretchcop/login/tailwind.css`); tras cambiar
una plantilla del tema, `pnpm install` una vez y `pnpm theme` regeneran `resources/css/tailwind.css`, que va en el repo
y la CI comprueba que esté al día.

Se queda como lo hace Keycloak: el registro no pide contraseña (con `verifyEmail` Keycloak la pide después de verificar el correo) y su
página lanza un error de script de `keycloak.v2` al no encontrar el campo; no afecta a nada. En desarrollo
`scripts/dev.sh` lo enlaza en Keycloak y un cambio se ve al recargar la página.

Al actualizar Keycloak, mira la pantalla de verificar el correo: el CSS anula con `margin-top: -1lh` el salto con el que
`login-verify-email.ftl` abre la frase, y si la plantilla lo quita el texto sube 24 px.

Keycloak avisa por correo de los cambios de seguridad (contraseña, dos pasos, passkeys). Los intentos fallidos no se
avisan uno por uno: el arranque lleva `--spi-events-listener--email--exclude-events=LOGIN_ERROR`. La consola de
cuenta de Keycloak está apagada; sus enlaces llevan a la Cuenta.

Desde Keycloak 26.8.2 la API de administración sólo acepta tokens con el scope `kc-admin-api`; los clientes que la
usan lo tienen como opcional y lo piden al sacar el token.
