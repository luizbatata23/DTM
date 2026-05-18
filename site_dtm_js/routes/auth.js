const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt'); // ← 1. Importamos o bcrypt aqui
const saltRounds = 10;          // ← Custo do hash (padrão seguro)

router.use((req, res, next) => {
  console.log('AUTH HIT:', req.method, req.path, req.body);
  next();
});

// ========================
// CADASTRO
// ========================
router.post('/cadastro', (req, res) => {
  const { nome, usuario, email, telefone, senha } = req.body;

  if (!nome || !usuario || !email || !senha) {
    return res.status(400).send('Preencha todos os campos obrigatórios.');
  }

  // 2. Criptografamos a senha antes de rodar o INSERT
  bcrypt.hash(senha, saltRounds, (err, hashGerado) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao processar a senha.');
    }

    const query = `
      INSERT INTO usuario (nome, usuario, email, telefone, senha)
      VALUES (?, ?, ?, ?, ?)
    `;

    // Passamos o 'hashGerado' no lugar da senha aberta
    db.run(query, [nome, usuario, email, telefone, hashGerado], function (err) {
      if (err) {
        console.error(err);
        if (err.message.includes('UNIQUE')) {
          return res.status(400).send('Usuário ou e-mail já cadastrado.');
        }
        return res.status(500).send('Erro ao cadastrar: ' + err.message);
      }

      res.send(`
        <script>
          alert('Cadastro realizado com sucesso! Use seu usuário para logar.');
          window.location.href='/';
        </script>
      `);
    });
  });
});

// ========================
// LOGIN
// ========================
router.post('/login', (req, res) => {
  const usuario = req.body.usuario || null;
  const senha = req.body.senha || null;

  if (!usuario || !senha) {
    return res.redirect('/');
  }

  // 3. Mudamos a Query: Buscamos APENAS pelo usuário (retiramos o 'AND senha = ?')
  const sql = `SELECT * FROM usuario WHERE usuario = ?`;

  db.get(sql, [usuario], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro interno.');
    }

    // Se o usuário existir, comparamos a senha digitada com o hash do banco
    if (row) {
      bcrypt.compare(senha, row.senha, (errCompare, senhasBatem) => {
        if (errCompare) {
          console.error(errCompare);
          return res.status(500).send('Erro ao validar login.');
        }

        if (senhasBatem) {
          // ✅ Senha correta
          req.session.usuario = usuario;
          req.session.isAdmin = (usuario === 'adm');
          res.redirect('/home');
        } else {
          // ❌ Senha incorreta
          exibirErroLogin(res);
        }
      });
    } else {
      // ❌ Usuário não encontrado
      exibirErroLogin(res);
    }
  });
});

// Função auxiliar para evitar código duplicado no erro de login
function exibirErroLogin(res) {
  res.send(`
    <script>
      alert('Usuário ou senha incorretos!');
      window.location.href='/';
    </script>
  `);
}

// ========================
// RECUPERAÇÃO DE SENHA
// ========================
router.post('/rec_senha', (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const usuario = req.body.usuario || '';
  const email = req.body.email || '';
  const nova_senha = req.body.nova_senha || '';

  if (!usuario || !email || !nova_senha) {
    return res.json({ sucesso: false, mensagem: 'Preencha todos os campos!' });
  }

  const querySelect = `SELECT senha FROM usuario WHERE usuario = ? AND email = ?`;

  db.get(querySelect, [usuario, email], (err, row) => {
    if (err) {
      return res.json({ sucesso: false, mensagem: 'Erro interno: ' + err.message });
    }

    if (row) {
      // 4. Comparamos a 'nova_senha' com a senha antiga (hash) para ver se são iguais
      bcrypt.compare(nova_senha, row.senha, (errCompare, saoIguais) => {
        if (errCompare) {
          return res.json({ sucesso: false, mensagem: 'Erro ao validar nova senha.' });
        } 

        if (saoIguais) {
          return res.json({
            sucesso: false,
            mensagem: 'A nova senha não pode ser igual à atual!'
          });
        }

        // 5. Se forem diferentes, geramos o hash da NOVA senha para salvar no banco
        bcrypt.hash(nova_senha, saltRounds, (errHash, novoHashGerado) => {
          if (errHash) {
            return res.json({ sucesso: false, mensagem: 'Erro ao processar nova senha.' });
          }

          const queryUpdate = `UPDATE usuario SET senha = ? WHERE usuario = ? AND email = ?`;

          db.run(queryUpdate, [novoHashGerado, usuario, email], function (err2) {
            if (err2) {
              return res.json({ sucesso: false, mensagem: 'Erro ao atualizar: ' + err2.message });
            }
            res.json({ sucesso: true, mensagem: 'Senha alterada com sucesso!' });
          });
        });
      });

    } else {
      res.json({
        sucesso: false,
        mensagem: 'Dados incorretos: Usuário ou E-mail não conferem.'
      });
    }
  });
});

module.exports = router;


/*const express = require('express');
const router = express.Router();
const db = require('../db');

router.use((req, res, next) => {
  console.log('AUTH HIT:', req.method, req.path, req.body);
  next();
});

// ========================
// CADASTRO
// ========================
router.post('/cadastro', (req, res) => {
  const { nome, usuario, email, telefone, senha } = req.body;

  if (!nome || !usuario || !email || !senha) {
    return res.status(400).send('Preencha todos os campos obrigatórios.');
  }

  const query = `
    INSERT INTO usuario (nome, usuario, email, telefone, senha)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(query, [nome, usuario, email, telefone, senha], function (err) {
    if (err) {
      console.error(err);
      // Erro de usuário ou email duplicado
      if (err.message.includes('UNIQUE')) {
        return res.status(400).send('Usuário ou e-mail já cadastrado.');
      }
      return res.status(500).send('Erro ao cadastrar: ' + err.message);
    }

    res.send(`
      <script>
        alert('Cadastro realizado com sucesso! Use seu usuário para logar.');
        window.location.href='/';
      </script>
    `);
  });
});

// ========================
// LOGIN
// ========================
router.post('/login', (req, res) => {
  const usuario = req.body.usuario || null;
  const senha = req.body.senha || null;

  if (!usuario || !senha) {
    return res.redirect('/');
  }

  const sql = `SELECT * FROM usuario WHERE usuario = ? AND senha = ?`;

  db.get(sql, [usuario, senha], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro interno.');
    }

    if (row) {
      req.session.usuario = usuario;
      req.session.isAdmin = (usuario === 'adm'); // ← define quem é ADM
      res.redirect('/home');
    } else {
      res.send(`
        <script>
          alert('Usuário ou senha incorretos!');
          window.location.href='/';
        </script>
      `);
    }
  });
});

// ========================
// RECUPERAÇÃO DE SENHA
// ========================
router.post('/rec_senha', (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const usuario = req.body.usuario || '';
  const email = req.body.email || '';
  const nova_senha = req.body.nova_senha || '';

  if (!usuario || !email || !nova_senha) {
    return res.json({ sucesso: false, mensagem: 'Preencha todos os campos!' });
  }

  const querySelect = `SELECT senha FROM usuario WHERE usuario = ? AND email = ?`;

  db.get(querySelect, [usuario, email], (err, row) => {
    if (err) {
      return res.json({ sucesso: false, mensagem: 'Erro interno: ' + err.message });
    }

    if (row) {
      if (nova_senha === row.senha) {
        return res.json({
          sucesso: false,
          mensagem: 'A nova senha não pode ser igual à atual!'
        });
      }

      const queryUpdate = `UPDATE usuario SET senha = ? WHERE usuario = ? AND email = ?`;

      db.run(queryUpdate, [nova_senha, usuario, email], function (err2) {
        if (err2) {
          return res.json({ sucesso: false, mensagem: 'Erro ao atualizar: ' + err2.message });
        }
        res.json({ sucesso: true, mensagem: 'Senha alterada com sucesso!' });
      });

    } else {
      res.json({
        sucesso: false,
        mensagem: 'Dados incorretos: Usuário ou E-mail não conferem.'
      });
    }
  });
});

module.exports = router;*/