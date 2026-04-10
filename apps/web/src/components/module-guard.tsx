"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser } from "@/lib/auth";

type ModuleGuardProps = {
  requiredModule: string;
  children: ReactNode;
};

type GuardState =
  | { status: "loading" }
  | { status: "authorized" }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "error"; message: string };

export function ModuleGuard({ requiredModule, children }: ModuleGuardProps) {
  const router = useRouter();
  const [state, setState] = useState<GuardState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const result = await fetchCurrentUser();

      if (cancelled) {
        return;
      }

      if (result.status === "unauthenticated") {
        setState(result);
        router.replace("/login");
        return;
      }

      if (result.status === "error") {
        setState(result);
        return;
      }

      const hasModule = result.user.modules.some(
        (moduleName) => moduleName.toLowerCase() === requiredModule.toLowerCase()
      );

      setState(hasModule ? { status: "authorized" } : { status: "forbidden" });
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [requiredModule, router]);

  if (state.status === "authorized") {
    return <>{children}</>;
  }

  if (state.status === "forbidden") {
    return (
      <GuardMessage
        title="Acesso não permitido"
        text={`A sessão atual não possui acesso ao módulo ${requiredModule}.`}
      />
    );
  }

  if (state.status === "error") {
    return <GuardMessage title="Falha de carregamento" text={state.message} />;
  }

  return (
    <GuardMessage
      title="Validando acesso"
      text="Conferindo autenticação e permissão do módulo."
    />
  );
}

function GuardMessage({ title, text }: { title: string; text: string }) {
  return (
    <main className="shell-grid flex min-h-screen items-center justify-center px-6 py-8">
      <div className="section-card w-full max-w-xl rounded-[28px] p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
          Astra Intranet Modern
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{title}</h1>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">{text}</p>
      </div>
    </main>
  );
}
