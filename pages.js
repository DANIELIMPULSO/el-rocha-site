// Páginas internas do mockup (Clientes, Projetos autorais, Capacitação).
// Cada bloco só roda se a página tiver o elemento correspondente.
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const p2 = n => String(n).padStart(2, '0');
const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---------- Título da abertura: letras separadas para reagirem ao mouse ----------
$$('.p-title span').forEach(s => {
  s.setAttribute('aria-hidden', 'true');
  // cada palavra fica em um bloco que não quebra: o título só muda de linha entre palavras, nunca no meio de uma
  s.innerHTML = s.textContent.split(/(\s+)/).map(p => /^\s+$/.test(p) ? '<i> </i>' : '<em>' + [...p].map(c => '<i>' + c + '</i>').join('') + '</em>').join('');
});
// títulos compridos usam letra menor, para cada linha caber inteira
$$('.p-title').forEach(t => { if (Math.max(...$$('span', t).map(s => s.textContent.length)) > 16) t.classList.add('longo'); });

// ---------- Clientes: depoimentos ----------
const stage = $('#voice-stage');
if (stage) {
  const voices = $$('.voice', stage);
  const list = $('#voice-list');
  const count = $('#voice-count');
  const DUR = 7000; // tempo de cada depoimento
  stage.style.setProperty('--dur', DUR + 'ms');
  let cur = 0, timer = null;

  const tabs = voices.map((v, k) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = '<b></b><strong></strong><small></small>';
    b.children[0].textContent = p2(k + 1);
    b.children[1].textContent = v.dataset.nome;
    b.children[2].textContent = v.dataset.emp.split(' · ')[0];
    b.addEventListener('click', () => go(k));
    li.append(b);
    list.append(li);
    return b;
  });

  function go(k) {
    cur = (k + voices.length) % voices.length;
    voices.forEach((v, i) => v.classList.toggle('on', i === cur));
    tabs.forEach((b, i) => b.setAttribute('aria-current', i === cur));
    count.textContent = p2(cur + 1) + ' / ' + p2(voices.length);
    // reinicia a barra de tempo e o avanço automático
    stage.classList.remove('run');
    clearTimeout(timer);
    if (calm) return;
    void stage.offsetWidth;
    stage.classList.add('run');
    timer = setTimeout(() => go(cur + 1), DUR);
  }
  // O avanço para enquanto o mouse está sobre o depoimento e recomeça quando ele sai
  stage.addEventListener('mouseenter', () => clearTimeout(timer));
  stage.addEventListener('mouseleave', () => { if (!calm) go(cur); });
  $$('.voice-nav button').forEach(b => b.addEventListener('click', () => go(cur + Number(b.dataset.dir))));
  go(0);
}

// ---------- Clientes: foco de luz que acompanha o mouse sobre a parede de marcas ----------
const wall = $('#wall');
if (wall && finePointer) {
  wall.addEventListener('mousemove', e => {
    const r = wall.getBoundingClientRect();
    wall.style.setProperty('--wx', (e.clientX - r.left) + 'px');
    wall.style.setProperty('--wy', (e.clientY - r.top) + 'px');
  }, { passive: true });
  wall.addEventListener('mouseleave', () => { wall.style.removeProperty('--wx'); wall.style.removeProperty('--wy'); });
}
$$('.wall li').forEach((li, k) => { li.style.transitionDelay = (k % 6) * 50 + 'ms'; });

// ---------- Autorais: filtro e cartazes que inclinam com o mouse ----------
$$('.filters[data-filter]').forEach(group => {
  const grid = $(group.dataset.filter);
  const items = $$('[data-cat]', grid);
  const more = $('[data-more="' + group.dataset.filter + '"]');
  const PAGE = Number(grid.dataset.page) || 0; // 0 = mostra tudo
  let filtro = 'todos', limite = PAGE || Infinity;
  // Decide o que fica visível e anima a troca: quem sai some, quem fica desliza até o novo lugar
  // e quem entra aparece em sequência (mesma transição do portfólio da home).
  let vez = 0;
  function aplicar(animar) {
    let vistos = 0, total = 0;
    const visivel = new Map(items.map(c => {
      const ok = filtro === 'todos' || c.dataset.cat.split('|').includes(filtro);
      if (ok) total++;
      return [c, ok && ++vistos <= limite];
    }));
    if (more) more.hidden = total <= limite;
    const trocar = () => items.forEach(c => { c.hidden = !visivel.get(c); if (!c.hidden) c.classList.add('in'); });
    if (!animar || calm || !grid.animate) { trocar(); return; }

    const turno = ++vez;
    grid.getAnimations({ subtree: true }).forEach(an => an.cancel());
    const antes = new Map(items.filter(c => !c.hidden).map(c => [c, c.getBoundingClientRect()]));
    const saem = [...antes.keys()].filter(c => !visivel.get(c));
    saem.forEach(c => c.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.95)' }], { duration: 240, easing: 'ease-in', fill: 'forwards' }));
    setTimeout(() => {
      if (turno !== vez) return;
      saem.forEach(c => c.getAnimations().forEach(an => an.cancel()));
      trocar();
      const suave = 'cubic-bezier(.2, .7, .2, 1)';
      let ordem = 0;
      items.filter(c => !c.hidden).forEach(c => {
        c.style.transitionDelay = '0s';
        const de = antes.get(c), para = c.getBoundingClientRect();
        if (de && !saem.includes(c)) {
          const dx = de.left - para.left, dy = de.top - para.top;
          if (dx || dy) c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 620, easing: suave });
        } else if (ordem < 12) {
          c.animate([{ opacity: 0, transform: 'translateY(18px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: 60 + ordem++ * 45, easing: suave, fill: 'backwards' });
        }
      });
    }, saem.length ? 250 : 0);
  }
  $$('button', group).forEach(b => b.addEventListener('click', () => {
    $$('button', group).forEach(x => x.setAttribute('aria-pressed', x === b));
    filtro = b.dataset.f;
    limite = PAGE || Infinity;
    aplicar(true);
  }));
  if (more) more.addEventListener('click', () => { limite += PAGE; aplicar(true); });
  if (PAGE) aplicar();
});
$$('.poster').forEach((p, k) => {
  p.style.transitionDelay = (k % 4) * 80 + 'ms';
  if (!finePointer || calm) return;
  const art = $('.poster-art', p);
  p.addEventListener('mousemove', e => {
    const r = art.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    art.style.setProperty('--ry', ((x - .5) * 14).toFixed(2) + 'deg');
    art.style.setProperty('--rx', ((.5 - y) * 10).toFixed(2) + 'deg');
    art.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
    art.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
  }, { passive: true });
  p.addEventListener('mouseleave', () => ['--rx', '--ry'].forEach(v => art.style.removeProperty(v)));
});

// ---------- Capacitação: fotos que ampliam ----------
const box = $('#lightbox');
if (box) {
  const boxImg = $('img', box);
  let grupo = [], atual = 0;
  // setas e contador (só aparecem quando há mais de uma foto no conjunto)
  box.insertAdjacentHTML('beforeend', '<button class="lb-seta lb-ant" type="button" aria-label="Foto anterior">←</button><button class="lb-seta lb-prox" type="button" aria-label="Próxima foto">→</button><span class="lb-conta" aria-hidden="true"></span>');
  const conta = $('.lb-conta', box);
  const mostrar = k => {
    atual = (k + grupo.length) % grupo.length;
    boxImg.src = grupo[atual].dataset.full;
    conta.textContent = p2(atual + 1) + ' / ' + p2(grupo.length);
    box.classList.toggle('uma', grupo.length < 2);
  };
  $$('[data-full]').forEach(b => b.addEventListener('click', () => {
    // o conjunto é a galeria onde a foto está (ou todas as fotos da página, se ela estiver solta no texto)
    grupo = $$('[data-full]', b.closest('.shots, .mosaic, section') || document);
    if (grupo.length < 2) grupo = $$('[data-full]');
    mostrar(grupo.indexOf(b));
    box.showModal();
    // a janela da foto fica acima de tudo; o cursor próprio entra nela para continuar visível
    $$('.cursor, .dot').forEach(c => box.append(c));
  }));
  $('.lb-ant', box).addEventListener('click', e => { e.stopPropagation(); mostrar(atual - 1); });
  $('.lb-prox', box).addEventListener('click', e => { e.stopPropagation(); mostrar(atual + 1); });
  box.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') mostrar(atual - 1); if (e.key === 'ArrowRight') mostrar(atual + 1); });
  box.addEventListener('click', () => box.close());
  box.addEventListener('close', () => $$('.cursor, .dot', box).forEach(c => document.body.append(c)));
}
const mosaics = $$('.mosaic');
$$('.shots li').forEach((li, k) => { li.style.transitionDelay = (k % 4) * 80 + 'ms'; });
$$('.grid-3 > *, .related > *, .posts.all > *').forEach((el, k) => { el.style.transitionDelay = (k % 3) * 90 + 'ms'; });

// ---------- Player: o vídeo só é carregado quando a pessoa aperta o play ----------
$$('.player[data-embed]').forEach(player => {
  const poster = $('.player-poster', player);
  if (!player.dataset.embed) return;
  poster.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = player.dataset.embed;
    f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    f.allowFullscreen = true;
    f.title = poster.getAttribute('aria-label') || 'Filme';
    player.replaceChildren(f);
  });
});

// ---------- Como funciona: etapas e linha do tempo guiadas pela rolagem ----------
const proc = $('#processo');
let updateProc = () => {};
if (proc) {
  const steps = $$('#proc-steps li');
  const num = $('#proc-num'), numSmall = $('#proc-n');
  const track = $('.tl-track', proc), head = $('.tl-head', proc);
  const clips = steps.map((li, k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.tabIndex = -1;
    b.innerHTML = '<b></b>';
    b.firstChild.textContent = p2(k + 1);
    b.append($('h3', li).textContent);
    b.addEventListener('click', () => scrollTo({ top: proc.offsetTop + (proc.offsetHeight - innerHeight) * ((k + .5) / steps.length), behavior: calm ? 'auto' : 'smooth' }));
    track.append(b);
    return b;
  });
  // Vídeo discreto atrás do número e da descrição de cada etapa (não cobre a linha do tempo de baixo).
  // MARCADOR DE LUGAR: usa o vídeo da home e salta para um trecho diferente a cada etapa.
  // No site real, cada etapa terá o seu próprio vídeo (trocar por data-video em cada <li>).
  let fundo = null;
  if (!calm) {
    fundo = document.createElement('video');
    fundo.className = 'proc-bg';
    fundo.muted = true; fundo.loop = true; fundo.playsInline = true; fundo.preload = 'metadata';
    fundo.setAttribute('aria-hidden', 'true');
    fundo.src = 'https://www.impulsofilmes.com.br/wp-content/uploads/2024/08/IMPULSOBANNER2024_05.mp4';
    $('.proc-stage', proc).prepend(fundo);
    // só toca enquanto a seção está na tela
    new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? fundo.play().catch(() => {}) : fundo.pause(); })).observe(proc);
  }
  const trocarFundo = k => {
    if (!fundo) return;
    fundo.classList.add('troca');
    setTimeout(() => {
      const li = steps[k];
      if (li && li.dataset.video && fundo.dataset.atual !== li.dataset.video) { fundo.src = li.dataset.video; fundo.dataset.atual = li.dataset.video; fundo.play().catch(() => {}); }
      else if (fundo.duration) fundo.currentTime = (fundo.duration / steps.length) * k;
      fundo.classList.remove('troca');
    }, 320);
  };
  let active = -1;
  const setStep = k => {
    if (k === active) return;
    active = k;
    trocarFundo(k);
    steps.forEach((li, i) => { li.classList.toggle('on', i === k); li.classList.toggle('past', i < k); });
    clips.forEach((b, i) => { b.classList.toggle('on', i === k); b.classList.toggle('done', i < k); });
    num.textContent = numSmall.textContent = p2(k + 1);
    num.classList.remove('flip');
    void num.offsetWidth;
    num.classList.add('flip');
  };
  updateProc = () => {
    const p = Math.max(0, Math.min(.9999, (scrollY - proc.offsetTop) / (proc.offsetHeight - innerHeight)));
    const pos = p * steps.length;
    setStep(Math.floor(pos));
    clips.forEach((b, i) => b.style.setProperty('--f', Math.max(0, Math.min(1, pos - i)).toFixed(3)));
    head.style.setProperty('--x', (p * track.offsetWidth).toFixed(1) + 'px');
  };
  addEventListener('resize', () => updateProc());
}

// ---------- Formulários (no mockup nada é enviado) ----------
$$('.steps-form').forEach(form => {
  const steps = $$('.step', form), bar = $$('.step-bar span', form);
  const back = $('[data-back]', form), next = $('[data-next]', form), send = $('[data-send]', form);
  let cur = 0;
  const show = k => {
    cur = k;
    steps.forEach((s, i) => s.classList.toggle('on', i === k));
    bar.forEach((s, i) => { s.classList.toggle('on', i === k); s.classList.toggle('done', i < k); });
    back.hidden = k === 0;
    next.hidden = k === steps.length - 1;
    send.hidden = k !== steps.length - 1;
  };
  next.addEventListener('click', () => {
    const invalido = $$('input, select, textarea', steps[cur]).find(el => !el.checkValidity());
    if (invalido) { invalido.reportValidity(); return; }
    show(cur + 1);
  });
  back.addEventListener('click', () => show(cur - 1));
  show(0);
});
$$('form').forEach(form => form.addEventListener('submit', e => {
  e.preventDefault();
  const note = $('.form-note', form);
  if (note) note.textContent = 'Mockup: o formulário ainda não envia nada.';
}));

// ---------- Cabeçalho, menu e entrada dos blocos ----------
const header = $('.top');
const burger = $('.burger');
const menu = $('#menu');
burger.addEventListener('click', () => burger.setAttribute('aria-expanded', menu.classList.toggle('open')));
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .1 });
$$('.reveal').forEach(el => io.observe(el));

// ---------- Rolagem ----------
const hero = $('.p-hero');
let queued = false;
function onScroll() {
  queued = false;
  header.classList.toggle('scrolled', scrollY > 40);
  if (calm) return;
  root.style.setProperty('--p', (scrollY / Math.max(1, root.scrollHeight - innerHeight)).toFixed(4));
  if (hero) hero.style.setProperty('--hs', Math.min(1, scrollY / hero.offsetHeight).toFixed(3));
  updateProc();
  mosaics.forEach(mosaic => {
    // deslocamento relativo ao centro da tela: as colunas se cruzam enquanto a galeria passa
    const r = mosaic.getBoundingClientRect();
    mosaic.style.setProperty('--sy', (((r.top + r.height / 2) - innerHeight / 2) * .12).toFixed(1));
  });
}
addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

// ---------- Timecode da abertura ----------
if (!calm && $('#tc')) {
  const tc = $('#tc');
  const t0 = performance.now();
  setInterval(() => {
    const f = Math.floor((performance.now() - t0) / (1000 / 24));
    tc.textContent = [Math.floor(f / 86400), Math.floor(f / 1440) % 60, Math.floor(f / 24) % 60, f % 24].map(p2).join(':');
  }, 1000 / 24);
}

// ---------- Mouse: cursor próprio, foco de luz da abertura e botões atraídos ----------
if (finePointer && !calm) {
  document.body.classList.add('has-cursor');
  const ring = $('.cursor');
  const dot = $('.dot');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
    const t = e.target.closest('[data-cursor], a, button');
    ring.classList.toggle('off', /IFRAME|INPUT|SELECT|TEXTAREA/.test(e.target.tagName));
    ring.classList.toggle('label', !!t && !!t.dataset.cursor);
    ring.classList.toggle('link', !!t && !t.dataset.cursor);
    ring.textContent = t && t.dataset.cursor ? t.dataset.cursor : '';
  }, { passive: true });
  (function follow() {
    rx += (mx - rx) * .18; ry += (my - ry) * .18;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(follow);
  })();

  const shade = $('.p-shade');
  const letters = $$('.p-title i');
  if (hero) hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    shade.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    shade.style.setProperty('--my', (e.clientY - r.top) + 'px');
    letters.forEach(l => {
      const b = l.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (b.left + b.width / 2), (e.clientY - (b.top + b.height / 2)) * 1.4);
      l.style.setProperty('--k', (1 + .22 * Math.max(0, 1 - d / 220) ** 2).toFixed(3));
    });
  }, { passive: true });
  if (hero) hero.addEventListener('mouseleave', () => letters.forEach(l => l.style.removeProperty('--k')));

  $$('.case, .player-poster').forEach(card => {
    const img = $('img', card);
    if (!img) return;
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      img.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5) * -18 + 'px');
      img.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5) * -18 + 'px');
    }, { passive: true });
    card.addEventListener('mouseleave', () => { img.style.removeProperty('--px'); img.style.removeProperty('--py'); });
  });

  $$('.btn.solid, .cta').forEach(b => {
    b.classList.add('magnet');
    b.addEventListener('mousemove', e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    b.addEventListener('mouseleave', () => { b.style.transform = ''; });
  });
}

// ---------- Números que contam quando entram na tela ----------
// Em cascata: cada número começa um pouco depois do anterior, sem esperar ele terminar. O ano avança de 2013 até o ano atual; os outros sobem de zero até o valor final.
{
  const parado = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anoAtual = new Date().getFullYear();
  const DURACAO = 2000; // tempo de cada contagem, em milissegundos
  const INTERVALO = 450; // distância entre o início de um número e o do próximo
  document.querySelectorAll('[data-anos]').forEach(el => { el.textContent = anoAtual - 2013; });
  const alvo = el => el.dataset.to === 'ano' ? anoAtual : Number(el.dataset.to);
  const partida = el => Number(el.dataset.from || 0);
  // o "+" é desenhado pelo CSS, pendurado à esquerda, para o alinhamento ser pelo primeiro algarismo
  const escrever = (el, v) => { el.textContent = Math.round(v) + (el.dataset.suffix || ''); };
  const numeros = [...document.querySelectorAll('.facts strong[data-to]')];
  numeros.forEach(el => escrever(el, alvo(el))); // valor final, caso não haja animação

  const contar = el => {
    const de = partida(el), ate = alvo(el), t0 = performance.now();
    el.closest('li').classList.remove('wait');
    (function passo(agora) {
      const t = Math.min(1, (agora - t0) / DURACAO);
      const suave = 1 - Math.pow(1 - t, 3); // começa firme e desacelera no fim
      escrever(el, de + (ate - de) * suave);
      if (t < 1) requestAnimationFrame(passo);
    })(t0);
  };
  if (!parado && numeros.length && 'IntersectionObserver' in window) {
    numeros.forEach(el => { escrever(el, partida(el)); el.closest('li').classList.add('wait'); });
    const ver = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      ver.unobserve(e.target);
      [...e.target.querySelectorAll('strong[data-to]')].forEach((el, k) => setTimeout(() => contar(el), k * INTERVALO));
    }), { threshold: .4 });
    document.querySelectorAll('.facts').forEach(ul => ver.observe(ul));
  }
}
