import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { keycloakify } from 'keycloakify/vite-plugin';
import { defineConfig } from 'vite';

// El tema de acceso de Keycloak, hecho en React: Keycloakify lo empaqueta en un jar (dist_keycloak/fretchcop-login.jar).
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    keycloakify({
      themeName: 'fretchcop',
      accountThemeImplementation: 'none',
      // Keycloak 26.8: un solo jar.
      keycloakVersionTargets: { '22-to-25': false, 'all-other-versions': 'fretchcop-login.jar' },
    }),
  ],
});
