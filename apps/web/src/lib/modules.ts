export type ModuleAction = {
  href: string;
  title: string;
  text: string;
};

export type ModuleDefinition = {
  name: string;
  route: string;
  summary: string;
  description: string;
  actions: ModuleAction[];
};

export const moduleCatalog: Record<string, ModuleDefinition> = {
  Bilhetagem: {
    name: "Bilhetagem",
    route: "/bilhetagem",
    summary: "Consulta de ligações, pesquisa de números e cadastro de descrições.",
    description: "Consultas e cadastros do módulo.",
    actions: [
      {
        href: "/bilhetagem/ligacoes",
        title: "Consulta de ligações",
        text: "Consulta por período, ramal ou número."
      },
      {
        href: "/bilhetagem/pesquisa",
        title: "Pesquisa",
        text: "Busca por número ou descrição."
      },
      {
        href: "/bilhetagem/cadastro-descricao",
        title: "Cadastro de descrição",
        text: "Inclusão e atualização de descrição telefônica."
      }
    ]
  },
  DocWeb: {
    name: "DocWeb",
    route: "/docweb",
    summary: "Consulta de circulares e cadastro de metadados de documentos.",
    description: "Consulta e manutenção de documentos e circulares.",
    actions: [
      {
        href: "/docweb/consulta",
        title: "Consulta de circulares",
        text: "Lista documentos por número, título, setor e status."
      },
      {
        href: "/docweb/cadastro",
        title: "Informações do arquivo",
        text: "Cadastro de circular com setor, título, arquivo e representantes."
      }
    ]
  }
};

export function getModuleDefinition(moduleName: string): ModuleDefinition | undefined {
  return moduleCatalog[moduleName];
}
