# Escopo Inicial

## Módulos incluídos na migração

- `ReqFunc`
- `Autorizacao`
- `HoraExtra`
- `FichaAcomp`
- `InstNormativa`
- `Atendimento`
- `Reativacao`
- `FAC`
- `DocWeb`
- `Bilhetagem`

## Módulos fora do rewrite principal

- `Agenda_Recursos`
- `ArqCorp`
- `ControlesDMS`
- `Programa_EMS`
- `Balanco`
- `antes-lote-Balanco`
- `Avaliacao`
- `Becomex`
- `monitor`
- `Guias`

## Regra de tratamento

Os módulos fora do rewrite principal não devem ser apagados agora. Eles ficam:

- fora do menu principal do sistema novo
- congelados no legado
- candidatos a `read-only`, exportação ou desligamento posterior

