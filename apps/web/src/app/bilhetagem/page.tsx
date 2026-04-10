import Link from "next/link";
import { BilhetagemPilotStatus } from "@/components/bilhetagem-pilot-status";
import { BrandMark } from "@/components/brand-mark";
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
          <header className="glass rounded-[36px] p-8 md:p-10">
            <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
              <section>
                <BrandMark subtitle="Piloto de referência para a migração funcional do legado WebSpeed para a nova stack React + .NET." compact />

                <div className="mt-7 max-w-3xl">
                  <h1 className="text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
                    Bilhetagem
                  </h1>
                  <p className="mt-4 text-base leading-7 text-[var(--muted)] md:text-lg">
                    O módulo prova autenticação, permissões, integração com OpenEdge,
                    pesquisa, cadastros e relatórios sem alterar o caminho operacional
                    de quem já usa a intranet.
                  </p>
                </div>
              </section>

              <aside className="section-card rounded-[28px] p-6">
                <p className="brand-chip">Meta do piloto</p>
                <p className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
                  Fechar equivalência funcional antes da expansão visual mais ampla.
                </p>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  O piloto precisa sair do `mock`, confirmar tabelas reais e manter o
                  mesmo eixo de filtros, permissões e gravação do módulo legado.
                </p>
                <Link href="/" className="brand-button-secondary mt-6 inline-flex">
                  Voltar ao shell
                </Link>
              </aside>
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="section-card rounded-[30px] p-6 md:p-8">
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
                    className="brand-soft-panel flex items-center gap-4 rounded-[22px] px-4 py-4"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-[var(--foreground)]">{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="section-card rounded-[30px] p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Entidades aparentes
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Tabelas que precisam de confirmação
              </h2>

              <div className="mt-6 flex flex-wrap gap-3">
                {apparentTables.map((tableName) => (
                  <span key={tableName} className="brand-tag font-medium text-[var(--foreground)]">
                    {tableName}
                  </span>
                ))}
              </div>

              <div className="brand-soft-panel mt-8 rounded-[24px] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--secondary)]">
                  Regra de migração
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  O piloto precisa manter filtros, resultados, permissões e gravação
                  funcional antes de qualquer redesenho mais profundo de experiência.
                </p>
              </div>
            </article>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <article className="section-card rounded-[30px] p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Próximos fluxos
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Telas já iniciadas no frontend
              </h2>

              <div className="mt-6 grid gap-3">
                <Link href="/bilhetagem/ligacoes" className="brand-button-secondary text-left">
                  Consulta geral de ligações
                </Link>
                <Link href="/bilhetagem/pesquisa" className="brand-button-secondary text-left">
                  Pesquisa por número e descrição
                </Link>
                <Link
                  href="/bilhetagem/cadastro-descricao"
                  className="brand-button-secondary text-left"
                >
                  Cadastro de descrição de telefone
                </Link>
              </div>
            </article>

            <article className="section-card rounded-[30px] p-6 md:p-8">
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
                    className="brand-soft-panel rounded-[22px] px-4 py-3 text-sm font-medium text-[var(--foreground)]"
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
