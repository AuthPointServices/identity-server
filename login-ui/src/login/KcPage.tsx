import DefaultPage from 'keycloakify/login/DefaultPage';
import UserProfileFormFields from 'keycloakify/login/UserProfileFormFields';
import { classes } from './classes';
import { useI18n } from './i18n';
import type { KcContext } from './KcContext';
import Template from './Template';

import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import LoginResetPasswordPage from './pages/LoginResetPassword';
import LoginUpdatePasswordPage from './pages/LoginUpdatePassword';
import LoginConfigTotpPage from './pages/LoginConfigTotp';
import LoginOtpPage from './pages/LoginOtp';
import WebauthnRegisterPage from './pages/WebauthnRegister';
import WebauthnAuthenticatePage from './pages/WebauthnAuthenticate';
import LoginVerifyEmailPage from './pages/LoginVerifyEmail';
import UpdateEmailPage from './pages/UpdateEmail';
import LoginUpdateProfilePage from './pages/LoginUpdateProfile';
import DeleteAccountConfirmPage from './pages/DeleteAccountConfirm';
import LogoutConfirmPage from './pages/LogoutConfirm';
import InfoPage from './pages/Info';
import ErrorPage from './pages/Error';
import LoginPageExpiredPage from './pages/LoginPageExpired';
import SelectAuthenticatorPage from './pages/SelectAuthenticator';
import LoginIdpLinkConfirmPage from './pages/LoginIdpLinkConfirm';
import TermsPage from './pages/Terms';

/**
 * Cada pantalla de Keycloak con su página; las poco frecuentes, con la de Keycloakify y nuestras clases. Las nuestras
 * van en el mismo archivo que la app, sin carga diferida: cada clic es una página nueva de Keycloak, y si la pantalla
 * llega en otro archivo el navegador pinta antes la página vacía (un parpadeo en blanco en cada navegación).
 */
export default function KcPage({ kcContext }: { kcContext: KcContext }) {
  const { i18n } = useI18n({ kcContext });
  return (
    <>
      {(() => {
        switch (kcContext.pageId) {
          case 'login.ftl':
            return <LoginPage kcContext={kcContext} i18n={i18n} />;
          case 'register.ftl':
            return <RegisterPage kcContext={kcContext} i18n={i18n} />;
          case 'login-reset-password.ftl':
            return <LoginResetPasswordPage kcContext={kcContext} i18n={i18n} />;
          case 'login-update-password.ftl':
            return <LoginUpdatePasswordPage kcContext={kcContext} i18n={i18n} />;
          case 'login-config-totp.ftl':
            return <LoginConfigTotpPage kcContext={kcContext} i18n={i18n} />;
          case 'login-otp.ftl':
            return <LoginOtpPage kcContext={kcContext} i18n={i18n} />;
          case 'webauthn-register.ftl':
            return <WebauthnRegisterPage kcContext={kcContext} i18n={i18n} />;
          case 'webauthn-authenticate.ftl':
            return <WebauthnAuthenticatePage kcContext={kcContext} i18n={i18n} />;
          case 'login-verify-email.ftl':
            return <LoginVerifyEmailPage kcContext={kcContext} i18n={i18n} />;
          case 'update-email.ftl':
            return <UpdateEmailPage kcContext={kcContext} i18n={i18n} />;
          case 'login-update-profile.ftl':
            return <LoginUpdateProfilePage kcContext={kcContext} i18n={i18n} />;
          case 'delete-account-confirm.ftl':
            return <DeleteAccountConfirmPage kcContext={kcContext} i18n={i18n} />;
          case 'logout-confirm.ftl':
            return <LogoutConfirmPage kcContext={kcContext} i18n={i18n} />;
          case 'info.ftl':
            return <InfoPage kcContext={kcContext} i18n={i18n} />;
          case 'error.ftl':
            return <ErrorPage kcContext={kcContext} i18n={i18n} />;
          case 'login-page-expired.ftl':
            return <LoginPageExpiredPage kcContext={kcContext} i18n={i18n} />;
          case 'select-authenticator.ftl':
            return <SelectAuthenticatorPage kcContext={kcContext} i18n={i18n} />;
          case 'login-idp-link-confirm.ftl':
            return <LoginIdpLinkConfirmPage kcContext={kcContext} i18n={i18n} />;
          case 'terms.ftl':
            return <TermsPage kcContext={kcContext} i18n={i18n} />;
          default:
            return (
              <DefaultPage
                kcContext={kcContext}
                i18n={i18n}
                classes={classes}
                Template={Template}
                doUseDefaultCss={false}
                UserProfileFormFields={UserProfileFormFields}
                doMakeUserConfirmPassword
              />
            );
        }
      })()}
    </>
  );
}
