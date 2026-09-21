const express = require('express');
const router = express.Router();
const db = require('../db');

function parseCoord(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) return next();
  return res.status(403).send('Acesso restrito ao administrador.');
}

function requireAuth(req, res, next) {
  if (req.session && req.session.usuario) return next();
  return res.status(401).json({ erro: 'Você precisa estar logado' });
}

// GET - lista jogos
router.get('/', (req, res) => {
  const sql = `
    SELECT id, titulo, origem, jogadores, imagem_url, historia, regras,
           COALESCE(categoria, 'estrategia') AS categoria,
           COALESCE(nota, '') AS nota,
           latitude, longitude
    FROM jogos_info ORDER BY titulo ASC
  `;

  let favoritoIds = [];

  // Se usuário está logado, busca seus favoritos
  if (req.session && req.session.usuario) {
    db.all(
      `SELECT jogo_id FROM favoritos WHERE usuario_id = (SELECT id FROM usuario WHERE usuario = ?)`,
      [req.session.usuario],
      (err, rows) => {
        if (!err && rows) {
          favoritoIds = rows.map(r => r.jogo_id);
        }
        buscarJogos();
      }
    );
  } else {
    buscarJogos();
  }

  function buscarJogos() {
    db.all(sql, [], (err, jogos) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Erro ao buscar jogos: ' + err.message);
      }

      jogos = jogos.map(j => ({
        ...j,
        historiaShort: j.historia
          ? j.historia.substring(0, 120) + (j.historia.length > 120 ? '...' : '')
          : '',
        isFavorito: favoritoIds.includes(j.id)
      }));

      res.render('catalogo', {
        jogos,
        usuario: req.session.usuario || null,
        isAdmin: req.session.isAdmin === true
      });
    });
  }
});

// POST - adiciona novo jogo
router.post('/adicionar', requireAdmin, (req, res) => {
  const { titulo, origem, jogadores, imagem_url, historia, regras, categoria, nota, latitude, longitude } = req.body;

  if (!titulo) {
    return res.status(400).send('O título é obrigatório.');
  }

  const sql = `
    INSERT INTO jogos_info (titulo, origem, jogadores, imagem_url, historia, regras, categoria, nota, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [titulo, origem, jogadores, imagem_url, historia, regras, categoria, nota || null, parseCoord(latitude), parseCoord(longitude)], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao adicionar jogo: ' + err.message);
    }
    res.redirect('/catalogo');
  });
});

// POST - edita jogo
router.post('/editar/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { titulo, origem, jogadores, imagem_url, historia, regras, categoria, nota, latitude, longitude } = req.body;

  if (!titulo) {
    return res.status(400).send('O título é obrigatório.');
  }

  const sql = `
    UPDATE jogos_info
    SET titulo = ?, origem = ?, jogadores = ?, imagem_url = ?, historia = ?, 
        regras = ?, categoria = ?, nota = ?, latitude = ?, longitude = ?
    WHERE id = ?
  `;

  db.run(sql, [titulo, origem, jogadores, imagem_url, historia, regras, categoria, nota || null, parseCoord(latitude), parseCoord(longitude), id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao editar jogo: ' + err.message);
    }
    res.redirect('/catalogo');
  });
});

// POST - exclui jogo
router.post('/excluir/:id', requireAdmin, (req, res) => {
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

// POST - adiciona jogo aos favoritos
router.post('/favoritar/:id', requireAuth, (req, res) => {
  const jogoId = parseInt(req.params.id);
  const usuario = req.session.usuario;

  db.get(`SELECT id FROM usuario WHERE usuario = ?`, [usuario], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ erro: 'Erro ao buscar usuário' });
    }

    const sql = `INSERT OR IGNORE INTO favoritos (usuario_id, jogo_id) VALUES (?, ?)`;
    db.run(sql, [user.id, jogoId], function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro ao adicionar favorito' });
      }
      res.json({ mensagem: 'Adicionado aos favoritos!' });
    });
  });
});

// DELETE - remove jogo dos favoritos
router.delete('/favoritar/:id', requireAuth, (req, res) => {
  const jogoId = parseInt(req.params.id);
  const usuario = req.session.usuario;

  db.get(`SELECT id FROM usuario WHERE usuario = ?`, [usuario], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ erro: 'Erro ao buscar usuário' });
    }

    db.run(`DELETE FROM favoritos WHERE usuario_id = ? AND jogo_id = ?`, [user.id, jogoId], function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ erro: 'Erro ao remover favorito' });
      }
      res.json({ mensagem: 'Removido dos favoritos!' });
    });
  });
});

// GET - lista jogos favoritos do usuário
router.get('/meus-favoritos', requireAuth, (req, res) => {
  const usuario = req.session.usuario;

  const sql = `
    SELECT j.id, j.titulo, j.origem, j.jogadores, j.imagem_url, j.historia, j.regras,
           COALESCE(j.categoria, 'estrategia') AS categoria,
           COALESCE(j.nota, '') AS nota,
           j.latitude, j.longitude
    FROM jogos_info j
    INNER JOIN favoritos f ON j.id = f.jogo_id
    INNER JOIN usuario u ON f.usuario_id = u.id
    WHERE u.usuario = ?
    ORDER BY f.data_adicionado DESC
  `;

  db.all(sql, [usuario], (err, jogos) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao buscar favoritos: ' + err.message);
    }

    jogos = jogos.map(j => ({
      ...j,
      historiaShort: j.historia
        ? j.historia.substring(0, 120) + (j.historia.length > 120 ? '...' : '')
        : '',
      isFavorito: true
    }));

    res.render('favoritos', {
      jogos,
      usuario: req.session.usuario || null,
      isAdmin: req.session.isAdmin === true
    });
  });
});

module.exports = router;