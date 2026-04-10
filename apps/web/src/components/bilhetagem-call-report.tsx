"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type CallReportFormState = {
  direction: "received" | "performed" | "both";
  scope: "internal" | "external" | "both";
  targetType: "extension" | "number";
  view: "summary" | "detailed";
  startDate: string;
  endDate: string;
  extensionStart: string;
  extensionEnd: string;
  number: string;
};

type CallReportResponse = {
  source: string;
  filters: {
    direction: string;
    scope: string;
    targetType: string;
    view: string;
    startDate: string;
    endDate: string;
    extensionStart?: string | null;
    extensionEnd?: string | null;
    number?: string | null;
  };
  summary: {
    totalCalls: number;
    totalDuration: string;
    totalCost: number;
  };
  groups: Array<{
    label: string;
    totalCalls: number;
    totalDuration: string;
    averageDuration: string;
  }>;
  items: Array<{
    date: string;
    time: string;
    direction: string;
    scope: string;
    origin: string;
    destination: string;
    typeCode: string;
    duration: string;
    description: string;
    city: string;
    user: string;
    cost: number;
  }>;
};

const directionOptions = [
  { value: "received", label: "Recebidas" },
  { value: "performed", label: "Efetuadas" },
  { value: "both", label: "Ambas" }
] as const;

const scopeOptions = [
  { value: "internal", label: "Internas" },
  { value: "external", label: "Externas" },
  { value: "both", label: "Ambas" }
] as const;

const targetOptions = [
  { value: "extension", label: "Ramal" },
  { value: "number", label: "Número" }
] as const;

const viewOptions = [
  { value: "summary", label: "Resumido" },
  { value: "detailed", label: "Detalhado" }
] as const;

function defaultDateRange() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}

export function BilhetagemCallReport() {
  const defaultDate = defaultDateRange();

  const [form, setForm] = useState<CallReportFormState>({
    direction: "both",
    scope: "both",
    targetType: "extension",
    view: "detailed",
    startDate: defaultDate,
    endDate: defaultDate,
    extensionStart: "",
    extensionEnd: "9999",
    number: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CallReportResponse | null>(null);

  useEffect(() => {
    const initialForm: CallReportFormState = {
      direction: "both",
      scope: "both",
      targetType: "extension",
      view: "detailed",
      startDate: defaultDate,
      endDate: defaultDate,
      extensionStart: "",
      extensionEnd: "9999",
      number: ""
    };

    void runReport(initialForm);
  }, [defaultDate]);

  async function runReport(nextForm: CallReportFormState) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/bilhetagem/calls/report"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(nextForm)
      });

      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | CallReportResponse
        | null;

      if (!response.ok) {
        const apiError = body as { error?: string } | null;
        setError(typeof apiError?.error === "string" ? apiError.error : "A consulta de ligações falhou.");
        setReport(null);
        return;
      }

      setReport(body as CallReportResponse);
    } catch {
      setError("Não foi possível consultar o relatório de ligações.");
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runReport(form);
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} className="section-card rounded-[28px] p-6 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-6">
            <FilterGroup
              title="Direção"
              options={directionOptions}
              value={form.direction}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  direction: value as CallReportFormState["direction"]
                }))
              }
            />

            <FilterGroup
              title="Escopo"
              options={scopeOptions}
              value={form.scope}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  scope: value as CallReportFormState["scope"]
                }))
              }
            />

            <FilterGroup
              title="Filtro principal"
              options={targetOptions}
              value={form.targetType}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  targetType: value as CallReportFormState["targetType"],
                  number: value === "number" ? current.number : ""
                }))
              }
            />

            <FilterGroup
              title="Saída"
              options={viewOptions}
              value={form.view}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  view: value as CallReportFormState["view"]
                }))
              }
            />
          </div>

          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                id="startDate"
                label="Data inicial"
                type="date"
                value={form.startDate}
                onChange={(value) => setForm((current) => ({ ...current, startDate: value }))}
              />
              <Field
                id="endDate"
                label="Data final"
                type="date"
                value={form.endDate}
                onChange={(value) => setForm((current) => ({ ...current, endDate: value }))}
              />
            </div>

            {form.targetType === "extension" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  id="extensionStart"
                  label="Ramal inicial"
                  value={form.extensionStart}
                  onChange={(value) => setForm((current) => ({ ...current, extensionStart: value }))}
                  placeholder="0000"
                />
                <Field
                  id="extensionEnd"
                  label="Ramal final"
                  value={form.extensionEnd}
                  onChange={(value) => setForm((current) => ({ ...current, extensionEnd: value }))}
                  placeholder="9999"
                />
              </div>
            ) : (
              <Field
                id="number"
                label="Número"
                value={form.number}
                onChange={(value) => setForm((current) => ({ ...current, number: value }))}
                placeholder="Ex.: 1934001000"
              />
            )}

            <div className="rounded-[24px] border border-[var(--border)] bg-[#faf6ef] p-5 text-sm leading-6 text-[var(--muted)]">
              A tela replica a lógica do legado de `bl_ligacoes.htm`: período,
              recebidas/efetuadas, internas/externas, ramal/número e saída resumida ou detalhada.
            </div>

            {error ? (
              <div className="rounded-2xl border border-[#d9917a] bg-[#fff2ee] px-4 py-3 text-sm text-[#8a3c28]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Consultando..." : "Consultar"}
            </button>
          </div>
        </div>
      </form>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="section-card rounded-[28px] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Resultado
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Totais da consulta
          </h2>

          {!report ? (
            <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
              Execute a consulta para carregar a visão de chamadas.
            </p>
          ) : (
            <>
              <div className="mt-6 grid gap-4">
                <MetricCard label="Fonte" value={report.source} />
                <MetricCard label="Total de ligações" value={String(report.summary.totalCalls)} />
                <MetricCard label="Tempo total" value={report.summary.totalDuration} />
                <MetricCard label="Custo total" value={`R$ ${report.summary.totalCost.toFixed(2)}`} />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <FilterChip label={`Direção: ${report.filters.direction}`} />
                <FilterChip label={`Escopo: ${report.filters.scope}`} />
                <FilterChip label={`Filtro: ${report.filters.targetType}`} />
                <FilterChip label={`Saída: ${report.filters.view}`} />
              </div>
            </>
          )}
        </article>

        <article className="section-card rounded-[28px] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Visualização
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
            {report?.filters.view === "summary" ? "Resumo por ramal" : "Prévia detalhada"}
          </h2>

          {!report ? (
            <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
              A consulta detalhada será exibida aqui.
            </p>
          ) : report.filters.view === "summary" ? (
            <div className="mt-6 overflow-hidden rounded-[24px] border border-[var(--border)]">
              <div className="grid grid-cols-[0.24fr_0.22fr_0.28fr_0.26fr] bg-[#eee4d6] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                <span>Ramal</span>
                <span>Total</span>
                <span>Tempo</span>
                <span>Média</span>
              </div>
              <div className="divide-y divide-[var(--border)] bg-white/85">
                {report.groups.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-[var(--muted)]">
                    Nenhum agrupamento encontrado.
                  </div>
                ) : (
                  report.groups.map((group) => (
                    <div
                      key={group.label}
                      className="grid grid-cols-[0.24fr_0.22fr_0.28fr_0.26fr] px-4 py-4 text-sm"
                    >
                      <span className="font-medium text-[var(--foreground)]">{group.label}</span>
                      <span>{group.totalCalls}</span>
                      <span>{group.totalDuration}</span>
                      <span>{group.averageDuration}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[24px] border border-[var(--border)]">
              <div className="grid grid-cols-[0.12fr_0.1fr_0.16fr_0.16fr_0.08fr_0.12fr_0.14fr_0.12fr] bg-[#eee4d6] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                <span>Data</span>
                <span>Hora</span>
                <span>Origem</span>
                <span>Destino</span>
                <span>Tipo</span>
                <span>Duração</span>
                <span>Descrição</span>
                <span>Usuário</span>
              </div>
              <div className="divide-y divide-[var(--border)] bg-white/85">
                {report.items.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-[var(--muted)]">
                    Nenhuma ligação encontrada para o filtro atual.
                  </div>
                ) : (
                  report.items.map((item) => (
                    <div
                      key={`${item.date}-${item.time}-${item.origin}-${item.destination}`}
                      className="grid grid-cols-[0.12fr_0.1fr_0.16fr_0.16fr_0.08fr_0.12fr_0.14fr_0.12fr] px-4 py-4 text-sm"
                    >
                      <span>{item.date}</span>
                      <span>{item.time}</span>
                      <span className="font-medium text-[var(--foreground)]">{item.origin}</span>
                      <span>{item.destination}</span>
                      <span>{item.typeCode}</span>
                      <span>{item.duration}</span>
                      <span>{item.description}</span>
                      <span>{item.user}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  value,
  onChange
}: {
  title: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-[var(--muted)]">{title}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              value === option.value
                ? "bg-[var(--primary)] text-white"
                : "border border-[var(--border)] bg-white/85 text-[var(--foreground)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-[var(--muted)]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function FilterChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[var(--border)] bg-[#faf6ef] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
      {label}
    </span>
  );
}
