const express = require('express');
const cors = require('cors'); 
const app = express();
require('dotenv').config();

const chatRoutes = require('./routes/chatRoutes');

app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));

app.use(express.json());

// Rotas
app.use('/api', chatRoutes);

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
