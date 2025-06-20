import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Configurações de desenvolvimento
if (import.meta.env.DEV) {
  // Habilitar React DevTools
  if (typeof window !== 'undefined') {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot;
  }
}

// Configurações de produção
if (import.meta.env.PROD) {
  // Desabilitar console.log em produção
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

// Renderizar aplicação
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
