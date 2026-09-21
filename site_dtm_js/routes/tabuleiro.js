const express = require('express');
const router = express.Router();
const db = require('../db');

// GET - Buscar um jogo específico com seus comentários e média de estrelas
router.get('/', (req, res) => {
  const id = parseInt(req.query.id);

  if (!id) {
    return res.redirect('/home');
  }

  const sqlJogo = `SELECT * FROM jogos_info WHERE id = ?`;
  const sqlComentarios = `
    SELECT id, usuario_nome, texto, estrelas, data_criacao 
    FROM comentarios 
    WHERE jogo_id = ? 
    ORDER BY data_criacao DESC
  `;
  const sqlMediaEstrelas = `
    SELECT AVG(estrelas) as media, COUNT(*) as total
    FROM comentarios
    WHERE jogo_id = ?
  `;

  db.get(sqlJogo, [id], (err, jogo) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao buscar o jogo.');
    }

    if (!jogo) {
      return res.status(404).send('<h1>Jogo não encontrado.</h1>');
    }

    // Busca comentários do jogo
    db.all(sqlComentarios, [id], (err, comentarios) => {
      if (err) {
        console.error(err);
        comentarios = [];
      }

      // Busca média de estrelas
      db.get(sqlMediaEstrelas, [id], (err, avaliacao) => {
        if (err) {
          console.error(err);
          avaliacao = { media: 0, total: 0 };
        }

        res.render('tabuleiro', { 
          jogo,
          comentarios: comentarios || [],
          usuario: req.session.usuario || null,
          isAdmin: req.session.isAdmin || false,
          mediaEstrelas: avaliacao.media ? parseFloat(avaliacao.media).toFixed(1) : 0,
          totalAvaliacoes: avaliacao.total || 0
        });
      });
    });
  });
});

// POST - Salvar novo comentário com avaliação
router.post('/comentario', (req, res) => {
  const { jogo_id, usuario_nome, texto, estrelas } = req.body;

  if (!jogo_id || !usuario_nome || !texto || !estrelas) {
    return res.status(400).json({ erro: 'Preencha todos os campos' });
  }

  const estrelaNum = parseInt(estrelas);
  if (estrelaNum < 1 || estrelaNum > 5) {
    return res.status(400).json({ erro: 'Avaliação deve ser entre 1 e 5 estrelas' });
  }

  const sql = `
    INSERT INTO comentarios (jogo_id, usuario_nome, texto, estrelas)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [jogo_id, usuario_nome, texto, estrelaNum], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao salvar comentário' });
    }
    res.status(201).json({ 
      mensagem: 'Comentário salvo com sucesso!',
      id: this.lastID,
      usuario_nome,
      texto,
      estrelas: estrelaNum,
      data_criacao: new Date().toLocaleString('pt-BR')
    });
  });
});

// DELETE - Deletar comentário
router.delete('/comentario/:id', (req, res) => {
  const comentarioId = parseInt(req.params.id);
  const usuarioLogado = req.session.usuario || null;
  const isAdmin = req.session.isAdmin || false;

  if (!usuarioLogado && !isAdmin) {
    return res.status(401).json({ erro: 'Você precisa estar logado para deletar comentários' });
  }

  // Busca o comentário para verificar se é o autor
  db.get(`SELECT usuario_nome FROM comentarios WHERE id = ?`, [comentarioId], (err, comentario) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao buscar comentário' });
    }

    if (!comentario) {
      return res.status(404).json({ erro: 'Comentário não encontrado' });
    }

    // Verifica se é o autor ou ADM
    const ehAutor = comentario.usuario_nome === usuarioLogado;
    const ehAdmin = isAdmin;

    if (!ehAutor && !ehAdmin) {
      return res.status(403).json({ erro: 'Você não tem permissão para deletar este comentário' });
    }

    // Deleta o comentário
    db.run(`DELETE FROM comentarios WHERE id = ?`, [comentarioId], function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro ao deletar comentário' });
      }
      res.json({ mensagem: 'Comentário deletado com sucesso!' });
    });
  });
});

module.exports = router;