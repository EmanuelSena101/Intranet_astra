"use client";

import { FormEvent, useState } from "react";
import { apiUrl } from "@/lib/api";

type SearchMode = "number" | "description";

type SearchResult = {
  source: string;
  mode: SearchMode;
  query: string;
  entries: Array<{
    number: string;
    description: string;
  }>;
};

export function BilhetagemSearch() {
  const [mode, setMode] = useState<SearchMode>("number");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiUrl("/bilhetagem/phone-book/search")}?mode=${mode}&query=${encodeURIComponent(query)}`,
        {
          credentials: "include",
          headers: { Accept: "application/json" }
        }
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "A pesquisa falhou.");
        setResult(null);
        return;
      }

      const payload = (await response.json()) as SearchResult;
      setResult(payload);
    } catch {
      setError("Não foi possível consultar o diretório telefônico.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={handleSubmit} className="section-card rounded-[28px] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Pesquisa
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
          Número ou descrição
        </h2>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setMode("number")}
            className={`brand-pill ${mode === "number" ? "brand-pill-active" : ""}`}
          >
            Por telefone
          </button>
          <button
            type="button"
            onClick={() => setMode("description")}
            className={`brand-pill ${mode === "description" ? "brand-pill-active" : ""}`}
          >
            Por descrição
          </button>
        </div>

        <div className="mt-6 space-y-2">
          <label htmlFor="query" className="text-sm font-medium text-[var(--muted)]">
            Texto de busca
          </label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="brand-input"
            placeholder={mode === "number" ? "Ex.: 1934" : "Ex.: CLIENTE"}
          />
        </div>

        {error ? <div className="brand-alert mt-5">{error}</div> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="brand-button-primary mt-6"
        >
          {isLoading ? "Pesquisando..." : "Pesquisar"}
        </button>
      </form>

      <section className="section-card rounded-[28px] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Resultado
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
          Entradas encontradas
        </h2>

        {!result ? (
          <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
            Execute uma busca para listar os resultados.
          </p>
        ) : result.entries.length === 0 ? (
          <div className="brand-soft-panel mt-6 rounded-2xl px-4 py-4 text-sm text-[var(--muted)]">
            Nenhum registro encontrado para `{result.query}`.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[24px] border border-[var(--border)]">
            <div className="brand-table-head grid grid-cols-[0.38fr_0.62fr] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              <span>Número</span>
              <span>Descrição</span>
            </div>
            <div className="divide-y divide-[var(--border)] bg-white/85">
              {result.entries.map((entry) => (
                <div
                  key={`${entry.number}-${entry.description}`}
                  className="grid grid-cols-[0.38fr_0.62fr] px-4 py-4 text-sm"
                >
                  <span className="font-medium text-[var(--foreground)]">{entry.number}</span>
                  <span className="text-[var(--muted)]">
                    {entry.description || "Sem descrição"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
