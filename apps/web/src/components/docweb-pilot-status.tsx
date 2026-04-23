"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type DocWebBootstrap = {
  module: string;
  status: string;
  provider: string;
  source: string;
  totalDocuments: number;
  publishedDocuments: number;
  cancelledDocuments: number;
};

type BootstrapState =
  | { status: "loading" }
  | { status: "loaded"; payload: DocWebBootstrap }
  | { status: "hidden" }
  | { status: "error"; message: string };

export function DocWebPilotStatus() {
  const [state, setState] = useState<BootstrapState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadBootstrap() {
      try {
        const response = await fetch(apiUrl("/docweb/bootstrap"), {
          credentials: "include",
          headers: { Accept: "application/json" }
        });

        if (response.status === 403) {
          if (!cancelled) {
            setState({ status: "hidden" });
          }

          return;
        }

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

        const payload = (await response.json()) as DocWebBootstrap;

        if (!cancelled) {
          setState({ status: "loaded", payload });
        }
      } catch {
        if (!cancelled) {
          setState({
            status: "error",
            message: "Não foi possível consultar o status do módulo DocWeb."
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
        Operação do módulo
      </h2>

      {state.status === "loading" ? (
        <p className="mt-6 text-sm leading-6 text-[var(--muted)]">Carregando informações...</p>
      ) : null}

      {state.status === "error" ? <div className="brand-alert mt-6">{state.message}</div> : null}

      {state.status === "loaded" ? (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <MetricCard label="Módulo" value={state.payload.module} />
            <MetricCard label="Provider" value={state.payload.provider} />
            <MetricCard label="Fonte" value={state.payload.source} />
            <MetricCard label="Documentos" value={String(state.payload.totalDocuments)} />
            <MetricCard label="Publicados" value={String(state.payload.publishedDocuments)} />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <MetricCard label="Cancelados" value={String(state.payload.cancelledDocuments)} />
            <MetricCard label="Status" value={state.payload.status} />
          </div>
        </>
      ) : null}
    </article>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="brand-metric rounded-2xl p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
