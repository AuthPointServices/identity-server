import DefaultPage from 'keycloakify/login/DefaultPage';
import UserProfileFormFields from 'keycloakify/login/UserProfileFormFields';
import { lazy, Suspense } from 'react';
import { classes } from './classes';
import { useI18n } from './i18n';
import type { KcContext } from './KcContext';
import Template from './Template';
import './styles.css';

const LoginPage = lazy(() => import('./pages/Login'));
const RegisterPage = lazy(() => import('./pages/Register'));
const LoginResetPasswordPage = lazy(() => import('./pages/LoginResetPassword'));
const LoginUpdatePasswordPage = lazy(() => import('./pages/LoginUpdatePassword'));
const LoginConfigTotpPage = lazy(() => import('./pages/LoginConfigTotp'));
const LoginOtpPage = lazy(() => import('./pages/LoginOtp'));
const WebauthnRegisterPage = lazy(() => import('./pages/WebauthnRegister'));
const WebauthnAuthenticatePage = lazy(() => import('./pages/WebauthnAuthenticate'));
const LoginVerifyEmailPage = lazy(() => import('./pages/LoginVerifyEmail'));
const UpdateEmailPage = lazy(() => import('./pages/UpdateEmail'));
const LoginUpdateProfilePage = lazy(() => import('./pages/LoginUpdateProfile'));
const DeleteAccountConfirmPage = lazy(() => import('./pages/DeleteAccountConfirm'));
const LogoutConfirmPage = lazy(() => import('./pages/LogoutConfirm'));
const InfoPage = lazy(() => import('./pages/Info'));
const ErrorPage = lazy(() => import('./pages/Error'));
const LoginPageExpiredPage = lazy(() => import('./pages/LoginPageExpired'));
const SelectAuthenticatorPage = lazy(() => import('./pages/SelectAuthenticator'));
const LoginIdpLinkConfirmPage = lazy(() => import('./pages/LoginIdpLinkConfirm'));
const TermsPage = lazy(() => import('./pages/Terms'));

/** Cada pantalla de Keycloak con su página; las poco frecuentes, con la de Keycloakify y nuestras clases. */
export default function KcPage({ kcContext }: { kcContext: KcContext }) {
  const { i18n } = useI18n({ kcContext });
  return (
    <Suspense>
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
    </Suspense>
  );
}
