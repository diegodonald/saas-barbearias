# Plano de Desenvolvimento - Sistema SaaS para Barbearias

## 📋 Visão Geral do Projeto

**Nome:** Sistema SaaS para Barbearias/Salões  
**Objetivo:** Desenvolver uma plataforma completa de gestão e agendamento online para barbearias, salões de beleza e estúdios de tatuagem.

**ATUALIZAÇÕES PRINCIPAIS:**
- ✅ Horários individuais têm **prioridade absoluta** sobre globais
- ✅ Barbeiros podem trabalhar **fora do horário da barbearia**
- ✅ Sistema de **serviços específicos por barbeiro**
- ✅ Migração para **Playwright** para testes E2E

## 🎯 Funcionalidades Principais

### 1. Site Institucional
- ✅ Página inicial moderna e responsiva
- ✅ Blog para marketing de conteúdo
- ✅ Sobre nós / Equipe
- ✅ **Showcase de serviços e barbeiros**
- ✅ Agendamento online para clientes
- ✅ Contato e localização

### 2. Sistema de Agendamento **ATUALIZADO**
- ✅ Agendamento online pelos clientes
- ✅ **Fluxo: Serviço → Barbeiro → Horário**
- ✅ Horários globais (funcionamento geral)
- ✅ **Horários individuais com prioridade absoluta**
- ✅ **Barbeiros podem exceder horários globais**
- ✅ Intervalos personalizáveis
- ✅ Sistema de exceções (global e individual)
- ✅ **Exceções individuais sempre prevalecem**
- ✅ Validação rigorosa de conflitos
- ✅ Prevenção de overlapping de horários

### 3. Sistema de Serviços por Barbeiro **NOVO**
- ✅ **Cada barbeiro executa serviços específicos**
- ✅ **Clientes só veem barbeiros que fazem o serviço escolhido**
- ✅ **Preços específicos por barbeiro**
- ✅ **Validação: não pode agendar serviço que barbeiro não faz**
- ✅ **Interface de gestão de serviços por barbeiro**
- ✅ **Relatórios por serviço/barbeiro**

### 4. Sistema de Roles
- ✅ SuperAdmin (desenvolvedor)
- ✅ Admin (donos da barbearia)
- ✅ Barber (barbeiros)
- ✅ User (clientes)

### 5. Dashboard Completo
- ✅ Dashboard administrativo com métricas
- ✅ **Dashboard barbeiro com gestão de serviços**
- ✅ Dashboard cliente com histórico
- ✅ **Relatórios detalhados por barbeiro/serviço**
- ✅ Calendário visual integrado

## 🏗️ Arquitetura Técnica **ATUALIZADA**

### Stack Principal
- **Frontend:** React.js + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Banco:** PostgreSQL + Prisma ORM
- **Auth:** JWT + bcrypt
- **Testes:** Jest + Vitest + **Playwright** (E2E)
- **Deploy:** Vercel (Frontend) + Railway (Backend)

### Mudanças Importantes
- ✅ **Migração de Cypress para Playwright**
- ✅ **Novo modelo BarberService no banco**
- ✅ **Lógica de precedência de horários reformulada**
- ✅ **Validações mais rigorosas**

## 🗂️ Estrutura de Precedência **ATUALIZADA**

### Ordem de Prioridade (da maior para menor):
1. **Exceção Individual do Barbeiro** (ABSOLUTA)
2. **Horário Individual do Barbeiro**
3. **Exceção Global da Barbearia**
4. **Horário Global da Barbearia** (apenas fallback)

### Regras Fundamentais:
- ✅ Barbeiro pode trabalhar **antes** do horário da barbearia
- ✅ Barbeiro pode trabalhar **depois** do horário da barbearia
- ✅ Barbeiro pode trabalhar **quando barbearia está fechada**
- ✅ Barbeiro só pode atender **serviços que executa**
- ✅ Cliente só vê **barbeiros que fazem o serviço escolhido**

## 📊 Modelo de Dados Principal **ATUALIZADO**

### Novos Modelos Principais:

```typescript
// Relacionamento Barbeiro-Serviço (NOVO)
model BarberService {
  id          String
  barberId    String
  serviceId   String
  customPrice Decimal?  // preço específico
  isActive    Boolean
  
  barber      Barber
  service     Service
}

// Exceções com novo tipo AVAILABLE
enum ExceptionType {
  CLOSED
  OFF
  SPECIAL_HOURS
  VACATION
  AVAILABLE     // NOVO: disponível mesmo com barbearia fechada
}
```

## 🚀 Cronograma de Desenvolvimento **ATUALIZADO**

### Fases Principais (20 Semanas):

**Semanas 1-2:** Configuração base + Playwright  
**Semanas 3-4:** Sistema de autenticação  
**Semanas 5-6:** Gestão de barbearias  
**Semanas 7-8:** **Sistema de serviços por barbeiro (NOVO)**  
**Semanas 9-10:** **Sistema de horários flexíveis (ATUALIZADO)**  
**Semanas 11-12:** Sistema de agendamento rigoroso  
**Semanas 13-14:** Dashboards e interfaces  
**Semanas 15-16:** Site institucional  
**Semanas 17-18:** **Testes com Playwright (FOCO)**  
**Semanas 19-20:** Deploy e produção  

## 🎯 Principais Diferenças da Versão Anterior

### 1. Sistema de Serviços por Barbeiro
- **Antes:** Qualquer barbeiro podia fazer qualquer serviço
- **Agora:** Sistema rigoroso de serviços específicos por barbeiro

### 2. Horários Flexíveis
- **Antes:** Barbeiros limitados ao horário da barbearia
- **Agora:** Barbeiros podem trabalhar independentemente

### 3. Testes E2E
- **Antes:** Cypress planejado
- **Agora:** Playwright implementado (mais rápido e robusto)

### 4. Validações de Agendamento
- **Antes:** Validação básica de conflitos
- **Agora:** Validação rigorosa com múltiplas camadas

## 📋 Checklist de Validação **ATUALIZADO**

### Funcionalidades Críticas a Validar:
- [ ] **Cliente escolhe serviço → vê apenas barbeiros que executam**
- [ ] **Barbeiro trabalha fora horário barbearia → cliente pode agendar**
- [ ] **Exceção individual prevalece sobre global**
- [ ] **Não é possível agendar serviço que barbeiro não faz**
- [ ] **Preços específicos por barbeiro são respeitados**
- [ ] **Slots gerados respeitam horários individuais**
- [ ] **Sistema rejeita agendamentos inválidos**
- [ ] **Não há overlapping de horários**

### Testes E2E Críticos (Playwright):
- [ ] **Fluxo completo de agendamento**
- [ ] **Validação de serviços por barbeiro**
- [ ] **Horários independentes funcionando**
- [ ] **Múltiplos navegadores (Chrome, Firefox, Safari)**
- [ ] **Responsividade mobile**
- [ ] **Performance adequada**

## 🔍 Monitoramento e Métricas **NOVO**

### KPIs Principais:
- **Taxa de sucesso de agendamentos:** > 95%
- **Tempo de resposta da API:** < 200ms
- **Cobertura de testes:** > 80%
- **Testes E2E passando:** > 90%
- **Satisfação do usuário:** > 4.5/5

### Logs Críticos:
- Tentativas de agendamento inválido
- Conflitos de horário detectados
- Alterações em serviços por barbeiro
- Exceções de horário criadas
- Performance de geração de slots

## 🎨 Experiência do Usuário **APRIMORADA**

### Fluxo do Cliente:
1. **Escolher serviço** (corte, barba, etc.)
2. **Ver barbeiros disponíveis** (apenas os que fazem o serviço)
3. **Comparar preços** (cada barbeiro pode ter preço diferente)
4. **Escolher barbeiro**
5. **Selecionar data/horário** (respeitando horários individuais)
6. **Confirmar agendamento**

### Fluxo do Barbeiro:
1. **Configurar serviços** que executa
2. **Definir preços** específicos
3. **Configurar horários** (independente da barbearia)
4. **Criar exceções** pessoais
5. **Gerenciar agenda**

### Fluxo do Admin:
1. **Configurar barbearia**
2. **Gerenciar barbeiros**
3. **Atribuir serviços**
4. **Configurar horários globais**
5. **Acompanhar métricas**

## 📱 Compatibilidade **GARANTIDA**

### Navegadores Suportados:
- ✅ Chrome/Chromium (Desktop + Mobile)
- ✅ Firefox (Desktop + Mobile)
- ✅ Safari (Desktop + Mobile)
- ✅ Edge (Desktop)

### Dispositivos:
- ✅ Desktop (1920x1080+)
- ✅ Tablet (768x1024+)
- ✅ Mobile (375x667+)

### Testes Automatizados:
- ✅ **Playwright** testa todos os navegadores
- ✅ **Execução paralela** para velocidade
- ✅ **Screenshots automáticos** em falhas
- ✅ **Traces detalhados** para debugging

---

## 🚀 Próximos Passos

1. **Semana 1-2:** Configurar ambiente com Playwright
2. **Semana 3-4:** Implementar autenticação
3. **Semana 5-6:** Criar gestão de barbearias
4. **Semana 7-8:** **PRIORIDADE: Sistema de serviços por barbeiro**
5. **Semana 9-10:** **PRIORIDADE: Horários flexíveis**

**Status:** ⚡ **Atualizado** - Versão 2.0 com Serviços por Barbeiro + Horários Flexíveis + Playwright  
**Última Atualização:** 2024-12-19  
**Responsável:** Diego (Desenvolvedor Júnior)  
**Mentor:** Arquiteto de Software Sênior (Claude)