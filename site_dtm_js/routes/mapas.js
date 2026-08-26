const express = require('express');
const router = express.Router();
const db = require('../db');

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) return next();
  return res.status(403).send('Acesso restrito ao administrador.');
}

function parseCoord(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// GET - página de mapas 2D/3D
router.get('/', (req, res) => {
  const sql = `
    SELECT id, titulo, origem, jogadores, imagem_url, historia, regras,
           COALESCE(categoria, 'estrategia') AS categoria,
           COALESCE(nota, '') AS nota,
           latitude, longitude
    FROM jogos_info 
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    ORDER BY titulo ASC
  `;

  db.all(sql, [], (err, jogos) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao buscar jogos: ' + err.message);
    }

    // Preparar dados GeoJSON para o mapa
    const geoJson = {
      type: 'FeatureCollection',
      features: jogos
        .filter(j => j.latitude !== null && j.longitude !== null)
        .map(j => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [j.longitude, j.latitude]
          },
          properties: {
            id: j.id,
            titulo: j.titulo,
            origem: j.origem,
            jogadores: j.jogadores,
            imagem_url: j.imagem_url,
            categoria: j.categoria,
            nota: j.nota
          }
        }))
    };

    res.render('mapas', { 
      jogos,
      geoJson: JSON.stringify(geoJson),
      usuario: req.session.usuario || null,
      isAdmin: req.session.isAdmin === true
    });
  });
});

// API - retorna todos os jogos com coordenadas (para uso no cliente)
router.get('/api/jogos', (req, res) => {
  const sql = `
    SELECT id, titulo, origem, jogadores, imagem_url, categoria, nota, latitude, longitude
    FROM jogos_info 
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    ORDER BY titulo ASC
  `;

  db.all(sql, [], (err, jogos) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar jogos' });
    }

    const geoJson = {
      type: 'FeatureCollection',
      features: jogos.map(j => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [j.longitude, j.latitude]
        },
        properties: {
          id: j.id,
          titulo: j.titulo,
          origem: j.origem,
          jogadores: j.jogadores,
          imagem_url: j.imagem_url,
          categoria: j.categoria,
          nota: j.nota
        }
      }))
    };

    res.json(geoJson);
  });
});

// API - retorna um jogo específico com coordenadas
router.get('/api/jogos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const sql = `
    SELECT id, titulo, origem, jogadores, imagem_url, historia, regras, categoria, nota, latitude, longitude
    FROM jogos_info 
    WHERE id = ?
  `;

  db.get(sql, [id], (err, jogo) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao buscar jogo' });
    }

    if (!jogo) {
      return res.status(404).json({ error: 'Jogo não encontrado' });
    }

    res.json(jogo);
  });
});

// Painel admin: lista todos os jogos (com e sem coordenadas)
router.get('/admin', requireAdmin, (req, res) => {
  const sql = `
    SELECT id, titulo, origem, categoria, latitude, longitude
    FROM jogos_info
    ORDER BY
      CASE WHEN latitude IS NULL OR longitude IS NULL THEN 0 ELSE 1 END,
      titulo ASC
  `;

  db.all(sql, [], (err, jogos) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao buscar jogos: ' + err.message);
    }

    const semCoord = jogos.filter((j) => j.latitude == null || j.longitude == null).length;
    res.render('mapas-admin', {
      jogos,
      semCoord,
      usuario: req.session.usuario || null,
      isAdmin: true
    });
  });
});

router.post('/admin/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).send('ID inválido.');

  const latitude = parseCoord(req.body.latitude);
  const longitude = parseCoord(req.body.longitude);

  if (latitude != null && (latitude < -90 || latitude > 90)) {
    return res.status(400).send('Latitude deve estar entre -90 e 90.');
  }
  if (longitude != null && (longitude < -180 || longitude > 180)) {
    return res.status(400).send('Longitude deve estar entre -180 e 180.');
  }

  db.run(
    `UPDATE jogos_info SET latitude = ?, longitude = ? WHERE id = ?`,
    [latitude, longitude, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Erro ao salvar coordenadas: ' + err.message);
      }
      res.redirect('/mapas/admin');
    }
  );
});

module.exports = router;