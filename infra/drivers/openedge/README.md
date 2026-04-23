# Driver ODBC Progress OpenEdge

Este diretório é copiado para dentro do container `api` em `/opt/progress/odbc/`
durante o build (ver `apps/api/Dockerfile`). O driver ODBC do Progress OpenEdge
é **licenciado** e, por isso, **não é versionado neste repositório** — cada
ambiente precisa provisionar o binário manualmente antes do build.

Sem o driver presente aqui, a imagem ainda é construída com sucesso e a API
sobe em **modo mock**: o endpoint `GET /api/health/database` retorna
`status=mock` e os módulos que dependem do OpenEdge caem em fallback local.

## Versão recomendada

Progress OpenEdge **12.8** ou superior (SQL92 + ODBC). Pacote típico:

```
progress_openedge_12.8_lnxx86_64.tar.gz
```

O nome exato da biblioteca compartilhada varia por versão/patch. Em 12.8
costuma ser `libpgoe1227.so`. O Dockerfile resolve o nome dinamicamente via
`ls /opt/progress/odbc/lib/libpgoe*.so`.

## Como obter o driver

1. Acesse o portal do Progress Software Support:
   https://community.progress.com/s/products/openedge
2. Baixe o pacote "ODBC Driver" para Linux x86_64 da versão 12.8 (ou superior).
3. Descompacte localmente em um diretório temporário.
4. Copie os artefatos para este diretório preservando a estrutura esperada:

```
infra/drivers/openedge/
├── lib/
│   ├── libpgoe1227.so            (ou o .so correspondente à sua versão)
│   ├── libpgicu66.so
│   ├── libpgssl32.so
│   └── ... demais .so do pacote ...
├── locale/                       (se o pacote incluir traduções)
├── licenses/                     (opcional — anote a licença em seguros)
└── README.md                     (este arquivo)
```

5. Dê `chmod 0644` nos `.so` e `chmod 0755` em eventuais scripts auxiliares.

## Validando após o build

```bash
docker compose -f infra/docker/compose.dev.yml build api
docker compose -f infra/docker/compose.dev.yml up -d api
docker exec astra-intranet-modern-api-dev odbcinst -q -d
# Esperado: [Progress OpenEdge Driver]
```

Se aparecer `Progress OpenEdge Driver` listado, o driver foi baked-in
corretamente. Caso contrário, confira se há algum `libpgoe*.so` neste
diretório antes do build.

## Rotação de versão

Para atualizar para uma nova versão do driver:

1. Remova o conteúdo atual de `infra/drivers/openedge/` (exceto `README.md`
   e `.gitkeep`).
2. Copie os artefatos da nova versão conforme acima.
3. Rebuild da imagem da API: `docker compose -f infra/docker/compose.dev.yml build api --no-cache`.
4. Ajuste (se necessário) a linha `Description=` em `/etc/odbcinst.ini` — ver
   seção correspondente no `apps/api/Dockerfile`.

## Restrição importante

**Nunca commite o `.so` nem qualquer arquivo binário do driver neste
diretório.** O `.gitignore` do repositório ignora esses padrões, mas a
responsabilidade final de respeitar a licença Progress é do operador que
prepara o ambiente.
