import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="shell-grid flex min-h-screen items-center justify-center px-6 py-8 md:px-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass rounded-[36px] p-8 md:p-10">
          <BrandMark subtitle="Autenticação inicial da nova intranet ASTRA, com visual renovado e base pronta para evolução módulo a módulo." />

          <div className="mt-8 max-w-2xl">
            <h1 className="text-4xl font-semibold leading-tight tracking-[-0.05em] md:text-5xl">
              Acesso ao ambiente novo com a mesma lógica operacional.
            </h1>
            <p className="mt-5 text-base leading-7 text-[var(--muted)] md:text-lg">
              Esta primeira camada substitui a sessão legada por um fluxo moderno,
              preparado para React, .NET e deploy em Docker, sem mudar a estrutura
              mental de uso de quem já opera a intranet.
            </p>
          </div>

          <div className="brand-divider mt-8" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="brand-soft-panel rounded-[24px] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                Base atual
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Cookie auth, sessão nova e autorização por módulo carregada no backend.
              </p>
            </div>
            <div className="brand-soft-panel rounded-[24px] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--secondary)]">
                Próximo foco
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Fechar o piloto do Bilhetagem e ligar as consultas reais ao OpenEdge.
              </p>
            </div>
          </div>
        </section>

        <section className="section-card rounded-[36px] p-8 md:p-10">
          <p className="brand-chip">Acesso</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em]">
            Entrar no ambiente moderno
          </h2>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Nesta fase os usuários ainda são de desenvolvimento. Depois o login
            será ligado ao modelo real de autenticação do legado.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
