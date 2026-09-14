const express = require('express');
const router = express.Router();
const db = require('../db');

// GET - Buscar um jogo específico
router.get('/', (req, res) => {
  const id = parseInt(req.query.id);

  if (!id) {
    return res.redirect('/home');
  }

  const sql = `SELECT * FROM jogos_info WHERE id = ?`;

  db.get(sql, [id], (err, jogo) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao buscar o jogo.');
    }

    if (jogo) {
      res.render('tabuleiro', { jogo });
    } else {
      res.status(404).send('<h1>Jogo não encontrado.</h1>');
    }
  });
});

// POST - Salvar avaliação
router.post('/', (req, res) => {
  const { texto, estrelas } = req.body;
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ erro: 'Usuário não autenticado' });
  }

  const sql = `INSERT INTO avaliacao (usuario_id, texto, estrelas) VALUES (?, ?, ?)`;

  db.run(sql, [usuario_id, texto, estrelas], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ erro: 'Erro ao salvar avaliação' });
    }
    res.status(201).json({ mensagem: 'Avaliação salva com sucesso!', id: this.lastID });
  });
});

module.exports = router;