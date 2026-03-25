# Documentação Técnica — Sistema Forno Nobre

> **Versão:** 1.0
> **Data:** Março de 2026
> **Classificação:** Interna

---

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Modelo de Dados (Entidades)](#3-modelo-de-dados-entidades)
4. [Regras de Negócio](#4-regras-de-negócio)
5. [Segurança e Autenticação](#5-segurança-e-autenticação)
6. [Decisões de Design](#6-decisões-de-design)
7. [API — Referência de Endpoints](#7-api--referência-de-endpoints)
8. [Guia de Manutenção e Testes](#8-guia-de-manutenção-e-testes)
9. [Guia de Instalação e Execução](#9-guia-de-instalação-e-execução)

---

## 1. Visão Geral do Projeto

### 1.1 Descrição

O **Forno Nobre** é um sistema de gestão para pizzaria, projetado para centralizar o cadastro de clientes, o catálogo de sabores, o registro e acompanhamento de pedidos e a aplicação automática de um programa de fidelidade.

O sistema é composto por uma **API RESTful** (backend) e uma **interface web administrativa** (frontend), comunicando-se via HTTP/JSON.

### 1.2 Objetivos do Sistema

- Gerenciar o cadastro de clientes com validação fiscal (CPF).
- Manter um cardápio de pizzas com categorização e controle de disponibilidade.
- Registrar pedidos com suporte a itens compostos (pizza meia-a-meia) e observações por item.
- Aplicar automaticamente o desconto do programa de fidelidade a cada 3º pedido concluído.
- Proteger todas as operações administrativas via autenticação JWT.

### 1.3 Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Backend (API) | NestJS | 11.x |
| ORM | TypeORM | 0.3.x |
| Banco de Dados | MySQL | 8.x |
| Autenticação | JWT + Passport | — |
| Hash de Senhas | bcrypt | 6.x |
| Validação de Entrada | class-validator / class-transformer | 0.15.x / 0.5.x |
| Frontend | Angular | 21.x |
| Estilização | Tailwind CSS | 4.x |
| Linguagem | TypeScript | 5.7 (back) / 5.9 (front) |

---

## 2. Arquitetura do Sistema

### 2.1 Visão Macro

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVEGADOR (Browser)                    │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │         Angular 21 — SPA (frontend/:4200)            │  │
│   │                                                      │  │
│   │  Auth Interceptor → injeta Bearer token em todas     │  │
│   │  as requisições HTTP saintes.                        │  │
│   │                                                      │  │
│   │  Proxy Dev (/api/*) → redireciona para :3000         │  │
│   └──────────────┬───────────────────────────────────────┘  │
└──────────────────┼──────────────────────────────────────────┘
                   │ HTTP/JSON  (prefixo /api removido pelo proxy)
┌──────────────────▼──────────────────────────────────────────┐
│                    NestJS API (:3000)                        │
│                                                             │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌─────────────┐   │
│  │   Auth   │ │ Customers │ │  Pizzas  │ │   Orders    │   │
│  │  Module  │ │  Module   │ │  Module  │ │   Module    │   │
│  └──────────┘ └───────────┘ └──────────┘ └──────┬──────┘   │
│                                                  │          │
│                 ┌────────────────────────────────┘          │
│                 │  LoyaltyService (acoplado ao OrdersModule) │
│                 └────────────────────────────────────────┐  │
│                                                          │  │
│  ┌────────────────────────────────────────────────────┐  │  │
│  │         TypeORM (Mapeamento Objeto-Relacional)      │  │  │
│  └────────────────────────┬───────────────────────────┘  │  │
└───────────────────────────┼──────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────┐
│                   MySQL Database                          │
│   users │ customers │ pizzas │ orders │ order_items       │
└──────────────────────────────────────────────────────────┘
```

---

### 2.2 Arquitetura Modular do Backend (NestJS)

O NestJS organiza o código no padrão **módulo → controlador → serviço → entidade**, garantindo separação de responsabilidades.

#### Módulos existentes

| Módulo | Responsabilidade |
|---|---|
| `AuthModule` | Login, emissão e validação de tokens JWT |
| `UsersModule` | Gerenciamento de usuários administrativos |
| `CustomersModule` | CRUD de clientes + validação de CPF |
| `PizzasModule` | CRUD do cardápio + ranking de sabores mais vendidos |
| `OrdersModule` | Registro e gestão de pedidos + programa de fidelidade |
| `OrderItemsModule` | Itens individuais de cada pedido |

#### Responsabilidades de cada camada

```
Controller   →  Recebe a requisição HTTP, valida o DTO e delega ao Service.
Service      →  Contém toda a lógica de negócio; acessa o banco via Repository.
Entity       →  Define a tabela e os relacionamentos no banco de dados.
DTO          →  Define e valida o formato dos dados de entrada (request body).
Guard        →  Intercepta a requisição antes do controller para verificar autenticação.
```

---

### 2.3 Estrutura de Componentes Standalone no Angular

O frontend utiliza o padrão **Standalone Components**, introduzido no Angular 15+ e adotado como padrão no Angular 17+. Nesse modelo, **não existem NgModules**; cada componente declara diretamente suas próprias dependências por meio da propriedade `imports`.

```typescript
// Exemplo: cada componente é autossuficiente
@Component({
  standalone: true,
  imports: [RouterOutlet, CommonModule, ReactiveFormsModule],
  ...
})
export class LoginComponent { ... }
```

**Vantagens adotadas no projeto:**
- Tree-shaking mais eficiente (o bundle final inclui somente o que é realmente usado).
- Carregamento lazy de rotas com `loadComponent()`.
- Uso de **Signals** para gerenciamento de estado reativo sem necessidade de bibliotecas externas (NgRx).

#### Organização de diretórios do frontend

```
frontend/src/app/
├── core/
│   ├── guards/         # Proteção de rotas (authGuard)
│   ├── interceptors/   # authInterceptor (injeção de token + logout em 401)
│   ├── models/         # Interfaces TypeScript (Customer, Pizza, Order)
│   └── services/       # Serviços HTTP (AuthService, CustomersService, etc.)
├── features/
│   ├── auth/login/     # Tela de login
│   └── dashboard/      # Layout principal + sub-rotas funcionais
│       ├── layout/
│       ├── overview/   # Painel inicial (resumo)
│       ├── clientes/
│       ├── sabores/
│       └── pedidos/
└── shared/
    ├── components/     # Navbar, Sidebar (reutilizáveis)
    └── validators/     # Validador de CPF para formulários reativos
```

---

### 2.4 Fluxo de Comunicação: Proxy e Interceptors

#### Proxy de Desenvolvimento

O arquivo `frontend/proxy.conf.json` instrui o servidor de desenvolvimento do Angular (`ng serve`) a redirecionar todas as chamadas com prefixo `/api` para o backend NestJS em `http://127.0.0.1:3000`, removendo o prefixo no processo.

```
Angular (porta 4200) → requisição para /api/customers
         ↓ proxy
NestJS  (porta 3000) → recebe /customers
```

Isso evita erros de CORS durante o desenvolvimento e mantém a URL base consistente no código frontend.

#### Auth Interceptor

O `authInterceptor` (`core/interceptors/auth.interceptor.ts`) é um **HttpInterceptorFn** funcional registrado globalmente em `app.config.ts`. Ele atua em **todas** as requisições HTTP de saída:

1. Verifica se existe um token JWT armazenado.
2. Clona a requisição original adicionando o cabeçalho `Authorization: Bearer <token>`.
3. Em caso de resposta **401 (Não Autorizado)** do servidor, chama `authService.logout()`, que limpa o token e redireciona para `/login`.

```
Componente Angular
      │
      ▼ HttpClient.get('/api/orders')
  authInterceptor
      │ → adiciona "Authorization: Bearer eyJ..."
      ▼
  Proxy (:4200 → :3000)
      ▼
  NestJS JwtAuthGuard
      │ → valida token
      ▼
  OrdersController
```

---

## 3. Modelo de Dados (Entidades)

### 3.1 Diagrama de Relacionamentos (ERD Simplificado)

```
┌──────────┐        ┌──────────┐        ┌────────────┐
│  users   │        │customers │  1      │   orders   │
│──────────│        │──────────│◄────────│────────────│
│ id (PK)  │        │ id (PK)  │    N    │ id (PK)    │
│ username │        │ name     │         │ customerId │
│ password │        │ cpf      │         │ status     │
└──────────┘        │ phone    │         │ totalValue │
                    │ address  │         │ finalValue │
                    │ email    │         │ discount   │
                    └──────────┘         └─────┬──────┘
                                               │ 1
                                               │
                                               ▼ N
                    ┌──────────┐        ┌────────────────┐
                    │  pizzas  │        │  order_items   │
                    │──────────│        │────────────────│
                    │ id (PK)  │◄───────│ id (PK)        │
                    │flavorName│  N:1   │ orderId (FK)   │
                    │ price    │        │ pizzaId (FK)   │
                    │ category │        │ quantity       │
                    │ isActive │        │ unitPrice      │
                    └──────────┘        │ notes          │
                                        └────────────────┘
```

**Cardinalidades:**
- `customers` **1 → N** `orders` (um cliente possui muitos pedidos)
- `orders` **1 → N** `order_items` (um pedido possui muitos itens)
- `pizzas` **1 → N** `order_items` (uma pizza pode aparecer em muitos itens)

---

### 3.2 Detalhamento das Entidades

#### Tabela `users`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | Nome de login |
| `password` | VARCHAR(255) | NOT NULL | Senha com hash bcrypt |

> Usuário padrão criado automaticamente na inicialização: `admin` / `admin123`.

---

#### Tabela `customers`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `name` | VARCHAR(100) | NOT NULL | Nome completo |
| `cpf` | VARCHAR(11) | NOT NULL, UNIQUE | CPF sem formatação (apenas dígitos) |
| `phone` | VARCHAR(20) | NULL | Telefone de contato |
| `address` | TEXT | NULL | Endereço completo |
| `email` | VARCHAR(150) | NULL | E-mail |
| `createdAt` | DATETIME | NOT NULL | Data de criação (automática) |

---

#### Tabela `pizzas`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `flavorName` | VARCHAR(100) | NOT NULL | Nome do sabor |
| `description` | TEXT | NULL | Descrição dos ingredientes |
| `price` | DECIMAL(10,2) | NOT NULL | Preço base |
| `category` | VARCHAR(20) | NOT NULL, DEFAULT 'Salgada' | Classificação: Salgada, Doce ou Especial |
| `isActive` | BOOLEAN | NOT NULL, DEFAULT true | Controla visibilidade no cardápio |
| `createdAt` | DATETIME | NOT NULL | Data de cadastro (automática) |

---

#### Tabela `orders`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `customerId` | INT | FK → customers.id | Cliente dono do pedido |
| `orderDate` | DATETIME | NOT NULL | Data/hora do pedido (automática) |
| `status` | ENUM | NOT NULL | Ver estados abaixo |
| `totalValue` | DECIMAL(10,2) | DEFAULT 0 | Soma bruta dos itens |
| `discountApplied` | DECIMAL(10,2) | DEFAULT 0 | Valor monetário do desconto |
| `finalValue` | DECIMAL(10,2) | DEFAULT 0 | Valor final após desconto |
| `isDiscountApplied` | BOOLEAN | DEFAULT false | Indica se desconto foi aplicado |

**Estados do pedido (OrderStatus):**

| Status | Descrição |
|---|---|
| `PENDING` | Pedido recebido, aguardando preparo |
| `PREPARING` | Em preparo na cozinha |
| `DELIVERED` | Entregue ao cliente |
| `CANCELED` | Cancelado |

> Pedidos com status `PREPARING` e `DELIVERED` são contabilizados para o programa de fidelidade. Pedidos `CANCELED` são ignorados.

---

#### Tabela `order_items`

| Coluna | Tipo | Restrições | Descrição |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | Identificador único |
| `orderId` | INT | FK → orders.id, CASCADE DELETE | Pedido ao qual pertence |
| `pizzaId` | INT | FK → pizzas.id, NULL | Pizza selecionada (pode ser nulo para itens customizados) |
| `quantity` | INT | NOT NULL, DEFAULT 1 | Quantidade |
| `unitPrice` | DECIMAL(10,2) | NOT NULL | Preço unitário no momento do pedido |
| `notes` | TEXT | NULL | Observações (ex: "metade frango, metade calabresa") |

---

## 4. Regras de Negócio

Esta seção descreve a lógica central que governa o comportamento do sistema.

---

### 4.1 Programa de Fidelidade — Desconto no 3º Pedido

**Regra:** A cada ciclo de 3 pedidos válidos (com status `PREPARING` ou `DELIVERED`), o próximo pedido é elegível a um desconto de **10%** sobre o valor total.

#### Como funciona (LoyaltyService)

```
LOYALTY_CYCLE = 3

Contagem de pedidos válidos do cliente:  N

Condição para desconto:
   N > 0  E  (N % 3) === 2

Exemplos:
   N = 0 → sem desconto (módulo: 0)
   N = 1 → sem desconto (módulo: 1)
   N = 2 → DESCONTO ELEGÍVEL (módulo: 2) ← 3º pedido será com desconto
   N = 3 → sem desconto (módulo: 0)
   N = 4 → sem desconto (módulo: 1)
   N = 5 → DESCONTO ELEGÍVEL (módulo: 2) ← 6º pedido será com desconto
```

**O operador módulo (`%`)** é a chave desta lógica. Ao verificar o resto da divisão por 3, o sistema identifica quando o cliente completou um ciclo e está prestes a realizar seu "pedido bônus".

#### Fluxo no sistema

```
1. Frontend → GET /orders/check-discount/:customerId
2. LoyaltyService.hasDiscount() consulta pedidos válidos
3. Retorna { eligible: boolean, completedOrders: number }
4. Se elegível, frontend exibe opção de aplicar desconto
5. POST /orders com isDiscountApplied: true
6. OrderCalculator aplica o desconto no cálculo do total
```

#### Cálculo aplicado (OrderCalculator)

```
LOYALTY_DISCOUNT_RATE = 0.10  (10%)

totalValue     = Σ (quantity × unitPrice)
discountApplied = totalValue × 0.10      (se isDiscountApplied = true)
finalValue     = totalValue − discountApplied

Todos os valores são arredondados para 2 casas decimais.
```

---

### 4.2 Lógica de Precificação Meia-a-Meia

**Regra de negócio do setor:** Quando um cliente pede uma pizza "metade-a-metade" (dois sabores dividindo uma pizza), cobra-se o preço do **sabor mais caro**.

#### Como está implementado

Essa regra é aplicada **no frontend** no momento da montagem do pedido:

1. O atendente seleciona dois sabores para uma pizza dividida.
2. O sistema compara os preços dos dois sabores selecionados.
3. O `unitPrice` enviado para a API é o **maior** dos dois preços.
4. O campo `notes` do item recebe a descrição da combinação, ex: `"Metade Frango c/ Catupiry / Metade Calabresa"`.

**Por que no frontend?** A lógica de UI (seleção de sabores, composição do item) vive naturalmente no cliente. A API recebe o `unitPrice` já calculado, o que a torna agnóstica à regra de precificação e reutilizável para diferentes estratégias futuras (ex: média dos preços, preço fixo por tamanho).

**O campo `notes` no `order_items`** é o mecanismo de extensibilidade que suporta essa regra sem necessidade de uma tabela separada para "sabores por metade".

---

### 4.3 Validação de CPF

O sistema implementa validação completa do CPF tanto no **backend** quanto no **frontend**, garantindo dupla camada de segurança.

#### Algoritmo de Validação (Módulo 11)

```
Entrada: "12345678909" (11 dígitos numéricos)

Etapa 1 — Rejeitar sequências inválidas:
   • Comprimento diferente de 11 → inválido
   • Todos os dígitos iguais (ex: "11111111111") → inválido

Etapa 2 — Calcular 1º dígito verificador:
   Pesos: 10, 9, 8, 7, 6, 5, 4, 3, 2
   soma = Σ (dígito[i] × peso[i])  para i de 0 a 8
   resto = soma % 11
   dv1  = (resto < 2) ? 0 : (11 - resto)
   Verificar: dv1 === dígito[9]

Etapa 3 — Calcular 2º dígito verificador:
   Pesos: 11, 10, 9, 8, 7, 6, 5, 4, 3, 2
   soma = Σ (dígito[i] × peso[i])  para i de 0 a 9
   resto = soma % 11
   dv2  = (resto < 2) ? 0 : (11 - resto)
   Verificar: dv2 === dígito[10]
```

#### Unicidade de CPF

Além da validade matemática, o banco de dados possui uma **restrição UNIQUE** na coluna `cpf`. A camada de serviço (`CustomersService`) também verifica explicitamente duplicatas antes de inserir ou atualizar:

- **Inserção:** `ConflictException` (HTTP 409) se o CPF já estiver cadastrado.
- **Atualização:** `ConflictException` se o CPF informado pertencer a outro cliente.

#### Validação no Frontend

O `cpfValidator` é um `ValidatorFn` para formulários reativos Angular. Ele aplica o mesmo algoritmo do backend, fornecendo feedback imediato ao usuário enquanto digita, sem precisar aguardar uma resposta da API.

O helper `formatCpf()` exibe o CPF no formato legível `XXX.XXX.XXX-XX`, enquanto `unformatCpf()` remove a formatação antes de enviar ao backend (que armazena apenas os dígitos).

---

### 4.4 Ciclo de Status de Pedidos

```
                        ┌──────────┐
                        │ PENDING  │  (estado inicial)
                        └────┬─────┘
                             │ atendente confirma preparo
                        ┌────▼─────┐
                        │PREPARING │
                        └────┬─────┘
                             │ pedido entregue
                        ┌────▼─────┐
                        │DELIVERED │  ← contabilizado para fidelidade
                        └──────────┘

     Qualquer estado → CANCELED  (cancelamento a qualquer momento)
```

> Apenas `PREPARING` e `DELIVERED` são contabilizados no programa de fidelidade. Pedidos `CANCELED` não entram na contagem.

---

### 4.5 Ranking de Sabores Mais Vendidos

O endpoint `GET /pizzas/top-sellers` utiliza uma **query otimizada no banco de dados** (QueryBuilder do TypeORM) para calcular, em uma única consulta SQL, a quantidade total vendida de cada sabor:

```sql
SELECT
    pizza.id         AS pizzaId,
    pizza.flavorName AS flavorName,
    SUM(item.quantity) AS totalSold
FROM order_items item
INNER JOIN pizzas pizza ON pizza.id = item.pizzaId
INNER JOIN orders ord   ON ord.id   = item.orderId
WHERE ord.status != 'CANCELED'
GROUP BY pizza.id, pizza.flavorName
ORDER BY totalSold DESC
LIMIT :limit
```

Pedidos cancelados são excluídos para refletir apenas o consumo real.

---

## 5. Segurança e Autenticação

### 5.1 Visão Geral do Fluxo de Autenticação

```
Cliente          AuthController          AuthService          JwtService
   │                    │                     │                    │
   │ POST /auth/login   │                     │                    │
   │ { username, pass } │                     │                    │
   │───────────────────►│                     │                    │
   │                    │ validateUser()      │                    │
   │                    │────────────────────►│                    │
   │                    │                     │ bcrypt.compare()   │
   │                    │                     │ (hash armazenado)  │
   │                    │                     │◄───────────────────│
   │                    │◄────────────────────│                    │
   │                    │ login(user)         │                    │
   │                    │────────────────────►│                    │
   │                    │                     │ jwt.sign(payload)  │
   │                    │                     │────────────────────►
   │                    │◄────────────────────│◄───────────────────│
   │◄───────────────────│                     │                    │
   │ { access_token }   │                     │                    │
```

### 5.2 JSON Web Token (JWT)

| Configuração | Valor |
|---|---|
| Algoritmo | HS256 (padrão) |
| Payload | `{ sub: userId, username: string }` |
| Expiração | 8 horas |
| Segredo | Variável de ambiente `JWT_SECRET` |
| Transporte | Cabeçalho HTTP `Authorization: Bearer <token>` |

### 5.3 Hashing de Senhas com Bcrypt

O bcrypt é um algoritmo de hash adaptativo projetado para ser lento, tornando ataques de força bruta computacionalmente inviáveis. O sistema utiliza a implementação `bcrypt@6` com o fator de custo padrão.

**Nunca a senha original é armazenada.** Apenas o hash é persistido no banco.

```
Cadastro:  senha_texto_puro → bcrypt.hash() → hash armazenado no banco
Login:     senha_texto_puro → bcrypt.compare(hash_do_banco) → true/false
```

### 5.4 Guards — Proteção de Rotas

O `JwtAuthGuard` é aplicado como decorator nos controllers de `Customers`, `Pizzas` e `Orders`. Qualquer requisição que não possua um token válido recebe resposta **HTTP 401 Unauthorized** antes de chegar ao método do controller.

```
Requisição HTTP
      │
  JwtAuthGuard (Guard)
      │
      ├─ Token ausente ou inválido → 401 Unauthorized (bloqueado aqui)
      │
      └─ Token válido → Controller Method (prossegue normalmente)
```

**Rotas públicas** (sem autenticação):
- `POST /auth/login`

**Rotas protegidas** (exigem Bearer token):
- Todos os endpoints de `/customers`, `/pizzas` e `/orders`

### 5.5 Estratégia JWT (JwtStrategy)

A `JwtStrategy` (implementação do Passport.js) é responsável por:

1. Extrair o token do cabeçalho `Authorization: Bearer <token>`.
2. Verificar a assinatura com `JWT_SECRET`.
3. Verificar se o token não está expirado.
4. Retornar o payload decodificado `{ id, username }` que fica disponível em `req.user`.

---

## 6. Decisões de Design

### 6.1 Por que Tailwind CSS?

O Tailwind CSS foi escolhido como framework de estilização por sua abordagem **utility-first**: em vez de escrever classes CSS customizadas, as classes de utilitário são aplicadas diretamente no HTML do template.

**Benefícios no contexto deste projeto:**
- **Velocidade de prototipação:** Estilização rápida sem alternar entre arquivos `.ts` e `.css`.
- **Consistência visual:** O sistema de design do Tailwind (cores, espaçamentos, tipografia) garante coesão visual por padrão.
- **Bundle otimizado:** O Tailwind remove automaticamente todas as classes não utilizadas no build de produção (PurgeCSS integrado), resultando em folhas de estilo mínimas.
- **Responsividade:** Prefixos como `sm:`, `md:`, `lg:` facilitam layouts responsivos sem media queries manuais.

### 6.2 Por que DTOs para Validação de Entrada?

Os **Data Transfer Objects (DTOs)** com `class-validator` garantem que dados inválidos sejam rejeitados na **fronteira do sistema** (camada HTTP), antes de chegar à lógica de negócio.

**Exemplo:** `CreateCustomerDto` define que `cpf` deve corresponder ao padrão `/^\d{11}$/` via `@Matches`. Se um CPF com letras for enviado, o NestJS retorna **HTTP 400 Bad Request** automaticamente, sem que o `CustomersService` seja sequer invocado.

**Benefícios:**
- A lógica de negócio (Services) assume que os dados já foram validados — código mais limpo e focado.
- Mensagens de erro descritivas e padronizadas para o cliente da API.
- O decorator `@Transform` permite normalizar dados de entrada (ex: converter string `"29.90"` para número `29.90` no `CreatePizzaDto`).

### 6.3 Campo `notes` em OrderItems — Flexibilidade para Meia-a-Meia

A decisão de incluir um campo `notes` (TEXT, nullable) na entidade `order_items` foi deliberada para suportar a regra de **pizza meia-a-meia** sem complexidade adicional no modelo de dados.

**Alternativa descartada:** Criar uma tabela `order_item_flavors` com relacionamento N:N entre itens e sabores. Embora mais normalizada, essa abordagem exigiria:
- Uma tabela adicional no banco.
- Queries mais complexas com múltiplos JOINs.
- Lógica extra de cálculo de preço no backend.

**Decisão adotada:** O campo `notes` armazena a descrição livre da composição do item (ex: `"Metade Frango / Metade Calabresa"`), enquanto o `pizzaId` pode ficar nulo para itens sem pizza específica. Isso mantém o modelo simples e extensível para observações gerais (ex: `"Sem cebola"`, `"Borda recheada"`).

### 6.4 Separação de `totalValue`, `discountApplied` e `finalValue`

Em vez de armazenar apenas o valor final, o pedido persiste os **três valores** separadamente. Essa decisão facilita:

- **Auditoria financeira:** É possível verificar qual desconto foi concedido por pedido.
- **Relatórios:** Relatórios de faturamento podem distinguir receita bruta de líquida.
- **Debugging:** Se uma anomalia de preço for detectada, é possível rastrear exatamente onde ocorreu.

### 6.5 Seed Automático do Usuário Administrador

O `UsersService` implementa `OnModuleInit`, garantindo que um usuário `admin` seja criado automaticamente **na primeira inicialização** do sistema, caso não exista. Isso permite que novos ambientes (desenvolvimento, staging, produção) sejam operacionais imediatamente, sem passos manuais de setup.

> **Atenção em produção:** Altere a senha do usuário `admin` imediatamente após o primeiro deploy.

---

## 7. API — Referência de Endpoints

> Todos os endpoints (exceto `/auth/login`) exigem o cabeçalho:
> `Authorization: Bearer <token>`

### 7.1 Autenticação

| Método | Endpoint | Body | Resposta | Descrição |
|---|---|---|---|---|
| POST | `/auth/login` | `{ username, password }` | `{ access_token }` | Autentica e retorna token JWT |

### 7.2 Clientes (`/customers`)

| Método | Endpoint | Body/Query | Resposta | Descrição |
|---|---|---|---|---|
| GET | `/customers` | — | `Customer[]` | Lista todos os clientes |
| GET | `/customers/:id` | — | `Customer` | Busca cliente por ID |
| POST | `/customers` | `CreateCustomerDto` | `Customer` | Cadastra novo cliente |
| PATCH | `/customers/:id` | `UpdateCustomerDto` | `Customer` | Atualiza dados do cliente |
| DELETE | `/customers/:id` | — | `void` | Remove cliente |

### 7.3 Pizzas (`/pizzas`)

| Método | Endpoint | Body/Query | Resposta | Descrição |
|---|---|---|---|---|
| GET | `/pizzas` | `?active=true\|false` | `Pizza[]` | Lista pizzas (padrão: apenas ativas) |
| GET | `/pizzas/top-sellers` | `?limit=10` | `TopSeller[]` | Ranking dos mais vendidos |
| GET | `/pizzas/:id` | — | `Pizza` | Busca pizza por ID |
| POST | `/pizzas` | `CreatePizzaDto` | `Pizza` | Cadastra nova pizza |
| PATCH | `/pizzas/:id` | `UpdatePizzaDto` | `Pizza` | Atualiza pizza |
| DELETE | `/pizzas/:id` | — | `void` | Remove pizza |

### 7.4 Pedidos (`/orders`)

| Método | Endpoint | Body/Query | Resposta | Descrição |
|---|---|---|---|---|
| GET | `/orders` | — | `Order[]` | Lista todos os pedidos |
| GET | `/orders/:id` | — | `Order` | Busca pedido por ID |
| GET | `/orders/check-discount/:customerId` | — | `DiscountCheck` | Verifica elegibilidade de desconto |
| POST | `/orders` | `CreateOrderDto` | `Order` | Cria novo pedido |
| PATCH | `/orders/:id` | `UpdateOrderDto` | `Order` | Atualiza pedido |
| PATCH | `/orders/:id/status` | `{ status: OrderStatus }` | `Order` | Atualiza apenas o status |
| DELETE | `/orders/:id` | — | `void` | Remove pedido |

### 7.5 Códigos de Resposta HTTP Utilizados

| Código | Significado | Quando ocorre |
|---|---|---|
| 200 | OK | Requisição bem-sucedida (GET, PATCH) |
| 201 | Created | Recurso criado com sucesso (POST) |
| 400 | Bad Request | Dados inválidos (CPF inválido, campos faltando) |
| 401 | Unauthorized | Token ausente, inválido ou expirado |
| 404 | Not Found | Recurso não encontrado por ID |
| 409 | Conflict | Violação de unicidade (CPF duplicado) |

---

## 8. Guia de Manutenção e Testes

### 8.1 Estrutura de Testes

O projeto utiliza **Jest** como framework de testes. Os testes unitários residem ao lado dos arquivos testados (sufixo `.spec.ts`).

```
src/
├── common/utils/
│   ├── cpf-validator.ts
│   ├── cpf-validator.spec.ts      ← testes do validador de CPF
│   ├── order-calculator.ts
│   └── order-calculator.spec.ts   ← testes do calculador de pedidos
```

### 8.2 Testes do Calculador de Pedidos (`order-calculator.spec.ts`)

Os testes cobrem os cenários críticos da regra de negócio de cálculo:

| Cenário | Entrada | Saída esperada |
|---|---|---|
| Pedido simples sem desconto | 2 itens, isDiscount = false | totalValue = soma; finalValue = soma; discount = 0 |
| Pedido com desconto de fidelidade | 1 item R$ 50,00, isDiscount = true | discount = 5,00; finalValue = 45,00 |
| Múltiplos itens com quantidade | qty=3, price=10; qty=2, price=15 | totalValue = 60,00 |
| Arredondamento de centavos | Valores que geram dízimas | Resultado arredondado em 2 casas |

### 8.3 Testes do Validador de CPF (`cpf-validator.spec.ts`)

| Cenário | CPF de entrada | Resultado |
|---|---|---|
| CPF válido | `"12345678909"` | `true` |
| Todos dígitos iguais | `"11111111111"` | `false` |
| Comprimento incorreto | `"123"` | `false` |
| Dígito verificador errado | `"12345678900"` | `false` |
| CPF com formatação | `"123.456.789-09"` | `true` (remove formatação automaticamente) |

### 8.4 Como Executar os Testes

```bash
# Todos os testes unitários
npm run test

# Modo watch (reexecuta ao salvar arquivos)
npm run test:watch

# Relatório de cobertura de código
npm run test:cov
```

O relatório de cobertura é gerado em `coverage/lcov-report/index.html`.

### 8.5 Guia para Manutenção das Regras de Negócio

#### Alterar o ciclo do programa de fidelidade

Arquivo: `src/orders/loyalty.service.ts`

```typescript
// Altere esta constante para mudar a frequência do desconto
private readonly LOYALTY_CYCLE = 3; // Atualmente: a cada 3 pedidos
```

#### Alterar a taxa de desconto

Arquivo: `src/common/utils/order-calculator.ts`

```typescript
// Altere esta constante para mudar o percentual de desconto
const LOYALTY_DISCOUNT_RATE = 0.1; // Atualmente: 10%
```

#### Adicionar um novo status de pedido

1. Edite o enum em `src/orders/enums/order-status.enum.ts`.
2. Verifique se o novo status deve ser contabilizado no `loyalty.service.ts` (`QUALIFYING_STATUSES`).
3. Adicione o label e cor no frontend: `frontend/src/app/core/models/order.model.ts` (`ORDER_STATUS_LABELS` e `ORDER_STATUS_COLORS`).

#### Adicionar uma nova categoria de pizza

1. Edite o tipo em `frontend/src/app/core/models/pizza.model.ts`:
   ```typescript
   type PizzaCategory = 'Salgada' | 'Doce' | 'Especial' | 'NovaCategoria'
   ```
2. A coluna `category` no banco é `VARCHAR`, portanto nenhuma migration é necessária.

---

## 9. Guia de Instalação e Execução

### 9.1 Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 20.x LTS |
| npm | 10.x |
| MySQL | 8.x |
| Git | 2.x |

### 9.2 Configuração do Ambiente

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd Pizzaria-Forno-Nobre

# 2. Instalar dependências do backend
npm install

# 3. Instalar dependências do frontend
cd frontend && npm install && cd ..

# 4. Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais de banco e JWT_SECRET
```

**Conteúdo do `.env`:**

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=pizzeria_db
JWT_SECRET=uma-chave-secreta-longa-e-aleatoria
PORT=3000
```

### 9.3 Banco de Dados

```sql
-- Crie o banco no MySQL
CREATE DATABASE pizzeria_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> O TypeORM com `synchronize: true` criará as tabelas automaticamente na primeira execução. Em **produção**, considere desativar `synchronize` e usar migrations explícitas.

### 9.4 Executando em Desenvolvimento

```bash
# Terminal 1 — Backend (porta 3000)
npm run start:dev

# Terminal 2 — Frontend (porta 4200)
cd frontend && npm start
```

Acesse: `http://localhost:4200`
Credenciais padrão: `admin` / `admin123`

### 9.5 Executando com Docker

```bash
# Sobe o banco MySQL via Docker Compose
docker-compose up -d

# Em seguida, inicie o backend e frontend conforme acima
```

### 9.6 Build de Produção

```bash
# Backend
npm run build
node dist/main.js

# Frontend
cd frontend && npm run build
# Arquivos gerados em frontend/dist/
```

---

*Fim do documento.*

---

> **Documento gerado em:** Março de 2026
> **Sistema:** Forno Nobre v1.0
> **Arquitetura:** NestJS 11 + Angular 21 + MySQL 8
