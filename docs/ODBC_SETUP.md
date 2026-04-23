# Setup ODBC Progress OpenEdge

Guia de ponta a ponta para habilitar a conexão ODBC com o banco Progress
OpenEdge corporativo no container `api` da Intranet Modern. Se você seguir
esse passo a passo em máquina limpa com Docker instalado, deve levar menos
de 1 hora para ter a stack falando com o OpenEdge de homologação.

## 1. Pré-requisitos

- Docker Engine 24+ e Docker Compose v2 (`docker compose`).
- .NET 10 SDK instalado, **apenas** se for rodar os testes unitários/integração
  localmente (`dotnet test apps/api/tests/Astra.Intranet.Api.Tests`). Não é
  necessário para o build do container.
- Acesso ao portal Progress Software para baixar o driver ODBC (licenciado).

## 2. Obter o driver ODBC do Progress OpenEdge

O driver **não** é distribuído neste repositório — é licenciado pelo
Progress Software.

1. Acesse: https://community.progress.com/s/products/openedge
2. Baixe o pacote "ODBC Driver" para **Linux x86_64** versão **12.8** ou
   superior. Arquivo típico:
   ```
   progress_openedge_12.8_lnxx86_64.tar.gz
   ```
3. Descompacte localmente e coloque os artefatos em
   `infra/drivers/openedge/` preservando a estrutura:
   ```
   infra/drivers/openedge/
   ├── lib/
   │   ├── libpgoe1227.so    (ou o .so equivalente da sua versão)
   │   ├── libpgicu66.so
   │   ├── libpgssl32.so
   │   └── ... demais .so do pacote ...
   ├── locale/               (se o pacote incluir traduções)
   ├── README.md             (já presente)
   └── .gitkeep              (já presente)
   ```
4. Para descobrir o nome exato do `.so` em uma máquina já com driver
   instalado, rode:
   ```bash
   ls /opt/progress/odbc/lib/libpgoe*.so
   ```
5. Confirme que os `.so` têm `chmod 0644`. Eventuais scripts do pacote
   precisam de `chmod 0755`.

> O `.gitignore` já ignora qualquer binário dentro de
> `infra/drivers/openedge/`, só permitindo `README.md` e `.gitkeep`.
> **Nunca commit o driver** — a licença Progress proíbe redistribuição.

## 3. Configurar variáveis de ambiente

1. Copie o template:
   ```bash
   cp infra/docker/.env.example infra/docker/.env
   ```
2. Preencha no mínimo estas variáveis (modo OpenEdge real):
   ```
   OPENEDGE_DSN=AstraOpenEdge
   OPENEDGE_HOST=banco-openedge.astra.local
   OPENEDGE_PORT=5555
   OPENEDGE_DATABASE=mgdms
   OPENEDGE_USER=astra_app
   OPENEDGE_PASSWORD=<senha-do-usuario-ODBC>
   ```
3. Se quiser rodar em **modo mock** (sem banco), deixe todas em branco. A
   API sobe e `/api/health/database` retorna `status=ok, dataSource=mock`.
4. Variáveis opcionais: `OPENEDGE_CONNECTION_STRING` sobrescreve tudo se
   você já tiver uma string ODBC pronta.

## 4. Build da imagem da API

O build espera a **raiz do monorepo** como contexto (para acessar tanto
`apps/api/` quanto `infra/drivers/openedge/`). O `compose.dev.yml` já está
configurado com `context: ../..` — basta rodar:

```bash
docker compose -f infra/docker/compose.dev.yml build api
```

Durante o build:

- `unixodbc`, `odbcinst`, `libssl-dev`, `ca-certificates`, `curl` são
  instalados na imagem final.
- `unixodbc-dev` fica apenas na stage `build` (não vai para a imagem final).
- O conteúdo de `infra/drivers/openedge/` é copiado para
  `/opt/progress/odbc/` dentro do container.
- Se o Dockerfile encontrar `libpgoe*.so` em `/opt/progress/odbc/lib/`,
  registra automaticamente o driver em `/etc/odbcinst.ini`:
  ```
  [Progress OpenEdge Driver]
  Description=Progress OpenEdge 12.8 Driver
  Driver=/opt/progress/odbc/lib/libpgoe1227.so
  Setup=/opt/progress/odbc/lib/libpgoe1227.so
  UsageCount=1
  ```

## 5. Subir a stack

```bash
docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml up -d api
```

O `docker-entrypoint.sh` do container:

1. Checa se o driver está registrado em `odbcinst`.
2. Gera `/etc/odbc.ini` em runtime a partir das `OPENEDGE_*` do ambiente
   (uma DSN por arquivo; ver seção 6 abaixo).
3. Delega para o `CMD` padrão (`dotnet Astra.Intranet.Api.dll`).

## 6. Validar a conexão

### Via health check HTTP

```bash
curl http://localhost:8080/api/health/database | jq
```

Possíveis respostas:

| Status HTTP | payload                                                         | Significado                                                       |
|-------------|-----------------------------------------------------------------|-------------------------------------------------------------------|
| 200         | `{"status":"ok","dataSource":"mock","elapsedMs":0,"slow":false}`| OpenEdge não configurado — API em modo mock                       |
| 200         | `{"status":"ok","dataSource":"openedge","database":"mgdms",...}`| Conexão bem-sucedida                                              |
| 200         | `{"status":"ok","dataSource":"openedge","slow":true,...}`       | Conexão OK mas o probe demorou > 5s (alerta operacional)          |
| 503         | `{"status":"error","message":"...","code":"IM002"/"08001"/...}` | Falha ao abrir a conexão ou executar o probe                      |

### Via `isql`

```bash
docker exec astra-intranet-modern-api-dev isql -v AstraOpenEdge "$OPENEDGE_USER" "$OPENEDGE_PASSWORD"
```

Em sucesso, cai em um prompt `SQL>`. Rode `select 1 from SYSPROGRESS.SYSCALCTABLE;`
para confirmar.

### Via `odbcinst`

```bash
docker exec astra-intranet-modern-api-dev odbcinst -q -d
# Esperado: [Progress OpenEdge Driver]
```

### Via smoke script

```bash
bash scripts/smoke-odbc.sh
```

O script sobe a stack sem credenciais reais, valida que `/api/health/database`
responde, e checa se o driver está listado em `odbcinst`. Retorna exit 0 em
sucesso. Destinado a rodar em máquina limpa e em CI.

## 7. Testes automatizados

### Unitários (xUnit + Moq)

```bash
dotnet test apps/api/tests/Astra.Intranet.Api.Tests
```

Cobrem três cenários principais do `DatabaseHealthCheck`:

- Conexão OK → `status=ok`
- Conexão falha → `status=error`
- Probe demora > 5s → `status=ok, slow=true`

Mais um teste de "mock" extra e um teste de integração via
`WebApplicationFactory<Program>`.

### Integração (WebApplicationFactory)

Sobe a API em memória em modo mock e valida o endpoint `/api/health/database`.
Incluído no mesmo `dotnet test` acima.

### E2E (Playwright)

```bash
npm --workspace tests/e2e run test -- --grep "health/database"
```

Valida o endpoint rodando contra uma stack levantada via `docker compose`.

## 8. Troubleshooting

### `IM002: Data source name not found and no default driver specified`

A DSN não foi gerada em `/etc/odbc.ini`. Causas comuns:

- Container subiu antes de o entrypoint rodar (não use override de
  `ENTRYPOINT` no compose).
- Uma ou mais `OPENEDGE_*` obrigatórias estão vazias — o entrypoint loga
  `AVISO: variáveis OpenEdge ausentes` e pula a geração.
- Nome da DSN diferente: confira `OPENEDGE_DSN` vs `OpenEdge:Dsn`.

Valide:
```bash
docker exec astra-intranet-modern-api-dev cat /etc/odbc.ini
```

### `[DataDirect][ODBC lib] Data source name not found`

Driver não foi registrado. Causa comum: `infra/drivers/openedge/` vazio
no momento do build. Rode `docker exec <api> odbcinst -q -d`. Se não
aparecer `Progress OpenEdge Driver`, provisione o driver e refaça o build:

```bash
docker compose -f infra/docker/compose.dev.yml build api --no-cache
```

### `libpgoe1227.so: cannot open shared object file`

O registro em `odbcinst.ini` aponta para um `.so` que não existe ou a
`LD_LIBRARY_PATH` está errada. Verifique:

```bash
docker exec astra-intranet-modern-api-dev ls /opt/progress/odbc/lib/libpgoe*.so
docker exec astra-intranet-modern-api-dev env | grep LD_LIBRARY_PATH
```

A `LD_LIBRARY_PATH` precisa conter `/opt/progress/odbc/lib` — o Dockerfile
já seta isso.

### Timeout/ECONNREFUSED ao conectar

Firewall, porta 5555 fechada, ou o Progress não está aceitando conexões
SQL. Teste a partir do próprio container:

```bash
docker exec astra-intranet-modern-api-dev sh -c 'nc -vz $OPENEDGE_HOST $OPENEDGE_PORT'
```

Também verifique com a equipe de banco se o OpenEdge está com
`SQL-CLIENTS` habilitado para o usuário `$OPENEDGE_USER`.

### `/api/health/database` sempre retorna `status=error` com `code=null`

O probe está caindo antes de atingir o OpenEdge — geralmente unixODBC ou
DSN mal formado. Rode o endpoint de diagnósticos do Bilhetagem para ver
mais detalhes:

```bash
curl http://localhost:8080/api/bilhetagem/diagnostics | jq
```

## 9. Atualização de versão do driver

1. Baixe a nova versão do portal Progress.
2. Esvazie `infra/drivers/openedge/` mantendo apenas `README.md` e `.gitkeep`.
3. Copie o conteúdo novo mantendo a estrutura `lib/`, `locale/`, etc.
4. Se o nome do `.so` mudou (ex.: `libpgoe1228.so`), o Dockerfile resolve
   dinamicamente via glob `libpgoe*.so`, então nenhuma mudança de código
   é necessária.
5. Atualize a linha `Description=` em `apps/api/Dockerfile` para refletir
   a nova versão, se desejar.
6. Rebuild:
   ```bash
   docker compose -f infra/docker/compose.dev.yml build api --no-cache
   docker compose -f infra/docker/compose.dev.yml up -d api
   ```
7. Rode `bash scripts/smoke-odbc.sh` e `dotnet test` para validar paridade.

## 10. Referências

- [Progress OpenEdge 12.8 ODBC documentation](https://docs.progress.com/bundle/openedge-sql-reference/page/Use-the-ODBC-driver.html)
- [unixODBC tutorial](http://www.unixodbc.org/)
- Código relevante no repo:
  - `apps/api/Dockerfile`
  - `apps/api/docker-entrypoint.sh`
  - `apps/api/src/Astra.Intranet.Api/Shared/OpenEdge/OpenEdgeConnectionFactory.cs`
  - `apps/api/src/Astra.Intranet.Api/Health/DatabaseHealthCheck.cs`
  - `apps/api/tests/Astra.Intranet.Api.Tests/Health/DatabaseHealthCheckTests.cs`
  - `infra/docker/compose.dev.yml`
  - `infra/drivers/openedge/README.md`
  - `scripts/smoke-odbc.sh`
