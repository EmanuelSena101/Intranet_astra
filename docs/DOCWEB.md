# DocWeb

## Papel do módulo

Primeira onda após o piloto do `Bilhetagem`.

O módulo atende principalmente:

- consulta de circulares e documentos
- cadastro de metadados do arquivo
- controle de publicação
- definição de representantes com acesso ao documento

## Telas principais identificadas no legado

- `docweb_info.htm`
  identificação do usuário e contexto do módulo
- `docweb_consulta.htm`
  listagem de circulares
- `docweb_infarquivo.htm`
  cadastro de circular
- `docweb_editar.htm`
  ajuste de dados do documento
- `docweb_alterar_arquivo.htm`
  troca de arquivo
- `docweb_excluir.htm`
  cancelamento / exclusão

## Entidades aparentes

- `sp-docweb`
- `sp-docweb-rep`
- sequência `sq-docweb`

## Estado implementado

- rota `/docweb` criada no frontend
- rota `/docweb/consulta` criada com filtros por texto, status e publicação
- rota `/docweb/cadastro` criada com formulário de documento
- `GET /api/docweb/bootstrap` disponível apenas para admin
- `GET /api/docweb/documents` disponível para usuários com acesso ao módulo
- `POST /api/docweb/documents` disponível para usuários com acesso ao módulo
- provider inicial em `mock`, com dados de documentos e atualização em memória

## Próximo passo do módulo

- validar tabelas reais do legado para sair do `mock`
- reproduzir edição, cancelamento e troca de arquivo
- ligar upload/download real do documento
