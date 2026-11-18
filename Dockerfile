# syntax=docker/dockerfile:1.7
# Keycloak de producción con lo nuestro dentro: las pantallas de acceso (login-ui), los pasos de flujo (providers/) y
# los correos (themes/). Dos imágenes: `config`, el trabajo que aplica config/, y `server` (la última, la de un
# `docker build` sin --target). Las usa docker-compose.yml.

# La de versions.env: la etapa `providers` falla si no coinciden.
ARG KEYCLOAK_VERSION=26.8.2

FROM quay.io/keycloak/keycloak:${KEYCLOAK_VERSION} AS keycloak

# Las pantallas de acceso: Keycloakify las empaqueta con Maven.
FROM node:24-trixie-slim AS theme
RUN apt-get update && apt-get install -y --no-install-recommends maven openjdk-21-jdk-headless \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /login-ui
COPY login-ui/package.json login-ui/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY login-ui/ ./
RUN pnpm build

# Los pasos de flujo, contra las librerías del Keycloak de la imagen (como scripts/dev.sh).
FROM eclipse-temurin:21-jdk AS providers
ARG KEYCLOAK_VERSION
COPY versions.env /versions.env
RUN [ "$KEYCLOAK_VERSION" = "$(sed -n 's/^KEYCLOAK_VERSION=//p' /versions.env)" ] \
  || { echo "KEYCLOAK_VERSION del Dockerfile ($KEYCLOAK_VERSION) distinto del de versions.env" >&2; exit 1; }
COPY --from=keycloak /opt/keycloak/lib /opt/keycloak/lib
COPY providers/src/main /src
RUN mkdir /build \
  && javac --release 21 -cp '/opt/keycloak/lib/lib/main/*:/opt/keycloak/lib/lib/boot/*' -d /build $(find /src/java -name '*.java') \
  && cp -r /src/resources/. /build \
  && jar --create --file /fretchcop-providers.jar -C /build .

# keycloak-config-cli, con la suma de versions.env.
FROM debian:trixie-slim AS fetch
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY versions.env /versions.env
RUN . /versions.env \
  && curl -fsSL --retry 3 -o /keycloak-config-cli.jar \
    "https://github.com/adorsys/keycloak-config-cli/releases/download/v$KCC_VERSION/keycloak-config-cli-$KCC_KEYCLOAK.jar" \
  && echo "$KCC_SHA256  /keycloak-config-cli.jar" | sha256sum -c -

# Aplica config/ y termina (scripts/apply.sh, con las variables del entorno). Java viene en la imagen de Keycloak.
FROM keycloak AS config
WORKDIR /opt/config
COPY --from=fetch /keycloak-config-cli.jar ./keycloak-config-cli.jar
COPY config ./config
COPY scripts/apply.sh ./scripts/apply.sh
ENV KCC_JAR=/opt/config/keycloak-config-cli.jar
ENTRYPOINT ["scripts/apply.sh"]

FROM keycloak AS server
COPY --from=theme --chown=1000:0 /login-ui/dist_keycloak/fretchcop-login.jar /opt/keycloak/providers/
COPY --from=providers --chown=1000:0 /fretchcop-providers.jar /opt/keycloak/providers/
COPY --chown=1000:0 themes/fretchcop /opt/keycloak/themes/fretchcop
# Una sola instancia: caché local, sin buscar otros nodos.
RUN /opt/keycloak/bin/kc.sh build --db=postgres --health-enabled=true --cache=local
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]
