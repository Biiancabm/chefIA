# easyService — contexto do projeto

> Documento para dar contexto a conversas com o Claude sobre o projeto.
> Última atualização: 23/11/2026. (O projeto se chamava "Universal"; a pasta e o banco ainda usam esse nome.)

## O que é

O **easyService** é um app de gestão para **negócios de pets** (passeador de cães, pet sitter). Funciona no navegador e pode ser **instalado no celular como app** (PWA).

O dono cadastra a empresa, convida os passeadores e os clientes, monta o catálogo de serviços e agenda os passeios. O passeador lê o briefing do pet, faz o passeio e preenche um relatório (checklist e fotos). O cliente acompanha tudo e lê o relatório. O dono acompanha o financeiro, inclusive o que pagar a cada passeador.

Exemplo: na "Patas Felizes", o cliente João cadastra a cachorra **Mel** (briefing: "puxa a guia", "dar água após o passeio"). Ele pede um passeio; o passeador Pedro, responsável por ele, aceita. No dia, Pedro lê o briefing, inicia o passeio e no fim marca *fez xixi, fez cocô, bebeu água*, escreve como foi e anexa fotos. João vê o relatório.

> Até 14/11/2026 a plataforma atendia 7 ramos (construção, limpeza, beleza...). Agora atende **só pets**. A estrutura de textos por ramo (`segmentos.ts`) foi mantida, mas só com o ramo PET.

## Papéis (por empresa)

Uma pessoa tem **uma conta** e pode participar de **várias empresas**, com um papel diferente em cada uma (ligação **Vínculo**).

| Papel | Nome técnico | Na tela | O que faz |
|---|---|---|---|
| Administrador | `ADMIN` | Administrador | Criou a empresa. Gerencia serviços, equipe, convites, aprovações e todos os passeios. Vê o financeiro da empresa |
| Executor | `EXECUTOR` | Passeador | Faz os passeios em que foi designado e preenche o relatório. Agenda para os próprios clientes, pede preços e cria serviços (com aprovação). Vê o próprio financeiro |
| Cliente | `CLIENTE` | Cliente | Cadastra os pets, pede passeios ao passeador responsável, aceita agendamentos e lê os relatórios |

## Funcionalidades prontas

**Conta**
- Cadastro, login (JWT de 1 dia), editar perfil, trocar senha, "esqueci a senha" (link de 1 hora)
- Limite de 10 tentativas por minuto em login, cadastro, esqueci e redefinir senha

**Empresa**
- Criar empresa com logo e **modelo de pagamento dos passeadores**: comissão (%) ou salário fixo, com explicação e exemplo. Muda depois em "Dados da empresa"
- Serviços sugeridos de pets (passeio 30 min, passeio 1 h, visita pet sitter), com checklist pronto
- Só cria empresa quem não participa de nenhuma ou já é ADMIN em alguma

**Equipe e convites**
- Convite por link ou email (72 h). Convite de passeador já habilita os serviços escolhidos; convite de cliente já define o passeador responsável
- Botão de copiar o link funciona também pelo IP da rede (sem https)
- Cada cliente tem **um** passeador responsável. Na Equipe, o admin define a comissão ou o salário de cada passeador

**Serviços**
- Catálogo: nome, descrição, valor, quem faz, checklist do relatório (`CHECKBOX`, `TEXTO_CURTO`, `TEXTO_LONGO`, obrigatórios e ordem)
- **Preço próprio do passeador**: ele pede outro valor; vale depois que o admin aprova. O admin pode voltar ao preço da empresa
- **Passeador cria serviço**: fica "aguardando aprovação" (não pode ser agendado, só ele e o admin veem) até o admin aprovar ou recusar

**Passeios (ordens de serviço)**
- Status: `PENDENTE_EXECUTOR` (cliente pediu) / `PENDENTE_CLIENTE` (passeador agendou) → `AGENDADO` → `EXECUTANDO` → `FINALIZADO`; também `CANCELADO` e `RECUSADO`. `RECEBIDO` existe no banco mas não é usado
- **Quem cria e quem aceita**: admin agenda já confirmado; passeador agenda para os próprios clientes e o cliente aceita/recusa; cliente pede ao passeador responsável, que aceita/recusa. Quem pediu pode desistir
- Valor do item = preço próprio aprovado do passeador, ou o preço do catálogo
- Relatório por item (início/fim, checklist, observações, **fotos enviadas pelo celular**). Com todos os itens com relatório, vira `FINALIZADO`
- "Passeio já concluído": depois do horário, o passeador registra o relatório sem ter apertado "iniciar"
- **Avisos no menu**: número no menu com o que espera resposta (pedidos para o passeador, agendamentos para o cliente, aprovações para o admin). Atualiza sozinho a cada minuto e aparece no título da aba. Ainda **não há notificação push nem email** desses eventos

**Pets (assistidos)**
- Espécie, raça, porte, idade, **foto enviada** e briefing ("Informações importantes" e "Lembretes")
- Cadastram: o cliente (os próprios) e o admin. Editam: admin, dono e o passeador responsável

**Financeiro do admin**
- Por mês (data do passeio): Recebido, A receber, Previsto. Filtros por **cliente** e por **passeador**
- Marcar como recebido (forma + data), "Em aberto" por cliente, ranking por serviço e por passeador
- **Gráfico de barras dos últimos 6 meses**
- **Pagamento da equipe**: quanto pagar a cada passeador (comissão sobre os passeios concluídos ou salário) e quanto fica para a empresa
- Pedidos não aceitos, cancelados e recusados ficam fora das contas

**Financeiro do passeador**
- Quanto ganha no mês (comissão ou salário), quanto ainda pode ganhar com o que está agendado, lista dos passeios, **mesmo gráfico de 6 meses** e ranking por serviço

**App instalável (PWA)**
- Manifesto, ícones, tela cheia, cor da barra do sistema, respeita entalhe e barra de gestos
- Botão "Instalar o app no celular" no menu da conta e aviso na tela inicial (no iPhone mostra o passo a passo do Safari)
- Service worker guarda os arquivos do app (abre rápido e sem internet mostra a última versão). Nunca guarda dados da API nem fotos. Só é registrado no site final (`npm run build`), não no modo de desenvolvimento

## Stack técnica

Monorepo com npm workspaces (`apps/*`):

- **`apps/api`**: NestJS 10 + Prisma 6 + PostgreSQL 16, JWT (passport), class-validator, nodemailer, multer (upload), @nestjs/throttler
- **`apps/web`**: React 19 + Vite + TypeScript + Tailwind CSS 4 + React Router 7 + TanStack Query + axios + lucide-react
- **Banco**: Postgres via `docker-compose.yml` (usuário, senha e banco `universal`, porta 5432)

Como rodar: `docker compose up -d`, depois `npm run dev:api` (porta 3000) e `npm run dev --workspace=web -- --host` (porta 5173, aberto para a rede). O site repassa `/api` e `/uploads` para a API. Rode **uma** instância de cada; dois `nest start --watch` juntos disputam a porta.

Pelo celular na mesma rede: `http://<IP do computador>:5173`. Redes de empresa/faculdade costumam isolar os aparelhos; nesse caso use o roteador do celular. Instalar como app exige **https** (ou localhost), então pelo IP da rede não aparece o botão de instalar.

### Modelo de dados (Prisma)

- `User`, `RedefinicaoSenha`
- `Empresa`: nome, documento, telefone, `segmento` (só `PET`), `modeloRemuneracao` (`COMISSAO`/`SALARIO`), logoUrl
- `Vinculo`: user + empresa + papel + status; cliente tem `vinculoResponsavelId`; passeador tem `comissaoPercentual` e `salarioMensal`
- `Convite`: papel, token, email, expiração, responsável (cliente), `servicoIds` (passeador)
- `Servico`: nome, descrição, valor, ativo, `aprovado`, `criadoPorVinculoId`
- `ExecutorServico`: quem faz qual serviço, com `valor` próprio aprovado e `valorProposto` aguardando
- `CampoRelatorio`, `OrdemServico` (status, data, valor, pagoEm, formaPagamento, assistido), `OrdemServicoItem`, `Relatorio` (fotos), `RelatorioValor`
- `Assistido`: o pet (nome, foto, dados, informações, lembretes)

### Principais rotas da API

- `auth`: registro, login, me, senha, esqueci-senha, redefinir-senha
- `empresas`: criar, minhas (com responsável e remuneração), dados, membros, clientes, responsável, `PATCH membros/:id/remuneracao`, serviços sugeridos
- `empresas/:id/convites` e `convites/:token`
- `empresas/:id/servicos`: CRUD, executores, campos-relatorio, `POST/DELETE :id/meu-preco`, `PATCH/DELETE :id/executores/:vid/preco`, `PATCH :id/aprovacao`, `DELETE :id/pedido`
- `empresas/:id/ordens-servico`: criar, listar, detalhe, status, pagamento, relatório
- `empresas/:id/assistidos`
- `POST uploads` (foto, logado, JPG/PNG/WebP até 5 MB) e `GET /uploads/<arquivo>`

Controle de acesso por empresa: `EmpresaRoleGuard` + `@Roles(...)`; cada serviço confere se o registro é da empresa.

## Pendências conhecidas (antes de colocar no ar)

- **Nada usado por pessoas reais ainda.** Nenhum deploy
- **Fotos no disco do servidor** (`apps/api/uploads`): em hospedagens que apagam o disco a cada publicação (Railway, Render), as fotos somem. Mover para armazenamento externo (S3, Cloudflare R2, Cloudinary) antes do deploy. Também não há cota por usuário
- **Notificações**: pedidos e aceites só aparecem com o app aberto. Faltam email ou push (e o link do relatório para WhatsApp)
- **SMTP** não configurado: emails só aparecem no console da API
- **Testes automatizados**: só o de exemplo. Prioridade: máquina de status dos passeios, cálculo do financeiro e isolamento entre empresas
- **Em produção** o site precisa ser servido no mesmo endereço da API (proxy de `/api` e `/uploads`), com https
- Trabalho desta fase ainda **não commitado** no git
