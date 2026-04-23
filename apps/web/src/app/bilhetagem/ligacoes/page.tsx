import { BilhetagemCallReport } from "@/components/bilhetagem-call-report";
import { ModuleWorkspaceShell } from "@/components/module-shells";

export default function BilhetagemLigacoesPage() {
  return (
    <ModuleWorkspaceShell
      requiredModule="Bilhetagem"
      title="Consulta de ligações"
      backHref="/bilhetagem"
      backLabel="Voltar ao módulo"
    >
      <BilhetagemCallReport />
    </ModuleWorkspaceShell>
  );
}
