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
          className="brand-input"
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
          className="brand-input"
          autoComplete="current-password"
        />
      </div>

      {error ? (
        <div className="brand-alert">{error}</div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="brand-button-primary w-full"
      >
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>

      <div className="brand-soft-panel rounded-2xl px-4 py-4 text-sm leading-6 text-[var(--muted)]">
        <p className="font-semibold text-[var(--foreground)]">Usuários de desenvolvimento</p>
        <p>`admin` / `admin123`</p>
        <p>`bilhetagem` / `bilhetagem123`</p>
      </div>
    </form>
  );
}
