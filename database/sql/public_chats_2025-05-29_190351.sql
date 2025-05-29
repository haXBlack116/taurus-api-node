/*
## Importando o Banco de Dados

1. Abra seu gerenciador de banco (Beekeeper, DBeaver, etc.).
2. Crie um banco de dados (ex.: `meu_banco`).
3. Execute os arquivos `estrutura.sql` e `dados.sql` na conexão do banco criado.
4. Configure o arquivo `.env` com os dados de conexão:

*/

CREATE TABLE public.chats (
  id serial NOT NULL,
  title character varying(255) NOT NULL,
  created_at timestamp without time zone NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.chats ADD CONSTRAINT chats_pkey PRIMARY KEY (id);