"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type StatusFilter = "active" | "cancelled" | "all";
type VisibilityFilter = "all" | "published" | "internal";

type SearchResult = {
  source: string;
  query: string;
  status: StatusFilter;
  visibility: VisibilityFilter;
  entries: Array<{
    documentNumber: string;
    sectorCode: string;
    title: string;
    fileName: string;
    fileSizeKilobytes: number;
    documentDate: string;
    documentTime: string;
    statusCode: string;
    expirationDate?: string | null;
    representativeCount: number;
  }>;
};

type ErrorResponse = {
  error?: string;
  detail?: string;
  title?: string;
};

export function DocWebDocumentList() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialDocuments() {
      setIsLoading(true);

      try {
        const response = await fetch(
          `${apiUrl("/docweb/documents")}?status=active&visibility=all&query=`,
          {
            credentials: "include",
            headers: { Accept: "application/json" }
          }
        );

        const body = (await response.json().catch(() => null)) as SearchResult | ErrorResponse | null;

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          const apiError = body as ErrorResponse | null;
          setError(
            apiError?.error ??
              apiError?.detail ??
              apiError?.title ??
              "Não foi possível carregar os documentos."
          );
          setResult(null);
          return;
        }

        setResult(body as SearchResult);
      } catch {
        if (!cancelled) {
          setError("Não foi possível carregar os documentos.");
          setResult(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiUrl("/docweb/documents")}?status=${status}&visibility=${visibility}&query=${encodeURIComponent(query)}`,
        {
          credentials: "include",
          headers: { Accept: "application/json" }
        }
      );

      const body = (await response.json().catch(() => null)) as SearchResult | ErrorResponse | null;

      if (!response.ok) {
        const apiError = body as ErrorResponse | null;
        setError(
          apiError?.error ??
            apiError?.detail ??
            apiError?.title ??
            "Não foi possível consultar as circulares."
        );
        setResult(null);
        return;
      }

      setResult(body as SearchResult);
    } catch {
      setError("Não foi possível consultar as circulares.");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <form onSubmit={handleSubmit} className="section-card rounded-[28px] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Consulta
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
          Filtros de documentos
        </h2>

        <div className="mt-6 space-y-2">
          <label htmlFor="query" className="text-sm font-medium text-[var(--muted)]">
            Número, título, setor ou arquivo
          </label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="brand-input"
            placeholder="Ex.: 101/26 ou Circular"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium text-[var(--muted)]">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              className="brand-input"
            >
              <option value="active">Ativos</option>
              <option value="cancelled">Cancelados</option>
              <option value="all">Todos</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="visibility" className="text-sm font-medium text-[var(--muted)]">
              Publicação
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as VisibilityFilter)}
              className="brand-input"
            >
              <option value="all">Todos</option>
              <option value="published">Publicados</option>
              <option value="internal">Pendentes / internos</option>
            </select>
          </div>
        </div>

        {error ? <div className="brand-alert mt-5">{error}</div> : null}

        <button type="submit" disabled={isLoading} className="brand-button-primary mt-6">
          {isLoading ? "Consultando..." : "Consultar"}
        </button>
      </form>

      <section className="section-card rounded-[28px] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Resultado
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
          Circulares encontradas
        </h2>

        {!result ? (
          <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
            {isLoading ? "Carregando documentos..." : "Execute uma consulta para listar os documentos."}
          </p>
        ) : result.entries.length === 0 ? (
          <div className="brand-soft-panel mt-6 rounded-2xl px-4 py-4 text-sm text-[var(--muted)]">
            Nenhum documento encontrado para os filtros informados.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-[24px] border border-[var(--border)]">
            <div className="min-w-[980px]">
              <div className="brand-table-head grid grid-cols-[0.9fr_0.7fr_2fr_1.4fr_0.8fr_0.9fr_0.8fr_0.7fr] gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                <span>Circular</span>
                <span>Setor</span>
                <span>Título</span>
                <span>Arquivo</span>
                <span>Tam. KB</span>
                <span>Data</span>
                <span>Hora</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-[var(--border)] bg-white/85">
                {result.entries.map((entry) => (
                  <div
                    key={`${entry.documentNumber}-${entry.fileName}`}
                    className="grid grid-cols-[0.9fr_0.7fr_2fr_1.4fr_0.8fr_0.9fr_0.8fr_0.7fr] gap-3 px-4 py-4 text-sm"
                  >
                    <span className="font-medium text-[var(--foreground)]">{entry.documentNumber}</span>
                    <span className="text-[var(--muted)]">{entry.sectorCode}</span>
                    <span className="text-[var(--foreground)]">{entry.title}</span>
                    <span className="text-[var(--muted)]">{entry.fileName}</span>
                    <span className="text-[var(--muted)]">{entry.fileSizeKilobytes.toFixed(2)}</span>
                    <span className="text-[var(--muted)]">{entry.documentDate}</span>
                    <span className="text-[var(--muted)]">{entry.documentTime}</span>
                    <span className="font-semibold text-[var(--primary)]">{entry.statusCode}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
