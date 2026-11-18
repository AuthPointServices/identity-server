import { Checkbox as UiCheckbox, InlineAlert, nativeButtonClass, nativeInputClass, nativeRadioClass, type AlertVariant } from '@authpoint/ui';
import { kcSanitize } from 'keycloakify/lib/kcSanitize';
import { useIsPasswordRevealed } from 'keycloakify/tools/useIsPasswordRevealed';
import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { IconAlert, IconCheck, IconCopy, IconEye, IconEyeOff } from './icons';

// Los formularios los envía el navegador a Keycloak: botones y campos nativos con las clases de @authpoint/ui. Tamaño L,
// el de una pantalla con un solo formulario.
const block = 'w-full no-underline!';
export const BUTTON_PRIMARY = `${nativeButtonClass({ variant: 'accent', size: 'l' })} ${block}`;
export const BUTTON_SECONDARY = `${nativeButtonClass({ variant: 'secondary', size: 'l' })} ${block}`;
export const BUTTON_DANGER = `${nativeButtonClass({ variant: 'negative', size: 'l' })} ${block}`;
/** «Cancelar», «Volver a iniciar sesión»: un botón sin borde en el verde de los enlaces. */
export const BUTTON_TEXT = `${nativeButtonClass({ variant: 'quiet', size: 'l' })} ${block} text-accent-content!`;
/** Un enlace suelto al lado de una etiqueta o bajo un campo: sin subrayado hasta el hover. */
export const LINK = 'rounded-sm text-100 font-medium text-accent-content no-underline hover:underline';
/** Una opción que se toca entera y envía el formulario (un método para entrar, una empresa). */
export const ROW_BUTTON = 'flex w-full items-center gap-4 rounded-md border border-border bg-bg px-4 py-3 text-left transition-colors duration-quick hover:bg-hover';

/** Un texto que viene del servidor (puede llevar HTML de Keycloak): se limpia antes de pintarlo. */
export function ServerText({ html, id, className }: { html: string; id?: string; className?: string }) {
  return <span id={id} className={className} dangerouslySetInnerHTML={{ __html: kcSanitize(html) }} />;
}

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id: string;
  label: ReactNode;
  /** El error de Keycloak para este campo, tal como llega. */
  error?: string | undefined;
  hint?: ReactNode;
  /** Lo que va a la derecha de la etiqueta («¿Olvidaste tu contraseña?»). */
  labelAside?: ReactNode;
  /** Con type="password": los nombres del botón de mostrarla y ocultarla. */
  reveal?: { show: string; hide: string };
};

/** Etiqueta encima, ayuda y error debajo y leídos con el campo (aria-describedby); con el error, el error ocupa el sitio de la ayuda. */
export function Field({ id, label, error, hint, labelAside, reveal, type = 'text', className = '', ...input }: FieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = (error ? errorId : hint ? hintId : '') || undefined;
  const isPassword = type === 'password' && reveal !== undefined;
  return (
    <div className="flex flex-col">
      <div className="mb-1 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-100 leading-tight font-medium text-fg-muted">{label}</label>
        {labelAside}
      </div>
      <div className="relative">
        <input
          id={id}
          name={input.name ?? id}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${nativeInputClass} h-(--size-control-l) ${isPassword ? 'pr-(--size-control-l)' : ''} ${className}`}
          {...input}
        />
        {isPassword && <RevealButton inputId={id} labels={reveal} />}
      </div>
      {error ? (
        <p className="mt-1 flex items-start gap-1.5 text-75 leading-tight text-negative-900">
          <IconAlert size={14} className="mt-px shrink-0" />
          <ServerText id={errorId} html={error} />
        </p>
      ) : hint && <p id={hintId} className="mt-1 text-75 leading-tight text-fg-muted">{hint}</p>}
    </div>
  );
}

function RevealButton({ inputId, labels }: { inputId: string; labels: { show: string; hide: string } }) {
  const { isPasswordRevealed, toggleIsPasswordRevealed } = useIsPasswordRevealed({ passwordInputId: inputId });
  return (
    <button
      type="button"
      aria-controls={inputId}
      aria-label={isPasswordRevealed ? labels.hide : labels.show}
      onClick={toggleIsPasswordRevealed}
      className="absolute inset-y-0 right-0 grid w-(--size-control-l) place-items-center rounded-r-md text-fg-muted transition-colors duration-quick hover:text-fg-strong focus-visible:-outline-offset-4"
    >
      {isPasswordRevealed ? <IconEyeOff size={18} /> : <IconEye size={18} />}
    </button>
  );
}

/** La casilla de @authpoint/ui; el navegador envía `name=on` y valida `required` como con una nativa. */
export function Checkbox({ id, label, name, defaultChecked = false, required = false, 'aria-invalid': invalid }: {
  id: string;
  label: ReactNode;
  name?: string;
  value?: string;
  defaultChecked?: boolean;
  required?: boolean;
  'aria-invalid'?: boolean | undefined;
}) {
  return <UiCheckbox id={id} name={name ?? id} value="on" defaultSelected={defaultChecked} isRequired={required} isInvalid={invalid ?? false}>{label}</UiCheckbox>;
}

/** Elegir uno de varios (un dispositivo): radios nativos en filas que se tocan enteras. La marca va sólo en el borde. */
export function Choices({ legend, hideLegend = false, name, options, defaultValue }: {
  legend: ReactNode;
  /** Cuando el título y el subtítulo ya lo dicen: la leyenda queda para los lectores de pantalla. */
  hideLegend?: boolean;
  name: string;
  options: { id: string; value: string; label: ReactNode }[];
  defaultValue?: string | undefined;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={hideLegend ? 'sr-only' : 'mb-1.5 text-100 font-medium text-fg'}>{legend}</legend>
      {options.map((o) => (
        <label key={o.value} htmlFor={o.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-4 py-3 text-200 text-fg has-checked:border-accent">
          <input id={o.id} type="radio" name={name} value={o.value} defaultChecked={o.value === defaultValue} className={nativeRadioClass} />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}

/** Un valor para llevarse a otra app (la clave de los dos pasos, un código), con su botón de copiar. */
export function CopyValue({ id, value, copyLabel, copiedLabel, buttonRef }: { id: string; value: string; copyLabel: string; copiedLabel: string; buttonRef?: (el: HTMLButtonElement | null) => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-layer-1 py-2 pr-2 pl-4">
      <p id={id} className="min-w-0 flex-1 text-200 font-medium tracking-wider text-balance wrap-anywhere text-fg tabular-nums select-all">{value}</p>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => void navigator.clipboard.writeText(value.replaceAll(' ', '')).then(() => setCopied(true))}
        className="grid size-(--size-control-m) shrink-0 place-items-center rounded-full text-fg-muted transition-colors duration-quick hover:bg-hover hover:text-fg-strong"
        aria-label={copied ? copiedLabel : copyLabel}
        title={copied ? copiedLabel : copyLabel}
      >
        {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
      </button>
      <span role="status" className="sr-only">{copied ? copiedLabel : ''}</span>
    </div>
  );
}

export type NoticeType = 'success' | 'warning' | 'error' | 'info';

const VARIANT: Record<NoticeType, AlertVariant> = { success: 'positive', warning: 'notice', error: 'negative', info: 'informative' };

/** Un aviso de Keycloak o nuestro: el InlineAlert de @authpoint/ui, sin título (la frase lo es). */
export function Notice({ type, children, html }: { type: NoticeType; children?: ReactNode; html?: string }) {
  return <InlineAlert variant={VARIANT[type]}>{html !== undefined ? <ServerText html={html} /> : children}</InlineAlert>;
}

/** Una raya con una palabra en medio («o»), entre dos maneras de entrar. */
export function Divider({ children }: { children: ReactNode }) {
  const id = useId();
  return (
    <div role="separator" aria-labelledby={id} className="flex items-center gap-3 text-75 text-fg-muted">
      <span className="h-px flex-1 bg-border" />
      <span id={id}>{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
