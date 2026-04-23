import { AdminOnly } from "@/components/admin-only";
import { BilhetagemPilotStatus } from "@/components/bilhetagem-pilot-status";
import { ModuleHomeShell } from "@/components/module-shells";
import { moduleCatalog } from "@/lib/modules";

const bilhetagemModule = moduleCatalog.Bilhetagem;

export default function BilhetagemPage() {
  return (
    <ModuleHomeShell
      requiredModule="Bilhetagem"
      title={bilhetagemModule.name}
      description={bilhetagemModule.description}
      actions={bilhetagemModule.actions}
    >
      <AdminOnly>
        <BilhetagemPilotStatus />
      </AdminOnly>
    </ModuleHomeShell>
  );
}
