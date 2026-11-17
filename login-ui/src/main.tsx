import { StrictMode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import KcPage from './login/KcPage';
import './login/styles.css';

// En desarrollo, sin Keycloak: ?mock=<nombre> pinta esa pantalla con datos simulados (login/mocks.ts).
if (import.meta.env.DEV && !window.kcContext) {
  const { getMock, mocks } = await import('./login/mocks');
  const name = new URLSearchParams(location.search).get('mock') ?? 'login';
  window.kcContext = getMock(name);
  if (!window.kcContext) document.body.textContent = `Mocks: ${Object.keys(mocks).join(', ')}`;
}

// El primer render, síncrono: el script bloquea la pintura (blocking="render" en index.html) y, al terminar, la página
// ya está entera. Así el navegador pasa de la pantalla anterior a esta sin pintar nada en medio.
const root = document.getElementById('root');
const kcContext = window.kcContext;
if (root && kcContext) {
  const app = createRoot(root);
  flushSync(() =>
    app.render(
      <StrictMode>
        <KcPage kcContext={kcContext} />
      </StrictMode>,
    ),
  );
}
