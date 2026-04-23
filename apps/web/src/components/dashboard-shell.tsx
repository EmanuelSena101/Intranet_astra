"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import type { CurrentUser } from "@/components/types";
import { apiUrl } from "@/lib/api";
import { getModuleDefinition } from "@/lib/modules";

type DashboardShellProps = {
  user: CurrentUser;
};

export function DashboardShell({ user }: DashboardShellProps) {
  const accessibleModules = [...user.modules].sort((left, right) => left.localeCompare(right));
  const quickAccessModules = accessibleModules.filter(
    (moduleName) => getModuleDefinition(moduleName)?.route
  );

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
              <BrandMark />

              <div className="mt-8 max-w-3xl">
                <h1 className="text-4xl font-semibold leading-tight tracking-[-0.05em] md:text-6xl">
                  Intranet ASTRA
                </h1>
                <p className="mt-5 text-base leading-7 text-[var(--muted)] md:text-lg">
                  Selecione um módulo para continuar.
                </p>
              </div>
            </section>

            <aside className="section-card rounded-[30px] p-6 md:p-7">
              <p className="brand-chip">Sessão ativa</p>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">
                {user.displayName}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Usuário <strong>{user.username}</strong> · <strong>{user.modules.length}</strong> módulos disponíveis
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
                  Módulos
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  Disponíveis
                </h2>
              </div>
              <span className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">
                {accessibleModules.length} módulos
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {accessibleModules.map((moduleName) => {
                const moduleDefinition = getModuleDefinition(moduleName);
                const route = moduleDefinition?.route;

                if (!route) {
                  return (
                    <div
                      key={moduleName}
                      className="brand-soft-panel rounded-[22px] px-4 py-4 text-sm font-semibold text-[var(--foreground)]"
                    >
                      {moduleName}
                    </div>
                  );
                }

                return (
                  <Link
                    key={moduleName}
                    href={route}
                    className="brand-soft-panel rounded-[22px] px-4 py-4 transition hover:-translate-y-0.5 hover:border-[var(--primary)]"
                  >
                    <p className="text-sm font-semibold text-[var(--foreground)]">{moduleName}</p>
                    {moduleDefinition?.summary ? (
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {moduleDefinition.summary}
                      </p>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </article>

          <article className="section-card rounded-[30px] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Perfis
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Permissões da sessão
            </h2>

            <div className="mt-6 flex flex-wrap gap-3">
              {user.roles.map((role) => (
                <span key={role} className="brand-tag">
                  {role}
                </span>
              ))}
            </div>
          </article>
        </section>

        {quickAccessModules.length > 0 ? (
          <section className="section-card rounded-[30px] p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Acesso rápido
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  Abrir módulo
                </h2>
              </div>

              <div className="flex flex-wrap gap-3 lg:max-w-[52%] lg:justify-end">
                {quickAccessModules.map((moduleName) => (
                  <Link
                    key={moduleName}
                    href={getModuleDefinition(moduleName)?.route ?? "/"}
                    className="brand-pill brand-pill-active"
                  >
                    {moduleName}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
