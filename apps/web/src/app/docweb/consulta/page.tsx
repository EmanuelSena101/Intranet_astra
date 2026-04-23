import { DocWebDocumentList } from "@/components/docweb-document-list";
import { ModuleWorkspaceShell } from "@/components/module-shells";

export default function DocWebConsultaPage() {
  return (
    <ModuleWorkspaceShell
      requiredModule="DocWeb"
      title="Consulta de circulares"
      backHref="/docweb"
      backLabel="Voltar ao módulo"
    >
      <DocWebDocumentList />
    </ModuleWorkspaceShell>
  );
}
