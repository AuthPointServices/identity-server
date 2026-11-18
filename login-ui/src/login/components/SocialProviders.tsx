import type { ReactNode } from 'react';
import { IconChevronDown, ProviderLogo } from './icons';
import { BUTTON_SECONDARY, Divider } from './ui';

export type Provider = { alias: string; providerId: string; displayName: string; loginUrl: string };

/** Cuántas formas de entrar se ven sin abrir «Más opciones», como en Adobe. */
const VISIBLE = 3;
/** El orden de Adobe, de más a menos usado; Keycloak, sin orden puesto en la consola, los da por orden alfabético. */
const ORDER = ['google', 'facebook', 'apple', 'microsoft'];
const rank = (p: Provider) => (ORDER.includes(p.providerId) ? ORDER.indexOf(p.providerId) : ORDER.length);

/**
 * Las otras formas de entrar, debajo del correo y tras la raya con «o», como en Adobe: los proveedores que el realm
 * tenga configurados con su marca («Continuar con Google»), en el orden de Adobe, y, si se pasa, la passkey. Las tres
 * primeras van a lo ancho; el resto, dentro de «Más opciones para iniciar sesión».
 */
export function SocialProviders({ providers, extra = [], continueWith, or, more }: { providers: Provider[]; extra?: ReactNode[]; continueWith: (name: string) => string; or: string | false; more: string }) {
  const items = [
    ...[...providers].sort((a, b) => rank(a) - rank(b)).map((p) => (
      <a key={p.alias} id={`social-${p.alias}`} href={p.loginUrl} className={BUTTON_SECONDARY}>
        <ProviderLogo providerId={p.providerId} size={18} />
        <span>{continueWith(p.displayName)}</span>
      </a>
    )),
    ...extra,
  ];
  if (items.length === 0) return null;
  const shown = items.slice(0, VISIBLE);
  const hidden = items.slice(VISIBLE);
  return (
    <div className="flex flex-col gap-5">
      {or && <Divider>{or}</Divider>}
      <div className="flex flex-col gap-2">
        {shown}
        {hidden.length > 0 && (
          // Nativo: se abre con teclado y lo anuncian los lectores; la flecha gira al abrirlo.
          <details className="group">
            <summary className="mx-auto flex h-(--size-control-m) w-fit cursor-pointer list-none items-center gap-1 rounded-full px-3 text-100 font-bold text-accent-content hover:bg-hover [&::-webkit-details-marker]:hidden">
              {more}
              <IconChevronDown size={16} className="transition-transform duration-quick group-open:rotate-180" />
            </summary>
            <div className="mt-2 flex flex-col gap-2">{hidden}</div>
          </details>
        )}
      </div>
    </div>
  );
}
