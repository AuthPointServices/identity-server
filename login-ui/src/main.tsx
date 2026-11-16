import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { KcPage } from './kc.gen';
import './login/styles.css';

// En desarrollo, sin Keycloak: ?mock=<nombre> pinta esa pantalla con datos simulados (login/mocks.ts).
if (import.meta.env.DEV && !window.kcContext) {
  const { getMock, mocks } = await import('./login/mocks');
  const name = new URLSearchParams(location.search).get('mock') ?? 'login';
  window.kcContext = getMock(name);
  if (!window.kcContext) document.body.textContent = `Mocks: ${Object.keys(mocks).join(', ')}`;
}

const root = document.getElementById('root');
if (root && window.kcContext) {
  createRoot(root).render(
    <StrictMode>
      <KcPage kcContext={window.kcContext} />
    </StrictMode>,
  );
}
