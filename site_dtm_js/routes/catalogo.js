const express = require('express');
const router = express.Router();
const db = require('../db');

// GET - lista jogos
router.get('/', (req, res) => {
  const sql = `
    SELECT id, titulo, origem, jogadores, imagem_url, historia, regras,
           COALESCE(categoria, 'estrategia') AS categoria,
           COALESCE(nota, '') AS nota
    FROM jogos_info ORDER BY titulo ASC
  `;

  db.all(sql, [], (err, jogos) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao buscar jogos: ' + err.message);
    }

    jogos = jogos.map(j => ({
      ...j,
      historiaShort: j.historia
        ? j.historia.substring(0, 120) + (j.historia.length > 120 ? '...' : '')
        : ''
    }));

    res.render('catalogo', {
      jogos,
      usuario: req.session.usuario || null,
      isAdmin: req.session.isAdmin === true
    });
  });
});

// POST - adiciona novo jogo
router.post('/adicionar', (req, res) => {
  const { titulo, origem, jogadores, imagem_url, historia, regras, categoria, nota } = req.body;

  if (!titulo) {
    return res.status(400).send('O título é obrigatório.');
  }

  const sql = `
    INSERT INTO jogos_info (titulo, origem, jogadores, imagem_url, historia, regras, categoria, nota)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [titulo, origem, jogadores, imagem_url, historia, regras, categoria, nota || null], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao adicionar jogo: ' + err.message);
    }
    res.redirect('/catalogo');
  });
});

// POST - edita jogo
router.post('/editar/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { titulo, origem, jogadores, imagem_url, historia, regras, categoria, nota } = req.body;

  if (!id || !titulo) {
    return res.status(400).send('ID e título são obrigatórios.');
  }

  const sql = `
    UPDATE jogos_info
    SET titulo = ?, origem = ?, jogadores = ?, imagem_url = ?,
        historia = ?, regras = ?, categoria = ?, nota = ?
    WHERE id = ?
  `;

  db.run(sql, [titulo, origem, jogadores, imagem_url, historia, regras, categoria, nota || null, id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao editar jogo: ' + err.message);
    }
    res.redirect('/catalogo');
  });
});

// POST - exclui jogo
router.post('/excluir/:id', (req, res) => {
  const id = parseInt(req.params.id);

  if (!id) {
    return res.status(400).send('ID inválido.');
  }

  db.run('DELETE FROM jogos_info WHERE id = ?', [id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao excluir jogo: ' + err.message);
    }
    res.redirect('/catalogo');
  });
});

module.exports = router;