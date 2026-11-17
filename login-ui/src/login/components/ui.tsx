import { kcSanitize } from 'keycloakify/lib/kcSanitize';
import { useIsPasswordRevealed } from 'keycloakify/tools/useIsPasswordRevealed';
import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { IconAlert, IconEye, IconEyeOff, IconInfo, IconSuccess, IconWarning } from './icons';

/* Botones de 44 px con radio de 10: el mismo alto que los campos, para que la columna se lea como una sola pieza. Con
   colores forzados, el relleno desaparece y el borde mantiene la forma. */
const button =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] px-4 text-[15px]/5 font-semibold no-underline! transition-colors duration-quick disabled:cursor-progress disabled:opacity-70 forced-colors:border forced-colors:border-[ButtonText]';
export const BUTTON_PRIMARY = `${button} bg-accent text-accent-fg hover:bg-accent-hover`;
export const BUTTON_SECONDARY = `${button} border border-border-strong bg-surface text-fg hover:bg-surface-2`;
export const BUTTON_DANGER = `${button} bg-danger text-danger-fg hover:opacity-90`;
/** Un enlace con forma de botón de texto: «Cancelar», «Volver a iniciar sesión». */
export const BUTTON_TEXT = `${button} font-medium text-link-ink hover:bg-accent/8`;

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

/**
 * Un campo de formulario: la etiqueta encima y atada al campo, la ayuda y el error debajo y leídos con él
 * (aria-describedby). Con type="password" lleva el botón de mostrarla.
 */
export function Field({ id, label, error, hint, labelAside, reveal, type = 'text', className = '', ...input }: FieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;
  const isPassword = type === 'password' && reveal !== undefined;
  return (
    <div className="flex flex-col">
      <div className="mb-1.5 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm/5 font-medium text-fg">{label}</label>
        {labelAside}
      </div>
      <div className="relative">
        <input
          id={id}
          name={input.name ?? id}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`h-11 w-full rounded-[10px] border bg-surface px-3 text-base/6 text-fg transition-[border-color,box-shadow] duration-quick placeholder:text-fg-muted/70 hover:border-fg focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_22%,transparent)] focus-visible:outline-none forced-colors:focus-visible:outline-2 ${
            error ? 'border-danger hover:border-danger focus-visible:border-danger focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-danger)_20%,transparent)]' : 'border-input'
          } ${isPassword ? 'pr-12' : ''} ${className}`}
          {...input}
        />
        {isPassword && <RevealButton inputId={id} labels={reveal} />}
      </div>
      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-sm/5 text-pretty text-danger">
          <IconAlert size={16} className="mt-0.5 shrink-0" />
          <ServerText id={errorId} html={error} />
        </p>
      )}
      {hint && <p id={hintId} className="mt-2 text-sm/5 text-fg-muted">{hint}</p>}
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
      className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-[10px] text-fg-muted transition-colors duration-quick hover:text-fg focus-visible:-outline-offset-4 pointer-coarse:w-12"
    >
      {isPasswordRevealed ? <IconEyeOff /> : <IconEye />}
    </button>
  );
}

/** Una casilla de 18 px con su texto, toda la fila se toca (44 px en táctil). */
export function Checkbox({ id, label, ...input }: Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> & { id: string; label: ReactNode }) {
  return (
    <label htmlFor={id} className="flex w-fit cursor-pointer items-center gap-2.5 text-sm/5 text-fg pointer-coarse:min-h-11">
      <input id={id} name={input.name ?? id} type="checkbox" className="size-[18px] shrink-0 cursor-pointer rounded-[5px] accent-accent" {...input} />
      {label}
    </label>
  );
}

export type NoticeType = 'success' | 'warning' | 'error' | 'info';

const NOTICE: Record<NoticeType, { box: string; icon: ReactNode }> = {
  success: { box: 'border-ok/25 bg-ok-subtle text-ok-ink', icon: <IconSuccess /> },
  warning: { box: 'border-warn/30 bg-warn-subtle text-warn', icon: <IconWarning /> },
  error: { box: 'border-danger/25 bg-danger-subtle text-danger', icon: <IconAlert /> },
  info: { box: 'border-border bg-surface-2 text-fg', icon: <IconInfo /> },
};

/** Un aviso: el color del estado, un borde fino de su color y el icono; el texto, de Keycloak o nuestro. */
export function Notice({ type, children, html }: { type: NoticeType; children?: ReactNode; html?: string }) {
  const { box, icon } = NOTICE[type];
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm/5 ${box}`}>
      <span className="mt-px shrink-0">{icon}</span>
      {html !== undefined ? <ServerText html={html} className="min-w-0" /> : <span className="min-w-0">{children}</span>}
    </div>
  );
}

/** Una raya con una palabra en medio («o»), entre dos maneras de entrar. */
export function Divider({ children }: { children: ReactNode }) {
  const id = useId();
  return (
    <div role="separator" aria-labelledby={id} className="flex items-center gap-3 text-[13px]/5 text-fg-muted">
      <span className="h-px flex-1 bg-border" />
      <span id={id}>{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
