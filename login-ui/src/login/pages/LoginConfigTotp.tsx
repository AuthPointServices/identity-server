import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Actions } from '../components/Actions';
import { QrCode } from '../components/QrCode';
import { BUTTON_SECONDARY, CopyValue, Field } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';
import { keyUri } from '../totp';

type TotpContext = Extract<KcContext, { pageId: 'login-config-totp.ftl' }>;

/**
 * Activar los dos pasos: nuestro código QR con qué hacer al lado, o la clave a mano, sin recargar la página (la clave
 * es la misma en los dos modos). Sin pasos numerados: lo que hay que escribir lo dicen las etiquetas. En un móvil, además,
 * un botón abre la app de verificación del propio móvil con la clave. El nombre del dispositivo sólo se pide si ya hay
 * otro, que es cuando Keycloak lo exige y sirve para elegir al entrar.
 */
export default function LoginConfigTotp({ kcContext, i18n }: { kcContext: TotpContext; i18n: I18n }) {
  const { url, isAppInitiatedAction, totp, messagesPerField, realm } = kcContext;
  const { msg, msgStr, advancedMsgStr } = i18n;
  const [mode, setMode] = useState<'qr' | 'manual'>(kcContext.mode === 'manual' ? 'manual' : 'qr');
  const manual = mode === 'manual';
  const p = totp.policy;
  // Keycloak da la clave del mensaje de cada app; si no la hay, el nombre tal cual.
  const apps = totp.supportedApplications.map((a) => advancedMsgStr(a));
  const codeError = messagesPerField.existsError('totp') ? messagesPerField.get('totp') : undefined;
  const labelError = messagesPerField.existsError('userLabel') ? messagesPerField.get('userLabel') : undefined;
  const askLabel = totp.otpCredentials.length >= 1 || labelError !== undefined;
  // «HmacSHA1» → «SHA1». No con getAlgorithmKey(): Keycloakify sólo lo evalúa en el servidor con mode=manual, y en el
  // modo QR devuelve «error» (el QR diría algorithm=error).
  const algorithm = p.algorithm.replace(/^Hmac/, '');
  // Los datos de la clave sólo hacen falta si no son los que toda app usa sin preguntar.
  const customPolicy = p.type !== 'totp' || algorithm !== 'SHA1' || p.digits !== 6 || p.period !== 30;
  const issuer = realm.displayName || realm.name;
  const account = totp.username;
  // Sin el usuario (otra versión de Keycloak) no se puede armar el enlace: queda el QR que manda Keycloak.
  const uri = account ? keyUri({ issuer, account, secret: totp.totpSecretEncoded, algorithm, digits: p.digits, ...(p.type === 'totp' ? { type: 'totp', period: p.period } : { type: 'hotp', counter: p.initialCounter }) }) : undefined;

  // Al cambiar de modo, el foco va a lo que acaba de aparecer, no se queda en un botón que ya no está.
  const focusAfter = useRef<HTMLElement | null>(null);
  const switched = useRef(false);
  useEffect(() => {
    if (switched.current) focusAfter.current?.focus();
  }, [mode]);
  const switchTo = (next: 'qr' | 'manual') => (e: MouseEvent) => {
    e.preventDefault();
    switched.current = true;
    setMode(next);
  };

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={false}
      headerNode={msg('loginTotpTitle')}
      documentTitle={msgStr('loginTotpTitle')}
      subtitle={manual ? msg('loginTotpManualStep2') : undefined}
      displayMessage={!messagesPerField.existsError('totp', 'userLabel')}
    >
      {manual ? (
        <div className="flex flex-col gap-3">
          <CopyValue id="kc-totp-secret-key" value={totp.totpSecretEncoded} copyLabel={msgStr('fcCopyKey')} copiedLabel={msgStr('fcKeyCopied')} buttonRef={(el) => void (focusAfter.current = el)} />
          {account && <p className="text-100 text-pretty text-fg-muted">{msg('fcTotpManualName', issuer, account)}</p>}
          {customPolicy && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-100 text-fg-muted tabular-nums">
              <dt>{msg('loginTotpType')}</dt><dd className="text-fg">{msgStr(`loginTotp.${p.type}` as never)}</dd>
              <dt>{msg('loginTotpAlgorithm')}</dt><dd className="text-fg">{algorithm}</dd>
              <dt>{msg('loginTotpDigits')}</dt><dd className="text-fg">{p.digits}</dd>
              {p.type === 'totp' ? <><dt>{msg('loginTotpInterval')}</dt><dd className="text-fg">{p.period}</dd></> : <><dt>{msg('loginTotpCounter')}</dt><dd className="text-fg">{p.initialCounter}</dd></>}
            </dl>
          )}
          <a id="mode-barcode" href={totp.qrUrl} onClick={switchTo('qr')} className="inline-flex min-h-6 w-fit items-center text-100 touch:py-3">{msg('loginTotpScanBarcode')}</a>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* En el teléfono, el código va centrado encima; desde 640 px, a la izquierda con qué hacer al lado. */}
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            {/* El QR trae su propio blanco; en oscuro, una ficha blanca alrededor: es lo que leen las cámaras. */}
            <div className="shrink-0 rounded-lg p-1.5 dark:bg-white">
              {uri ? (
                <QrCode value={uri} label={msgStr('fcTotpQrAlt')} className="size-[168px] max-sm:size-[192px]" />
              ) : (
                <img id="kc-totp-secret-qr-code" src={`data:image/png;base64, ${totp.totpSecretQrCode}`} alt={msgStr('fcTotpQrAlt')} className="size-[168px] [image-rendering:pixelated] max-sm:size-[192px]" />
              )}
            </div>
            <div className="flex w-full min-w-0 flex-1 flex-col gap-3 text-100 text-pretty text-fg">
              <p>
                {msg('fcTotpScanWith')}{' '}
                {apps.map((a, i) => (
                  <span key={a}>
                    <span className="whitespace-nowrap">{a}</span>
                    {i < apps.length - 2 ? ', ' : i === apps.length - 2 ? ` ${msgStr('fcOr')} ` : '.'}
                  </span>
                ))}
              </p>
              {/* Desde el propio móvil no se puede escanear su pantalla: el enlace otpauth:// abre la app con la clave. */}
              {uri && (
                <div className="hidden max-sm:touch:block">
                  <a href={uri} className={BUTTON_SECONDARY}>{msg('fcTotpOpenApp')}</a>
                </div>
              )}
              <a id="mode-manual" href={totp.manualUrl} onClick={switchTo('manual')} ref={(el) => void (focusAfter.current = el)} className="inline-flex min-h-6 w-fit items-center touch:py-3">
                {msg('loginTotpUnableToScan')}
              </a>
            </div>
          </div>
        </div>
      )}

      <form id="kc-totp-settings-form" action={url.loginAction} method="post" className="flex flex-col gap-5">
        <Field
          id="totp"
          label={msg('fcTotpCode', String(p.digits))}
          autoComplete="one-time-code"
          inputMode="numeric"
          // Sólo cifras, y no más de las del código: un espacio o un guion pegados con él lo harían inválido.
          onInput={(e) => void (e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, p.digits))}
          autoFocus={codeError !== undefined}
          error={codeError}
          className="text-300 font-medium tracking-[0.16em] tabular-nums"
        />
        <input type="hidden" id="totpSecret" name="totpSecret" value={totp.totpSecret} />
        <input type="hidden" id="mode" name="mode" value={mode} />
        {askLabel && (
          // Obligatorio también en el navegador: sin nombre, Keycloak devolvería la página con un error. El ejemplo va dentro
          // del campo y no debajo, para que la página quepa sin desplazar también con él.
          <Field id="userLabel" label={msg('loginTotpDeviceName')} placeholder={msgStr('fcTotpDeviceExample')} autoComplete="off" required error={labelError} />
        )}
        <Actions submit={msg('fcTotpActivate')} cancel={isAppInitiatedAction && msg('doCancel')} submitProps={{ id: 'saveTOTPBtn' }} />
      </form>
    </Template>
  );
}
