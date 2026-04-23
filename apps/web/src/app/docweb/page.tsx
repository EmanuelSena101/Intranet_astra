import { AdminOnly } from "@/components/admin-only";
import { DocWebPilotStatus } from "@/components/docweb-pilot-status";
import { ModuleHomeShell } from "@/components/module-shells";
import { moduleCatalog } from "@/lib/modules";

const docWebModule = moduleCatalog.DocWeb;

export default function DocWebPage() {
  return (
    <ModuleHomeShell
      requiredModule="DocWeb"
      title={docWebModule.name}
      description={docWebModule.description}
      actions={docWebModule.actions}
    >
      <AdminOnly>
        <DocWebPilotStatus />
      </AdminOnly>
    </ModuleHomeShell>
  );
}
