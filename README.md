Tecnologias utilizadas
1.Node.js

2.Express

3.PostgreSQL

4.dotenv (variáveis de ambiente)

5.pg (driver PostgreSQL para Node.js)

Requisitos
1.Node.js

2.PostgreSQL

3.Gerenciador de pacotes npm 

Instalação

1.Clone o Repositório: git clone https://github.com/haXBlack116/taurus-api-node.git

2.Acesse a pasta do projeto: cd taurus-api-node

3.Instale as dependências: npm install

4.Configure as variáveis de ambiente
Coloque suas informações no arquivo .env.example: 

# Porta em que o servidor backend vai rodar
PORT=3000

# Chave da API do Gemini (substituir pela sua chave real)
API_KEY=sua_chave_do_Gemini

# Configurações do Banco de Dados
DB_HOST=localhost         # Endereço do banco de dados (localhost se estiver na mesma máquina)

# Porta que o banco está escutando (Ex: 5432 para PostgreSQL, 3306 para MySQL)
DB_PORT=porta_do_banco   

# Usuário do banco de dados
DB_USER=seu_usuario       

# Senha do banco de dados
DB_PASSWORD=sua_senha 

# Nome do banco de dados criado pelos scripts em SQL na pasta database.
DB_DATABASE=nome_do_banco      

5.Configure o banco de dados
Crie o banco no PostgreSQL: CREATE DATABASE nome_do_banco;

6.Rode o servidor: npm start

taurus-api-node@1.0.0 start
> node server.js

Servidor rodando na porta 3000

Banco de Dados
O projeto utiliza PostgreSQL. As definições de tabelas e dados iniciais estão localizadas na pasta: /database/sql/

Rotas
| Método | Rota         | Descrição                           |
| ------ | ------------ | ----------------------------------- |
| GET    | `/chats`     | Lista todos os chats                |
| POST   | `/chats`     | Cria um novo chat                   |
| GET    | `/messages`  | Lista todas as mensagens            |
| POST   | `/messages`  | Cria uma nova mensagem              |
| ...    | (Mais rotas) | Definidas em `routes/chatRoutes.js` |


