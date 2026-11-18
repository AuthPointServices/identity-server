/** El nombre común (CN) del titular, con las comas escapadas («Pérez\, Ana»); sin CN, el DN entero. */
export function commonName(dn: string) {
  const cn = /(?:^|,)\s*CN=((?:\\.|[^,\\])+)/i.exec(dn)?.[1];
  return cn ? cn.replace(/\\(.)/g, '$1').trim() : dn;
}

