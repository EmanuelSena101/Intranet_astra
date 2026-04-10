"use client";

import Link from "next/link";
import type { CurrentUser } from "@/components/types";
import { apiUrl } from "@/lib/api";

const includedModules = [
  "ReqFunc",
  "Autorizacao",
  "HoraExtra",
  "FichaAcomp",
  "InstNormativa",
  "Atendimento",
  "Reativacao",
  "FAC",
  "DocWeb",
  "Bilhetagem"
];

const excludedModules = [
  "Agenda_Recursos",
  "ArqCorp",
  "ControlesDMS",
  "Programa_EMS",
  "Balanco",
  "antes-lote-Balanco",
  "Avaliacao",
  "Becomex",
  "monitor",
  "Guias"
];

const workstreams = [
  {
    title: "Frontend React",
    text: "Next.js com shell visual novo, navegação moderna e componentes preparados para manter o fluxo mental do legado."
  },
  {
    title: "Backend .NET",
    text: "API e worker para regras de negócio, permissões, OpenEdge via ODBC e adapters de integrações legadas."
  },
  {
    title: "Infra Portainer",
    text: "Deploy container-first com Compose, Caddy na borda e montagem do driver OpenEdge por volume."
  }
];

const moduleRoutes: Record<string, string> = {
  Bilhetagem: "/bilhetagem"
};

type DashboardShellProps = {
  user: CurrentUser;
};

export function DashboardShell({ user }: DashboardShellProps) {
  async function handleLogout() {
    await fetch(apiUrl("/auth/logout"), {
      method: "POST",
      credentials: "include"
    });

    window.location.href = "/login";
  }

  return (
    <main className="shell-grid min-h-screen px-6 py-8 md:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="glass overflow-hidden rounded-[32px] p-8 md:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                Astra Intranet Modern
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-6xl">
                Reescrita modular, visual nova e deploy pronto para Docker.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
                Esta base nasce para substituir a intranet legada por ondas,
                mantendo banco, permissões e funcionamento, mas com frontend
                moderno em React e backend preparado para OpenEdge.
              </p>
            </div>

            <div className="section-card min-w-[280px] rounded-[24px] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Sessão atual
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {user.displayName}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Usuário `{user.username}` com acesso a {user.modules.length} módulos.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-[var(--border)] bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]"
                  >
                    {role}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 rounded-2xl border border-[var(--border)] bg-white/85 px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-3">
          {workstreams.map((stream) => (
            <article
              key={stream.title}
              className="section-card rounded-[28px] p-6 transition-transform duration-200 hover:-translate-y-1"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                {stream.title}
              </p>
              <p className="mt-4 text-base leading-7 text-[var(--foreground)]">
                {stream.text}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="section-card rounded-[28px] p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Escopo inicial
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  Módulos que entram no rewrite
                </h2>
              </div>
              <span className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">
                {includedModules.length} módulos
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {includedModules.map((moduleName) => (
                <div
                  key={moduleName}
                  className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-medium"
                >
                {moduleName}
                </div>
              ))}
            </div>
          </article>

          <article className="section-card rounded-[28px] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Fora do rewrite
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Mantidos no legado por enquanto
            </h2>

            <div className="mt-6 flex flex-wrap gap-3">
              {excludedModules.map((moduleName) => (
                <span
                  key={moduleName}
                  className="rounded-full border border-[var(--border)] bg-[#fbf7f2] px-3 py-2 text-sm text-[var(--muted)]"
                >
                  {moduleName}
                </span>
              ))}
            </div>
          </article>
        </section>

        <section className="section-card rounded-[28px] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Stack definida
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                React na frente, .NET atrás, Docker desde o início.
              </h2>
            </div>

            <div className="lg:col-span-2 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
                <p className="text-sm font-semibold text-[var(--primary)]">Web</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Next.js 16, React 19, TypeScript, Tailwind 4.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
                <p className="text-sm font-semibold text-[var(--primary)]">API</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  ASP.NET Core 10, OpenEdge via ODBC, auth e permissões.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/75 p-4">
                <p className="text-sm font-semibold text-[var(--primary)]">Infra</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Compose, Portainer, Caddy e worker para integrações.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section-card rounded-[28px] p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Módulos disponíveis na sessão
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Menu inicial baseado nas permissões do usuário
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--muted)]">
                Nesta fase, a autorização já nasce no backend e o frontend
                consome apenas os módulos liberados para a sessão autenticada.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:max-w-[50%] lg:justify-end">
              {user.modules.map((moduleName) => {
                const route = moduleRoutes[moduleName];

                if (!route) {
                  return (
                    <span
                      key={moduleName}
                      className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      {moduleName}
                    </span>
                  );
                }

                return (
                  <Link
                    key={moduleName}
                    href={route}
                    className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]"
                  >
                    {moduleName}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
