package space.fretchcop.identity;

import org.keycloak.common.util.Time;
import org.keycloak.credential.CredentialInput;
import org.keycloak.credential.CredentialInputValidator;
import org.keycloak.credential.CredentialModel;
import org.keycloak.credential.CredentialProvider;
import org.keycloak.credential.CredentialProviderFactory;
import org.keycloak.credential.CredentialTypeMetadata;
import org.keycloak.credential.CredentialTypeMetadataContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;

/**
 * «Los dos pasos por correo» como una forma de entrar más de la cuenta, igual que la app de verificación: existe si la
 * persona lo activó (ConfigureEmailCode) y se quita como cualquier otra. No guarda ningún secreto, sólo que está
 * activado; el código de cada vez lo genera EmailCode.
 */
public final class EmailCodeCredentialProvider implements CredentialProvider<CredentialModel>, CredentialInputValidator {

    public static final String TYPE = "fc-email-code";

    private final KeycloakSession session;

    EmailCodeCredentialProvider(KeycloakSession session) {
        this.session = session;
    }

    @Override
    public String getType() {
        return TYPE;
    }

    @Override
    public CredentialModel createCredential(RealmModel realm, UserModel user, CredentialModel credential) {
        credential.setType(TYPE);
        if (credential.getCreatedDate() == null) credential.setCreatedDate(Time.currentTimeMillis());
        return user.credentialManager().createStoredCredential(credential);
    }

    @Override
    public boolean deleteCredential(RealmModel realm, UserModel user, String credentialId) {
        return user.credentialManager().removeStoredCredentialById(credentialId);
    }

    @Override
    public CredentialModel getCredentialFromModel(CredentialModel model) {
        return model;
    }

    @Override
    public CredentialTypeMetadata getCredentialTypeMetadata(CredentialTypeMetadataContext context) {
        return CredentialTypeMetadata.builder()
                .type(TYPE)
                .category(CredentialTypeMetadata.Category.TWO_FACTOR)
                .displayName("fcEmailCodeDisplayName")
                .helpText("fcEmailCodeHelpText")
                .iconCssClass("kcAuthenticatorOTPClass")
                .createAction(ConfigureEmailCode.PROVIDER_ID)
                .removeable(true)
                .build(session);
    }

    @Override
    public boolean supportsCredentialType(String credentialType) {
        return TYPE.equals(credentialType);
    }

    @Override
    public boolean isConfiguredFor(RealmModel realm, UserModel user, String credentialType) {
        return supportsCredentialType(credentialType) && user.credentialManager().getStoredCredentialsByTypeStream(TYPE).findAny().isPresent();
    }

    /** No hay nada que validar con una entrada: el código lo comprueba EmailCode contra su sesión. */
    @Override
    public boolean isValid(RealmModel realm, UserModel user, CredentialInput input) {
        return false;
    }

    public static final class Factory implements CredentialProviderFactory<EmailCodeCredentialProvider> {

        @Override
        public String getId() {
            return TYPE;
        }

        @Override
        public CredentialProvider<CredentialModel> create(KeycloakSession session) {
            return new EmailCodeCredentialProvider(session);
        }
    }
}
