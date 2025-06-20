# 🕐 Regras Rigorosas do Sistema de Agendamento

## 📋 Visão Geral

O sistema de agendamento deve ser **extremamente rigoroso** para evitar conflitos, overlapping e problemas operacionais, já que os próprios clientes farão os agendamentos diretamente.

**IMPORTANTE:** Horários e exceções individuais dos barbeiros têm **PRIORIDADE TOTAL** sobre configurações globais.

## 🏢 Horários Globais (Barbearia)

### Definição
- **Horário Global:** Horário de funcionamento geral da barbearia
- Define horário padrão quando barbeiros não têm configuração individual
- Serve como **fallback** quando barbeiro não tem horário específico

### Configuração
```typescript
interface GlobalSchedule {
  dayOfWeek: number; // 0 = domingo, 1 = segunda, etc.
  isOpen: boolean;
  openTime: string; // "09:00"
  closeTime: string; // "18:00"
  lunchStart?: string; // "12:00"
  lunchEnd?: string; // "13:00"
}
```

### Regras
- ✅ Serve como base para barbeiros sem configuração individual
- ✅ Barbeiros podem exceder completamente os horários globais
- ✅ Aplicado apenas quando barbeiro não tem horário específico
- ✅ Intervalos globais aplicam apenas se barbeiro não tem configuração própria

## 👨‍💼 Horários Individuais (Barbeiros)

### Definição
- **Horário Individual:** Horário específico de cada barbeiro
- **TEM PRIORIDADE ABSOLUTA** sobre horários globais
- Barbeiro pode trabalhar **independente** do horário da barbearia

### Configuração
```typescript
interface BarberSchedule {
  barberId: string;
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string; // PODE ser anterior ao horário global
  endTime: string; // PODE ser posterior ao horário global
  breakStart?: string; // intervalo pessoal
  breakEnd?: string;
}
```

### Regras - ATUALIZADAS
- ✅ Horário individual **SEMPRE** prevalece sobre global
- ✅ Barbeiro **PODE** trabalhar antes do horário global
- ✅ Barbeiro **PODE** trabalhar depois do horário global
- ✅ Barbeiro **PODE** trabalhar quando barbearia está "fechada"
- ✅ Se barbeiro tem intervalo, não pode atender neste período
- ✅ Apenas conflitos com outros agendamentos do mesmo barbeiro são considerados

## 🛠️ Serviços por Barbeiro

### Definição
- Cada barbeiro pode executar apenas **serviços específicos**
- Cliente só pode agendar serviços que o barbeiro executa
- Barbeiros podem ter especializações diferentes

### Configuração
```typescript
interface BarberService {
  id: string;
  barberId: string;
  serviceId: string;
  customPrice?: Decimal; // preço específico deste barbeiro
  isActive: boolean;
  createdAt: DateTime;
}

interface ServiceAvailability {
  serviceId: string;
  serviceName: string;
  availableBarbers: {
    barberId: string;
    barberName: string;
    price: Decimal;
  }[];
}
```

### Regras de Serviços
- ✅ Barbeiro só pode atender serviços cadastrados para ele
- ✅ Cliente só vê barbeiros que executam o serviço escolhido
- ✅ Cada barbeiro pode ter preço diferente para o mesmo serviço
- ✅ Admin pode ativar/desativar serviços por barbeiro
- ❌ Não é possível agendar serviço que barbeiro não executa

## 🚫 Sistema de Exceções

### Exceções Globais
Aplicam-se apenas quando barbeiro **NÃO tem exceção individual**:
```typescript
interface GlobalException {
  id: string;
  date: Date;
  type: 'CLOSED' | 'SPECIAL_HOURS';
  reason: string; // "Feriado", "Reforma", etc.
  specialOpenTime?: string; // se type === 'SPECIAL_HOURS'
  specialCloseTime?: string;
}
```

### Exceções Individuais
**SEMPRE** prevalecem sobre exceções globais:
```typescript
interface BarberException {
  id: string;
  barberId: string;
  date: Date;
  type: 'OFF' | 'SPECIAL_HOURS' | 'VACATION' | 'AVAILABLE';
  reason: string; // "Férias", "Atestado", "Atendimento especial", etc.
  specialStartTime?: string;
  specialEndTime?: string;
}
```

### Ordem de Precedência - ATUALIZADA
1. **Exceção Individual** (PRIORIDADE ABSOLUTA)
2. **Horário Individual** (se não há exceção individual)
3. **Exceção Global** (apenas se não há configuração individual)
4. **Horário Global** (apenas como fallback)

### Exemplos de Precedência - ATUALIZADOS

**Caso 1: Barbeiro trabalha mesmo com barbearia fechada**
- Global: Barbearia fechada (domingo)
- Horário Individual: João trabalha domingo 8h-12h
- **Resultado:** João pode atender domingo 8h-12h

**Caso 2: Exceção individual prevalece sobre global**
- Global: Barbearia fechada (feriado)
- Exceção Global: Fechado
- Exceção Individual: João disponível 14h-18h
- **Resultado:** João pode atender 14h-18h (exceção individual prevalece)

**Caso 3: Barbeiro estende horário**
- Global: Barbearia 9h-18h
- Horário Individual: Maria 7h-20h
- **Resultado:** Maria pode atender 7h-20h (horário individual prevalece)

## ⏱️ Validações Rigorosas de Agendamento - ATUALIZADAS

### 1. Validação de Horário Base
```typescript
function validateBaseSchedule(
  dateTime: Date, 
  barberId: string, 
  serviceId: string
): boolean {
  // 1. Verificar se é horário futuro
  if (dateTime <= new Date()) return false;
  
  // 2. Verificar se barbeiro executa o serviço
  if (!barberExecutesService(barberId, serviceId)) return false;
  
  // 3. Verificar exceções individuais PRIMEIRO (prioridade absoluta)
  const barberException = getBarberException(barberId, dateTime);
  if (barberException) {
    if (barberException.type === 'OFF' || barberException.type === 'VACATION') {
      return false;
    }
    if (barberException.type === 'SPECIAL_HOURS' || barberException.type === 'AVAILABLE') {
      return isWithinExceptionHours(dateTime, barberException);
    }
  }
  
  // 4. Verificar horário individual do barbeiro
  const barberSchedule = getBarberSchedule(barberId, dateTime);
  if (barberSchedule) {
    if (!barberSchedule.isWorking) return false;
    return isWithinBarberHours(dateTime, barberSchedule);
  }
  
  // 5. APENAS se não há configuração individual, verificar global
  const globalException = getGlobalException(dateTime);
  if (globalException) {
    if (globalException.type === 'CLOSED') return false;
    if (globalException.type === 'SPECIAL_HOURS') {
      return isWithinExceptionHours(dateTime, globalException);
    }
  }
  
  // 6. Fallback para horário global
  const globalSchedule = getGlobalSchedule(dateTime);
  if (!globalSchedule.isOpen) return false;
  return isWithinGlobalHours(dateTime, globalSchedule);
}
```

### 2. Validação de Serviço por Barbeiro
```typescript
function barberExecutesService(barberId: string, serviceId: string): boolean {
  const barberServices = getBarberServices(barberId);
  return barberServices.some(bs => 
    bs.serviceId === serviceId && bs.isActive
  );
}

function getAvailableBarbersForService(serviceId: string): Barber[] {
  return barbers.filter(barber => 
    barber.isActive && barberExecutesService(barber.id, serviceId)
  );
}
```

### 3. Validação de Conflito de Agendamentos (sem mudanças)
```typescript
function validateAppointmentConflict(
  startTime: Date,
  endTime: Date,
  barberId: string,
  excludeAppointmentId?: string
): boolean {
  const existingAppointments = getBarberAppointments(barberId, startTime.getDate());
  
  for (const appointment of existingAppointments) {
    if (appointment.id === excludeAppointmentId) continue;
    
    // Verificar overlapping
    const appointmentStart = appointment.startTime;
    const appointmentEnd = appointment.endTime;
    
    // Conflito se: (inicio < fim_existente) E (fim > inicio_existente)
    if (startTime < appointmentEnd && endTime > appointmentStart) {
      return false; // Conflito detectado
    }
  }
  
  return true; // Sem conflitos
}
```

## 🎯 Geração de Slots Disponíveis - ATUALIZADA

### Algoritmo de Geração
```typescript
function generateAvailableSlots(
  serviceId: string,
  date: Date,
  barberId?: string // opcional, se não informado busca todos
): BarberTimeSlot[] {
  const service = getService(serviceId);
  const serviceDuration = service.duration; // em minutos
  
  // 1. Obter barbeiros que executam o serviço
  const availableBarbers = barberId 
    ? [getBarber(barberId)] 
    : getAvailableBarbersForService(serviceId);
  
  const allSlots: BarberTimeSlot[] = [];
  
  for (const barber of availableBarbers) {
    // 2. Obter horários válidos para o barbeiro específico
    const workingHours = getValidWorkingHours(barber.id, date);
    if (!workingHours) continue;
    
    // 3. Obter agendamentos existentes do barbeiro
    const existingAppointments = getBarberAppointments(barber.id, date);
    
    // 4. Gerar slots possíveis (intervalo de 30min)
    const barberSlots = generateAllPossibleSlots(workingHours, 30);
    
    // 5. Filtrar slots que conflitam com agendamentos
    const availableSlots = barberSlots.filter(slot => {
      const slotEnd = new Date(slot.start.getTime() + serviceDuration * 60000);
      
      // Verificar se o slot + duração do serviço cabe no horário
      if (slotEnd > workingHours.end) return false;
      
      // Verificar conflitos com agendamentos existentes
      return !existingAppointments.some(appointment => 
        slot.start < appointment.endTime && slotEnd > appointment.startTime
      );
    });
    
    // 6. Adicionar informações do barbeiro aos slots
    allSlots.push(...availableSlots.map(slot => ({
      ...slot,
      barberId: barber.id,
      barberName: barber.user.name,
      price: getServicePriceForBarber(serviceId, barber.id)
    })));
  }
  
  return allSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
}
```

## 🔒 Validações Específicas por Situação - ATUALIZADAS

### Para Clientes (Self-Booking)
- ✅ Só pode agendar horários futuros (mínimo 1h de antecedência)
- ✅ Só pode ver barbeiros que executam o serviço escolhido
- ✅ Só pode agendar em slots disponíveis do barbeiro
- ✅ Não pode agendar em horários de intervalo do barbeiro
- ✅ Pode agendar mesmo fora do horário "global" da barbearia
- ✅ Um cliente por vez por barbeiro

### Para Barbeiros
- ✅ Pode ver agenda completa
- ✅ Pode marcar exceções pessoais (inclusive trabalhar fora do horário global)
- ✅ Pode cancelar agendamentos com justificativa
- ✅ Pode configurar horários independente da barbearia
- ✅ Pode definir quais serviços executa
- ❌ Não pode alterar horários globais

### Para Administradores
- ✅ Pode sobrescrever qualquer regra (com confirmação)
- ✅ Pode criar exceções globais e individuais
- ✅ Pode ajustar horários de qualquer barbeiro
- ✅ Pode definir serviços por barbeiro
- ✅ Pode marcar agendamentos administrativos

## 🚨 Tratamento de Erros - ATUALIZADO

### Mensagens de Erro Específicas
```typescript
enum AppointmentError {
  PAST_TIME = "Não é possível agendar para horários passados",
  BARBER_NOT_WORKING = "Barbeiro não trabalha neste horário",
  TIME_CONFLICT = "Horário já ocupado",
  SERVICE_TOO_LONG = "Serviço não cabe no horário disponível",
  BARBER_ON_VACATION = "Barbeiro em férias nesta data",
  INVALID_SERVICE = "Serviço não disponível para este barbeiro",
  SERVICE_NOT_OFFERED = "Este barbeiro não executa este serviço",
  BARBER_UNAVAILABLE = "Barbeiro não disponível nesta data"
}
```

## 📊 Logs e Auditoria (sem mudanças)

### Eventos a serem Logados
- ✅ Tentativas de agendamento (sucesso/falha)
- ✅ Cancelamentos e motivos
- ✅ Alterações de horários (barbeiro/admin)
- ✅ Criação de exceções
- ✅ Conflitos detectados e resolvidos
- ✅ Alterações em serviços por barbeiro

### Formato do Log
```typescript
interface AppointmentLog {
  timestamp: Date;
  action: 'CREATE' | 'UPDATE' | 'CANCEL' | 'CONFLICT' | 'SERVICE_CHANGE';
  userId: string;
  barberId: string;
  appointmentId?: string;
  serviceId?: string;
  details: any;
  ipAddress: string;
}
```

---

**Princípios Fundamentais Atualizados:** 
> 1. "Horários individuais têm prioridade absoluta sobre configurações globais"
> 2. "Barbeiros podem trabalhar independente do funcionamento da barbearia"
> 3. "Apenas barbeiros habilitados podem executar serviços específicos"
> 4. "É melhor rejeitar um agendamento inválido do que aceitar um válido"

O sistema deve ser **conservador** nas validações mas **flexível** nos horários individuais.