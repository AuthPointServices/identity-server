import { useMemo } from 'react';
import { QR_INK, QR_QUIET, qrPaths } from '../qr';

/** El código QR de la clave (las formas, en ../qr.ts). Tinta sobre blanco también en el modo oscuro: es lo que leen
 *  todas las cámaras. */
export function QrCode({ value, label, className = '' }: { value: string; label: string; className?: string }) {
  const { size, dots, rings, pupils } = useMemo(() => qrPaths(value), [value]);
  const box = size + QR_QUIET * 2;
  return (
    <svg role="img" aria-label={label} viewBox={`${-QR_QUIET} ${-QR_QUIET} ${box} ${box}`} shapeRendering="geometricPrecision" className={`block ${className}`}>
      <rect x={-QR_QUIET} y={-QR_QUIET} width={box} height={box} fill="#fff" />
      <path d={dots} fill={QR_INK} />
      <path d={rings} fill={QR_INK} fillRule="evenodd" />
      <path d={pupils} fill={QR_INK} />
    </svg>
  );
}
