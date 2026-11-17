package space.fretchcop.identity;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import jakarta.ws.rs.core.Cookie;
import jakarta.ws.rs.core.NewCookie;

import org.keycloak.Config;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.AuthenticatorFactory;
import org.keycloak.authentication.authenticators.conditional.ConditionalAuthenticator;
import org.keycloak.authentication.authenticators.conditional.ConditionalAuthenticatorFactory;
import org.keycloak.common.util.Time;
import org.keycloak.credential.CredentialModel;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.credential.OTPCredentialModel;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.representations.JsonWebToken;

/**
 * «No volver a pedirlo en este dispositivo»: tras los dos pasos, una cookie firmada por el realm los salta 30 días en
 * este navegador. Vale para una cuenta y mientras no cambien sus formas del segundo paso.
 */
public final class TrustedDevice {

    static final String FIELD = "fcTrustDevice";
    static final int DAYS = 30;
    private static final String COOKIE = "FC_TRUSTED_DEVICE";
    private static final String TYPE = "fc-trusted-device";
    private static final String WAYS_CLAIM = "ways";
    private static final Set<String> WAYS = Set.of(OTPCredentialModel.TYPE, EmailCodeCredentialProvider.TYPE);

    private TrustedDevice() {
    }

    /** Huella de las formas del segundo paso: añadir o quitar una deja de confiar en todos los dispositivos. */
    static String ways(UserModel user) {
        String ids = user.credentialManager().getStoredCredentialsStream()
                .filter(c -> WAYS.contains(c.getType())).map(CredentialModel::getId).sorted().collect(Collectors.joining(","));
        if (ids.isEmpty()) return "";
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(ids.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    static boolean trusted(KeycloakSession session, UserModel user) {
        Cookie cookie = session.getContext().getHttpRequest().getHttpHeaders().getCookies().get(COOKIE);
        String ways = ways(user);
        if (cookie == null || ways.isEmpty()) return false;
        JsonWebToken token;
        try {
            token = session.tokens().decode(cookie.getValue(), JsonWebToken.class);
        } catch (RuntimeException e) {
            return false;
        }
        return token != null && token.isActive() && TYPE.equals(token.getType()) && user.getId().equals(token.getSubject())
                && ways.equals(token.getOtherClaims().get(WAYS_CLAIM));
    }

    static void remember(KeycloakSession session, RealmModel realm, UserModel user) {
        String ways = ways(user);
        if (ways.isEmpty()) return;
        long now = Time.currentTimeSeconds();
        JsonWebToken token = new JsonWebToken().id(UUID.randomUUID().toString()).type(TYPE).subject(user.getId())
                .iat(now).exp(now + DAYS * 86400L);
        token.setOtherClaims(WAYS_CLAIM, ways);
        String path = session.getContext().getUri().getBaseUriBuilder().path("realms").path(realm.getName()).build().getRawPath();
        session.getContext().getHttpResponse().setCookieIfAbsent(new NewCookie.Builder(COOKIE).value(session.tokens().encode(token))
                .path(path).maxAge(DAYS * 86400).httpOnly(true).sameSite(NewCookie.SameSite.LAX)
                .secure(realm.getSslRequired().isRequired(session.getContext().getConnection())).build());
    }

    /** La condición de los dos pasos: se piden salvo en un dispositivo de confianza de esta cuenta. */
    public static final class NotTrusted implements ConditionalAuthenticator {

        public static final String PROVIDER_ID = "fc-device-not-trusted";
        static final NotTrusted SINGLETON = new NotTrusted();

        @Override
        public boolean matchCondition(AuthenticationFlowContext context) {
            return context.getUser() == null || !trusted(context.getSession(), context.getUser());
        }

        @Override
        public void action(AuthenticationFlowContext context) {
        }

        @Override
        public boolean requiresUser() {
            return true;
        }

        @Override
        public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {
        }

        @Override
        public void close() {
        }
    }

    public static final class NotTrustedFactory implements ConditionalAuthenticatorFactory {

        @Override
        public ConditionalAuthenticator getSingleton() {
            return NotTrusted.SINGLETON;
        }

        @Override
        public String getId() {
            return NotTrusted.PROVIDER_ID;
        }

        @Override
        public String getDisplayType() {
            return "Condition - device not trusted";
        }

        @Override
        public String getHelpText() {
            return "Matches unless this browser was trusted for the user after two-step verification (fc-remember-device).";
        }

        @Override
        public boolean isConfigurable() {
            return false;
        }

        @Override
        public Requirement[] getRequirementChoices() {
            return new Requirement[] {Requirement.REQUIRED, Requirement.DISABLED};
        }

        @Override
        public boolean isUserSetupAllowed() {
            return false;
        }

        @Override
        public List<ProviderConfigProperty> getConfigProperties() {
            return List.of();
        }

        @Override
        public void init(Config.Scope config) {
        }

        @Override
        public void postInit(KeycloakSessionFactory factory) {
        }

        @Override
        public void close() {
        }
    }

    /**
     * Al final de entrar: si el segundo paso se envió con la casilla, confía en este navegador. Sólo se llega aquí
     * después de pasar los dos pasos (o sin tenerlos), así que la casilla no sirve para saltárselos.
     */
    public static final class Remember implements Authenticator {

        public static final String PROVIDER_ID = "fc-remember-device";
        static final Remember SINGLETON = new Remember();

        @Override
        public void authenticate(AuthenticationFlowContext context) {
            UserModel user = context.getUser();
            if (user != null && "POST".equals(context.getHttpRequest().getHttpMethod())
                    && "on".equals(context.getHttpRequest().getDecodedFormParameters().getFirst(FIELD))) {
                remember(context.getSession(), context.getRealm(), user);
            }
            context.success();
        }

        @Override
        public void action(AuthenticationFlowContext context) {
            context.success();
        }

        @Override
        public boolean requiresUser() {
            return false;
        }

        @Override
        public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
            return true;
        }

        @Override
        public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {
        }

        @Override
        public void close() {
        }
    }

    public static final class RememberFactory implements AuthenticatorFactory {

        @Override
        public Authenticator create(KeycloakSession session) {
            return Remember.SINGLETON;
        }

        @Override
        public String getId() {
            return Remember.PROVIDER_ID;
        }

        @Override
        public String getDisplayType() {
            return "Remember trusted device";
        }

        @Override
        public String getHelpText() {
            return "Trusts this browser for 30 days when the two-step form was sent with fcTrustDevice=on. Put it after two-step verification.";
        }

        @Override
        public String getReferenceCategory() {
            return null;
        }

        @Override
        public boolean isConfigurable() {
            return false;
        }

        @Override
        public Requirement[] getRequirementChoices() {
            return new Requirement[] {Requirement.REQUIRED, Requirement.DISABLED};
        }

        @Override
        public boolean isUserSetupAllowed() {
            return false;
        }

        @Override
        public List<ProviderConfigProperty> getConfigProperties() {
            return List.of();
        }

        @Override
        public void init(Config.Scope config) {
        }

        @Override
        public void postInit(KeycloakSessionFactory factory) {
        }

        @Override
        public void close() {
        }
    }
}
