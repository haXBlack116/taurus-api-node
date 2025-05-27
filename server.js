const express = require('express');
const cors = require('cors'); 
const app = express();
require('dotenv').config();

const chatRoutes = require('./routes/chatRoutes');

// Middleware - CORS configurado para permitir só o frontend
app.use(cors({
  origin: 'http://localhost:5173', // Porta do Vite (frontend)
  methods: ['GET', 'POST'],
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
