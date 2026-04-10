# Astra Intranet Modern

Nova base para reescrita da intranet ASTRA em stack moderna, com:

- `Next.js + React + TypeScript` no frontend
- `ASP.NET Core 10` no backend
- `ASP.NET Core Worker` para tarefas em segundo plano
- `Docker Compose + Portainer` como alvo de deploy
- banco `Progress OpenEdge` mantido como dependência externa

## Estrutura

- `apps/web`: frontend Next.js
- `apps/api`: API ASP.NET Core
- `apps/worker`: worker para integrações e jobs
- `packages`: pacotes compartilhados
- `infra`: Docker, Caddy, Portainer e insumos de deploy
- `tests/e2e`: testes de ponta a ponta
- `docs`: escopo e planejamento

## Estado atual

Este repositório já nasce com:

- shell visual inicial
- API base com health checks, autenticação por cookie e endpoint de bootstrap
- worker base
- `Dockerfiles`
- `compose` para dev e para Portainer
- `Caddy` como edge proxy
- placeholders de configuração para OpenEdge ODBC
- piloto inicial de `Bilhetagem` com pesquisa e cadastro
- `Bilhetagem > Ligacoes` pronto para tentar `OpenEdge` por configuração, com fallback para `mock`

## Observação importante

O ambiente local atual não possui `dotnet` instalado, então os projetos `.NET` foram gerados manualmente e não foram compilados aqui. O scaffold foi preparado para funcionar em CI ou em máquina com SDK `.NET 10`.

## Primeiros passos

1. Instalar o SDK `.NET 10` na máquina de desenvolvimento ou CI.
2. Provisionar o driver ODBC do OpenEdge no caminho esperado em `infra/drivers/openedge`.
3. Ajustar `infra/docker/.env.example` para um `.env` real.
4. Subir localmente com `docker compose -f infra/docker/compose.dev.yml up --build`.
5. Evoluir o primeiro módulo piloto: `Bilhetagem`.

## Bilhetagem

O piloto atual já cobre:

- login e autorização por módulo
- pesquisa de números e descrições
- cadastro de descrição de telefone
- formulário inicial de `Ligacoes` com filtros de período, direção, escopo, ramal/número e saída resumida/detalhada

O diretório telefônico está preparado para tentar `OpenEdge` quando `Bilhetagem:Directory:TableName` for configurado no `appsettings` ou via ambiente. Enquanto isso, o modo `auto` cai em `mock`.

### Variáveis úteis

- `BILHETAGEM_DIRECTORY_PROVIDER=auto`
- `BILHETAGEM_DIRECTORY_TABLE_NAME=...`
- `BILHETAGEM_CALLS_PROVIDER=auto`
- `BILHETAGEM_CALLS_TABLE_NAME=...`
- `BILHETAGEM_CALLS_DIRECTORY_TABLE_NAME=...`
- `BILHETAGEM_CALLS_USERS_TABLE_NAME=...`
- `BILHETAGEM_CALLS_*_FIELD=...`

Depois de configurar as tabelas do Bilhetagem, o endpoint `GET /api/bilhetagem/diagnostics`
passa a informar se conexão, tabelas e colunas do OpenEdge estão acessíveis.

Exemplo de primeiro passo para sair do `mock` no diretório:

1. preencher `OPENEDGE_*`
2. definir `BILHETAGEM_DIRECTORY_PROVIDER=auto`
3. definir `BILHETAGEM_DIRECTORY_TABLE_NAME` com a tabela SQL equivalente a `lig-destino`
4. subir a stack com `docker compose --env-file infra/docker/.env.example -f infra/docker/compose.dev.yml up --build`
