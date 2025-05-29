const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../database/db');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Buscar histórico do chat
async function getHistory(chatId) {
  try {
    const result = await pool.query(
      `SELECT role, content
       FROM messages
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

// Salvar mensagem
async function saveMessage(chatId, role, content) {
  try {
    await pool.query(
      'INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)',
      [chatId, role, content]
    );
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
  }
}

// Criar um novo chat com nome incrementado se já existir
router.post('/chat/new', async (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Título é obrigatório.' });
  }

  try {
    // Verifica quantos chats já existem com esse nome base
    const checkRes = await pool.query(
      "SELECT COUNT(*) FROM chats WHERE title ILIKE $1 OR title ILIKE $1 || ' (%)'",
      [title]
    );

    const count = parseInt(checkRes.rows[0].count);

    // Se já existir, incrementa. Se não, mantém o nome original
    const finalTitle = count === 0 ? title : `${title} (${count + 1})`;

    const result = await pool.query(
      'INSERT INTO chats (title) VALUES ($1) RETURNING *',
      [finalTitle]
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
      `SELECT id, title, created_at
       FROM chats
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar chats:', error);
    res.status(500).json({ error: 'Erro ao buscar chats.' });
  }
});

// Obter histórico de um chat específico
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

    const history = await pool.query(
      `SELECT role, content, created_at
       FROM messages
       WHERE chat_id = $1
       ORDER BY created_at ASC`,
      [chatId]
    );

    res.json({
      chat: chat.rows[0],
      history: history.rows
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico.' });
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
    const chat = await pool.query(
      'SELECT * FROM chats WHERE id = $1',
      [chatId]
    );

    if (chat.rows.length === 0) {
      return res.status(404).json({ error: 'Chat não encontrado.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const history = await getHistory(chatId);

    const chatInstance = model.startChat({ history });

    const result = await chatInstance.sendMessage(message);
    const response = result.response.text();

    // Salvar mensagem do usuário e da IA
    await saveMessage(chatId, 'user', message);
    await saveMessage(chatId, 'model', response);

    res.json({ response });
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    res.status(500).json({ error: 'Erro interno ao processar a mensagem.' });
  }
});

// Deletar um chat e seu histórico
router.delete('/chat/:chatId', async (req, res) => {
  const { chatId } = req.params;
  try {
    const chat = await pool.query(
      'SELECT * FROM chats WHERE id = $1',
      [chatId]
    );

    if (chat.rows.length === 0) {
      return res.status(404).json({ error: 'Chat não encontrado.' });
    }

    // Deleta mensagens primeiro (se existir tabela relacionada)
    await pool.query(
      'DELETE FROM messages WHERE chat_id = $1',
      [chatId]
    );

    // Depois deleta o chat
    await pool.query(
      'DELETE FROM chats WHERE id = $1',
      [chatId]
    );

    res.json({ message: 'Chat e histórico deletados com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar chat:', error);
    res.status(500).json({ error: 'Erro ao deletar chat.' });
  }
});

// Atualizar título de um chat
router.put('/chat/:chatId', async (req, res) => {
  const { chatId } = req.params;
  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Título não pode estar vazio.' });
  }

  try {
    const chat = await pool.query(
      'SELECT * FROM chats WHERE id = $1',
      [chatId]
    );

    if (chat.rows.length === 0) {
      return res.status(404).json({ error: 'Chat não encontrado.' });
    }

    const result = await pool.query(
      'UPDATE chats SET title = $1 WHERE id = $2 RETURNING *',
      [title.trim(), chatId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar título:', error);
    res.status(500).json({ error: 'Erro ao atualizar título do chat.' });
  }
});


module.exports = router;
