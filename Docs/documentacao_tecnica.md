# 📚 Documentação Técnica - Sistema SaaS Barbearias

## 🏗️ Arquitetura do Sistema

### Overview da Arquitetura
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Banco de      │
│   React.js      │◄──►│   Node.js       │◄──►│   Dados         │
│   TypeScript    │    │   Express       │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Stack Tecnológica

#### Frontend
- **Framework:** React.js 18+ com TypeScript
- **Styling:** Tailwind CSS + HeadlessUI
- **State Management:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod
- **Routing:** React Router DOM v6
- **Build:** Vite
- **Testing:** Vitest + React Testing Library + Playwright (E2E)

#### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js com TypeScript
- **ORM:** Prisma
- **Auth:** JWT + bcrypt
- **Validation:** Zod
- **Testing:** Jest + Supertest + Playwright (E2E)
- **Documentation:** Swagger/OpenAPI

#### Banco de Dados
- **Primary:** PostgreSQL 15+
- **Cache:** Redis (futuro)
- **File Storage:** AWS S3 ou similar

#### DevOps & Deploy
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Frontend Deploy:** Vercel
- **Backend Deploy:** Railway ou Render
- **Monitoring:** Sentry

## 🗂️ Estrutura de Pastas

```
saas_barber/
├── frontend/                  # React App
│   ├── public/
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   │   ├── ui/          # Componentes de UI base
│   │   │   ├── forms/       # Componentes de formulário
│   │   │   └── layout/      # Componentes de layout
│   │   ├── pages/           # Páginas da aplicação
│   │   │   ├── auth/        # Login, registro, etc.
│   │   │   ├── client/      # Área do cliente
│   │   │   ├── barber/      # Área do barbeiro
│   │   │   ├── admin/       # Área administrativa
│   │   │   └── public/      # Páginas públicas
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API calls
│   │   ├── contexts/        # React contexts
│   │   ├── utils/           # Utilitários
│   │   ├── types/           # TypeScript types
│   │   └── constants/       # Constantes
│   ├── tests/               # Testes E2E Playwright
│   ├── package.json
│   └── vite.config.ts
├── backend/                   # Node.js API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utilitários
│   │   ├── config/          # Configurações
│   │   └── types/           # TypeScript types
│   ├── prisma/              # Prisma schema e migrations
│   ├── tests/               # Testes unitários e integração
│   ├── e2e/                 # Testes E2E Playwright compartilhados
│   ├── package.json
│   └── tsconfig.json
├── docs/                      # Documentação
├── docker-compose.yml         # Docker para desenvolvimento
├── playwright.config.ts       # Configuração Playwright
└── README.md
```

## 💾 Modelo de Dados (Prisma Schema) - ATUALIZADO

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role     @default(CLIENT)
  name      String
  phone     String?
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  barbershop   Barbershop? @relation("BarbershopOwner")
  barberProfile Barber?
  clientProfile Client?
  appointments  Appointment[]

  @@map("users")
}

model Barbershop {
  id          String  @id @default(cuid())
  name        String
  description String?
  address     String
  phone       String
  email       String
  website     String?
  logo        String?
  
  // Configurações
  timezone    String  @default("America/Sao_Paulo")
  currency    String  @default("BRL")
  
  // Relacionamentos
  ownerId     String  @unique
  owner       User    @relation("BarbershopOwner", fields: [ownerId], references: [id])
  
  barbers     Barber[]
  services    Service[]
  appointments Appointment[]
  schedules   GlobalSchedule[]
  exceptions  GlobalException[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("barbershops")
}

model Barber {
  id           String     @id @default(cuid())
  userId       String     @unique
  barbershopId String
  
  // Informações profissionais
  description  String?
  experience   Int?       // anos de experiência
  specialties  String[]   // especialidades
  
  // Status
  isActive     Boolean    @default(true)
  
  // Relacionamentos
  user         User       @relation(fields: [userId], references: [id])
  barbershop   Barbershop @relation(fields: [barbershopId], references: [id])
  
  schedules    BarberSchedule[]
  exceptions   BarberException[]
  appointments Appointment[]
  services     BarberService[]  // NOVO: serviços que executa
  
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@map("barbers")
}

model Client {
  id        String   @id @default(cuid())
  userId    String   @unique
  
  // Informações adicionais
  birthDate DateTime?
  gender    Gender?
  notes     String?   // notas do barbeiro sobre o cliente
  
  // Relacionamentos
  user         User          @relation(fields: [userId], references: [id])
  appointments Appointment[]
  
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@map("clients")
}

model Service {
  id           String     @id @default(cuid())
  barbershopId String
  name         String
  description  String?
  duration     Int        // em minutos
  price        Decimal    @db.Decimal(10, 2)  // preço base
  
  // Configurações
  isActive     Boolean    @default(true)
  category     String?    // "Corte", "Barba", "Tratamento", etc.
  
  // Relacionamentos
  barbershop   Barbershop @relation(fields: [barbershopId], references: [id])
  appointments Appointment[]
  barberServices BarberService[]  // NOVO: barbeiros que executam
  
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@map("services")
}

// NOVO: Relacionamento entre Barbeiro e Serviços
model BarberService {
  id          String  @id @default(cuid())
  barberId    String
  serviceId   String
  
  // Configurações específicas
  customPrice Decimal? @db.Decimal(10, 2)  // preço específico do barbeiro
  isActive    Boolean  @default(true)
  
  // Relacionamentos
  barber      Barber   @relation(fields: [barberId], references: [id], onDelete: Cascade)
  service     Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([barberId, serviceId])
  @@map("barber_services")
}

model Appointment {
  id           String            @id @default(cuid())
  barbershopId String
  barberId     String
  clientId     String
  serviceId    String
  
  // Horários
  startTime    DateTime
  endTime      DateTime
  
  // Status e informações
  status       AppointmentStatus @default(SCHEDULED)
  notes        String?
  totalPrice   Decimal           @db.Decimal(10, 2)
  
  // Relacionamentos
  barbershop   Barbershop @relation(fields: [barbershopId], references: [id])
  barber       Barber     @relation(fields: [barberId], references: [id])
  client       User       @relation(fields: [clientId], references: [id])
  service      Service    @relation(fields: [serviceId], references: [id])
  
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@map("appointments")
}

model GlobalSchedule {
  id           String     @id @default(cuid())
  barbershopId String
  dayOfWeek    Int        // 0 = domingo, 1 = segunda, etc.
  
  isOpen       Boolean    @default(true)
  openTime     String     // "09:00"
  closeTime    String     // "18:00"
  
  // Intervalo (almoço)
  lunchStart   String?    // "12:00"
  lunchEnd     String?    // "13:00"
  
  // Relacionamentos
  barbershop   Barbershop @relation(fields: [barbershopId], references: [id])
  
  @@unique([barbershopId, dayOfWeek])
  @@map("global_schedules")
}

model BarberSchedule {
  id        String  @id @default(cuid())
  barberId  String
  dayOfWeek Int     // 0 = domingo, 1 = segunda, etc.
  
  isWorking Boolean @default(true)
  startTime String  // "09:00" - PODE ser anterior ao global
  endTime   String  // "17:00" - PODE ser posterior ao global
  
  // Intervalo pessoal
  breakStart String? // "14:00"
  breakEnd   String? // "15:00"
  
  // Relacionamentos
  barber    Barber  @relation(fields: [barberId], references: [id])
  
  @@unique([barberId, dayOfWeek])
  @@map("barber_schedules")
}

model GlobalException {
  id           String        @id @default(cuid())
  barbershopId String
  date         DateTime      @db.Date
  type         ExceptionType
  reason       String
  
  // Para SPECIAL_HOURS
  specialOpenTime  String?
  specialCloseTime String?
  
  // Relacionamentos
  barbershop   Barbershop @relation(fields: [barbershopId], references: [id])
  
  @@unique([barbershopId, date])
  @@map("global_exceptions")
}

model BarberException {
  id       String        @id @default(cuid())
  barberId String
  date     DateTime      @db.Date
  type     ExceptionType
  reason   String
  
  // Para SPECIAL_HOURS ou AVAILABLE
  specialStartTime String?
  specialEndTime   String?
  
  // Relacionamentos
  barber   Barber @relation(fields: [barberId], references: [id])
  
  @@unique([barberId, date])
  @@map("barber_exceptions")
}

// Enums
enum Role {
  SUPER_ADMIN
  ADMIN
  BARBER
  CLIENT
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum ExceptionType {
  CLOSED      // Fechado
  OFF         // Folga (para barbeiro)
  SPECIAL_HOURS // Horário especial
  VACATION    // Férias
  AVAILABLE   // NOVO: Disponível (mesmo com barbearia fechada)
}
```

## 🔐 Sistema de Autenticação (sem mudanças)

### JWT Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  barbershopId?: string; // para admins e barbeiros
  barberId?: string;     // para barbeiros
  iat: number;
  exp: number;
}
```

## 🛣️ API Endpoints - ATUALIZADO

### Autenticação
```
POST   /api/auth/register    # Registro de usuário
POST   /api/auth/login       # Login
POST   /api/auth/refresh     # Refresh token
POST   /api/auth/logout      # Logout
POST   /api/auth/forgot      # Esqueci a senha
POST   /api/auth/reset       # Reset senha
```

### Usuários
```
GET    /api/users/me         # Perfil do usuário logado
PUT    /api/users/me         # Atualizar perfil
GET    /api/users            # Listar usuários (admin)
PUT    /api/users/:id        # Atualizar usuário (admin)
DELETE /api/users/:id        # Deletar usuário (admin)
```

### Barbearias
```
GET    /api/barbershops      # Listar barbearias
POST   /api/barbershops      # Criar barbearia
GET    /api/barbershops/:id  # Obter barbearia
PUT    /api/barbershops/:id  # Atualizar barbearia
DELETE /api/barbershops/:id  # Deletar barbearia
```

### Serviços - NOVOS ENDPOINTS
```
GET    /api/services                           # Listar serviços da barbearia
POST   /api/services                           # Criar serviço
GET    /api/services/:id                       # Obter serviço
PUT    /api/services/:id                       # Atualizar serviço
DELETE /api/services/:id                       # Deletar serviço

GET    /api/services/by-barber/:barberId       # Serviços de um barbeiro
POST   /api/services/assign-barber             # Atribuir serviço a barbeiro
DELETE /api/services/remove-barber             # Remover serviço de barbeiro
PUT    /api/services/barber-price              # Atualizar preço específico
```

### Barbeiros - ENDPOINTS ATUALIZADOS
```
GET    /api/barbers                            # Listar barbeiros
POST   /api/barbers                            # Criar barbeiro
GET    /api/barbers/:id                        # Obter barbeiro
PUT    /api/barbers/:id                        # Atualizar barbeiro
DELETE /api/barbers/:id                        # Deletar barbeiro

GET    /api/barbers/by-service/:serviceId      # Barbeiros que executam serviço
GET    /api/barbers/:id/services               # Serviços do barbeiro
PUT    /api/barbers/:id/services               # Atualizar serviços do barbeiro
```

### Agendamentos - ENDPOINTS ATUALIZADOS
```
GET    /api/appointments                       # Listar agendamentos
POST   /api/appointments                       # Criar agendamento
GET    /api/appointments/:id                   # Obter agendamento
PUT    /api/appointments/:id                   # Atualizar agendamento
DELETE /api/appointments/:id                   # Cancelar agendamento

GET    /api/appointments/available-slots       # Horários disponíveis por serviço
GET    /api/appointments/barber/:barberId      # Agendamentos do barbeiro
GET    /api/appointments/service/:serviceId    # Agendamentos por serviço
```

### Horários
```
GET    /api/schedules/global/:barbershopId     # Horários globais
PUT    /api/schedules/global/:barbershopId     # Atualizar horários globais
GET    /api/schedules/barber/:barberId         # Horários do barbeiro
PUT    /api/schedules/barber/:barberId         # Atualizar horários do barbeiro
```

## 🎨 Componentes Frontend - ATUALIZADOS

### Estrutura de Componentes
```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// components/forms/AppointmentForm.tsx
interface AppointmentFormProps {
  barbershopId: string;
  onSubmit: (data: AppointmentData) => void;
  initialData?: Partial<AppointmentData>;
  preSelectedService?: string; // NOVO
}

// components/services/ServiceBarberSelector.tsx
interface ServiceBarberSelectorProps {
  serviceId: string;
  selectedBarberId?: string;
  onBarberSelect: (barberId: string) => void;
  showPrices?: boolean;
}

// components/barber/BarberServiceManager.tsx
interface BarberServiceManagerProps {
  barberId: string;
  onServicesUpdate: (services: BarberService[]) => void;
}

// components/calendar/Calendar.tsx
interface CalendarProps {
  appointments: Appointment[];
  onDateSelect: (date: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  view: 'month' | 'week' | 'day';
  filterByBarber?: string; // NOVO
  filterByService?: string; // NOVO
}
```

## 🧪 Estratégia de Testes - MIGRAÇÃO PARA PLAYWRIGHT

### Por que Playwright em vez de Cypress?

**Vantagens do Playwright:**
- ✅ **Multi-browser nativo** (Chrome, Firefox, Safari, Edge)
- ✅ **Melhor performance** e velocidade de execução
- ✅ **Auto-wait inteligente** reduz flakiness
- ✅ **Paralellização nativa** com isolamento completo
- ✅ **Debugging avançado** com traces e screenshots
- ✅ **API mais moderna** e TypeScript nativo
- ✅ **Mobile testing** integrado
- ✅ **Network interception** mais robusta

### Configuração Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Backend Tests (Jest)
```typescript
// tests/appointments.test.ts
describe('Appointments API', () => {
  describe('POST /api/appointments', () => {
    it('should create appointment with valid barber service', async () => {
      // Setup: Create barber with specific service
      const barber = await createTestBarber();
      const service = await createTestService();
      await assignServiceToBarber(barber.id, service.id);
      
      const appointmentData = {
        barberId: barber.id,
        serviceId: service.id,
        startTime: '2024-01-20T10:00:00Z'
      };
      
      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(appointmentData)
        .expect(201);
        
      expect(response.body.id).toBeDefined();
    });
    
    it('should reject appointment if barber does not execute service', async () => {
      const barber = await createTestBarber();
      const service = await createTestService();
      // NOT assigning service to barber
      
      const appointmentData = {
        barberId: barber.id,
        serviceId: service.id,
        startTime: '2024-01-20T10:00:00Z'
      };
      
      await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(appointmentData)
        .expect(400);
    });
  });
});
```

### Frontend Tests (Playwright E2E)
```typescript
// e2e/appointment-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Appointment Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data
    await page.goto('/');
    await loginAsClient(page);
  });

  test('should book appointment with specific barber service', async ({ page }) => {
    // Navigate to booking
    await page.click('[data-testid="book-appointment"]');
    
    // Select service
    await page.selectOption('[data-testid="service-select"]', 'haircut');
    
    // Verify only barbers who do haircuts are shown
    const barberOptions = page.locator('[data-testid="barber-option"]');
    await expect(barberOptions).toHaveCount(2); // Assuming 2 barbers do haircuts
    
    // Select barber
    await page.click('[data-testid="barber-option-1"]');
    
    // Select date and time
    await page.click('[data-testid="calendar-date-20"]');
    await page.click('[data-testid="time-slot-10-00"]');
    
    // Confirm booking
    await page.click('[data-testid="confirm-booking"]');
    
    // Verify success
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
    
    // Verify appointment appears in user's appointments
    await page.goto('/my-appointments');
    await expect(page.locator('[data-testid="appointment-item"]')).toHaveCount(1);
  });

  test('should show no barbers for service not offered', async ({ page }) => {
    await page.goto('/book');
    
    // Select service that no barber offers
    await page.selectOption('[data-testid="service-select"]', 'massage');
    
    // Should show no available barbers
    await expect(page.locator('[data-testid="no-barbers-message"]')).toBeVisible();
  });
});

// e2e/barber-schedule.spec.ts
test.describe('Barber Independent Schedule', () => {
  test('barber can work outside barbershop hours', async ({ page }) => {
    await loginAsBarber(page);
    await page.goto('/barber/schedule');
    
    // Set barber hours outside barbershop hours
    // Barbershop: 9AM-6PM, Barber: 7AM-8PM
    await page.fill('[data-testid="start-time"]', '07:00');
    await page.fill('[data-testid="end-time"]', '20:00');
    await page.click('[data-testid="save-schedule"]');
    
    // Verify client can book at 7AM
    await loginAsClient(page);
    await page.goto('/book');
    await page.selectOption('[data-testid="service-select"]', 'haircut');
    await page.click('[data-testid="barber-option-1"]');
    
    // Should see 7AM slot available
    const sevenAmSlot = page.locator('[data-testid="time-slot-07-00"]');
    await expect(sevenAmSlot).toBeVisible();
    await expect(sevenAmSlot).not.toBeDisabled();
  });
});
```

### Component Tests (React Testing Library)
```typescript
// components/__tests__/ServiceBarberSelector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceBarberSelector } from '../ServiceBarberSelector';

const mockBarbers = [
  { id: '1', name: 'João', price: 30 },
  { id: '2', name: 'Maria', price: 35 }
];

describe('ServiceBarberSelector', () => {
  it('should show only barbers who execute the service', async () => {
    render(
      <ServiceBarberSelector 
        serviceId="haircut"
        onBarberSelect={jest.fn()}
        showPrices={true}
      />
    );
    
    // Should show barbers with prices
    expect(screen.getByText('João - R$ 30,00')).toBeInTheDocument();
    expect(screen.getByText('Maria - R$ 35,00')).toBeInTheDocument();
  });
});
```

## 🚀 Deploy e DevOps - ATUALIZADO

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test
      
      - name: Install Playwright
        run: npx playwright install
      
      - name: Run E2E tests
        run: npx playwright test
        
      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: railway deploy
```

## 📊 Monitoramento e Logs - ATUALIZADO

### Estrutura de Logs
```typescript
// utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log específico para serviços por barbeiro
export const logBarberServiceAction = (action: string, barberId: string, serviceId: string) => {
  logger.info('Barber service action', {
    action,
    barberId,
    serviceId,
    timestamp: new Date()
  });
};

export { logger };
```

---

**Última Atualização:** 2024-12-19  
**Versão:** 2.0.0 - Serviços por Barbeiro + Playwright  
**Responsável:** Diego (Desenvolvedor Júnior)