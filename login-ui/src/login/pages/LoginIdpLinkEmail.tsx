import { IconExternal } from '../components/icons';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import { providerName } from '../providers';
import Template from '../Template';
import { webmailFor } from '../webmail';

/**
 * Para conectar un proveedor a una cuenta que ya existe, Keycloak manda un enlace al correo de la cuenta: revisa tu
 * correo, como al verificarlo. Reenviar y «ya lo abrí en otro navegador» van al mismo sitio: Keycloak sigue si ya se
 * confirmó y, si no, lo reenvía.
 */
export default function LoginIdpLinkEmail({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-idp-link-email.ftl' }>; i18n: I18n }) {
  const { url, brokerContext, idpAlias, properties } = kcContext;
  const { msg, msgStr } = i18n;
  const idp = providerName(idpAlias);
  const email = brokerContext.email;
  const devInbox = properties.FC_DEV_INBOX_URL;
  const inbox = devInbox ? { name: msgStr('fcDevInbox'), url: devInbox } : webmailFor(email);
  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('fcCheckInboxTitle')}
      documentTitle={msgStr('fcCheckInboxTitle')}
      subtitle={
        <>
          {email ? msg('fcLinkIdpEmailSentTo', idp, brokerContext.username) : msg('fcLinkIdpEmailSent', idp, brokerContext.username)}
          {email && <span className="mt-0.5 block font-medium break-all text-fg">{email}</span>}
        </>
      }
      displayInfo
      infoNode={
        <span className="flex flex-col gap-2">
          <span>{msg('fcLinkIdpEmailElsewhere')} <a href={url.loginAction}>{msg('doContinue')}</a></span>
          <span>{msg('fcLinkIdpNotYours')} <a href={url.loginRestartFlowUrl}>{msg('fcStartOver')}</a></span>
        </span>
      }
    >
      <div className="flex flex-col gap-2">
        {inbox && (
          <a href={inbox.url} target="_blank" rel="noopener noreferrer" className={BUTTON_PRIMARY}>
            {msgStr('fcOpenInbox', inbox.name)}
            <IconExternal size={16} />
          </a>
        )}
        <a href={url.loginAction} className={BUTTON_SECONDARY}>{msg('fcResendEmail')}</a>
      </div>
    </Template>
  );
}
