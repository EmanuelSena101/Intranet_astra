import Link from "next/link";
import { BilhetagemEntryForm } from "@/components/bilhetagem-entry-form";
import { ModuleGuard } from "@/components/module-guard";

export default function BilhetagemCadastroDescricaoPage() {
  return (
    <ModuleGuard requiredModule="Bilhetagem">
      <main className="shell-grid min-h-screen px-6 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <header className="glass rounded-[32px] p-8 md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="inline-flex rounded-full border border-[var(--border)] bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                  Bilhetagem
                </p>
                <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
                  Cadastro de descrição
                </h1>
                <p className="mt-4 text-base leading-7 text-[var(--muted)] md:text-lg">
                  Este fluxo replica a regra do legado para telefones novos,
                  telefones sem descrição e tentativas de duplicidade.
                </p>
              </div>

              <Link
                href="/bilhetagem"
                className="inline-flex rounded-2xl border border-[var(--border)] bg-white/85 px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                Voltar ao módulo
              </Link>
            </div>
          </header>

          <BilhetagemEntryForm />
        </div>
      </main>
    </ModuleGuard>
  );
}
