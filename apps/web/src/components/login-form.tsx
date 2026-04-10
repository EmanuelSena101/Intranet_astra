"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

type LoginState = {
  username: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState<LoginState>({
    username: "admin",
    password: "admin123"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        setError("Usuário ou senha inválidos.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Não foi possível conectar à API de autenticação.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="username" className="text-sm font-medium text-[var(--muted)]">
          Usuário
        </label>
        <input
          id="username"
          type="text"
          value={form.username}
          onChange={(event) =>
            setForm((current) => ({ ...current, username: event.target.value }))
          }
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
          autoComplete="username"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-[var(--muted)]">
          Senha
        </label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(event) =>
            setForm((current) => ({ ...current, password: event.target.value }))
          }
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
          autoComplete="current-password"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-[#d9917a] bg-[#fff2ee] px-4 py-3 text-sm text-[#8a3c28]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>

      <div className="rounded-2xl border border-[var(--border)] bg-[#faf6ef] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
        <p className="font-semibold text-[var(--foreground)]">Usuários de desenvolvimento</p>
        <p>`admin` / `admin123`</p>
        <p>`bilhetagem` / `bilhetagem123`</p>
      </div>
    </form>
  );
}
