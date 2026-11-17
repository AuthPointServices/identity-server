import { encode, QrCodeDataType } from 'uqr';

/*
 * El código QR de la clave con las formas de un QR de marca: módulos en punto, los tres ojos como un marco cuadrado de
 * esquinas suaves con la pupila redonda, y los de alineación igual en pequeño. Las formas cambian, la estructura no: el
 * ojo guarda sus proporciones 1:1:3:1:1, cada módulo su centro oscuro, y hay cuatro módulos de margen blanco. El marco
 * apenas se redondea: con esquinas muy redondas, los lectores que buscan el ojo por sus esquinas (OpenCV) ya no lo ven. Sin logo en el centro: taparlo pide corrección H,
 * y el enlace otpauth:// pasaría de 41 a 61 módulos, más pequeños y peores de leer. Sin React, para que
 * scripts/qr-check.mjs lo lea con zbarimg y OpenCV.
 */

export const QR_INK = '#15171c';
// Diámetro de cada punto, en módulos: lo bastante grande para que la cámara lo lea oscuro, con aire entre vecinos.
const DOT = 0.9;
// El margen blanco alrededor, en módulos: el de la norma.
export const QR_QUIET = 4;

/** Un cuadrado redondeado como trazado, para restar el hueco del aro con evenodd. */
const roundRect = (x: number, y: number, s: number, r: number) =>
  `M${x + r} ${y}H${x + s - r}A${r} ${r} 0 0 1 ${x + s} ${y + r}V${y + s - r}A${r} ${r} 0 0 1 ${x + s - r} ${y + s}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + s - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

/** Un círculo como dos arcos, para meter todos los puntos en un solo trazado (sin costuras entre ellos). */
const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

export type QrPaths = { size: number; dots: string; rings: string; pupils: string };

export function qrPaths(value: string): QrPaths {
  // El nivel de corrección más alto que cabe en la versión más pequeña: menos módulos, más grandes.
  const qr = encode(value, { ecc: 'L', boostEcc: true, border: 0 });
  const n = qr.size;
  const type = (x: number, y: number) => qr.types[y]![x]!;
  const isAlign = (x: number, y: number) => x >= 0 && y >= 0 && type(x, y) === QrCodeDataType.Alignment;
  let dots = '', rings = '', pupils = '';
  // Los ojos (7 módulos), en sus tres esquinas. Su tipo incluye el borde blanco que los separa, que no se dibuja.
  for (const [x, y] of [[0, 0], [n - 7, 0], [0, n - 7]] as const) {
    rings += roundRect(x, y, 7, 0.5) + roundRect(x + 1, y + 1, 5, 0.35);
    pupils += circle(x + 3.5, y + 3.5, 1.5);
  }
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = type(x, y);
      if (t === QrCodeDataType.Position) continue;
      // Un patrón de alineación (5 módulos) se dibuja entero desde su esquina de arriba a la izquierda.
      if (t === QrCodeDataType.Alignment) {
        if (!isAlign(x - 1, y) && !isAlign(x, y - 1)) {
          rings += roundRect(x, y, 5, 0.45) + roundRect(x + 1, y + 1, 3, 0.3);
          pupils += circle(x + 2.5, y + 2.5, 0.5);
        }
        continue;
      }
      if (qr.data[y]![x]!) dots += circle(x + 0.5, y + 0.5, DOT / 2);
    }
  }
  return { size: n, dots, rings, pupils };
}

/** El SVG entero como texto, el mismo que pinta components/QrCode (para comprobarlo fuera del navegador). */
export function qrSvg(value: string, px: number) {
  const { size, dots, rings, pupils } = qrPaths(value);
  const box = size + QR_QUIET * 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="${-QR_QUIET} ${-QR_QUIET} ${box} ${box}">` +
    `<rect x="${-QR_QUIET}" y="${-QR_QUIET}" width="${box}" height="${box}" fill="#fff"/>` +
    `<path d="${dots}" fill="${QR_INK}"/><path d="${rings}" fill="${QR_INK}" fill-rule="evenodd"/><path d="${pupils}" fill="${QR_INK}"/></svg>`
  );
}
