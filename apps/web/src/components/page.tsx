import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="shell-grid flex min-h-screen items-center justify-center px-6 py-8 md:px-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass rounded-[36px] p-8 md:p-10">
          <BrandMark />

          <div className="mt-8 max-w-2xl">
            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.05em] md:text-5xl">
              Bem-vindo à Intranet ASTRA.
            </h1>
            <p className="mt-5 text-base leading-7 text-[var(--muted)] md:text-lg">
              Acesse com suas credenciais para continuar.
            </p>
          </div>
        </section>

        <section className="section-card rounded-[36px] p-8 md:p-10">
          <p className="brand-chip">Acesso</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">
            Entrar
          </h2>

          <div className="mt-8">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
