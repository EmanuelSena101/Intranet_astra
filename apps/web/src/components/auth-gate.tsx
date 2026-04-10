"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import type { CurrentUser } from "@/components/types";
import { fetchCurrentUser } from "@/lib/auth";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: CurrentUser }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

export function AuthGate() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      const result = await fetchCurrentUser();

      if (cancelled) {
        return;
      }

      if (result.status === "unauthenticated") {
        setState(result);
        router.replace("/login");
        return;
      }

      setState(result);
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state.status === "authenticated") {
    return <DashboardShell user={state.user} />;
  }

  if (state.status === "error") {
    return (
      <main className="shell-grid flex min-h-screen items-center justify-center px-6 py-8">
        <div className="section-card w-full max-w-xl rounded-[28px] p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
            Falha de sessão
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
            A fundação de autenticação ainda precisa de ajustes.
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">{state.message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="shell-grid flex min-h-screen items-center justify-center px-6 py-8">
      <div className="section-card w-full max-w-md rounded-[28px] p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
          Astra Intranet Modern
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
          Carregando sua sessão
        </h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">
          Validando autenticação, permissões e módulos disponíveis.
        </p>
      </div>
    </main>
  );
}
