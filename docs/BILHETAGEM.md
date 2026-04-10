# Bilhetagem

## Papel do módulo

Piloto recomendado da migração.

O módulo atende principalmente:

- consulta de chamadas telefônicas
- filtros por período, tipo e origem/destino
- visão resumida e detalhada
- cadastro de descrição de telefones
- busca de telefone por número ou descrição

## Telas principais identificadas

- `bl_info.htm`
  página informativa do usuário
- `bl_ligacoes.htm`
  tela principal de filtros e abertura dos relatórios
- `bl_ligacoes_res.htm`
  relatório resumido de chamadas
- `bl_ligacoes_det.htm`
  relatório detalhado de chamadas
- `bl_cad_descricao.htm`
  cadastro ou complemento de descrição para telefone
- `bl_busca_numero.htm`
  pesquisa de números e descrições

## Tabelas e entidades aparentes

Pela leitura do legado, as tabelas mais importantes do piloto parecem ser:

- `lig-ligacao`
- `lig-ramal`
- `mgdms.lig-destino`
- `net-usuarios`

## Comportamentos relevantes do legado

- A tela principal usa filtros de:
  - período
  - recebidas / efetuadas / ambas
  - internas / externas / ambas
  - ramal ou número
  - resumido ou detalhado
- A navegação para relatórios é feita por popup com query string.
- O cadastro de descrição grava em `mgdms.lig-destino`.
- A busca pode ser por início do telefone ou por início da descrição.
- Há forte dependência de formatação de telefone e critérios de chamada interna/externa.

## Paridade esperada na versão nova

### Fase 1

- manter os mesmos filtros
- manter os mesmos resultados principais
- manter o cadastro de descrição
- manter pesquisa por número e descrição
- manter permissão do módulo
- expor API própria para o diretório telefônico

### Fase 2

- trocar popup por telas modernas
- melhorar paginação e filtros
- exportação e impressão consistentes

## Sequência recomendada de implementação

1. `bl_info`
2. `bl_busca_numero`
3. `bl_cad_descricao`
4. `bl_ligacoes`
5. `bl_ligacoes_res`
6. `bl_ligacoes_det`

## Riscos do piloto

- diferenças de regra para classificar ligações internas e externas
- dependência de índices e performance em `lig-ligacao`
- formatação de telefone e ramal
- dependência indireta do contexto do usuário logado

## Endpoints iniciais no sistema novo

- `GET /api/bilhetagem/bootstrap`
- `GET /api/bilhetagem/phone-book/search`
- `POST /api/bilhetagem/phone-book/entries`

## Observação atual

Nesta etapa, o diretório telefônico do piloto está com backend `mock-backed`.
Isso permite evoluir frontend, autenticação, permissões e contratos antes de
ligar a implementação final ao OpenEdge.

## Estado implementado

- login e sessão já controlam acesso ao módulo via cookie auth
- shell principal já renderiza o menu conforme os módulos permitidos
- rota `/bilhetagem` já consome `GET /api/bilhetagem/bootstrap`
- rota `/bilhetagem/pesquisa` já consome `GET /api/bilhetagem/phone-book/search`
- rota `/bilhetagem/cadastro-descricao` já consome `POST /api/bilhetagem/phone-book/entries`
- o backend atual do piloto ainda é `mock`, com regras de criação, atualização e conflito alinhadas ao legado
