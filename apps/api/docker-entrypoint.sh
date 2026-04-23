#!/usr/bin/env sh
# =============================================================================
# docker-entrypoint.sh
#
# Gera /etc/odbc.ini em runtime a partir das variáveis de ambiente
# OPENEDGE_*, registra a DSN, e em seguida delega para o CMD (por padrão
# "dotnet Astra.Intranet.Api.dll").
#
# Se nenhuma variável OPENEDGE_* estiver definida, o script apenas loga um
# warning e segue - a API continua subindo em modo mock; /api/health/database
# retorna status "mock".
# =============================================================================
set -eu

: "${OPENEDGE_DSN:=AstraOpenEdge}"
: "${OPENEDGE_HOST:=}"
: "${OPENEDGE_PORT:=5555}"
: "${OPENEDGE_DATABASE:=}"
: "${OPENEDGE_USER:=}"
: "${OPENEDGE_PASSWORD:=}"

# Compat: a stack legada também usa OPENEDGE_USERNAME em alguns locais
if [ -z "${OPENEDGE_USER}" ] && [ -n "${OPENEDGE_USERNAME:-}" ]; then
    OPENEDGE_USER="${OPENEDGE_USERNAME}"
fi

log() {
    printf '[docker-entrypoint] %s\n' "$*" >&2
}

# Checa driver registrado — ajuda a diagnosticar imagens sem o binário
# do Progress presente em build time.
if command -v odbcinst >/dev/null 2>&1; then
    if odbcinst -q -d 2>/dev/null | grep -q 'Progress OpenEdge Driver'; then
        log "Driver Progress OpenEdge registrado em odbcinst."
    else
        log "AVISO: driver Progress OpenEdge não registrado em /etc/odbcinst.ini."
        log "AVISO: a API vai subir, mas /api/health/database deve falhar até o driver ser provisionado."
        log "AVISO: ver docs/ODBC_SETUP.md para instalar o driver em infra/drivers/openedge/."
    fi
fi

missing=""
for var in OPENEDGE_HOST OPENEDGE_DATABASE OPENEDGE_USER OPENEDGE_PASSWORD; do
    eval "value=\${$var}"
    if [ -z "${value}" ]; then
        missing="${missing} ${var}"
    fi
done

if [ -n "${missing}" ]; then
    log "AVISO: variáveis OpenEdge ausentes ou vazias:${missing}"
    log "AVISO: pulando geração de /etc/odbc.ini - a API deve rodar em modo mock (status=mock)."
else
    # Nunca logar a senha.
    log "Gerando /etc/odbc.ini para DSN='${OPENEDGE_DSN}' host='${OPENEDGE_HOST}' database='${OPENEDGE_DATABASE}'."
    cat > /etc/odbc.ini <<ODBCINI
[${OPENEDGE_DSN}]
Driver=Progress OpenEdge Driver
HostName=${OPENEDGE_HOST}
PortNumber=${OPENEDGE_PORT}
DatabaseName=${OPENEDGE_DATABASE}
UID=${OPENEDGE_USER}
PWD=${OPENEDGE_PASSWORD}
DefaultSchema=PUB
ODBCINI
    chmod 0640 /etc/odbc.ini 2>/dev/null || true
fi

log "Iniciando processo principal: $*"
exec "$@"
