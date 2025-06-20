import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Users,
  Scissors,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { barbershopService } from '../../services/barbershopService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';

interface Barbershop {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  owner: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  _count: {
    barbers: number;
    services: number;
    appointments: number;
  };
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const BarbershopsPage: React.FC = () => {
  const { user } = useAuth();
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const canCreateBarbershop =
    user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const fetchBarbershops = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError(null);

      const response = await barbershopService.list({
        page,
        limit: 10,
        search: search || undefined,
      });

      setBarbershops(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao carregar barbearias'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbershops();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBarbershops(1, searchTerm);
  };

  const handlePageChange = (newPage: number) => {
    fetchBarbershops(newPage, searchTerm);
  };

  if (loading && barbershops.length === 0) {
    return (
      <div className='flex justify-center items-center min-h-64'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Barbearias</h1>
          <p className='text-gray-600'>Gerencie as barbearias do sistema</p>
        </div>

        {canCreateBarbershop && (
          <Link
            to='/barbershops/new'
            className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <Plus className='w-4 h-4 mr-2' />
            Nova Barbearia
          </Link>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className='flex gap-2'>
        <div className='flex-1 relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <input
            type='text'
            placeholder='Buscar por nome, endereço ou descrição...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
        </div>
        <button
          type='submit'
          className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'
        >
          Buscar
        </button>
      </form>

      {/* Error Message */}
      {error && <ErrorMessage message={error} />}

      {/* Barbershops Grid */}
      {barbershops.length === 0 && !loading ? (
        <div className='text-center py-12'>
          <Scissors className='w-12 h-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Nenhuma barbearia encontrada
          </h3>
          <p className='text-gray-600 mb-4'>
            {searchTerm
              ? 'Tente ajustar os termos de busca.'
              : 'Comece criando sua primeira barbearia.'}
          </p>
          {canCreateBarbershop && !searchTerm && (
            <Link
              to='/barbershops/new'
              className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
            >
              <Plus className='w-4 h-4 mr-2' />
              Criar Primeira Barbearia
            </Link>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {barbershops.map(barbershop => (
            <div
              key={barbershop.id}
              className='bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow'
            >
              <div className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900 truncate'>
                    {barbershop.name}
                  </h3>
                  <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full'>
                    {barbershop.owner.role}
                  </span>
                </div>

                {barbershop.description && (
                  <p className='text-gray-600 text-sm mb-4 line-clamp-2'>
                    {barbershop.description}
                  </p>
                )}

                <div className='space-y-2 mb-4'>
                  <div className='flex items-center text-sm text-gray-600'>
                    <MapPin className='w-4 h-4 mr-2 flex-shrink-0' />
                    <span className='truncate'>{barbershop.address}</span>
                  </div>
                  <div className='flex items-center text-sm text-gray-600'>
                    <Phone className='w-4 h-4 mr-2 flex-shrink-0' />
                    <span>{barbershop.phone}</span>
                  </div>
                  <div className='flex items-center text-sm text-gray-600'>
                    <Mail className='w-4 h-4 mr-2 flex-shrink-0' />
                    <span className='truncate'>{barbershop.email}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className='grid grid-cols-3 gap-2 mb-4 text-center'>
                  <div className='bg-gray-50 rounded-lg p-2'>
                    <div className='flex items-center justify-center mb-1'>
                      <Users className='w-4 h-4 text-gray-600' />
                    </div>
                    <div className='text-sm font-medium text-gray-900'>
                      {barbershop._count.barbers}
                    </div>
                    <div className='text-xs text-gray-600'>Barbeiros</div>
                  </div>
                  <div className='bg-gray-50 rounded-lg p-2'>
                    <div className='flex items-center justify-center mb-1'>
                      <Scissors className='w-4 h-4 text-gray-600' />
                    </div>
                    <div className='text-sm font-medium text-gray-900'>
                      {barbershop._count.services}
                    </div>
                    <div className='text-xs text-gray-600'>Serviços</div>
                  </div>
                  <div className='bg-gray-50 rounded-lg p-2'>
                    <div className='flex items-center justify-center mb-1'>
                      <Calendar className='w-4 h-4 text-gray-600' />
                    </div>
                    <div className='text-sm font-medium text-gray-900'>
                      {barbershop._count.appointments}
                    </div>
                    <div className='text-xs text-gray-600'>Agendamentos</div>
                  </div>
                </div>

                {/* Owner Info */}
                <div className='border-t pt-3'>
                  <p className='text-xs text-gray-500'>
                    Proprietário:{' '}
                    <span className='font-medium'>{barbershop.owner.name}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className='flex gap-2 mt-4'>
                  <Link
                    to={`/barbershops/${barbershop.id}`}
                    className='flex-1 text-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors'
                  >
                    Ver Detalhes
                  </Link>
                  {(user?.role === 'SUPER_ADMIN' ||
                    barbershop.owner.id === user?.id) && (
                    <Link
                      to={`/barbershops/${barbershop.id}/edit`}
                      className='px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors'
                    >
                      Editar
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className='flex justify-center items-center space-x-2'>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className='px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
          >
            Anterior
          </button>

          <span className='text-sm text-gray-600'>
            Página {pagination.page} de {pagination.pages}
          </span>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className='px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
          >
            Próxima
          </button>
        </div>
      )}

      {loading && barbershops.length > 0 && (
        <div className='flex justify-center'>
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};
