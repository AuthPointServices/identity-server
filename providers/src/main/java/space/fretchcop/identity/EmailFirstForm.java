package space.fretchcop.identity;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;

import org.keycloak.Config;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.AuthenticatorFactory;
import org.keycloak.authentication.authenticators.broker.AbstractIdpAuthenticator;
import org.keycloak.authentication.authenticators.broker.util.SerializedBrokeredIdentityContext;
import org.keycloak.authentication.authenticators.browser.UsernamePasswordForm;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.UserModel;
import org.keycloak.models.credential.PasswordCredentialModel;
import org.keycloak.models.credential.WebAuthnCredentialModel;
import org.keycloak.models.utils.KeycloakModelUtils;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.services.messages.Messages;
import org.keycloak.sessions.AuthenticationSessionModel;

/**
 * El primer paso de entrar, como en Adobe: sólo el correo. Es el «Username Form» de Keycloak 26.8.2 (que es final y no
 * se puede extender: aquí va su misma lógica) más una comprobación: si la cuenta no tiene contraseña ni passkey, no
 * sigue a pedir una contraseña que no existe (Keycloak mostraría «se requiere configuración de credencial»). Se queda en
 * el correo y dice cómo entra esa cuenta: con su proveedor (Google…), o eligiendo la contraseña con el enlace de
 * recuperar (lo que tienen quienes se registraron y no abrieron el enlace).
 */
public final class EmailFirstForm extends UsernamePasswordForm {

    public static final String PROVIDER_ID = "email-first-form";
    /** Los mensajes de la página del correo (src/login/i18n.ts de login-ui). */
    public static final String USES_PROVIDER = "fcAccountUsesProvider";
    public static final String NO_PASSWORD = "fcAccountNoPassword";

    public EmailFirstForm(KeycloakSession session) {
        super(session);
    }

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        // Como UsernameForm: al volver a pedir la contraseña el correo ya se sabe, salvo que la cuenta tenga un
        // proveedor con el que volver a entrar.
        if (context.getUser() != null && linkedProviders(context).isEmpty()) {
            context.success();
            return;
        }
        super.authenticate(context);
    }

    @Override
    protected boolean validateForm(AuthenticationFlowContext context, MultivaluedMap<String, String> formData) {
        if (!validateUser(context, formData)) return false;
        UserModel user = context.getUser();
        boolean password = user.credentialManager().isConfiguredFor(PasswordCredentialModel.TYPE);
        boolean passkey = user.credentialManager().isConfiguredFor(WebAuthnCredentialModel.TYPE_PASSWORDLESS);
        if (password || passkey) return true;

        // Sin forma de entrar con el correo: se queda en este paso, con el correo puesto, y dice qué hacer.
        // El nombre que se ve en su botón: el que se le puso o, sin él, el del tipo de proveedor («Google»).
        List<String> providers = linkedProviders(context).stream().map(p -> KeycloakModelUtils.getIdentityProviderDisplayName(context.getSession(), p)).collect(Collectors.toList());
        context.clearUser();
        LoginFormsProvider form = context.form().setFormData(formData);
        if (providers.isEmpty()) form.setInfo(NO_PASSWORD);
        else form.setInfo(USES_PROVIDER, String.join(", ", providers));
        if (isConditionalPasskeysEnabled(null)) webauthnAuth.fillContextForm(context);
        context.challenge(form.createLoginUsername());
        return false;
    }

    @Override
    protected Response challenge(AuthenticationFlowContext context, MultivaluedMap<String, String> formData) {
        LoginFormsProvider forms = context.form();
        if (!formData.isEmpty()) forms.setFormData(formData);
        return forms.createLoginUsername();
    }

    @Override
    protected Response createLoginForm(LoginFormsProvider form) {
        return form.createLoginUsername();
    }

    @Override
    protected String getDefaultChallengeMessage(AuthenticationFlowContext context) {
        return context.getRealm().isLoginWithEmailAllowed() ? Messages.INVALID_USERNAME_OR_EMAIL : Messages.INVALID_USERNAME;
    }

    /** Los proveedores (Google…) enlazados a la cuenta y activos, salvo aquel con el que ya se está entrando. */
    private static List<IdentityProviderModel> linkedProviders(AuthenticationFlowContext context) {
        KeycloakSession session = context.getSession();
        UserModel user = context.getUser();
        if (user == null) return List.of();
        AuthenticationSessionModel authSession = context.getAuthenticationSession();
        SerializedBrokeredIdentityContext serialized = SerializedBrokeredIdentityContext.readFromAuthenticationSession(authSession, AbstractIdpAuthenticator.BROKERED_CONTEXT_NOTE);
        IdentityProviderModel current = serialized == null ? null : serialized.deserialize(session, authSession).getIdpConfig();
        return session.users().getFederatedIdentitiesStream(context.getRealm(), user)
                .map(identity -> session.identityProviders().getByAlias(identity.getIdentityProvider()))
                .filter(Objects::nonNull)
                .filter(IdentityProviderModel::isEnabled)
                .filter(idp -> current == null || !Objects.equals(current.getAlias(), idp.getAlias()))
                .collect(Collectors.toList());
    }

    /** La fábrica: una instancia por petición, porque la parte de las passkeys guarda la sesión. */
    public static final class Factory implements AuthenticatorFactory {

        @Override
        public Authenticator create(KeycloakSession session) {
            return new EmailFirstForm(session);
        }

        @Override
        public String getId() {
            return PROVIDER_ID;
        }

        @Override
        public String getDisplayType() {
            return "Email first form";
        }

        @Override
        public String getHelpText() {
            return "Asks only for the email, like Username Form. If the account has no password or passkey, stays on the email step and says how it signs in.";
        }

        @Override
        public String getReferenceCategory() {
            return PasswordCredentialModel.TYPE;
        }

        @Override
        public boolean isConfigurable() {
            return false;
        }

        @Override
        public Requirement[] getRequirementChoices() {
            return new Requirement[] {Requirement.REQUIRED};
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
