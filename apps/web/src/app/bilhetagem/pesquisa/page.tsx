import { BilhetagemSearch } from "@/components/bilhetagem-search";
import { ModuleWorkspaceShell } from "@/components/module-shells";

export default function BilhetagemPesquisaPage() {
  return (
    <ModuleWorkspaceShell
      requiredModule="Bilhetagem"
      title="Pesquisa de números e descrições"
      backHref="/bilhetagem"
      backLabel="Voltar ao módulo"
    >
      <BilhetagemSearch />
    </ModuleWorkspaceShell>
  );
}
