const express = require('express');
const router = express.Router();

router.get('/home', (req, res) => {
  res.render('home', {
    usuario: req.session.usuario || null,
    isAdmin: req.session.isAdmin || false
  });
});

router.get('/sobre', (req, res) => {
  res.render('sobre', {
    usuario: req.session.usuario || null,
    isAdmin: req.session.isAdmin || false
  });
});

module.exports = router;