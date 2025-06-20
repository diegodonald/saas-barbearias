import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';

// Páginas
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import { BarbershopsPage } from '@/pages/barbershops/BarbershopsPage';
import { CreateBarbershopPage } from '@/pages/barbershops/CreateBarbershopPage';

// Componente para redirecionar usuários autenticados
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated =
    localStorage.getItem('accessToken') && localStorage.getItem('user');

  if (isAuthenticated) {
    return <Navigate to='/dashboard' replace />;
  }

  return <>{children}</>;
};

// Página de erro 404
const NotFoundPage: React.FC = () => (
  <div className='min-h-screen flex items-center justify-center bg-secondary-50'>
    <div className='text-center'>
      <h1 className='text-6xl font-bold text-secondary-900'>404</h1>
      <p className='mt-4 text-xl text-secondary-600'>Página não encontrada</p>
      <a
        href='/dashboard'
        className='mt-6 inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors'
      >
        Voltar ao Dashboard
      </a>
    </div>
  </div>
);

// Página de acesso negado
const UnauthorizedPage: React.FC = () => (
  <div className='min-h-screen flex items-center justify-center bg-secondary-50'>
    <div className='text-center'>
      <h1 className='text-6xl font-bold text-secondary-900'>403</h1>
      <p className='mt-4 text-xl text-secondary-600'>Acesso negado</p>
      <p className='mt-2 text-secondary-500'>
        Você não tem permissão para acessar esta página
      </p>
      <a
        href='/dashboard'
        className='mt-6 inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors'
      >
        Voltar ao Dashboard
      </a>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className='App'>
          <Routes>
            {/* Rotas públicas */}
            <Route
              path='/login'
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path='/register'
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Rotas protegidas */}
            <Route
              path='/dashboard'
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Rotas de Barbearias */}
            <Route
              path='/barbershops'
              element={
                <ProtectedRoute>
                  <BarbershopsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path='/barbershops/new'
              element={
                <ProtectedRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <CreateBarbershopPage />
                </ProtectedRoute>
              }
            />

            {/* Rota raiz - redireciona para dashboard se autenticado, senão para login */}
            <Route path='/' element={<Navigate to='/dashboard' replace />} />

            {/* Páginas de erro */}
            <Route path='/unauthorized' element={<UnauthorizedPage />} />
            <Route path='*' element={<NotFoundPage />} />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position='top-right'
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                boxShadow:
                  '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                padding: '16px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
