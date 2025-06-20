import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, Phone, Mail, Globe } from 'lucide-react';
import {
  barbershopService,
  CreateBarbershopData,
} from '../../services/barbershopService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { SuccessMessage } from '../../components/ui/SuccessMessage';

export const CreateBarbershopPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState<CreateBarbershopData>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    let formattedValue = value;

    // Formatação automática do telefone
    if (name === 'phone') {
      formattedValue = barbershopService.formatPhone(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue,
    }));

    // Limpar erros quando o usuário começar a digitar
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar dados
    const errors = barbershopService.validateBarbershopData(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setValidationErrors([]);

      const barbershop = await barbershopService.create(formData);

      setSuccess('Barbearia criada com sucesso!');

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate(`/barbershops/${barbershop.id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar barbearia');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/barbershops');
  };

  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <button
          onClick={handleCancel}
          className='p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors'
        >
          <ArrowLeft className='w-5 h-5' />
        </button>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Nova Barbearia</h1>
          <p className='text-gray-600'>
            Preencha os dados para criar uma nova barbearia
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} />}
      {validationErrors.length > 0 && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <h3 className='text-sm font-medium text-red-800 mb-2'>
            Corrija os seguintes erros:
          </h3>
          <ul className='text-sm text-red-700 space-y-1'>
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className='bg-white rounded-lg shadow-md border border-gray-200'
      >
        <div className='p-6 space-y-6'>
          {/* Informações Básicas */}
          <div>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Informações Básicas
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='md:col-span-2'>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Nome da Barbearia *
                </label>
                <input
                  type='text'
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Ex: Barbearia do João'
                />
              </div>

              <div className='md:col-span-2'>
                <label
                  htmlFor='description'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Descrição
                </label>
                <textarea
                  id='description'
                  name='description'
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Descreva sua barbearia...'
                />
              </div>
            </div>
          </div>

          {/* Localização */}
          <div>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Localização
            </h2>
            <div>
              <label
                htmlFor='address'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                <MapPin className='w-4 h-4 inline mr-1' />
                Endereço Completo *
              </label>
              <input
                type='text'
                id='address'
                name='address'
                value={formData.address}
                onChange={handleInputChange}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Rua, número, bairro, cidade - CEP'
              />
            </div>
          </div>

          {/* Contato */}
          <div>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Contato
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label
                  htmlFor='phone'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  <Phone className='w-4 h-4 inline mr-1' />
                  Telefone *
                </label>
                <input
                  type='tel'
                  id='phone'
                  name='phone'
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='(11) 99999-9999'
                />
              </div>

              <div>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  <Mail className='w-4 h-4 inline mr-1' />
                  Email *
                </label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='contato@barbearia.com'
                />
              </div>

              <div className='md:col-span-2'>
                <label
                  htmlFor='website'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  <Globe className='w-4 h-4 inline mr-1' />
                  Website (opcional)
                </label>
                <input
                  type='url'
                  id='website'
                  name='website'
                  value={formData.website}
                  onChange={handleInputChange}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='https://www.barbearia.com'
                />
              </div>
            </div>
          </div>

          {/* Configurações */}
          <div>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>
              Configurações
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label
                  htmlFor='timezone'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Fuso Horário
                </label>
                <select
                  id='timezone'
                  name='timezone'
                  value={formData.timezone}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, timezone: e.target.value }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value='America/Sao_Paulo'>São Paulo (GMT-3)</option>
                  <option value='America/Manaus'>Manaus (GMT-4)</option>
                  <option value='America/Rio_Branco'>Rio Branco (GMT-5)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor='currency'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Moeda
                </label>
                <select
                  id='currency'
                  name='currency'
                  value={formData.currency}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, currency: e.target.value }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value='BRL'>Real Brasileiro (R$)</option>
                  <option value='USD'>Dólar Americano ($)</option>
                  <option value='EUR'>Euro (€)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end gap-3'>
          <button
            type='button'
            onClick={handleCancel}
            disabled={loading}
            className='px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50'
          >
            Cancelar
          </button>
          <button
            type='submit'
            disabled={loading}
            className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50'
          >
            {loading ? (
              <LoadingSpinner size='sm' className='mr-2' />
            ) : (
              <Save className='w-4 h-4 mr-2' />
            )}
            {loading ? 'Criando...' : 'Criar Barbearia'}
          </button>
        </div>
      </form>
    </div>
  );
};
