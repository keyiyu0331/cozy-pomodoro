// Entry point: finds <div id="root"> in index.html and mounts the React app in it.

import './lib/oldNames'; // must stay first: moves data saved under the app's old name
import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initDesktop, isDesktopApp } from './desktop/desktop';
import './index.css';

// The address /wind-lab shows the wind test bench instead of the app.
// `lazy` means its code is only downloaded if you actually go there.
const WindLab = lazy(() => import('./lab/WindLab'));
const onWindLab = window.location.pathname.replace(/\/+$/, '').endsWith('/wind-lab');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {onWindLab ? (
      <Suspense fallback={null}>
        <WindLab />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);

// Offline support: register the service worker (see scripts/sw-template.js).
// Only in the built app — during `npm run dev` it would get in the way by
// serving old cached files while you are changing the code.
// (The desktop app doesn't need it either: its files are already on the computer.)
if (import.meta.env.PROD && !isDesktopApp && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((err) => console.warn('Offline support could not be set up', err));
  });
}

// In the desktop app, connect the timer to the native window pop-up.
void initDesktop();
