// ====================================================
// 1. GESTÃO DO MENU HAMBÚRGUER (MOBILE)
// ====================================================
function configurarMenuToggle() {
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav"); // A variável é mainNav
  const navLinks = document.querySelectorAll(".nav-link");

  if (menuToggle && mainNav) {
    // 1. Abre e fecha o menu
    menuToggle.addEventListener("click", () => {
      // CORREÇÃO: Usar mainNav em vez de navList
      mainNav.classList.toggle("active");

      // CORREÇÃO: Manter consistência na classe "active"
      menuToggle.classList.toggle("active");
    });

    // 2. Fecha o menu ao clicar em um link
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        // CORREÇÃO: Remover a classe "active", não "open"
        mainNav.classList.remove("active");
        menuToggle.classList.remove("active");
      });
    });
  }
}

// ====================================================
// 2. DESTAQUE DE LINK ATIVO
// ====================================================
function destacarLinkAtivo() {
  const path = window.location.pathname.split("/").pop();
  const atual = path === "" ? "home.html" : path;
  const links = document.querySelectorAll(".main-nav .nav-link");

  links.forEach((link) => {
    link.classList.remove("active");
    const href = link.getAttribute("href").split("/").pop();
    if (atual === href) {
      link.classList.add("active");
    }
  });
}

// ====================================================
// 3. LÓGICA DE FILTROS E PARÂMETROS DE URL
// ====================================================
function processarParametrosEAncoras() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("categoria");

  // Verifica se a função setCategoria existe (exclusiva do catálogo)
  if (cat && typeof setCategoria === "function") {
    setCategoria(cat);
  }

  // Suaviza o deslize para a âncora #secao-filtros
  if (window.location.hash === "#secao-filtros") {
    const elemento = document.getElementById("secao-filtros");
    if (elemento) {
      setTimeout(() => {
        elemento.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }
}

// Função moderna para animar elementos ao rolar (Intersection Observer)
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    if (reveals.length === 0) return;

    // Configuração do "Observador"
    const observerOptions = {
        root: null, // usa a janela do navegador como base
        rootMargin: '0px',
        threshold: 0.15 // Ativa quando 15% do elemento estiver visível
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Opcional: para de observar depois que animou uma vez
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Começa a observar cada elemento .reveal
    reveals.forEach(el => observer.observe(el));
}

function selecionarMembro(elemento) {
    // 1. Pega todos os cards
    const cards = document.querySelectorAll('.member-card');
    
    // 2. Remove a classe active de todos
    cards.forEach(card => card.classList.remove('active'));
    
    // 3. Adiciona active apenas no que foi clicado
    elemento.classList.add('active');
}
// EXECUÇÃO CENTRALIZADA E CORRIGIDA
document.addEventListener("DOMContentLoaded", () => {

  // 1. Menu Mobile
  configurarMenuToggle();

  // 2. Outras funções de navegação
  if (typeof destacarLinkAtivo === "function") destacarLinkAtivo();
  if (typeof processarParametrosEAncoras === "function") processarParametrosEAncoras();

  // 3. Animação de scroll
  initScrollReveal();

  // 4. Vira o card ao clicar
  // 4. Vira o card ao clicar (e desivra os outros)
const cards = document.querySelectorAll('.game-card');
cards.forEach(card => {
  card.addEventListener('click', () => {
    const jaEstaVirado = card.classList.contains('virado');

    // Desivra todos
    cards.forEach(c => c.classList.remove('virado'));

    // Se o card clicado NÃO estava virado, vira ele
    if (!jaEstaVirado) {
      card.classList.add('virado');
    }
  });
});

});