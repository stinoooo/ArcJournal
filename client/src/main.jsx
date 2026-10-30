import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/syne/400.css';
import '@fontsource/syne/500.css';
import '@fontsource/syne/600.css';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/dm-sans/wght-italic.css';
import App from './App';
import './styles/global.css';

// Browser-only development against server/dev-server.js. Stripped from builds.
if (import.meta.env.DEV && import.meta.env.VITE_DEV_BRIDGE === '1') await import('./dev/browserBridge');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
