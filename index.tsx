import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

/**
 * React 19/ESM Singleton Root Initialization
 * Ensures that hot reloads or multiple script executions don't create multiple React roots.
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Target container 'root' not found in document.");
}

const global = window as any;
if (!global.__REACT_ROOT__) {
  global.__REACT_ROOT__ = createRoot(rootElement);
}

const root = global.__REACT_ROOT__;

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);