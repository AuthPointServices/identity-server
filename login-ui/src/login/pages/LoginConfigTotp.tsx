import { useState } from 'react';
import { Actions } from '../components/Actions';
import { IconCheck, IconCopy } from '../components/icons';
import { Field } from '../components/ui';
import type { I18n } from '../i18n';
import type { KcContext } from '../KcContext';
import Template from '../Template';

/**
 * Activar los dos pasos: el código QR con la frase de qué hacer al lado, o la clave a mano. Sin pasos numerados: lo
 * que hay que escribir lo dicen las etiquetas. El nombre del dispositivo sólo se pide si ya hay otro, que es cuando
 * Keycloak lo exige y sirve para elegir al entrar.
 */
export default function LoginConfigTotp({ kcContext, i18n }: { kcContext: Extract<KcContext, { pageId: 'login-config-totp.ftl' }>; i18n: I18n }) {
  const { url, isAppInitiatedAction, totp, mode, messagesPerField } = kcContext;
  const { msg, msgStr, advancedMsgStr } = i18n;
  const manual = mode === 'manual';
  const p = totp.policy;
  // Keycloak da la clave del mensaje de cada app; si no la hay, el nombre tal cual.
  const apps = totp.supportedApplications.map((a) => advancedMsgStr(a));
  const codeError = messagesPerField.existsError('totp') ? messagesPerField.get('totp') : undefined;
  const labelError = messagesPerField.existsError('userLabel') ? messagesPerField.get('userLabel') : undefined;
  const askLabel = totp.otpCredentials.length >= 1 || labelError !== undefined;
  // Los datos de la clave sólo hacen falta si no son los que toda app usa sin preguntar.
  const customPolicy = p.type !== 'totp' || p.getAlgorithmKey() !== 'SHA1' || p.digits !== 6 || p.period !== 30;

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
          <SecretKey value={totp.totpSecretEncoded} copyLabel={msgStr('fcCopyKey')} copiedLabel={msgStr('fcKeyCopied')} />
          {customPolicy && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm/5 text-fg-muted tabular-nums">
              <dt>{msg('loginTotpType')}</dt><dd className="text-fg">{msgStr(`loginTotp.${p.type}` as never)}</dd>
              <dt>{msg('loginTotpAlgorithm')}</dt><dd className="text-fg">{p.getAlgorithmKey()}</dd>
              <dt>{msg('loginTotpDigits')}</dt><dd className="text-fg">{p.digits}</dd>
              {p.type === 'totp' ? <><dt>{msg('loginTotpInterval')}</dt><dd className="text-fg">{p.period}</dd></> : <><dt>{msg('loginTotpCounter')}</dt><dd className="text-fg">{p.initialCounter}</dd></>}
            </dl>
          )}
          <a id="mode-barcode" href={totp.qrUrl} className="w-fit text-sm/5 pointer-coarse:py-3">{msg('loginTotpScanBarcode')}</a>
        </div>
      ) : (
        // Si al lado no quedan 160 px (en 320), la frase baja bajo el código en vez de desbordar.
        <div className="flex flex-wrap items-stretch gap-5">
          {/* Blanco también en oscuro, que es lo que leen las cámaras. Keycloak da el código en 246 px: a la mitad exacta y
              sin suavizar, cada módulo cae en píxeles enteros. */}
          <img
            id="kc-totp-secret-qr-code"
            src={`data:image/png;base64, ${totp.totpSecretQrCode}`}
            alt={msgStr('fcTotpQrAlt')}
            className="box-content size-[123px] shrink-0 rounded-xl border border-border bg-white p-2 [image-rendering:pixelated]"
          />
          <div className="flex min-w-40 flex-1 flex-col justify-between gap-3 text-sm/5 text-pretty text-fg">
            <p>
              {msg('fcTotpScanWith')}{' '}
              {apps.map((a, i) => (
                <span key={a}>
                  <span className="whitespace-nowrap">{a}</span>
                  {i < apps.length - 2 ? ', ' : i === apps.length - 2 ? ` ${msgStr('fcOr')} ` : '.'}
                </span>
              ))}
            </p>
            <a id="mode-manual" href={totp.manualUrl} className="w-fit pointer-coarse:py-3">{msg('loginTotpUnableToScan')}</a>
          </div>
        </div>
      )}

      <form id="kc-totp-settings-form" action={url.loginAction} method="post" className="flex flex-col gap-5">
        <Field
          id="totp"
          label={msg('authenticatorCode')}
          autoComplete="one-time-code"
          inputMode="numeric"
          autoFocus={codeError !== undefined}
          error={codeError}
          className="text-lg/6 font-medium tracking-[0.16em] tabular-nums"
        />
        <input type="hidden" id="totpSecret" name="totpSecret" value={totp.totpSecret} />
        {mode && <input type="hidden" id="mode" name="mode" value={mode} />}
        {askLabel && (
          <Field id="userLabel" label={msg('loginTotpDeviceName')} autoComplete="off" error={labelError} hint={labelError ? undefined : msg('loginTotpStep3DeviceName')} />
        )}
        <Actions submit={msg('doSubmit')} cancel={isAppInitiatedAction && msg('doCancel')} submitProps={{ id: 'saveTOTPBtn' }} />
      </form>
    </Template>
  );
}

/** La clave en grupos de cuatro, con un botón para copiarla (en el móvil se pega en la app del mismo móvil). */
function SecretKey({ value, copyLabel, copiedLabel }: { value: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl bg-container py-2 pr-2 pl-4">
      <p id="kc-totp-secret-key" className="min-w-0 flex-1 text-base/6 font-medium tracking-wider text-balance text-fg tabular-nums select-all">{value}</p>
      <button
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
