import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="shell-grid flex min-h-screen items-center justify-center px-6 py-8 md:px-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass rounded-[36px] p-8 md:p-10">
          <BrandMark subtitle="Portal corporativo da ASTRA." />

          <div className="mt-8 max-w-2xl">
            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.05em] md:text-5xl">
              Acesso à intranet
            </h1>
            <p className="mt-5 text-base leading-7 text-[var(--muted)] md:text-lg">
              Informe seu usuário e sua senha para continuar.
            </p>
          </div>

          <div className="brand-divider mt-8" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="brand-soft-panel rounded-[24px] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                Ambiente
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Acesso centralizado aos módulos corporativos.
              </p>
            </div>
            <div className="brand-soft-panel rounded-[24px] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--secondary)]">
                Atendimento
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Em caso de dúvida, utilize os canais internos de suporte.
              </p>
            </div>
          </div>
        </section>

        <section className="section-card rounded-[36px] p-8 md:p-10">
          <p className="brand-chip">Acesso</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">
            Entrar
          </h2>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Use suas credenciais para acessar o sistema.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
