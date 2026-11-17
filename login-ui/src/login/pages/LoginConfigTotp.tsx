import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Actions } from '../components/Actions';
import { IconCheck, IconCopy } from '../components/icons';
import { QrCode } from '../components/QrCode';
import { BUTTON_SECONDARY, Field } from '../components/ui';
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
          <SecretKey value={totp.totpSecretEncoded} copyLabel={msgStr('fcCopyKey')} copiedLabel={msgStr('fcKeyCopied')} buttonRef={(el) => void (focusAfter.current = el)} />
          {account && <p className="text-sm/5 text-pretty text-fg-muted">{msg('fcTotpManualName', issuer, account)}</p>}
          {customPolicy && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm/5 text-fg-muted tabular-nums">
              <dt>{msg('loginTotpType')}</dt><dd className="text-fg">{msgStr(`loginTotp.${p.type}` as never)}</dd>
              <dt>{msg('loginTotpAlgorithm')}</dt><dd className="text-fg">{algorithm}</dd>
              <dt>{msg('loginTotpDigits')}</dt><dd className="text-fg">{p.digits}</dd>
              {p.type === 'totp' ? <><dt>{msg('loginTotpInterval')}</dt><dd className="text-fg">{p.period}</dd></> : <><dt>{msg('loginTotpCounter')}</dt><dd className="text-fg">{p.initialCounter}</dd></>}
            </dl>
          )}
          <a id="mode-barcode" href={totp.qrUrl} onClick={switchTo('qr')} className="inline-flex min-h-6 w-fit items-center text-sm/5 pointer-coarse:py-3">{msg('loginTotpScanBarcode')}</a>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* En el teléfono, el código va centrado encima; desde 640 px, a la izquierda con qué hacer al lado. */}
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-stretch">
            {/* Blanco también en oscuro, que es lo que leen las cámaras (el SVG lleva su propio fondo blanco; el marco sólo
                lo pone en oscuro, para que sus esquinas redondeadas sean blancas). Un objeto sobre la página: borde fino en
                claro, sombra suave en los dos. */}
            <div className="shrink-0 rounded-[16px] bg-[light-dark(transparent,#fff)] p-1.5 shadow-[0_1px_2px_light-dark(rgb(16_24_40/0.06),transparent),0_10px_28px_-14px_light-dark(rgb(16_24_40/0.28),rgb(0_0_0/0.6))] ring-1 ring-[light-dark(var(--color-border),transparent)]">
              {uri ? (
                <QrCode value={uri} label={msgStr('fcTotpQrAlt')} className="size-[168px] max-sm:size-[192px]" />
              ) : (
                <img id="kc-totp-secret-qr-code" src={`data:image/png;base64, ${totp.totpSecretQrCode}`} alt={msgStr('fcTotpQrAlt')} className="size-[168px] [image-rendering:pixelated] max-sm:size-[192px]" />
              )}
            </div>
            <div className="flex w-full min-w-0 flex-1 flex-col gap-3 text-sm/5 text-pretty text-fg">
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
                <div className="hidden max-sm:pointer-coarse:block">
                  <a href={uri} className={BUTTON_SECONDARY}>{msg('fcTotpOpenApp')}</a>
                </div>
              )}
              <a id="mode-manual" href={totp.manualUrl} onClick={switchTo('manual')} ref={(el) => void (focusAfter.current = el)} className="mt-auto inline-flex min-h-6 w-fit items-center pointer-coarse:py-3">
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
          className="text-lg/6 font-medium tracking-[0.16em] tabular-nums"
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

/** La clave en grupos de cuatro, con un botón para copiarla (en el móvil se pega en la app del mismo móvil). */
function SecretKey({ value, copyLabel, copiedLabel, buttonRef }: { value: string; copyLabel: string; copiedLabel: string; buttonRef?: (el: HTMLButtonElement | null) => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl bg-container py-2 pr-2 pl-4">
      <p id="kc-totp-secret-key" className="min-w-0 flex-1 text-base/6 font-medium tracking-wider text-balance text-fg tabular-nums select-all">{value}</p>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => void navigator.clipboard.writeText(value.replaceAll(' ', '')).then(() => setCopied(true))}
        className="grid size-10 shrink-0 place-items-center rounded-lg text-fg-muted transition-colors duration-quick hover:bg-surface hover:text-fg pointer-coarse:size-11"
        aria-label={copied ? copiedLabel : copyLabel}
        title={copied ? copiedLabel : copyLabel}
      >
        {copied ? <IconCheck /> : <IconCopy />}
      </button>
      <span role="status" className="sr-only">{copied ? copiedLabel : ''}</span>
    </div>
  );
}
