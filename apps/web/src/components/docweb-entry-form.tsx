"use client";

import { FormEvent, useState } from "react";
import { apiUrl } from "@/lib/api";

type UpsertResponse = {
  status: "Created" | "Updated";
  source: string;
  message: string;
  document: {
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
  };
};

type ErrorResponse = {
  error?: string;
  detail?: string;
  title?: string;
};

export function DocWebEntryForm() {
  const [documentNumber, setDocumentNumber] = useState("");
  const [sectorCode, setSectorCode] = useState("");
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSizeKilobytes, setFileSizeKilobytes] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [publishNow, setPublishNow] = useState(true);
  const [representativesText, setRepresentativesText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UpsertResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const representativeCodes = representativesText
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (representativeCodes.some((value) => Number.isNaN(Number(value)))) {
      setError("Os representantes devem ser informados como códigos numéricos separados por vírgula.");
      setResult(null);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(apiUrl("/docweb/documents"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          documentNumber,
          sectorCode,
          title,
          fileName,
          fileSizeKilobytes: fileSizeKilobytes === "" ? 0 : Number(fileSizeKilobytes),
          expirationDate: expirationDate || null,
          publishNow,
          representativeCodes: representativeCodes.map((value) => Number(value))
        })
      });

      const body = (await response.json().catch(() => null)) as UpsertResponse | ErrorResponse | null;

      if (!response.ok) {
        const apiError = body as ErrorResponse | null;
        setError(
          apiError?.error ??
            apiError?.detail ??
            apiError?.title ??
            "Falha ao salvar o documento."
        );
        setResult(null);
        return;
      }

      setResult(body as UpsertResponse);
    } catch {
      setError("Não foi possível salvar o documento.");
      setResult(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr]">
      <form onSubmit={handleSubmit} className="section-card rounded-[28px] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Cadastro
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
          Informações da circular
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="documentNumber" className="text-sm font-medium text-[var(--muted)]">
              Número do documento
            </label>
            <input
              id="documentNumber"
              type="text"
              value={documentNumber}
              onChange={(event) => setDocumentNumber(event.target.value)}
              className="brand-input"
              placeholder="Ex.: 101/26"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="sectorCode" className="text-sm font-medium text-[var(--muted)]">
              Setor
            </label>
            <input
              id="sectorCode"
              type="text"
              value={sectorCode}
              onChange={(event) => setSectorCode(event.target.value)}
              className="brand-input"
              placeholder="Ex.: COM"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-[var(--muted)]">
            Título
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="brand-input"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-2">
            <label htmlFor="fileName" className="text-sm font-medium text-[var(--muted)]">
              Arquivo
            </label>
            <input
              id="fileName"
              type="text"
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              className="brand-input"
              placeholder="Ex.: Circular_101_26.pdf"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="fileSizeKilobytes" className="text-sm font-medium text-[var(--muted)]">
              Tamanho KB
            </label>
            <input
              id="fileSizeKilobytes"
              type="number"
              min="0"
              step="0.01"
              value={fileSizeKilobytes}
              onChange={(event) => setFileSizeKilobytes(event.target.value)}
              className="brand-input"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
          <div className="space-y-2">
            <label htmlFor="expirationDate" className="text-sm font-medium text-[var(--muted)]">
              Expiração
            </label>
            <input
              id="expirationDate"
              type="date"
              value={expirationDate}
              onChange={(event) => setExpirationDate(event.target.value)}
              className="brand-input"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="representativesText" className="text-sm font-medium text-[var(--muted)]">
              Representantes
            </label>
            <textarea
              id="representativesText"
              value={representativesText}
              onChange={(event) => setRepresentativesText(event.target.value)}
              className="brand-input min-h-28"
              placeholder="Códigos separados por vírgula. Em branco = acesso geral."
            />
          </div>
        </div>

        <label className="mt-5 flex items-center gap-3 text-sm font-medium text-[var(--muted)]">
          <input
            type="checkbox"
            checked={publishNow}
            onChange={(event) => setPublishNow(event.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          Publicar imediatamente
        </label>

        {error ? <div className="brand-alert mt-5">{error}</div> : null}

        <button type="submit" disabled={isSubmitting} className="brand-button-primary mt-6">
          {isSubmitting ? "Salvando..." : "Salvar documento"}
        </button>
      </form>

      <section className="section-card rounded-[28px] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Resultado
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
          Retorno da operação
        </h2>

        {!result ? (
          <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
            Preencha os dados da circular e salve para ver o retorno.
          </p>
        ) : (
          <div className="brand-soft-panel mt-6 rounded-[24px] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
              {result.status}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{result.message}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ResultCard label="Documento" value={result.document.documentNumber} />
              <ResultCard label="Setor" value={result.document.sectorCode} />
              <ResultCard label="Título" value={result.document.title} />
              <ResultCard label="Arquivo" value={result.document.fileName} />
              <ResultCard label="Status" value={result.document.statusCode} />
              <ResultCard
                label="Representantes"
                value={
                  result.document.representativeCount > 0
                    ? String(result.document.representativeCount)
                    : "Acesso geral"
                }
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="brand-soft-panel rounded-2xl px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{value}</p>
    </div>
  );
}
