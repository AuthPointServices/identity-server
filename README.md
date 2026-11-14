# identity-server

El servidor de identidad de la empresa: Keycloak con la configuración como código. Emite los tokens OpenID Connect
de todos los productos (Orange, letgrid, …) y guarda las cuentas, las sesiones y los factores de acceso.

- `auth.fretchcop.space`: este servidor (inicio de sesión, registro, recuperación).
- `accounts.fretchcop.space`: la gestión de la cuenta, en `accounts-frontend` y `accounts-backend`.

Cada producto es un cliente OIDC del realm, esté en un subdominio o en un dominio propio.
