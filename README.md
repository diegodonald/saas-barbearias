# 💈 Sistema SaaS para Barbearias

Sistema completo de gestão e agendamento online para barbearias, salões de beleza e estúdios de tatuagem.

## 🚀 Funcionalidades Principais

### ✨ Para Clientes
- 📅 Agendamento online intuitivo
- 🔍 Busca por serviços e barbeiros
- 💰 Comparação de preços por barbeiro
- 📱 Interface mobile-first
- 📊 Histórico de agendamentos

### 👨‍💼 Para Barbeiros
- 🕐 Horários flexíveis e independentes
- 🛠️ Gestão de serviços específicos
- 💵 Preços personalizados por serviço
- 📈 Dashboard com métricas pessoais
- 🚫 Sistema de exceções e folgas

### 🏢 Para Administradores
- 🏪 Gestão completa da barbearia
- 👥 Gerenciamento de barbeiros
- 📊 Relatórios e analytics
- ⚙️ Configurações globais
- 🔐 Controle de acesso

## 🏗️ Arquitetura

### Stack Tecnológica
- **Frontend:** React 18 + TypeScript + Tailwind CSS + Vite
- **Backend:** Node.js + Express + TypeScript + Prisma
- **Banco:** PostgreSQL 15 + Redis (cache)
- **Testes:** Jest + Vitest + Playwright (E2E)
- **Deploy:** Vercel (Frontend) + Railway (Backend)

### Estrutura do Projeto
```
saas_full/
├── frontend/          # React App
├── backend/           # Node.js API
├── docs/             # Documentação
├── docker/           # Configurações Docker
├── e2e/              # Testes E2E Playwright
├── docker-compose.yml
└── package.json      # Workspace root
```

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- Docker & Docker Compose
- Git

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/diegodonald/saas-barbearias.git
cd saas-barbearias
```

2. **Configure o ambiente**
```bash
# Instalar dependências
npm run setup

# Subir banco de dados
npm run docker:up

# Executar migrações
npm run db:migrate

# Seed inicial (opcional)
npm run db:seed
```

3. **Executar em desenvolvimento**
```bash
# Executar frontend e backend simultaneamente
npm run dev

# Ou executar separadamente
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:3001
```

### Acessos
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Banco (Adminer):** http://localhost:8080
- **Prisma Studio:** `npm run db:studio`

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes E2E
npm run test:e2e

# Testes com coverage
npm run test:coverage
```

## 📚 Documentação

- [📋 Checklist de Desenvolvimento](./checklist_desenvolvimento.md)
- [📖 Documentação Técnica](./docs/documentacao_tecnica.md)
- [📝 Plano Geral](./docs/plano_geral.md)
- [⏰ Regras de Agendamento](./docs/regras_agendamento.md)

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Executa frontend e backend |
| `npm run build` | Build de produção |
| `npm test` | Executa todos os testes |
| `npm run lint` | Linting do código |
| `npm run format` | Formatação com Prettier |
| `npm run db:migrate` | Executa migrações |
| `npm run db:seed` | Popula banco com dados iniciais |

## 🌟 Funcionalidades Únicas

### Sistema de Serviços por Barbeiro
- Cada barbeiro executa apenas serviços específicos
- Clientes só veem barbeiros que fazem o serviço escolhido
- Preços personalizados por barbeiro

### Horários Flexíveis
- Barbeiros podem trabalhar fora do horário da barbearia
- Horários individuais têm prioridade absoluta
- Sistema rigoroso de validação de conflitos

### Agendamento Inteligente
- Fluxo otimizado: Serviço → Barbeiro → Horário
- Validação em tempo real
- Prevenção de overlapping

## 🚀 Deploy

### Desenvolvimento
```bash
npm run docker:up
npm run dev
```

### Produção
- **Frontend:** Deploy automático no Vercel
- **Backend:** Deploy automático no Railway
- **CI/CD:** GitHub Actions

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Diego Donald**
- GitHub: [@diegodonald](https://github.com/diegodonald)
- Email: diegodonald@example.com

---

⭐ Se este projeto te ajudou, considere dar uma estrela!
