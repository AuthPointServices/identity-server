package space.fretchcop.identity;

import java.util.List;

import jakarta.ws.rs.core.MultivaluedMap;

import org.keycloak.Config;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.AuthenticationFlowError;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.AuthenticatorFactory;
import org.keycloak.authentication.AuthenticatorUtil;
import org.keycloak.authentication.authenticators.util.AuthenticatorUtils;
import org.keycloak.events.Errors;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.credential.WebAuthnCredentialModel;
import org.keycloak.models.utils.FormMessage;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.services.messages.Messages;
import org.keycloak.sessions.AuthenticationSessionModel;

/**
 * Entrar con un código por correo en lugar de la contraseña, como en Adobe. Va como alternativa de «Password Form» en el
 * paso que sigue al correo: quien tiene contraseña elige el código desde su página («Recibir un código por correo»), y
 * quien no la tiene (se registró y no abrió el enlace) llega aquí directamente. Recibirlo verifica el correo. Un fallo
 * cuenta para la protección contra fuerza bruta, como una contraseña mal.
 */
public final class EmailCodeLoginForm implements Authenticator {

    public static final String PROVIDER_ID = "fc-email-code";

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        AuthenticationSessionModel auth = context.getAuthenticationSession();
        // Ya entró con una passkey en el paso del correo: no hace falta otro.
        if (AuthenticatorUtil.getAuthnCredentials(auth).contains(WebAuthnCredentialModel.TYPE_PASSWORDLESS)) {
            context.success();
            return;
        }
        UserModel user = context.getUser();
        LoginFormsProvider form = context.form();
        if (blocked(context, form)) {
            context.challenge(EmailCode.page(form, user, auth, EmailCode.Mode.LOGIN));
            return;
        }
        if (!EmailCode.active(auth, EmailCode.Mode.LOGIN)) sendInto(context, form, false);
        context.challenge(EmailCode.page(form, user, auth, EmailCode.Mode.LOGIN));
    }

    @Override
    public void action(AuthenticationFlowContext context) {
        MultivaluedMap<String, String> data = context.getHttpRequest().getDecodedFormParameters();
        AuthenticationSessionModel auth = context.getAuthenticationSession();
        UserModel user = context.getUser();
        LoginFormsProvider form = context.form();
        if (data.containsKey("resend")) {
            sendInto(context, form, true);
            context.challenge(EmailCode.page(form, user, auth, EmailCode.Mode.LOGIN));
            return;
        }
        if (blocked(context, form)) {
            context.forceChallenge(EmailCode.page(form, user, auth, EmailCode.Mode.LOGIN));
            return;
        }
        switch (EmailCode.check(auth, EmailCode.Mode.LOGIN, data.getFirst(EmailCode.FIELD))) {
            case OK -> {
                EmailCode.markEmailVerified(user, auth, context.getEvent());
                auth.setAuthNote(EmailCode.FIRST_FACTOR_NOTE, "true");
                context.success();
            }
            case WRONG, TOO_MANY -> {
                boolean tooMany = !EmailCode.active(auth, EmailCode.Mode.LOGIN);
                context.getEvent().user(user).error(Errors.INVALID_USER_CREDENTIALS);
                form.addError(new FormMessage(EmailCode.FIELD, tooMany ? "fcEmailCodeTooMany" : "fcEmailCodeWrong"));
                context.failureChallenge(AuthenticationFlowError.INVALID_CREDENTIALS, EmailCode.page(form, user, auth, EmailCode.Mode.LOGIN));
            }
            case EXPIRED -> {
                form.addError(new FormMessage(EmailCode.FIELD, "fcEmailCodeExpired"));
                context.challenge(EmailCode.page(form, user, auth, EmailCode.Mode.LOGIN));
            }
        }
    }

    /** Envía un código y deja en la página qué pasó: enviado (si lo pidió otra vez), espera o fallo del correo. */
    static void sendInto(AuthenticationFlowContext context, LoginFormsProvider form, boolean resend) {
        sendInto(context.getSession(), context.getRealm(), context.getUser(), context.getAuthenticationSession(), form, EmailCode.Mode.LOGIN, resend);
    }

    static void sendInto(KeycloakSession session, RealmModel realm, UserModel user, AuthenticationSessionModel auth, LoginFormsProvider form, EmailCode.Mode mode, boolean resend) {
        switch (EmailCode.send(session, realm, user, auth, mode)) {
            case SENT -> {
                if (resend) form.setSuccess("fcEmailCodeResent");
            }
            case WAIT -> form.setInfo("fcEmailCodeWait", Math.max(1, EmailCode.resendIn(auth, mode)));
            case FAILED -> form.setError(Messages.EMAIL_SENT_ERROR);
        }
    }

    /** La cuenta está bloqueada por demasiados intentos: lo dice y no acepta códigos. */
    private static boolean blocked(AuthenticationFlowContext context, LoginFormsProvider form) {
        String error = AuthenticatorUtils.getDisabledByBruteForceEventError(context, context.getUser());
        if (error == null) return false;
        context.getEvent().user(context.getUser()).error(error);
        form.addError(new FormMessage(EmailCode.FIELD, Errors.USER_TEMPORARILY_DISABLED.equals(error) ? Messages.ACCOUNT_TEMPORARILY_DISABLED : Messages.ACCOUNT_PERMANENTLY_DISABLED));
        return true;
    }

    @Override
    public boolean requiresUser() {
        return true;
    }

    @Override
    public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
        return user.getEmail() != null && !user.getEmail().isBlank();
    }

    @Override
    public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {
    }

    @Override
    public void close() {
    }

    public static final class Factory implements AuthenticatorFactory {

        private static final EmailCodeLoginForm SINGLETON = new EmailCodeLoginForm();

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
            return "Email code";
        }

        @Override
        public String getHelpText() {
            return "Signs in with a one-time code sent to the account's email. Use it as an alternative to Password Form.";
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
