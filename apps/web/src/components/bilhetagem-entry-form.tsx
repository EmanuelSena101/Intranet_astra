"use client";

import { FormEvent, useState } from "react";
import { apiUrl } from "@/lib/api";

type UpsertResponse = {
  status: "Created" | "Updated" | "Conflict";
  source: string;
  message: string;
  entry: {
    number: string;
    description: string;
  };
};

type ErrorResponse = {
  error?: string;
};

export function BilhetagemEntryForm() {
  const [ddd, setDdd] = useState("019");
  const [telephone, setTelephone] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UpsertResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/bilhetagem/phone-book/entries"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          ddd,
          telephone,
          description
        })
      });

      const body = (await response.json().catch(() => null)) as
        | ErrorResponse
        | UpsertResponse
        | null;

      if (!response.ok) {
        const apiError = body as ErrorResponse | null;

        setError(
          typeof apiError?.error === "string" ? apiError.error : "Falha ao cadastrar descrição."
        );
        setResult(null);
        return;
      }

      setResult(body as UpsertResponse);
    } catch {
      setError("Não foi possível salvar o telefone na API de Bilhetagem.");
      setResult(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={handleSubmit} className="section-card rounded-[28px] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Cadastro
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
          Descrição de telefone
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-[0.28fr_0.72fr]">
          <div className="space-y-2">
            <label htmlFor="ddd" className="text-sm font-medium text-[var(--muted)]">
              DDD
            </label>
            <input
              id="ddd"
              type="text"
              value={ddd}
              onChange={(event) => setDdd(event.target.value)}
              className="brand-input"
              maxLength={3}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="telephone" className="text-sm font-medium text-[var(--muted)]">
              Telefone
            </label>
            <input
              id="telephone"
              type="text"
              value={telephone}
              onChange={(event) => setTelephone(event.target.value)}
              className="brand-input"
              placeholder="Número sem hífen"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-[var(--muted)]">
            Descrição
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="brand-input"
            placeholder="Razão social ou nome"
          />
        </div>

        {error ? <div className="brand-alert mt-5">{error}</div> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="brand-button-primary mt-6"
        >
          {isSubmitting ? "Salvando..." : "Salvar descrição"}
        </button>
      </form>

      <section className="section-card rounded-[28px] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Retorno da API
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
          Resultado da operação
        </h2>

        {!result ? (
          <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
            O comportamento segue a regra atual do legado: cria telefone novo,
            atualiza telefone sem descrição ou retorna conflito se já houver descrição.
          </p>
        ) : (
          <div className="brand-soft-panel mt-6 rounded-[24px] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
              {result.status}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{result.message}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="brand-soft-panel rounded-2xl px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Número
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                  {result.entry.number}
                </p>
              </div>
              <div className="brand-soft-panel rounded-2xl px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Descrição
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                  {result.entry.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
