package space.fretchcop.identity;

import jakarta.ws.rs.core.MultivaluedMap;

import org.keycloak.Config;
import org.keycloak.authentication.InitiatedActionSupport;
import org.keycloak.authentication.RequiredActionContext;
import org.keycloak.authentication.RequiredActionFactory;
import org.keycloak.authentication.RequiredActionProvider;
import org.keycloak.credential.CredentialModel;
import org.keycloak.credential.CredentialProvider;
import org.keycloak.events.Details;
import org.keycloak.events.EventType;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.FormMessage;
import org.keycloak.sessions.AuthenticationSessionModel;

/**
 * Activar los dos pasos por correo: se envía un código al correo de la cuenta y, al escribirlo, queda activado (así se
 * sabe que llegan). Lo lanza la app con kc_action=fc-configure-email-code, como el de la app de verificación; por ser
 * una forma de entrar, Keycloak pide haber entrado hace poco (max_auth_age, 5 minutos).
 */
public final class ConfigureEmailCode implements RequiredActionProvider, RequiredActionFactory {

    public static final String PROVIDER_ID = "fc-configure-email-code";

    @Override
    public InitiatedActionSupport initiatedActionSupport() {
        return InitiatedActionSupport.SUPPORTED;
    }

    @Override
    public void evaluateTriggers(RequiredActionContext context) {
    }

    @Override
    public void requiredActionChallenge(RequiredActionContext context) {
        UserModel user = context.getUser();
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            context.ignore();
            return;
        }
        AuthenticationSessionModel auth = context.getAuthenticationSession();
        LoginFormsProvider form = context.form();
        if (!EmailCode.active(auth, EmailCode.Mode.SETUP)) {
            EmailCodeLoginForm.sendInto(context.getSession(), context.getRealm(), user, auth, form, EmailCode.Mode.SETUP, false);
        }
        context.challenge(EmailCode.page(form, user, auth, EmailCode.Mode.SETUP));
    }

    @Override
    public void processAction(RequiredActionContext context) {
        MultivaluedMap<String, String> data = context.getHttpRequest().getDecodedFormParameters();
        AuthenticationSessionModel auth = context.getAuthenticationSession();
        UserModel user = context.getUser();
        LoginFormsProvider form = context.form();
        if (data.containsKey("resend")) {
            EmailCodeLoginForm.sendInto(context.getSession(), context.getRealm(), user, auth, form, EmailCode.Mode.SETUP, true);
            context.challenge(EmailCode.page(form, user, auth, EmailCode.Mode.SETUP));
            return;
        }
        switch (EmailCode.check(auth, EmailCode.Mode.SETUP, data.getFirst(EmailCode.FIELD))) {
            case OK -> {
                EmailCodeCredentialProvider provider = (EmailCodeCredentialProvider) context.getSession().getProvider(CredentialProvider.class, EmailCodeCredentialProvider.TYPE);
                if (user.credentialManager().getStoredCredentialsByTypeStream(EmailCodeCredentialProvider.TYPE).findAny().isEmpty()) {
                    CredentialModel credential = new CredentialModel();
                    credential.setUserLabel(user.getEmail());
                    provider.createCredential(context.getRealm(), user, credential);
                    // Como al añadir otra forma de entrar: queda en la actividad y llega el aviso por correo.
                    context.getEvent().clone().event(EventType.UPDATE_CREDENTIAL).user(user).detail(Details.CREDENTIAL_TYPE, EmailCodeCredentialProvider.TYPE).success();
                }
                EmailCode.markEmailVerified(user, auth, context.getEvent());
                context.success();
            }
            case WRONG, TOO_MANY -> {
                boolean tooMany = !EmailCode.active(auth, EmailCode.Mode.SETUP);
                form.addError(new FormMessage(EmailCode.FIELD, tooMany ? "fcEmailCodeTooMany" : "fcEmailCodeWrong"));
                context.challenge(EmailCode.page(form, user, auth, EmailCode.Mode.SETUP));
            }
            case EXPIRED -> {
                form.addError(new FormMessage(EmailCode.FIELD, "fcEmailCodeExpired"));
                context.challenge(EmailCode.page(form, user, auth, EmailCode.Mode.SETUP));
            }
        }
    }

    @Override
    public RequiredActionProvider create(KeycloakSession session) {
        return this;
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    @Override
    public String getDisplayText() {
        return "Configure email codes";
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
