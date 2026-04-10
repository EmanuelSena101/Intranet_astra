"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
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
    text: "Interface renovada em Next.js, mantendo os mesmos fluxos mentais do legado para reduzir atrito de adoção."
  },
  {
    title: "Backend .NET",
    text: "Autenticação, permissões, integração OpenEdge e adapters legados concentrados em uma API única e rastreável."
  },
  {
    title: "Infra Docker",
    text: "Stack pronta para Compose e Portainer, com Caddy na borda e desenho voltado para execução externa."
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
        <header className="glass rounded-[36px] p-8 md:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.18fr_0.82fr]">
            <section>
              <BrandMark subtitle="Nova base da intranet ASTRA com identidade visual alinhada à marca, mantendo módulos, permissões e comportamento operacional." />

              <div className="mt-8 max-w-3xl">
                <h1 className="text-4xl font-semibold leading-tight tracking-[-0.05em] md:text-6xl">
                  Reescrita modular com cara nova, sem romper o uso diário.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
                  A nova plataforma nasce para substituir o WebSpeed por ondas:
                  mesma lógica de trabalho, mesmo banco e mesma regra de acesso,
                  agora com uma camada visual mais clara, responsiva e pronta para Docker.
                </p>
              </div>

              <div className="brand-divider mt-8" />

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {workstreams.map((stream) => (
                  <article
                    key={stream.title}
                    className="brand-soft-panel rounded-[24px] p-5 transition-transform duration-200 hover:-translate-y-1"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                      {stream.title}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{stream.text}</p>
                  </article>
                ))}
              </div>
            </section>

            <aside className="section-card rounded-[30px] p-6 md:p-7">
              <p className="brand-chip">Sessão ativa</p>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">
                {user.displayName}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Usuário <strong>{user.username}</strong> com acesso liberado a{" "}
                <strong>{user.modules.length}</strong> módulos nesta fase do rewrite.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="brand-metric rounded-[22px] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Perfis
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                    {user.roles.length}
                  </p>
                </div>
                <div className="brand-metric rounded-[22px] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    Módulos
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                    {user.modules.length}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <span key={role} className="brand-tag font-semibold uppercase tracking-[0.12em]">
                    {role}
                  </span>
                ))}
              </div>

              <div className="brand-soft-panel mt-6 rounded-[24px] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--secondary)]">
                  Diretriz de entrega
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  A prioridade continua sendo equivalência funcional. O ganho visual entra
                  sem deslocar quem já opera o sistema atual.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="brand-button-secondary mt-6 w-full"
              >
                Encerrar sessão
              </button>
            </aside>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="section-card rounded-[30px] p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Escopo inicial
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  Módulos previstos no rewrite
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
                  className="brand-soft-panel rounded-[22px] px-4 py-4 text-sm font-semibold text-[var(--foreground)]"
                >
                  {moduleName}
                </div>
              ))}
            </div>
          </article>

          <article className="section-card rounded-[30px] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Mantidos no legado
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Fora do rewrite por enquanto
            </h2>

            <div className="mt-6 flex flex-wrap gap-3">
              {excludedModules.map((moduleName) => (
                <span key={moduleName} className="brand-tag">
                  {moduleName}
                </span>
              ))}
            </div>
          </article>
        </section>

        <section className="section-card rounded-[30px] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Stack definida
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                React na frente, .NET atrás e operação pensada para Portainer.
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--muted)]">
                A arquitetura combina uma camada visual moderna com um backend mais
                previsível para o legado OpenEdge e o deploy containerizado.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="brand-soft-panel rounded-[24px] p-5">
                <p className="text-sm font-semibold text-[var(--primary)]">Web</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Next.js 16, React 19, TypeScript e Tailwind 4.
                </p>
              </div>
              <div className="brand-soft-panel rounded-[24px] p-5">
                <p className="text-sm font-semibold text-[var(--primary)]">API</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  ASP.NET Core 10, autenticação por cookie e ODBC para OpenEdge.
                </p>
              </div>
              <div className="brand-soft-panel rounded-[24px] p-5">
                <p className="text-sm font-semibold text-[var(--secondary)]">Infra</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Compose, Caddy, worker de integrações e alvo direto em Portainer.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section-card rounded-[30px] p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Acesso liberado
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Menu inicial por permissão de sessão
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--muted)]">
                O frontend já nasce consumindo os módulos liberados pelo backend.
                Nessa etapa, os módulos sem rota nova ainda seguem visíveis apenas como referência.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:max-w-[52%] lg:justify-end">
              {user.modules.map((moduleName) => {
                const route = moduleRoutes[moduleName];

                if (!route) {
                  return (
                    <span key={moduleName} className="brand-pill brand-pill-active">
                      {moduleName}
                    </span>
                  );
                }

                return (
                  <Link key={moduleName} href={route} className="brand-pill brand-pill-active">
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
