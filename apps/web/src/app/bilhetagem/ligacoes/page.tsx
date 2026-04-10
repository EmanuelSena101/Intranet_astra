import Link from "next/link";
import { BilhetagemCallReport } from "@/components/bilhetagem-call-report";
import { BrandMark } from "@/components/brand-mark";
import { ModuleGuard } from "@/components/module-guard";

export default function BilhetagemLigacoesPage() {
  return (
    <ModuleGuard requiredModule="Bilhetagem">
      <main className="shell-grid min-h-screen px-6 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <header className="glass rounded-[36px] p-8 md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <BrandMark compact />
                <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
                  Consulta de ligações
                </h1>
              </div>

              <Link
                href="/bilhetagem"
                className="brand-button-secondary inline-flex"
              >
                Voltar ao módulo
              </Link>
            </div>
          </header>

          <BilhetagemCallReport />
        </div>
      </main>
    </ModuleGuard>
  );
}
