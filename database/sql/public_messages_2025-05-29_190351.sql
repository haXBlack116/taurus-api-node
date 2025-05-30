/*
## Importando o Banco de Dados

1. Abra seu gerenciador de banco (Beekeeper, DBeaver, etc.).
2. Crie um banco de dados (ex.: `meu_banco`).
3. Execute os arquivos `estrutura.sql` e `dados.sql` na conexão do banco criado.
4. Configure o arquivo `.env` com os dados de conexão:

*/

CREATE TABLE messages (
  id serial NOT NULL,
  chat_id integer NOT NULL,
  role character varying(50) NOT NULL,
  content text NOT NULL,
  created_at timestamp without time zone NULL DEFAULT CURRENT_TIMESTAMP
);
