import Link from "next/link";
import { AdminOnly } from "@/components/admin-only";
import { BilhetagemPilotStatus } from "@/components/bilhetagem-pilot-status";
import { BrandMark } from "@/components/brand-mark";
import { ModuleGuard } from "@/components/module-guard";

const actions = [
  {
    href: "/bilhetagem/ligacoes",
    title: "Consulta de ligações",
    text: "Consulta por período, ramal ou número."
  },
  {
    href: "/bilhetagem/pesquisa",
    title: "Pesquisa",
    text: "Busca por número ou descrição."
  },
  {
    href: "/bilhetagem/cadastro-descricao",
    title: "Cadastro de descrição",
    text: "Inclusão e atualização de descrição telefônica."
  }
];

export default function BilhetagemPage() {
  return (
    <ModuleGuard requiredModule="Bilhetagem">
      <main className="shell-grid min-h-screen px-6 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <header className="glass rounded-[36px] p-8 md:p-10">
            <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <section>
                <BrandMark compact />

                <div className="mt-7 max-w-3xl">
                  <h1 className="text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
                    Bilhetagem
                  </h1>
                  <p className="mt-4 text-base leading-7 text-[var(--muted)] md:text-lg">
                    Consultas e cadastros do módulo.
                  </p>
                </div>
              </section>

              <aside className="section-card rounded-[28px] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Navegação rápida
                </p>
                <div className="mt-4 grid gap-3">
                  {actions.map((action) => (
                    <Link key={action.href} href={action.href} className="brand-button-secondary">
                      {action.title}
                    </Link>
                  ))}
                </div>

                <Link href="/" className="brand-button-secondary mt-6 inline-flex">
                  Voltar ao início
                </Link>
              </aside>
            </div>
          </header>

          <section className="section-card rounded-[30px] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Serviços
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Ações disponíveis
            </h2>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {actions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="brand-soft-panel rounded-[24px] p-5 transition hover:-translate-y-0.5 hover:border-[var(--primary)]"
                >
                  <p className="text-base font-semibold text-[var(--foreground)]">{action.title}</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{action.text}</p>
                </Link>
              ))}
            </div>
          </section>
          <AdminOnly>
            <BilhetagemPilotStatus />
          </AdminOnly>
        </div>
      </main>
    </ModuleGuard>
  );
}
