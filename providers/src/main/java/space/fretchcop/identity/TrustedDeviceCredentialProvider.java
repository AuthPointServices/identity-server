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
 * Los dispositivos de confianza de la cuenta (TrustedDevice): una sola credencial sin secreto. Quitarla, desde la
 * Cuenta, deja de confiar en todos a la vez. Guarda cuándo se confió en el último.
 */
public final class TrustedDeviceCredentialProvider implements CredentialProvider<CredentialModel>, CredentialInputValidator {

    public static final String TYPE = "fc-trusted-devices";

    private final KeycloakSession session;

    TrustedDeviceCredentialProvider(KeycloakSession session) {
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
                .displayName("fcTrustedDevicesDisplayName")
                .helpText("fcTrustedDevicesHelpText")
                .iconCssClass("kcAuthenticatorOTPClass")
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

    @Override
    public boolean isValid(RealmModel realm, UserModel user, CredentialInput input) {
        return false;
    }

    public static final class Factory implements CredentialProviderFactory<TrustedDeviceCredentialProvider> {

        @Override
        public String getId() {
            return TYPE;
        }

        @Override
        public CredentialProvider<CredentialModel> create(KeycloakSession session) {
            return new TrustedDeviceCredentialProvider(session);
        }
    }
}
