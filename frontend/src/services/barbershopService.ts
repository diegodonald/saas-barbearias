import { api } from './api';

export interface Barbershop {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  timezone: string;
  currency: string;
  ownerId: string;
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
  updatedAt: string;
}

export interface CreateBarbershopData {
  name: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  timezone?: string;
  currency?: string;
}

export interface UpdateBarbershopData {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone?: string;
  currency?: string;
}

export interface BarbershopFilters {
  search?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
}

export interface BarbershopListResponse {
  data: Barbershop[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

class BarbershopService {
  /**
   * Listar barbearias
   */
  async list(filters: BarbershopFilters = {}): Promise<BarbershopListResponse> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.ownerId) params.append('ownerId', filters.ownerId);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<ApiResponse<Barbershop[]> & { pagination: any }>(
      `/barbershops?${params.toString()}`
    );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Buscar barbearia por ID
   */
  async getById(id: string, includeDetails = false): Promise<Barbershop> {
    const params = includeDetails ? '?includeDetails=true' : '';
    const response = await api.get<ApiResponse<Barbershop>>(`/barbershops/${id}${params}`);
    return response.data.data;
  }

  /**
   * Criar nova barbearia
   */
  async create(data: CreateBarbershopData): Promise<Barbershop> {
    const response = await api.post<ApiResponse<Barbershop>>('/barbershops', data);
    return response.data.data;
  }

  /**
   * Atualizar barbearia
   */
  async update(id: string, data: UpdateBarbershopData): Promise<Barbershop> {
    const response = await api.put<ApiResponse<Barbershop>>(`/barbershops/${id}`, data);
    return response.data.data;
  }

  /**
   * Deletar barbearia
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/barbershops/${id}`);
  }

  /**
   * Validar dados de barbearia
   */
  validateBarbershopData(data: CreateBarbershopData | UpdateBarbershopData): string[] {
    const errors: string[] = [];

    if ('name' in data && data.name !== undefined) {
      if (!data.name || data.name.trim().length < 2) {
        errors.push('Nome deve ter pelo menos 2 caracteres');
      }
      if (data.name.length > 100) {
        errors.push('Nome deve ter no máximo 100 caracteres');
      }
    }

    if ('address' in data && data.address !== undefined) {
      if (!data.address || data.address.trim().length < 10) {
        errors.push('Endereço deve ter pelo menos 10 caracteres');
      }
    }

    if ('phone' in data && data.phone !== undefined) {
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!data.phone || !phoneRegex.test(data.phone)) {
        errors.push('Telefone deve estar no formato (XX) XXXXX-XXXX');
      }
    }

    if ('email' in data && data.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!data.email || !emailRegex.test(data.email)) {
        errors.push('Email deve ter um formato válido');
      }
    }

    if ('website' in data && data.website !== undefined && data.website) {
      try {
        new URL(data.website);
      } catch {
        errors.push('Website deve ser uma URL válida');
      }
    }

    if ('description' in data && data.description !== undefined && data.description) {
      if (data.description.length > 500) {
        errors.push('Descrição deve ter no máximo 500 caracteres');
      }
    }

    return errors;
  }

  /**
   * Formatar telefone
   */
  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone;
  }

  /**
   * Formatar endereço para exibição
   */
  formatAddress(address: string): string {
    return address.trim().replace(/\s+/g, ' ');
  }

  /**
   * Gerar slug para URL amigável
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
  }

  /**
   * Verificar se usuário pode editar barbearia
   */
  canEditBarbershop(barbershop: Barbershop, userId?: string, userRole?: string): boolean {
    if (!userId) return false;
    
    return userRole === 'SUPER_ADMIN' || barbershop.ownerId === userId;
  }

  /**
   * Verificar se usuário pode deletar barbearia
   */
  canDeleteBarbershop(barbershop: Barbershop, userId?: string, userRole?: string): boolean {
    if (!userId) return false;
    
    return userRole === 'SUPER_ADMIN' || barbershop.ownerId === userId;
  }

  /**
   * Obter estatísticas da barbearia
   */
  getBarbershopStats(barbershop: Barbershop) {
    return {
      barbers: barbershop._count.barbers,
      services: barbershop._count.services,
      appointments: barbershop._count.appointments,
      isActive: barbershop._count.barbers > 0,
    };
  }

  /**
   * Formatar data de criação
   */
  formatCreatedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Obter horário de funcionamento padrão
   */
  getDefaultWorkingHours() {
    return {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '08:00', close: '16:00', closed: false },
      sunday: { open: '08:00', close: '12:00', closed: true },
    };
  }

  /**
   * Validar horário de funcionamento
   */
  validateWorkingHours(hours: any): string[] {
    const errors: string[] = [];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach(day => {
      if (hours[day] && !hours[day].closed) {
        if (!hours[day].open || !hours[day].close) {
          errors.push(`Horário de ${day} deve ter abertura e fechamento definidos`);
        } else if (hours[day].open >= hours[day].close) {
          errors.push(`Horário de abertura deve ser anterior ao fechamento em ${day}`);
        }
      }
    });
    
    return errors;
  }
}

export const barbershopService = new BarbershopService();
