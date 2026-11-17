package space.fretchcop.identity;

import java.util.List;

import org.keycloak.Config;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.AuthenticatorFactory;
import org.keycloak.events.Details;
import org.keycloak.events.EventType;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;
import org.keycloak.models.DefaultActionTokenKey;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.UserModel.RequiredAction;
import org.keycloak.provider.ProviderConfigProperty;

/**
 * Abrir el enlace de «¿Olvidaste tu contraseña?» verifica el correo, como el enlace de verificar: los dos llegan al
 * mismo buzón y Keycloak comprueba que el correo del enlace sigue siendo el de la cuenta.
 *
 * <p>Sin esto, quien se registra y no abre el primer enlace queda sin salida: el registro no pide contraseña (llega
 * tras verificar), así que entrar falla, registrarse otra vez dice que el correo ya existe, y recuperar la contraseña
 * pide verificar el correo con un tercer correo. Va en el flujo de recuperar, justo después de «Send Reset Email».
 */
public final class ResetLinkVerifiesEmail implements Authenticator, AuthenticatorFactory {

    public static final String PROVIDER_ID = "reset-link-verifies-email";

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        UserModel user = context.getUser();
        // Keycloak deja esta nota al procesar un enlace de correo de esta cuenta; sin ella el paso no toca nada.
        // ponytail: vale cualquier enlace de correo de la cuenta, no solo el de recuperar; todos van a su buzón.
        String fromLink = context.getAuthenticationSession().getAuthNote(DefaultActionTokenKey.ACTION_TOKEN_USER_ID);
        if (user != null && user.getId().equals(fromLink) && !user.isEmailVerified()) {
            user.setEmailVerified(true);
            user.removeRequiredAction(RequiredAction.VERIFY_EMAIL);
            context.getAuthenticationSession().removeRequiredAction(RequiredAction.VERIFY_EMAIL);
            context.getEvent().clone().event(EventType.VERIFY_EMAIL).user(user).detail(Details.EMAIL, user.getEmail()).success();
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
    public String getDisplayType() {
        return "Reset link verifies email";
    }

    @Override
    public String getHelpText() {
        return "Marks the email as verified once the reset link is opened. Goes right after Send Reset Email.";
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
    public Authenticator create(KeycloakSession session) {
        return this;
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

    @Override
    public String getId() {
        return PROVIDER_ID;
    }
}
