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

type BootstrapState =
  | { status: "loading" }
  | { status: "loaded"; payload: BilhetagemBootstrap }
  | { status: "error"; message: string };

export function BilhetagemPilotStatus() {
  const [state, setState] = useState<BootstrapState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadBootstrap() {
      try {
        const response = await fetch(apiUrl("/bilhetagem/bootstrap"), {
          credentials: "include",
          headers: {
            Accept: "application/json"
          }
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
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

        const payload = (await response.json()) as BilhetagemBootstrap;

        if (!cancelled) {
          setState({ status: "loaded", payload });
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
                {state.payload.status}
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
