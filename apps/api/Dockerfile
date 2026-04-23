# =============================================================================
# Astra Intranet API - Dockerfile
#
# Multi-stage:
#   1. build    - compila a API com .NET 10 SDK
#   2. final    - runtime .NET 10 + unixodbc + driver Progress OpenEdge 12.8+
#
# O driver ODBC do Progress OpenEdge é licenciado e NÃO é redistribuído no
# repositório. Para builds que precisem conectar ao banco real, baixe o driver
# conforme docs/ODBC_SETUP.md e coloque-o em ../../infra/drivers/openedge/ ANTES
# do build.
#
# Se o diretório estiver vazio (só com README e .gitkeep), a imagem ainda é
# construída com sucesso e pode subir em modo mock; /api/health/database
# retornará status=error até o driver ser provisionado.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1 - build
# -----------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:10.0-bookworm-slim AS build
WORKDIR /src

# Build context esperado: raiz do monorepo (infra/drivers/openedge/ também
# precisa estar acessível para a stage final)
COPY Directory.Build.props ./
COPY global.json ./
COPY apps/api/src/Astra.Intranet.Api/Astra.Intranet.Api.csproj apps/api/src/Astra.Intranet.Api/
RUN dotnet restore apps/api/src/Astra.Intranet.Api/Astra.Intranet.Api.csproj

COPY apps/api/src/Astra.Intranet.Api/ apps/api/src/Astra.Intranet.Api/
RUN dotnet publish apps/api/src/Astra.Intranet.Api/Astra.Intranet.Api.csproj \
        -c Release \
        -o /app/publish \
        /p:UseAppHost=false

# -----------------------------------------------------------------------------
# Stage 2 - final (runtime)
# -----------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:10.0-bookworm-slim AS final
WORKDIR /app

# Dependências mínimas para ODBC + TLS
# (unixodbc-dev fica apenas na stage build para não inflar a imagem final)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        unixodbc \
        odbcinst \
        libssl-dev \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Driver ODBC Progress OpenEdge
# O conteúdo de infra/drivers/openedge/ é copiado para dentro do container em
# /opt/progress/odbc/. Em builds sem driver real, só vão README.md e .gitkeep,
# e o driver não será registrado.
COPY infra/drivers/openedge/ /opt/progress/odbc/

# Registra o driver no odbcinst.ini **apenas** se o binário efetivamente existir.
# O nome libpgoe*.so varia conforme a versão do driver (ex.: libpgoe1227.so para
# a 12.8); resolvemos dinamicamente no build. Para descobrir manualmente:
#   docker exec <api> ls /opt/progress/odbc/lib/libpgoe*.so
RUN set -eux; \
    mkdir -p /opt/progress/odbc/lib; \
    driver_path="$(ls /opt/progress/odbc/lib/libpgoe*.so 2>/dev/null | head -n1 || true)"; \
    if [ -n "$driver_path" ]; then \
        printf '%s\n' \
            '[Progress OpenEdge Driver]' \
            'Description=Progress OpenEdge 12.8 Driver' \
            "Driver=${driver_path}" \
            "Setup=${driver_path}" \
            'UsageCount=1' \
            > /etc/odbcinst.ini; \
        echo "[odbcinst] registered Progress OpenEdge Driver -> ${driver_path}"; \
    else \
        echo "[odbcinst] Progress driver não encontrado em /opt/progress/odbc/lib/ - imagem vai rodar em modo mock"; \
    fi

# Variáveis de ambiente para o runtime ODBC encontrar arquivos de configuração
# e o .so do driver. ODBCINI é gerado em runtime pelo docker-entrypoint.sh a
# partir das variáveis OPENEDGE_*.
ENV ODBCINI=/etc/odbc.ini \
    ODBCSYSINI=/etc \
    LD_LIBRARY_PATH=/opt/progress/odbc/lib:/usr/lib/x86_64-linux-gnu \
    ASPNETCORE_URLS=http://0.0.0.0:8080

COPY --from=build /app/publish .

# Entrypoint gera /etc/odbc.ini a partir das OPENEDGE_* antes de subir a API.
COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["dotnet", "Astra.Intranet.Api.dll"]
