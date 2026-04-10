import Link from "next/link";
import { BilhetagemPilotStatus } from "@/components/bilhetagem-pilot-status";
import { ModuleGuard } from "@/components/module-guard";

const legacyScreens = [
  "bl_info.htm",
  "bl_busca_numero.htm",
  "bl_cad_descricao.htm",
  "bl_ligacoes.htm",
  "bl_ligacoes_res.htm",
  "bl_ligacoes_det.htm"
];

const apparentTables = [
  "lig-ligacao",
  "lig-ramal",
  "mgdms.lig-destino",
  "net-usuarios"
];

const firstDeliverables = [
  "Tela inicial do módulo",
  "Pesquisa por número e descrição",
  "Cadastro de descrição de telefone",
  "Filtros equivalentes da listagem principal",
  "Relatório resumido",
  "Relatório detalhado"
];

export default function BilhetagemPage() {
  return (
    <ModuleGuard requiredModule="Bilhetagem">
      <main className="shell-grid min-h-screen px-6 py-8 md:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <header className="glass rounded-[32px] p-8 md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="inline-flex rounded-full border border-[var(--border)] bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                  Piloto do Rewrite
                </p>
                <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
                  Bilhetagem
                </h1>
                <p className="mt-4 text-base leading-7 text-[var(--muted)] md:text-lg">
                  Este é o primeiro módulo candidato a sair do WebSpeed. A meta
                  é provar autenticação, permissões, OpenEdge, filtros, cadastros
                  e relatórios sem mudar o fluxo principal do usuário.
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex rounded-2xl border border-[var(--border)] bg-white/85 px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                Voltar ao shell
              </Link>
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="section-card rounded-[28px] p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Escopo funcional
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Primeiras entregas da migração
              </h2>

              <div className="mt-6 grid gap-3">
                {firstDeliverables.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-[var(--foreground)]">{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="section-card rounded-[28px] p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Entidades aparentes
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Tabelas que precisam ser confirmadas
              </h2>

              <div className="mt-6 flex flex-wrap gap-3">
                {apparentTables.map((tableName) => (
                  <span
                    key={tableName}
                    className="rounded-full border border-[var(--border)] bg-[#fbf7f2] px-4 py-2 text-sm font-medium text-[var(--foreground)]"
                  >
                    {tableName}
                  </span>
                ))}
              </div>

              <div className="mt-8 rounded-[24px] border border-[var(--border)] bg-white/70 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                  Regra de migração
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  O piloto deve manter filtros, resultados, permissões e gravação
                  funcional antes de qualquer melhoria de experiência mais ampla.
                </p>
              </div>
            </article>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <article className="section-card rounded-[28px] p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Próximas telas
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Fluxos já iniciados no frontend
              </h2>

              <div className="mt-6 grid gap-3">
                <Link
                  href="/bilhetagem/ligacoes"
                  className="rounded-2xl border border-[var(--border)] bg-white/85 px-4 py-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  Consulta geral de ligações
                </Link>
                <Link
                  href="/bilhetagem/pesquisa"
                  className="rounded-2xl border border-[var(--border)] bg-white/85 px-4 py-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  Pesquisa por número e descrição
                </Link>
                <Link
                  href="/bilhetagem/cadastro-descricao"
                  className="rounded-2xl border border-[var(--border)] bg-white/85 px-4 py-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  Cadastro de descrição de telefone
                </Link>
              </div>
            </article>

            <article className="section-card rounded-[28px] p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Legado mapeado
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Telas-fonte do WebSpeed
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {legacyScreens.map((screen) => (
                  <div
                    key={screen}
                    className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm font-medium"
                  >
                    {screen}
                  </div>
                ))}
              </div>
            </article>
          </section>

          <BilhetagemPilotStatus />
        </div>
      </main>
    </ModuleGuard>
  );
}
