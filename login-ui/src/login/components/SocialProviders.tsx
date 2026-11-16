import { ProviderLogo } from './icons';
import { BUTTON_SECONDARY, Divider } from './ui';

export type Provider = { alias: string; providerId: string; displayName: string; loginUrl: string };

/**
 * Entrar con otra cuenta: los proveedores que el realm tenga configurados, con su marca. Uno o dos van a lo ancho con
 * su nombre («Continuar con Google»); con tres o más, en una fila de marcas del mismo ancho, cada una con su nombre
 * para el lector y al pasar el cursor. Debajo, la raya con «o» que lleva al correo.
 */
export function SocialProviders({ providers, continueWith, or }: { providers: Provider[]; continueWith: (name: string) => string; or: string | false }) {
  if (providers.length === 0) return null;
  const row = providers.length > 2;
  return (
    <div className="flex flex-col gap-5">
      <ul className={row ? 'grid gap-2' : 'flex flex-col gap-2'} style={row ? { gridTemplateColumns: `repeat(${providers.length}, minmax(0, 1fr))` } : undefined}>
        {providers.map((p) => {
          const name = continueWith(p.displayName);
          return (
            <li key={p.alias}>
              <a id={`social-${p.alias}`} href={p.loginUrl} aria-label={row ? name : undefined} title={row ? name : undefined} className={`${BUTTON_SECONDARY} font-medium`}>
                <ProviderLogo providerId={p.providerId} size={row ? 20 : 18} />
                {!row && <span>{name}</span>}
              </a>
            </li>
          );
        })}
      </ul>
      {or && <Divider>{or}</Divider>}
    </div>
  );
}
