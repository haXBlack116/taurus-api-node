const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../database/db');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function getHistory(userId) {
  try {
    const result = await pool.query(
      `SELECT role, message 
       FROM chat_history 
       WHERE user_id = $1 
       ORDER BY created_at ASC`,
      [userId]
    );
    return result.rows.map(row => ({
      role: row.role,
      parts: [{ text: row.message }],
    }));
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return [];
  }
}

async function saveMessage(userId, role, message) {
  try {
    await pool.query(
      'INSERT INTO chat_history (user_id, role, message) VALUES ($1, $2, $3)',
      [userId, role, message]
    );
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
  }
}

// 🔹 Endpoint para obter histórico
router.get('/chat/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT role, message, created_at 
       FROM chat_history 
       WHERE user_id = $1 
       ORDER BY created_at ASC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

router.post('/chat/:userId', async (req, res) => {
  const { userId } = req.params;
  const { message } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'ID de usuário inválido.' });
  }

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Mensagem não enviada ou vazia.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const history = await getHistory(userId);

    const chat = model.startChat({ history });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    await saveMessage(userId, 'user', message);
    await saveMessage(userId, 'model', response);

    res.json({ response });
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    res.status(500).json({ error: 'Erro interno ao processar a mensagem.' });
  }
});

module.exports = router;
