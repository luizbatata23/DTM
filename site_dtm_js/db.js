const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'tdm_db.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Falha na conexão SQLite: ' + err.message);
    process.exit(1);
  }
  console.log('Conectado ao banco SQLite!');
});

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS jogos_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      origem TEXT,
      jogadores TEXT,
      imagem_url TEXT,
      historia TEXT,
      regras TEXT,
      categoria TEXT,
      nota REAL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS usuario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      usuario TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      telefone TEXT,
      senha TEXT NOT NULL
    )
  `);

  // Insere ADM com senha em hash (só se ainda não existir)
  bcrypt.hash('tabuleiros@1234', 10, (err, hash) => {
    if (err) {
      console.error('Erro ao gerar hash do ADM:', err.message);
      return;
    }
    db.run(`
      INSERT OR IGNORE INTO usuario (nome, usuario, email, telefone, senha)
      VALUES ('ADM', 'adm', 'adm@tdm.com', '', ?)
    `, [hash], (err) => {
      if (err) console.error('Erro ao inserir ADM:', err.message);
      else console.log('ADM verificado/criado com sucesso!');
    });
  });

  // Insere jogos apenas se o banco estiver vazio
  db.get(`SELECT COUNT(*) as total FROM jogos_info`, (err, row) => {
    if (err || row.total > 0) return;

    const jogos = [
      ['Mu Torere', 'Nova Zelândia (Maori)', '2 jogadores', '/img/1_MU TORERE.pdf.png', 'Jogo de tabuleiro tradicional do povo maori.', 'Dois jogadores movem suas peças em torno de um círculo com um ponto central, tentando bloquear o adversário.', 'estrategia', 4.5],
      ['T Shu-P U', 'Origem desconhecida', '2 jogadores', '/img/1_T_SHU-P_U.pdf.png', 'Jogo tradicional registrado em compilações de jogos históricos.', 'Os jogadores movem peças em um tabuleiro simples tentando capturar ou bloquear o oponente.', 'estrategia', 4.0],
      ['Totolopsi', 'Origem tradicional', '2 jogadores', '/img/1_TOTOLOPSI.pdf.png', 'Jogo de estratégia abstrata de origem tradicional.', 'Jogadores alternam movimentos buscando alinhar ou capturar peças, conforme regras específicas do jogo.', 'estrategia', 4.0],
      ['Zuz Mel (7x7)', 'Origem tradicional', '2 jogadores', '/img/2_ZUZ MEL (7x7).pdf.png', 'Versão em tabuleiro 7x7 do jogo Zuz Mel.', 'Peças se movem em casas adjacentes buscando formar padrões de captura.', 'estrategia', 4.1],
      ['Ntxuva', 'Moçambique', '2 jogadores', '/img/2_NTXUVA.pdf.png', 'Jogo de mancala tradicional de Moçambique.', 'Os jogadores semeiam sementes em cavidades do tabuleiro tentando capturar mais sementes que o adversário.', 'estrategia', 4.7],
      ['Coité e Galinhas', 'Brasil / África (inspirado)', '2 jogadores', '/img/3_COITE E GALINHAS.pdf.png', 'Jogo de caça inspirado em jogos tradicionais de caça e fuga.', 'Um lado controla o caçador (coité) e o outro controla as galinhas, tentando escapar ou cercar o caçador.', 'estrategia', 4.3],
      ['Laram Wali', 'Origem tradicional', '2 jogadores', '/img/3_LARAM WALI.pdf.png', 'Jogo de tabuleiro tradicional pouco difundido.', 'Os jogadores movem peças em um padrão fixo, tentando capturar ou bloquear o adversário.', 'estrategia', 4.0],
      ['Awithlaknannai Mosona', 'Pueblo (EUA)', '2 jogadores', '/img/4_AWITHLAKNNANI MOSONA.pdf.png', 'Jogo de alinhamento do povo indígena Pueblo.', 'Os jogadores movem peças por interseções de linhas tentando formar alinhamentos vencedores.', 'estrategia', 4.6],
      ['Xatranje', 'Oriente Médio / Índia', '2 jogadores', '/img/4_XATRANJE.pdf.png', 'Variante histórica do xadrez, antecessora do xadrez moderno.', 'Peças se movem em padrões similares ao xadrez, porém com regras históricas específicas.', 'estrategia', 4.8],
      ['Adugo', 'Brasil (povos indígenas)', '2 jogadores', '/img/5_ADUGO.png', 'Jogo indígena brasileiro também conhecido como "Jogo da Onça".', 'Um jogador controla a onça, outro os cachorros, tentando cercar ou escapar.', 'estrategia', 4.7],
      ['Tobti', 'Origem tradicional', '2 jogadores', '/img/5_TOBTI.pdf.png', 'Jogo tradicional de estratégia de origem pouco documentada.', 'Os jogadores movem peças em um tabuleiro com linhas, tentando capturar as peças adversárias.', 'estrategia', 4.0],
      ['Wali', 'África', '2 jogadores', '/img/6_WALI.pdf.png', 'Jogo de alinhamento tradicional africano.', 'Os jogadores colocam e movem peças tentando formar linhas consecutivas e capturar peças do oponente.', 'estrategia', 4.2],
      ['Choko', 'África', '2 jogadores', '/img/7_CHOKO.pdf.png', 'Jogo africano de captura e bloqueio.', 'Peças são movidas por um tabuleiro com interseções, buscando capturas estratégicas.', 'estrategia', 4.3],
      ['Shatar', 'Mongólia', '2 jogadores', '/img/7_SHATAR.pdf.png', 'Variante mongol do xadrez.', 'Regras semelhantes ao xadrez, com pequenas diferenças em movimentação de peças e condições de vitória.', 'estrategia', 4.6],
      ['Kharbaga', 'África do Norte', '2 jogadores', '/img/8_KHARBAGA.pdf.png', 'Jogo tradicional da região do Magrebe.', 'Os jogadores movimentam peças em um tabuleiro quadriculado com diagonais, procurando capturas múltiplas.', 'estrategia', 4.4],
      ['Pancha Keliya', 'Sri Lanka', '2 jogadores', '/img/9_PANCHA KELIYA.pdf.png', 'Jogo de corrida de peças tradicional de Sri Lanka.', 'Jogadores movem suas peças por um caminho, usando dados ou sorteio, tentando chegar primeiro ao final.', 'sorte', 4.1],
      ['Senterej', 'Etiópia', '2 jogadores', '/img/9_SENTEREJ.pdf.png', 'Variante etíope do xadrez.', 'Há uma fase de posicionamento livre antes do início da partida, seguida por movimentos semelhantes ao xadrez.', 'estrategia', 4.5],
      ['Fetaix', 'África', '2 jogadores', '/img/10_FETAIX.pdf.png', 'Jogo africano semelhante a damas avançadas.', 'Peças movem-se diagonalmente com regras especiais de captura.', 'estrategia', 4.2],
      ['Markuk', 'Origem tradicional', '2 jogadores', '/img/10_MARKUK.pdf.png', 'Jogo tradicional de captura.', 'Jogadores movem peças em interseções de linhas tentando capturar peças inimigas.', 'estrategia', 4.0],
      ['Shax', 'Somália', '2 jogadores', '/img/12_SHAX.pdf.png', 'Jogo tradicional somali, semelhante ao mancala e jogos de alinhamento.', 'Jogadores posicionam e movem peças para capturar as do adversário.', 'estrategia', 4.4],
      ['Sixteen Soldiers', 'Índia / Sri Lanka', '2 jogadores', '/img/13_SIXTEEN SOLDIERS.pdf.png', 'Jogo de batalha entre dois exércitos de dezesseis peças.', 'Peças movem-se por linhas do tabuleiro tentando capturar todas as peças inimigas.', 'estrategia', 4.3],
      ['Aadupuli Attam', 'Índia (Tamil Nadu)', '2 jogadores', '/img/14_AADUPULI ATTAM.pdf.png', 'Jogo tradicional indiano de caça e fuga (cabras e tigres).', 'Um jogador controla tigres e outro cabras, buscando capturar ou cercar o adversário.', 'estrategia', 4.6],
      ['Bolotoudou', 'África', '2 jogadores', '/img/14_BOLOTODOUDOU.pdf.png', 'Jogo de tabuleiro africano pouco difundido.', 'Jogadores movem peças com o objetivo de capturar ou bloquear o oponente.', 'estrategia', 4.0],
      ['Cerco da Pirâmide', 'Europa (histórico)', '2 jogadores', '/img/15_CERCO DA PIRÂMIDE.pdf.png', 'Jogo de cerco com formato de pirâmide.', 'Um lado tenta romper o cerco enquanto o outro tenta manter o bloqueio.', 'estrategia', 4.2],
      ['Morabaraba', 'África do Sul', '2 jogadores', '/img/16_MORABARABA.pdf.png', 'Jogo tradicional africano semelhante ao moinho (Nine Men\'s Morris).', 'Jogadores colocam e movem "bois" formando linhas de três para capturar peças adversárias.', 'estrategia', 4.8],
      ['Pat Gonu', 'Coreia', '2 jogadores', '/img/16_PAT GONU.pdf.png', 'Jogo de estratégia coreano simples.', 'Duas peças se movem por interseções de linhas tentando bloquear o movimento da outra.', 'estrategia', 4.1],
      ['Felli', 'Nepal', '2 jogadores', '/img/17_FELLI.pdf.png', 'Jogo tradicional de alinhamento do Nepal.', 'Jogadores movem peças por vértices de um tabuleiro em forma de cruz, tentando capturar o adversário.', 'estrategia', 4.2],
      ['Pretwa', 'Índia', '2 jogadores', '/img/18_PRETWA.pdf.png', 'Jogo de tabuleiro indiano com padrão circular.', 'Peças se movem por linhas concêntricas e radiais, buscando capturas.', 'estrategia', 4.3],
      ['Pentalpha', 'Europa / tradicional', '1 jogador', '/img/20_PENTALPHA.pdf.png', 'Jogo de solitário em forma de estrela de cinco pontas.', 'O objetivo é colocar e mover peças de modo a preencher ou limpar o tabuleiro conforme regras específicas.', 'estrategia', 4.0],
      ['Pulijudam', 'Índia', '2 jogadores', '/img/20_PULIJUDAM.pdf.png', 'Jogo indiano de caça e fuga (tigre e cabras).', 'Semelhante a outros jogos de caça, um jogador tenta capturar e o outro cercar.', 'estrategia', 4.5],
      ['Zamma', 'África do Norte', '2 jogadores', '/img/21_ZAMMA.pdf.png', 'Jogo de damas tradicional da região do Saara.', 'Peças movem-se diagonalmente com regras de captura parecidas com damas.', 'estrategia', 4.4],
      ['Kororobodo', 'África', '2 jogadores', '/img/22_KOROROBODO.pdf.png', 'Jogo tradicional africano de tabuleiro.', 'Jogadores alternam movimentos buscando capturas obrigatórias.', 'estrategia', 4.1],
      ['Queah', 'Libéria', '2 jogadores', '/img/23_QUEAH.pdf.png', 'Jogo tradicional liberiano.', 'Peças são dispostas em um tabuleiro em forma de diamante, movendo-se para capturar as do adversário.', 'estrategia', 4.3],
      ['Zuz Mel (5x5)', 'Origem tradicional', '2 jogadores', '/img/24_ZUZ MEL (5 x 5).pdf.png', 'Versão em tabuleiro 5x5 do jogo Zuz Mel.', 'Variante mais compacta, com movimentos e capturas adaptados ao tabuleiro menor.', 'estrategia', 4.1],
      ['Katsfála', 'Origem tradicional', '2 jogadores', '/img/25_KATSFÁLA.pdf.png', 'Jogo de tabuleiro tradicional de estratégia abstrata.', 'Jogadores movem peças por interseções de linhas para capturar o oponente.', 'estrategia', 4.0],
      ['Juli Gonu', 'Coreia', '2 jogadores', '/img/26_JULI GONU.pdf.png', 'Variante simples de jogo Gonu coreano.', 'Duas peças por lado se movem por linhas tentando bloquear o adversário.', 'estrategia', 4.0],
    ];

    const sql = `
      INSERT INTO jogos_info (titulo, origem, jogadores, imagem_url, historia, regras, categoria, nota)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    jogos.forEach(jogo => {
      db.run(sql, jogo, (err) => {
        if (err) console.error('Erro ao inserir jogo:', err.message);
      });
    });

    console.log('Jogos iniciais inseridos com sucesso!');
  });

});

module.exports = db;