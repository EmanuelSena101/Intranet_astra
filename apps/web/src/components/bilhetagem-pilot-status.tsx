"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type BilhetagemBootstrap = {
  module: string;
  status: string;
  directory: {
    provider: string;
    source: string;
    openEdgeConfigured: boolean;
    tableName?: string | null;
  };
  calls: {
    provider: string;
    source: string;
    openEdgeConfigured: boolean;
    callsTableName?: string | null;
    directoryTableName?: string | null;
    usersTableName?: string | null;
  };
};

type BilhetagemDiagnostics = {
  connectionStatus: string;
  connectionMessage: string;
  probes: Array<{
    key: string;
    label: string;
    status: string;
    message: string;
    tableName?: string | null;
    columns: string[];
  }>;
};

type BootstrapState =
  | { status: "loading" }
  | { status: "loaded"; payload: BilhetagemBootstrap; diagnostics: BilhetagemDiagnostics }
  | { status: "hidden" }
  | { status: "error"; message: string };

export function BilhetagemPilotStatus() {
  const [state, setState] = useState<BootstrapState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadBootstrap() {
      try {
        const [bootstrapResponse, diagnosticsResponse] = await Promise.all([
          fetch(apiUrl("/bilhetagem/bootstrap"), {
            credentials: "include",
            headers: {
              Accept: "application/json"
            }
          }),
          fetch(apiUrl("/bilhetagem/diagnostics"), {
            credentials: "include",
            headers: {
              Accept: "application/json"
            }
          })
        ]);

        if (bootstrapResponse.status === 403 || diagnosticsResponse.status === 403) {
          if (!cancelled) {
            setState({ status: "hidden" });
          }

          return;
        }

        if (!bootstrapResponse.ok || !diagnosticsResponse.ok) {
          const body = (await bootstrapResponse.json().catch(() => null)) as
            | { error?: string; detail?: string; title?: string }
            | null;

          if (!cancelled) {
            setState({
              status: "error",
              message:
                body?.error ??
                body?.detail ??
                body?.title ??
                "Falha ao carregar status do módulo."
            });
          }

          return;
        }

        const payload = (await bootstrapResponse.json()) as BilhetagemBootstrap;
        const diagnostics = (await diagnosticsResponse.json()) as BilhetagemDiagnostics;

        if (!cancelled) {
          setState({ status: "loaded", payload, diagnostics });
        }
      } catch {
        if (!cancelled) {
          setState({
            status: "error",
            message: "Não foi possível consultar o status do módulo Bilhetagem."
          });
        }
      }
    }

    void loadBootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "hidden") {
    return null;
  }

  return (
    <article className="section-card rounded-[28px] p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        Status
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
        Integrações do módulo
      </h2>

      {state.status === "loading" ? (
        <p className="mt-6 text-sm leading-6 text-[var(--muted)]">Carregando informações...</p>
      ) : null}

      {state.status === "error" ? (
        <div className="brand-alert mt-6">{state.message}</div>
      ) : null}

      {state.status === "loaded" ? (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="brand-metric rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Módulo
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {state.payload.module}
              </p>
            </div>
            <div className="brand-metric rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Diretório
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {state.payload.directory.source}
              </p>
            </div>
            <div className="brand-metric rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Ligações
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {state.payload.calls.source}
              </p>
            </div>
            <div className="brand-metric rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Status
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {state.diagnostics.connectionStatus}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="brand-soft-panel rounded-[24px] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                Diretório telefônico
              </p>
              <div className="mt-4 grid gap-3">
                <StatusRow label="Provider" value={state.payload.directory.provider} />
                <StatusRow label="Fonte ativa" value={state.payload.directory.source} />
                <StatusRow
                  label="OpenEdge"
                  value={state.payload.directory.openEdgeConfigured ? "configurado" : "não configurado"}
                />
                <StatusRow
                  label="Tabela"
                  value={state.payload.directory.tableName || "não informada"}
                />
              </div>
            </div>

            <div className="brand-soft-panel rounded-[24px] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                Ligações
              </p>
              <div className="mt-4 grid gap-3">
                <StatusRow label="Provider" value={state.payload.calls.provider} />
                <StatusRow label="Fonte ativa" value={state.payload.calls.source} />
                <StatusRow
                  label="OpenEdge"
                  value={state.payload.calls.openEdgeConfigured ? "configurado" : "não configurado"}
                />
                <StatusRow
                  label="Tabela de ligações"
                  value={state.payload.calls.callsTableName || "não informada"}
                />
                <StatusRow
                  label="Tabela de descrições"
                  value={state.payload.calls.directoryTableName || "não informada"}
                />
                <StatusRow
                  label="Tabela de usuários"
                  value={state.payload.calls.usersTableName || "não informada"}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
              Diagnóstico OpenEdge
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {state.diagnostics.connectionMessage}
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {state.diagnostics.probes.map((probe) => (
                <div key={probe.key} className="brand-soft-panel rounded-[22px] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{probe.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                        {probe.status}
                      </p>
                    </div>
                    <ProbeStatus status={probe.status} />
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{probe.message}</p>

                  <div className="mt-4 space-y-2">
                    <StatusRow label="Tabela" value={probe.tableName || "não informada"} />
                    <StatusRow
                      label="Colunas"
                      value={probe.columns.length > 0 ? probe.columns.join(", ") : "não disponíveis"}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </article>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="brand-soft-panel rounded-2xl px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function ProbeStatus({ status }: { status: string }) {
  const colorClass =
    status === "ok"
      ? "bg-[var(--primary)]"
      : status === "error"
        ? "bg-[var(--secondary)]"
        : "bg-[var(--muted)]";

  return <span className={`mt-1 h-3 w-3 rounded-full ${colorClass}`} />;
}
