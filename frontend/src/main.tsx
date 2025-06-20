import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Configurações de desenvolvimento
if (import.meta.env.DEV) {
  // React DevTools será habilitado automaticamente em desenvolvimento
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
