const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../database/db');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Buscar histórico de um chat específico
async function getHistory(chatId) {
  try {
    const result = await pool.query(
      `SELECT role, content 
       FROM chat_history 
       WHERE chat_id = $1 
       ORDER BY created_at ASC`,
      [chatId]
    );
    return result.rows.map(row => ({
      role: row.role,
      parts: [{ text: row.content }],
    }));
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return [];
  }
}

// Salvar mensagem no chat
async function saveMessage(chatId, role, content) {
  try {
    await pool.query(
      'INSERT INTO chat_history (chat_id, role, content) VALUES ($1, $2, $3)',
      [chatId, role, content]
    );
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
  }
}

// Criar um novo chat
router.post('/chat/new', async (req, res) => {
  const { title } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO chats (title) VALUES ($1) RETURNING *',
      [title || 'Novo Chat']
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar novo chat:', error);
    res.status(500).json({ error: 'Erro ao criar novo chat.' });
  }
});

// Listar todos os chats
router.get('/chat', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chats ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar chats:', error);
    res.status(500).json({ error: 'Erro ao buscar chats.' });
  }
});

// Obter histórico de um chat
router.get('/chat/:chatId', async (req, res) => {
  const { chatId } = req.params;
  try {
    const chat = await pool.query(
      'SELECT * FROM chats WHERE id = $1',
      [chatId]
    );

    if (chat.rows.length === 0) {
      return res.status(404).json({ error: 'Chat não encontrado.' });
    }

    const result = await pool.query(
      `SELECT role, content, created_at 
       FROM chat_history 
       WHERE chat_id = $1 
       ORDER BY created_at ASC`,
      [chatId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// Enviar mensagem em um chat existente
router.post('/chat/:chatId', async (req, res) => {
  const { chatId } = req.params;
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Mensagem não enviada ou vazia.' });
  }

  try {
    const chatExist = await pool.query(
      'SELECT * FROM chats WHERE id = $1',
      [chatId]
    );

    if (chatExist.rows.length === 0) {
      return res.status(404).json({ error: 'Chat não encontrado.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const history = await getHistory(chatId);

    const chat = model.startChat({ history });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    await saveMessage(chatId, 'user', message);
    await saveMessage(chatId, 'model', response);

    res.json({ response });
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    res.status(500).json({ error: 'Erro interno ao processar a mensagem.' });
  }
});

// Deletar um chat
router.delete('/chat/:chatId', async (req, res) => {
  const { chatId } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM chats WHERE id = $1 RETURNING *',
      [chatId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Chat não encontrado.' });
    }
    res.json({ message: 'Chat deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar chat:', error);
    res.status(500).json({ error: 'Erro ao deletar chat.' });
  }
});

module.exports = router;
