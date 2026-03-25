# Pizzaria Forno Nobre

Sistema de gerenciamento para pizzaria, desenvolvido com NestJS (backend) e Angular (frontend).

---

## Tecnologias

- **Backend:** NestJS 11, TypeORM, MySQL, Passport JWT
- **Frontend:** Angular 21, Tailwind CSS 4, Vitest
- **Banco de dados:** MySQL 8.0 via Docker

---

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

---

## Configuração inicial

### 1. Variáveis de ambiente

Copie o arquivo de exemplo e configure as variáveis:

```bash
cp .env.example .env
```

Edite o `.env` com os valores desejados (os padrões já funcionam com o Docker Compose).

### 2. Instalar dependências

```bash
# Backend
npm install

# Frontend
cd frontend && npm install
```

---

## Banco de dados (Docker)

### Subir o container pela primeira vez

```bash
docker compose up -d
```

### Parar o container

```bash
docker compose down
```

### Reiniciar o container (após já ter sido criado)

```bash
docker compose start
```

### Parar sem remover o container

```bash
docker compose stop
```

> **Nota:** Use `docker compose down` apenas para remover o container. Os dados ficam preservados no volume `pizzeria_data`. Para apagar os dados também, use `docker compose down -v`.

### Verificar status do container

```bash
docker compose ps
```

---

## Rodando o backend

```bash
# Modo desenvolvimento (com hot reload)
npm run start:dev

# Modo produção
npm run start:prod
```

O backend sobe em `http://localhost:3000`.

---

## Rodando o frontend

```bash
cd frontend
npm start
```

O frontend sobe em `http://localhost:4200`.

---

## Testes

### Backend (Jest)

```bash
# Testes unitários
npm run test

# Testes em modo watch
npm run test:watch

# Cobertura de código
npm run test:cov

# Testes e2e
npm run test:e2e
```

### Frontend (Vitest)

```bash
cd frontend

# Rodar testes com Vitest
npm run test:vitest

# Rodar testes com Angular test runner (Karma)
npm test
```

---

## Estrutura do projeto

```text
Pizzaria-Forno-Nobre/
├── src/                    # Backend NestJS
│   ├── auth/               # Autenticação JWT
│   ├── customers/          # Módulo de clientes
│   ├── orders/             # Módulo de pedidos
│   └── pizzas/             # Módulo de pizzas
├── frontend/               # Frontend Angular
│   └── src/
│       ├── app/
│       │   ├── core/       # Guards, interceptors
│       │   └── features/   # Módulos de funcionalidades
│       └── ...
├── docker-compose.yml      # Configuração do banco MySQL
└── .env.example            # Exemplo de variáveis de ambiente
```
