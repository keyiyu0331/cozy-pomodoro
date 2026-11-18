// Entry point: finds <div id="root"> in index.html and mounts the React app in it.

import './lib/oldNames'; // must stay first: moves data saved under the app's old name
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline support: register the service worker (see scripts/sw-template.js).
// Only in the built app — during `npm run dev` it would get in the way by
// serving old cached files while you are changing the code.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((err) => console.warn('Offline support could not be set up', err));
  });
}
