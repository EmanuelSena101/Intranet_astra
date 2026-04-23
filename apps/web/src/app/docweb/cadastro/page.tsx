import { DocWebEntryForm } from "@/components/docweb-entry-form";
import { ModuleWorkspaceShell } from "@/components/module-shells";

export default function DocWebCadastroPage() {
  return (
    <ModuleWorkspaceShell
      requiredModule="DocWeb"
      title="Informações do arquivo"
      backHref="/docweb"
      backLabel="Voltar ao módulo"
    >
      <DocWebEntryForm />
    </ModuleWorkspaceShell>
  );
}
