import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="shell-grid flex min-h-screen items-center justify-center px-6 py-8 md:px-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass rounded-[32px] p-8 md:p-10">
          <p className="inline-flex rounded-full border border-[var(--border)] bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
            Login inicial
          </p>
          <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-5xl">
            Fundação de autenticação para a nova intranet.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)] md:text-lg">
            O objetivo desta etapa é substituir a sessão legada por uma base
            nova, preparada para React, .NET e deploy em Docker/Portainer.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="section-card rounded-[24px] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                Backend
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Cookie auth, sessão, permissões e bootstrap de módulos.
              </p>
            </div>
            <div className="section-card rounded-[24px] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                Frontend
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Login, shell visual e carregamento do menu por sessão.
              </p>
            </div>
          </div>
        </section>

        <section className="section-card rounded-[32px] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Acesso
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            Entrar no ambiente novo
          </h2>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Nesta fase os usuários são de desenvolvimento. Depois esta camada
            será ligada ao modelo real de autenticação do legado.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}

