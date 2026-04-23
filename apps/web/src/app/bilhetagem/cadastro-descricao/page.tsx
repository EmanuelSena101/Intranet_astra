import { BilhetagemEntryForm } from "@/components/bilhetagem-entry-form";
import { ModuleWorkspaceShell } from "@/components/module-shells";

export default function BilhetagemCadastroDescricaoPage() {
  return (
    <ModuleWorkspaceShell
      requiredModule="Bilhetagem"
      title="Cadastro de descrição"
      backHref="/bilhetagem"
      backLabel="Voltar ao módulo"
    >
      <BilhetagemEntryForm />
    </ModuleWorkspaceShell>
  );
}
