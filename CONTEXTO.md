# Universal — contexto do projeto

> Documento para dar contexto a conversas com o Claude sobre o projeto.
> Última atualização: 29/10/2026.

## O que é

O **Universal** é uma plataforma de **gestão de prestação de serviços** para pequenas empresas. Uma mesma plataforma atende ramos muito diferentes, como passeador de cães, pedreiro, diarista, manicure, eletricista ou professor particular, e **se adapta ao ramo** de cada empresa.

A ideia central: o dono cadastra a empresa e escolhe o ramo. Depois convida os funcionários e os clientes, monta o catálogo de serviços e agenda os atendimentos. O funcionário executa e preenche um relatório (checklist) ao final. O cliente acompanha tudo e confirma o recebimento.

Exemplo: na empresa de passeios de cães "Patas Felizes", o admin agenda um **passeio** para o **tutor** João com o **passeador** Pedro. Pedro inicia o passeio, e no final marca *fez xixi, fez cocô, bebeu água* e escreve como o cão se comportou. João vê o relatório e confirma.

## Papéis (por empresa)

Uma pessoa tem **uma conta** e pode participar de **várias empresas**, com um papel diferente em cada uma. A ligação pessoa ↔ empresa se chama **Vínculo**.

| Papel | Nome técnico | O que faz |
|---|---|---|
| Administrador | `ADMIN` | Quem criou a empresa. Gerencia serviços, equipe, convites, ramo e todas as OS |
| Executor | `EXECUTOR` | Funcionário/prestador. Vê e executa as OS em que foi designado e preenche o relatório |
| Cliente | `CLIENTE` | Contrata. Vê o próprio histórico e confirma o recebimento |

O nome de cada papel na tela muda conforme o ramo (ver abaixo).

## Adaptação por ramo (segmento)

Ao criar a empresa, o admin escolhe o ramo. O admin pode trocar depois. O ramo define:
- **Vocabulário** das telas
- **Cor principal** do site e o ícone da empresa
- **Serviços sugeridos**, com preço e checklist de relatório prontos. São opcionais e criados na hora da criação da empresa ou depois. Serviços com o mesmo nome não são duplicados.

| Ramo (`Segmento`) | O que é agendado | Executor vira | Cliente vira | Cor |
|---|---|---|---|---|
| `PET` — Pets | Passeio | Passeador | Tutor | laranja |
| `CONSTRUCAO` — Construção e reformas | Obra | Profissional | Cliente | âmbar |
| `LIMPEZA` — Limpeza | Limpeza | Diarista | Cliente | ciano |
| `BELEZA` — Beleza e estética | Atendimento | Profissional | Cliente | rosa |
| `MANUTENCAO` — Manutenção e reparos | Chamado | Técnico | Cliente | índigo |
| `AULAS` — Aulas e treinos | Aula | Professor | Aluno | roxo |
| `OUTRO` — Outro ramo (padrão) | Ordem de serviço | Executor | Cliente | azul |

Exemplos de serviços sugeridos:
- **PET:** passeio de 30 min, passeio de 1 h, visita pet sitter
- **CONSTRUCAO:** diária de pedreiro, assentamento de piso, visita técnica
- **LIMPEZA:** faxina completa, limpeza pós-obra, passar roupa
- **BELEZA:** corte, manicure e pedicure, sobrancelha
- **MANUTENCAO:** reparo elétrico, reparo hidráulico, limpeza de ar-condicionado
- **AULAS:** aula particular, treino personalizado

Onde ficam essas configurações: os textos, cores e ícones estão em `apps/web/src/lib/segmentos.ts`, e os serviços sugeridos em `apps/api/src/empresas/servicos-sugeridos.ts`.

## Funcionalidades prontas

**Conta**
- Cadastro, login (JWT, validade de 1 dia), editar perfil, trocar senha
- Esqueci a senha: link por email com validade de 1 hora

**Empresa e equipe**
- Criar empresa (com ramo); o criador vira ADMIN
- Convites por link ou email para EXECUTOR ou CLIENTE, com validade padrão de 72 h. Um convite com email só pode ser aceito por essa conta
- Listar membros e remover membros (o vínculo fica INATIVO; um admin não pode ser removido)

**Serviços (catálogo)**
- Nome, descrição, valor e fotos (por enquanto são URLs digitadas, ainda não há upload)
- Ativar/desativar
- Definir quais executores podem fazer cada serviço
- **Campos de relatório** por serviço (checklist): tipos `CHECKBOX`, `TEXTO_CURTO`, `TEXTO_LONGO`, com campos obrigatórios e ordem

**Ordens de serviço (OS)**
- Criada por ADMIN ou EXECUTOR: cliente, data/hora (não pode ser no passado), observações e um ou mais itens (serviço + executor de cada item). O valor total é a soma dos itens
- Fluxo de status: `AGENDADO → EXECUTANDO → FINALIZADO → RECEBIDO`, e também `CANCELADO`
- Regras de status:
  - ADMIN pode qualquer transição
  - EXECUTOR (designado na OS) só pode colocar em `EXECUTANDO` ou `CANCELADO`
  - CLIENTE (dono da OS) só pode passar de `FINALIZADO` para `RECEBIDO`
- **Relatório por item:** só com a OS em `EXECUTANDO` e só pelo executor do item. Tem hora de início e fim (fim depois do início), os valores dos campos (os obrigatórios são validados), observações e fotos. Um relatório por item
- Quando **todos os itens têm relatório**, a OS vira `FINALIZADO` automaticamente
- Visibilidade: o admin vê todas as OS; o executor vê aquelas em que está designado; o cliente vê as próprias

**Telas (frontend)**
- Login, cadastro, esqueci/redefinir senha, aceitar convite
- "Minhas empresas" (lista com ícone e cor do ramo + criação de empresa)
- Dentro da empresa: Visão geral (só admin, com números e próximos agendamentos), lista de OS ("Histórico" para o cliente), detalhe da OS com relatório, Serviços, Equipe (só admin)

## Stack técnica

Monorepo com npm workspaces (`apps/*`):

- **`apps/api`**: NestJS 10 + Prisma 6 + PostgreSQL 16, autenticação JWT (passport), class-validator, nodemailer. Sem SMTP configurado, os links de email aparecem só no console
- **`apps/web`**: React 19 + Vite + TypeScript + Tailwind CSS 4 + React Router 7 + TanStack Query + axios + ícones lucide-react
- **Banco**: Postgres via `docker-compose.yml` (usuário, senha e banco `universal`, porta 5432)

Como rodar: `docker compose up -d`, depois `npm run dev:api` (porta 3000) e `npm run dev:web` (porta 5173).

### Modelo de dados (Prisma)

- `User`: conta (nome, email, senhaHash, telefone)
- `Empresa`: nome, documento, telefone, **segmento**, criadoPor
- `Vinculo`: user + empresa + papel + status (`PENDENTE/ATIVO/INATIVO`); único por (user, empresa)
- `Convite`: empresa, papel, token, email opcional, expiraEm, usadoEm
- `Servico`: empresa, nome, descrição, valor, fotos[], ativo
- `ExecutorServico`: quais executores fazem qual serviço
- `CampoRelatorio`: campos do checklist de um serviço
- `OrdemServico`: empresa, cliente (vínculo), status, dataAgendada, observações, valorTotal
- `OrdemServicoItem`: OS + serviço + executor (vínculo) + valor
- `Relatorio`: um por item (horaInicio, horaFim, observações, fotos)
- `RelatorioValor`: resposta de cada campo do checklist
- `RedefinicaoSenha`: tokens de "esqueci minha senha"

### Principais rotas da API

- `auth`: `POST registro`, `POST login`, `GET/PATCH me`, `PATCH senha`, `POST esqueci-senha`, `POST redefinir-senha`
- `empresas`: `POST`, `GET` (minhas), `GET/PATCH :id`, `GET :id/membros`, `DELETE :id/membros/:vinculoId`, `POST :id/servicos-sugeridos`
- `empresas/:id/convites`: criar, listar, revogar. `convites/:token`: ver e aceitar
- `empresas/:id/servicos`: CRUD, executores, campos-relatorio
- `empresas/:id/ordens-servico`: criar, listar, detalhe, `PATCH :id/status`, `POST :id/itens/:itemId/relatorio`

O controle de acesso por empresa é feito pelo `EmpresaRoleGuard` + o decorator `@Roles(...)`.

## Pendências e ideias

- **Dados específicos por ramo**: cadastro dos pets do tutor (nome, raça, cuidados), endereço da obra, etc. Hoje o ramo muda textos, cores e serviços, mas não os dados guardados
- **Upload de fotos** de verdade (hoje as fotos são URLs digitadas)
- **Testes automatizados** (só existem os de exemplo do NestJS)
- Configurar **SMTP** para enviar emails de verdade
- Notificações (ex.: avisar o tutor quando o passeio começa e termina)
- Agenda/calendário visual, recorrência (ex.: passeio toda segunda e quarta)
- Pagamentos e financeiro
- Deploy em produção
