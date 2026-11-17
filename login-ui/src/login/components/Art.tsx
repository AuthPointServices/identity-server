import { useLayoutEffect, useRef, useState } from 'react';
import accountOk from '../assets/states/account-ok.webp';
import cookies from '../assets/states/cookies.webp';
import emailOk from '../assets/states/email-ok.webp';
import error from '../assets/states/error.webp';
import expired from '../assets/states/expired.webp';
import signedIn from '../assets/states/signed-in.webp';
import signedOut from '../assets/states/signed-out.webp';

/*
 * Las ilustraciones de las pantallas de estado: objetos de porcelana, acero y obsidiana con el fuego del panel de la
 * marca encendido dentro (el mismo shader de FireField), renderizados en 3D con three.js. Las fuentes y cómo volver a
 * renderizarlas están en login-ui/art/. 560 × 420 px, a 280 × 210 en pantalla (2x); fondo transparente, sirven en claro
 * y en oscuro.
 */

export type ArtKind = 'signed-in' | 'signed-out' | 'sign-out' | 'email-ok' | 'account-ok' | 'expired' | 'error' | 'cookies';

const SRC: Record<ArtKind, string> = {
  'signed-in': signedIn,
  'sign-out': signedIn,
  'signed-out': signedOut,
  'email-ok': emailOk,
  'account-ok': accountOk,
  expired,
  error,
  cookies,
};

/** La ilustración de una pantalla de estado, decorativa (el título dice lo mismo). Ocupa su sitio desde el principio y
 *  aparece al cargar, sin mover nada. */
export function Art({ kind }: { kind: ArtKind }) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  // Si ya estaba en caché, «load» pudo dispararse antes de engancharlo.
  useLayoutEffect(() => {
    if (ref.current?.complete) setLoaded(true);
  }, []);
  return (
    <img
      ref={ref}
      data-art={kind}
      src={SRC[kind]}
      alt=""
      width={280}
      height={210}
      decoding="async"
      fetchPriority="high"
      onLoad={() => setLoaded(true)}
      className={`block h-[210px] w-[280px] max-w-full object-contain transition-opacity duration-300 ease-out select-none max-sm:h-[180px] max-sm:w-[240px] ${loaded ? 'opacity-100' : 'opacity-0'}`}
      draggable={false}
    />
  );
}
