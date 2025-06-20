import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { LogOut, User, Settings, Calendar, BarChart3 } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      SUPER_ADMIN: 'Super Administrador',
      ADMIN: 'Administrador',
      BARBER: 'Barbeiro',
      CLIENT: 'Cliente',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-800',
      ADMIN: 'bg-blue-100 text-blue-800',
      BARBER: 'bg-green-100 text-green-800',
      CLIENT: 'bg-gray-100 text-gray-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-secondary-900">
                SaaS Barbearias
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-secondary-900">{user?.name}</p>
                  <p className="text-xs text-secondary-500">{user?.email}</p>
                </div>
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogOut size={16} />}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">
            Bem-vindo, {user?.name}!
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-secondary-600">Você está logado como:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role || '')}`}>
              {getRoleDisplayName(user?.role || '')}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card variant="elevated" hover>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Agendamentos Hoje</p>
                  <p className="text-2xl font-semibold text-secondary-900">12</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" hover>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <User className="h-8 w-8 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Clientes Ativos</p>
                  <p className="text-2xl font-semibold text-secondary-900">248</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" hover>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-8 w-8 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Receita Mensal</p>
                  <p className="text-2xl font-semibold text-secondary-900">R$ 15.420</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" hover>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Settings className="h-8 w-8 text-secondary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Taxa de Ocupação</p>
                  <p className="text-2xl font-semibold text-secondary-900">87%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Info Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="elevated">
            <CardHeader title="Informações do Usuário" />
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-secondary-700">Nome</label>
                  <p className="mt-1 text-sm text-secondary-900">{user?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700">Email</label>
                  <p className="mt-1 text-sm text-secondary-900">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700">Telefone</label>
                  <p className="mt-1 text-sm text-secondary-900">{user?.phone || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-secondary-700">Tipo de Conta</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role || '')}`}>
                      {getRoleDisplayName(user?.role || '')}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader title="Ações Rápidas" />
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" fullWidth leftIcon={<Calendar size={18} />}>
                  Novo Agendamento
                </Button>
                <Button variant="outline" fullWidth leftIcon={<User size={18} />}>
                  Gerenciar Perfil
                </Button>
                <Button variant="outline" fullWidth leftIcon={<Settings size={18} />}>
                  Configurações
                </Button>
                <Button variant="outline" fullWidth leftIcon={<BarChart3 size={18} />}>
                  Relatórios
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
