import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import './index.css'
import './i18n'
import App from './App.tsx'

// Force clear storage on version change
const CURRENT_VERSION = '2.5.2';
const storedVersion = localStorage.getItem('nox_version');
if (storedVersion !== CURRENT_VERSION) {
  console.log('[Init] Version changed, clearing storage:', storedVersion, '->', CURRENT_VERSION);
  localStorage.clear();
  localStorage.setItem('nox_version', CURRENT_VERSION);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TonConnectUIProvider manifestUrl="https://ais-dev-l2xairsffd26jwcbwbuqyu-32118150839.europe-west2.run.app/tonconnect-manifest.json">
      <App />
    </TonConnectUIProvider>
  </StrictMode>,
)
