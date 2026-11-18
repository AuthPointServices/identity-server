const NAMES: Record<string, string> = { google: 'Google', github: 'GitHub', facebook: 'Facebook', microsoft: 'Microsoft', apple: 'Apple' };

/** El nombre de un proveedor por su alias, en las páginas donde Keycloak no manda el nombre que se le puso. */
export const providerName = (alias: string) => NAMES[alias] ?? alias;
