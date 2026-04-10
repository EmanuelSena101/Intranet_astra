# OpenEdge Driver Placeholder

Inclua aqui os artefatos necessários do driver ODBC do Progress OpenEdge para os containers `api` e `worker`.

Este diretório existe para que o compose e os containers já nasçam com um ponto padrão de montagem.

Exemplos do que pode entrar aqui:

- bibliotecas do driver
- `odbc.ini`
- `odbcinst.ini`
- scripts de setup específicos do fornecedor

Sem o driver real, a aplicação sobe, mas a conexão com o banco legado não será validada.

