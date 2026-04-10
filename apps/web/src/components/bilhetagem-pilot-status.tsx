"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type BilhetagemBootstrap = {
  module: string;
  status: string;
  source: string;
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
                "O bootstrap do módulo não respondeu como esperado."
            });
          }

          return;
        }

        const payload = (await response.json()) as BilhetagemBootstrap;

        if (!cancelled) {
          setState({
            status: "loaded",
            payload
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            status: "error",
            message: "Não foi possível consultar o bootstrap do módulo Bilhetagem."
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
        Estado do piloto
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
        Bilhetagem ligado na API nova
      </h2>

      {state.status === "loading" ? (
        <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
          Carregando o bootstrap do módulo e validando o contrato atual da API.
        </p>
      ) : null}

      {state.status === "error" ? (
        <div className="mt-6 rounded-2xl border border-[#d9917a] bg-[#fff2ee] px-4 py-4 text-sm text-[#8a3c28]">
          {state.message}
        </div>
      ) : null}

      {state.status === "loaded" ? (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Módulo
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {state.payload.module}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Fonte
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {state.payload.source}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Status
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {state.payload.status}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                Telas mapeadas
              </p>
              <div className="mt-4 grid gap-2">
                {state.payload.screens.map((screen) => (
                  <div
                    key={screen}
                    className="rounded-2xl border border-[var(--border)] bg-[#faf6ef] px-4 py-3 text-sm font-medium text-[var(--foreground)]"
                  >
                    {screen}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--border)] bg-white/80 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                Próximas entregas
              </p>
              <div className="mt-4 grid gap-2">
                {state.payload.firstDeliverables.map((deliverable, index) => (
                  <div
                    key={deliverable}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[#faf6ef] px-4 py-3 text-sm"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="font-medium text-[var(--foreground)]">{deliverable}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </article>
  );
}
