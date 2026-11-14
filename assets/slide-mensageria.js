/* Widget [data-escala] (Aula 10): "escalar jobs = pendurar mais workers na MESMA fila".
   Um producer lança 2 jobs/s; cada worker consome ~0,7 jobs/s. O aluno clica em + e − worker e vê a
   fila encher ou esvaziar. Carregar ANTES de slide.js (as miniaturas clonam o estado já desenhado).
   Sem else: early return / continue. */
(function(){
  var MAX_FILA = 24;
  var CHEGAM = 2;            // jobs por segundo que o producer lança
  var POR_WORKER = 0.7;      // jobs por segundo que cada worker consome

  function $all(raiz, sel){ return Array.prototype.slice.call(raiz.querySelectorAll(sel)); }

  function initEscala(raiz){
    var celulas = $all(raiz, '.esc-fila i');
    var filaEl = raiz.querySelector('.esc-fila');
    var numEl = raiz.querySelector('.esc-n');
    var workersEl = $all(raiz, '.esc-w');
    var veredito = raiz.querySelector('.esc-veredito');
    var mais = raiz.querySelector('.esc-mais');
    var menos = raiz.querySelector('.esc-menos');

    var workers = 3;
    var fila = 2;
    var saldoConsumo = 0;
    var saldoChegada = 0;
    var tocando = true;
    var vistoAntes = false;
    var ultimoToque = 0;
    var passo = 0;

    function desenhar(){
      celulas.forEach(function(c, i){ c.classList.toggle('on', i < Math.min(fila, celulas.length)); });
      filaEl.classList.toggle('cheia', fila >= MAX_FILA);
      numEl.textContent = fila;
      workersEl.forEach(function(w, i){
        w.classList.toggle('on', i < workers);
        w.classList.toggle('off', i >= workers);
        w.classList.toggle('ocupado', i < workers && fila > 0);
      });
      menos.disabled = workers <= 1;
      mais.disabled = workers >= workersEl.length;
      var escoa = workers * POR_WORKER;
      veredito.className = 'esc-veredito';
      if(escoa < CHEGAM){
        veredito.classList.add('ruim');
        veredito.textContent = 'chegam ' + CHEGAM + '/s e ' + workers + ' worker' + (workers > 1 ? 's' : '') + ' faz' + (workers > 1 ? 'em' : '') + ' ' + escoa.toFixed(1).replace('.', ',') + '/s: a fila CRESCE';
        return;
      }
      veredito.classList.add('bom');
      veredito.textContent = workers + ' workers fazem ' + escoa.toFixed(1).replace('.', ',') + '/s: a fila ESVAZIA';
    }

    function slideAberto(){
      var slide = raiz.closest('.slide');
      if(!slide) return true;
      return !slide.hidden;
    }

    function definirWorkers(n){
      workers = Math.min(Math.max(n, 1), workersEl.length);
      desenhar();
    }

    function tocar(acao){
      return function(){
        tocando = false;                 // mexeu na mão: para o autoplay
        raiz.classList.add('pausado');
        definirWorkers(workers + acao);
      };
    }
    mais.addEventListener('click', tocar(1));
    menos.addEventListener('click', tocar(-1));

    // a cada 250 ms o mundo anda um tick
    setInterval(function(){
      if(!slideAberto()){ vistoAntes = false; return; }
      if(!vistoAntes){
        vistoAntes = true;
        passo = 0;
        if(tocando){ fila = 0; definirWorkers(1); }
      }
      saldoChegada += CHEGAM * 0.25;
      while(saldoChegada >= 1){
        saldoChegada -= 1;
        fila = Math.min(fila + 1, MAX_FILA);
      }
      saldoConsumo += workers * POR_WORKER * 0.25;
      while(saldoConsumo >= 1){
        saldoConsumo -= 1;
        fila = Math.max(fila - 1, 0);
      }
      desenhar();
    }, 250);

    // autoplay: 1 worker (cresce) → 2 (cresce devagar) → 3 (esvazia) → 4, e recomeça
    setInterval(function(){
      if(!tocando || !slideAberto() || !vistoAntes) return;
      passo += 1;
      if(passo % 4 !== 0) return;
      var proximo = workers + 1;
      if(proximo > 4) proximo = 1;
      definirWorkers(proximo);
    }, 1800);

    raiz.alternar = function(){
      tocando = !tocando;
      raiz.classList.toggle('pausado', !tocando);
    };
    raiz.tocando = function(){ return tocando; };
    raiz.definirTocando = function(valor){ tocando = valor; };
    raiz.irPara = function(){};
    raiz.atual = function(){ return null; };
    desenhar();
  }

  /* ── controle do passo a passo (⏸/▶, um botão por passo, ‹ ›) sobre os widgets [data-passos] ── */
  function initControles(raiz){
    var play = raiz.querySelector('.pp-play');
    var botoes = $all(raiz, '.pp-b');
    var prev = raiz.querySelector('.pp-prev');
    var next = raiz.querySelector('.pp-next');
    if(!play || !raiz.irPara) return;

    function sincronizar(){
      var n = raiz.atual();
      var tocando = raiz.tocando();
      botoes.forEach(function(b){
        var i = parseInt(b.dataset.i, 10);
        b.classList.toggle('on', i === n);
        b.classList.toggle('feito', i < n);
      });
      play.textContent = tocando ? '⏸ pausar' : '▶ tocar';
      raiz.classList.toggle('pausado', !tocando);
      prev.disabled = n <= 1;
      next.disabled = n >= botoes.length;
    }

    play.addEventListener('click', function(){ raiz.alternar(); sincronizar(); });
    prev.addEventListener('click', function(){ raiz.passo(-1); sincronizar(); });
    next.addEventListener('click', function(){ raiz.passo(1); sincronizar(); });
    botoes.forEach(function(b){
      b.addEventListener('click', function(){
        raiz.definirTocando(false);        // escolheu um passo: para e fica nele, para falar à vontade
        raiz.irPara(parseInt(b.dataset.i, 10));
        sincronizar();
      });
    });
    setInterval(sincronizar, 150);
    sincronizar();
  }
  $all(document, '[data-passos]').forEach(initControles);

  $all(document, '[data-escala]').forEach(initEscala);

  // P (para/retoma) vale também para este widget
  window.addEventListener('keydown', function(e){
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    if(e.key.toLowerCase() !== 'p') return;
    var w = document.querySelector('.deck .slide:not([hidden]) [data-escala]');
    if(w) w.alternar();
  }, true);
})();
