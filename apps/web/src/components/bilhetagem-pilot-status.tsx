"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type BilhetagemBootstrap = {
  module: string;
  status: string;
  directorySource: string;
  callsSource: string;
  screens: string[];
  firstDeliverables: string[];
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
                {state.payload.directorySource}
              </p>
            </div>
            <div className="brand-metric rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Ligações
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {state.payload.callsSource}
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
        </>
      ) : null}
    </article>
  );
}
