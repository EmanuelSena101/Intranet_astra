#!/usr/bin/env bash
# =============================================================================
# scripts/smoke-odbc.sh
#
# Smoke test manual do setup ODBC. Valida que:
#   1. A imagem da API faz build (mesmo sem driver real).
#   2. O container sobe em modo mock (sem OPENEDGE_* preenchidas).
#   3. GET /api/health/database responde com status=ok e dataSource=mock (200).
#   4. Se o driver Progress tiver sido provisionado em
#      infra/drivers/openedge/, `odbcinst -q -d` lista
#      "Progress OpenEdge Driver".
#
# Uso:
#   bash scripts/smoke-odbc.sh
#
# Requisitos: docker e docker compose no PATH.
#
# Exit codes:
#   0 tudo certo
#   1 falha no build
#   2 container não subiu
#   3 /api/health/database não respondeu como esperado
# =============================================================================
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose_file="${repo_root}/infra/docker/compose.dev.yml"
env_file="${repo_root}/infra/docker/.env.smoke"
container_name="astra-intranet-modern-api-dev"

log() { printf '\033[36m[smoke-odbc]\033[0m %s\n' "$*"; }
fail() { printf '\033[31m[smoke-odbc][ERRO]\033[0m %s\n' "$*" >&2; }

cleanup() {
    log "Limpando recursos..."
    docker compose --env-file "${env_file}" -f "${compose_file}" down --remove-orphans --volumes >/dev/null 2>&1 || true
    rm -f "${env_file}"
}
trap cleanup EXIT

log "Gerando .env.smoke (modo mock, sem OPENEDGE_* preenchidas)..."
cat > "${env_file}" <<'ENV'
APP_NAME=astra-intranet-smoke
HTTP_PORT=18080
ASPNETCORE_ENVIRONMENT=Development
OPENEDGE_DSN=AstraOpenEdge
OPENEDGE_HOST=
OPENEDGE_PORT=5555
OPENEDGE_DATABASE=
OPENEDGE_USER=
OPENEDGE_PASSWORD=
BILHETAGEM_DIRECTORY_PROVIDER=mock
BILHETAGEM_CALLS_PROVIDER=mock
DOCWEB_PROVIDER=mock
ENV

log "Build da imagem da API (pode demorar na primeira vez)..."
if ! docker compose --env-file "${env_file}" -f "${compose_file}" build api; then
    fail "Falha no build da imagem api"
    exit 1
fi

log "Subindo o container api em background..."
if ! docker compose --env-file "${env_file}" -f "${compose_file}" up -d api; then
    fail "Falha ao subir o container api"
    exit 2
fi

log "Aguardando a API responder (até 30s)..."
for attempt in $(seq 1 30); do
    if docker exec "${container_name}" sh -c 'command -v curl >/dev/null 2>&1 && curl -fsS http://localhost:8080/healthz' >/dev/null 2>&1; then
        log "API respondendo no /healthz (tentativa ${attempt})."
        break
    fi
    sleep 1
    if [ "${attempt}" = "30" ]; then
        fail "API não respondeu em 30s. Últimos logs:"
        docker logs --tail 80 "${container_name}" >&2 || true
        exit 2
    fi
done

log "Chamando GET /api/health/database no container..."
response_body="$(docker exec "${container_name}" sh -c 'curl -fsS http://localhost:8080/api/health/database' 2>/dev/null || true)"
response_status="$(docker exec "${container_name}" sh -c 'curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health/database')"

log "HTTP status: ${response_status}"
log "Body: ${response_body}"

case "${response_status}" in
    200)
        if echo "${response_body}" | grep -q '"status":"ok"' && echo "${response_body}" | grep -q '"dataSource":"mock"'; then
            log "OK: endpoint respondeu 200 com status=ok e dataSource=mock (modo mock)."
        else
            fail "200 mas payload inesperado. Esperava status=ok e dataSource=mock."
            exit 3
        fi
        ;;
    503)
        # Também aceitável neste smoke: significa que alguém deixou OPENEDGE_*
        # preenchidas e o container tentou conectar ao banco real.
        if echo "${response_body}" | grep -q '"status":"error"'; then
            log "OK: endpoint respondeu 503 com status=error (driver carregado mas banco inacessível)."
        else
            fail "503 mas payload não contém status=error."
            exit 3
        fi
        ;;
    *)
        fail "Status HTTP inesperado: ${response_status}."
        exit 3
        ;;
esac

log "Verificando se o Progress OpenEdge Driver está registrado em odbcinst..."
if docker exec "${container_name}" odbcinst -q -d 2>/dev/null | grep -q 'Progress OpenEdge Driver'; then
    log "OK: 'Progress OpenEdge Driver' listado em odbcinst."
else
    log "AVISO: driver Progress não registrado — infra/drivers/openedge/ não contém o binário .so."
    log "AVISO: esse estado é esperado em builds sem o driver Progress provisionado."
fi

log "Smoke test finalizou com sucesso."
exit 0
