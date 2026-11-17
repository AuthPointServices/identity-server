package space.fretchcop.identity;

import java.util.List;

import jakarta.ws.rs.core.MultivaluedMap;

import org.keycloak.Config;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.AuthenticationFlowError;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.AuthenticatorFactory;
import org.keycloak.authentication.CredentialValidator;
import org.keycloak.credential.CredentialProvider;
import org.keycloak.events.Errors;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.FormMessage;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.sessions.AuthenticationSessionModel;

/**
 * El segundo paso por correo, como en Adobe: tras la contraseña, un código enviado al correo, para quien lo activó.
 * Va como alternativa del código de la app en los dos pasos: con los dos activados se elige con «Prueba otra forma».
 * Si ya se entró con un código por correo, no vale otra vez el mismo buzón: no cuenta como configurado y, si alguien lo
 * elige igualmente, se pasa a la otra forma.
 */
public final class EmailCodeSecondFactor implements Authenticator, CredentialValidator<EmailCodeCredentialProvider> {

    public static final String PROVIDER_ID = "fc-email-code-2fa";

    private static boolean firstFactorWasEmail(AuthenticationSessionModel auth) {
        return auth != null && "true".equals(auth.getAuthNote(EmailCode.FIRST_FACTOR_NOTE));
    }

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        AuthenticationSessionModel auth = context.getAuthenticationSession();
        if (firstFactorWasEmail(auth)) {
            context.attempted();
            return;
        }
        LoginFormsProvider form = context.form();
        if (!EmailCode.active(auth, EmailCode.Mode.SECOND)) {
            EmailCodeLoginForm.sendInto(context.getSession(), context.getRealm(), context.getUser(), auth, form, EmailCode.Mode.SECOND, false);
        }
        context.challenge(EmailCode.page(form, context.getUser(), auth, EmailCode.Mode.SECOND));
    }

    @Override
    public void action(AuthenticationFlowContext context) {
        MultivaluedMap<String, String> data = context.getHttpRequest().getDecodedFormParameters();
        AuthenticationSessionModel auth = context.getAuthenticationSession();
        UserModel user = context.getUser();
        LoginFormsProvider form = context.form();
        if (data.containsKey("resend")) {
            EmailCodeLoginForm.sendInto(context.getSession(), context.getRealm(), user, auth, form, EmailCode.Mode.SECOND, true);
            context.challenge(EmailCode.page(form, user, auth, EmailCode.Mode.SECOND));
            return;
        }
        switch (EmailCode.check(auth, EmailCode.Mode.SECOND, data.getFirst(EmailCode.FIELD))) {
            case OK -> context.success(EmailCodeCredentialProvider.TYPE);
            case WRONG, TOO_MANY -> {
                boolean tooMany = !EmailCode.active(auth, EmailCode.Mode.SECOND);
                context.getEvent().user(user).error(Errors.INVALID_USER_CREDENTIALS);
                form.addError(new FormMessage(EmailCode.FIELD, tooMany ? "fcEmailCodeTooMany" : "fcEmailCodeWrong"));
                context.failureChallenge(AuthenticationFlowError.INVALID_CREDENTIALS, EmailCode.page(form, user, auth, EmailCode.Mode.SECOND));
            }
            case EXPIRED -> {
                form.addError(new FormMessage(EmailCode.FIELD, "fcEmailCodeExpired"));
                context.challenge(EmailCode.page(form, user, auth, EmailCode.Mode.SECOND));
            }
        }
    }

    @Override
    public EmailCodeCredentialProvider getCredentialProvider(KeycloakSession session) {
        return (EmailCodeCredentialProvider) session.getProvider(CredentialProvider.class, EmailCodeCredentialProvider.TYPE);
    }

    @Override
    public boolean requiresUser() {
        return true;
    }

    @Override
    public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
        return getCredentialProvider(session).isConfiguredFor(realm, user, EmailCodeCredentialProvider.TYPE)
                && !firstFactorWasEmail(session.getContext().getAuthenticationSession());
    }

    @Override
    public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {
    }

    @Override
    public void close() {
    }

    public static final class Factory implements AuthenticatorFactory {

        private static final EmailCodeSecondFactor SINGLETON = new EmailCodeSecondFactor();

        @Override
        public Authenticator create(KeycloakSession session) {
            return SINGLETON;
        }

        @Override
        public String getId() {
            return PROVIDER_ID;
        }

        @Override
        public String getDisplayType() {
            return "Email code (second factor)";
        }

        @Override
        public String getHelpText() {
            return "Asks for a one-time code sent to the account's email, for accounts that turned it on. Use it as an alternative to OTP Form.";
        }

        @Override
        public String getReferenceCategory() {
            return EmailCodeCredentialProvider.TYPE;
        }

        @Override
        public boolean isConfigurable() {
            return false;
        }

        @Override
        public Requirement[] getRequirementChoices() {
            return new Requirement[] {Requirement.ALTERNATIVE, Requirement.REQUIRED, Requirement.DISABLED};
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
