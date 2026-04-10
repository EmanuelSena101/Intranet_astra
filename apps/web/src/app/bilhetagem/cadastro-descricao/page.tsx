import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { BilhetagemEntryForm } from "@/components/bilhetagem-entry-form";
import { ModuleGuard } from "@/components/module-guard";

export default function BilhetagemCadastroDescricaoPage() {
  return (
    <ModuleGuard requiredModule="Bilhetagem">
      <main className="shell-grid min-h-screen px-6 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <header className="glass rounded-[36px] p-8 md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <BrandMark compact subtitle="Cadastro de descrição de telefone preservando as regras atuais de inclusão, atualização e conflito." />
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
                className="brand-button-secondary inline-flex"
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
