// El Rocha: Sem Pedir Licença — comportamentos próprios do site. Carregado depois de pages.js (do mockup),
// que já cuida de cabeçalho, menu, .reveal, barra de progresso, player do YouTube e lightbox.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const dois = n => String(n).padStart(2, '0');
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Fotos de imprensa ----------
  // O brief pede autorização dos fotógrafos/veículos antes de publicar fotos de imprensa.
  // Com false, toda imagem marcada com data-imprensa vira um placeholder cinza (a legenda com o crédito continua).
  const MOSTRAR_FOTOS_DE_IMPRENSA = true;
  if (!MOSTRAR_FOTOS_DE_IMPRENSA) {
    document.documentElement.classList.add('sem-imprensa'); // tira também a foto de fundo da abertura
    $$('img[data-imprensa]').forEach(img => {
      const ph = document.createElement('span');
      ph.className = 'ph';
      ph.textContent = 'Aguardando autorização';
      const alvo = img.closest('button[data-full]') || img;
      if (alvo !== img) { alvo.removeAttribute('data-full'); alvo.disabled = true; }
      img.replaceWith(ph);
    });
  }

  // ---------- Lightbox: legenda com crédito embaixo da foto ampliada ----------
  const box = $('#lightbox');
  if (box) {
    const img = $('img', box);
    const leg = $('.lb-legenda', box);
    const atualizar = () => {
      const src = img.getAttribute('src');
      const b = $$('[data-full]').find(x => x.dataset.full === src);
      leg.innerHTML = b && b.dataset.legenda ? b.dataset.legenda : '';
    };
    new MutationObserver(atualizar).observe(img, { attributes: true, attributeFilter: ['src'] });
  }

  // ---------- Abertura: o vídeo surge à direita quando o mouse passa sobre o título ----------
  // Só em telas com mouse e largas. A prévia toca sem som e translúcida; o clique (pages.js) abre o vídeo com som.
  const hero = $('.c-hero.titulo-hover');
  if (hero && matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)').matches) {
    const titulo = $('h1', hero), fig = $('.abertura-video', hero), player = $('.player[data-embed]', fig);
    const id = player.dataset.embed.split('/embed/')[1].split('?')[0];
    let previa = null, pronto = false, querTocar = false, t = null;
    const comando = func => previa && previa.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
    const preparar = () => {
      if (previa) return;
      previa = document.createElement('iframe');
      previa.className = 'previa';
      previa.title = 'Prévia sem som';
      previa.tabIndex = -1;
      previa.setAttribute('aria-hidden', 'true');
      previa.allow = 'autoplay; encrypted-media';
      previa.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=0&mute=1&controls=0&loop=1&playlist=' + id + '&playsinline=1&rel=0&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
      previa.addEventListener('load', () => { pronto = true; setTimeout(() => { if (querTocar) comando('playVideo'); }, 400); });
      const dica = document.createElement('span');
      dica.className = 'previa-dica';
      dica.textContent = 'Clique no vídeo para assistir com som';
      player.append(previa, dica);
    };
    const mostrar = () => {
      clearTimeout(t);
      if (hero.classList.contains('video-fixo')) return;
      preparar();
      hero.classList.add('video-on');
      querTocar = true;
      if (pronto) comando('playVideo');
    };
    const esconder = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (hero.classList.contains('video-fixo')) return;
        hero.classList.remove('video-on');
        querTocar = false;
        comando('pauseVideo');
      }, 350);
    };
    hero.addEventListener('mouseenter', preparar, { once: true }); // começa a carregar antes de o mouse chegar ao título
    titulo.addEventListener('mouseenter', mostrar);
    titulo.addEventListener('mouseleave', esconder);
    fig.addEventListener('mouseenter', () => { if (hero.classList.contains('video-on')) clearTimeout(t); });
    fig.addEventListener('mouseleave', esconder);
    // clique no vídeo: pages.js troca a prévia pelo vídeo com som, que fica fixo na tela
    player.addEventListener('click', () => { hero.classList.add('video-fixo'); hero.classList.remove('video-on'); }, true);
  }

  // ---------- Abertura: a foto de fundo anda alguns pixels na direção oposta ao mouse (paralaxe) ----------
  const fundo = $('.c-hero .af-parallax');
  if (fundo && matchMedia('(hover: hover) and (pointer: fine)').matches && !calmo) {
    const sec = fundo.closest('.c-hero');
    sec.addEventListener('mousemove', e => {
      const r = sec.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      fundo.style.transform = `translate(${(-x * 26).toFixed(1)}px, ${(-y * 18).toFixed(1)}px)`;
    }, { passive: true });
    sec.addEventListener('mouseleave', () => { fundo.style.transform = ''; });
  }

  // ---------- Cronologia: linha do tempo horizontal com setas e arraste ----------
  $$('.linha-wrap').forEach(wrap => {
    const trilho = $('.linha', wrap);
    const itens = $$('li', trilho);
    const ant = $('[data-dir="-1"]', wrap), prox = $('[data-dir="1"]', wrap), conta = $('.count', wrap);
    const passo = () => itens[0].getBoundingClientRect().width;
    const estado = () => {
      const max = trilho.scrollWidth - trilho.clientWidth;
      ant.disabled = trilho.scrollLeft <= 2;
      prox.disabled = trilho.scrollLeft >= max - 2;
      const k = Math.min(itens.length - 1, Math.round(trilho.scrollLeft / passo()));
      conta.textContent = dois(k + 1) + ' / ' + dois(itens.length);
    };
    [ant, prox].forEach(b => b.addEventListener('click', () => trilho.scrollBy({ left: Number(b.dataset.dir) * passo(), behavior: calmo ? 'auto' : 'smooth' })));
    trilho.addEventListener('scroll', () => requestAnimationFrame(estado), { passive: true });
    addEventListener('resize', estado);
    estado();
    // arrastar com o mouse (no toque, a rolagem nativa já resolve)
    let x0 = 0, s0 = 0, ativo = false, moveu = false;
    trilho.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      ativo = true; moveu = false; x0 = e.clientX; s0 = trilho.scrollLeft;
    });
    addEventListener('pointermove', e => {
      if (!ativo) return;
      const dx = e.clientX - x0;
      if (!moveu && Math.abs(dx) > 4) { moveu = true; trilho.classList.add('arrastando'); }
      if (moveu) trilho.scrollLeft = s0 - dx;
    });
    addEventListener('pointerup', () => {
      if (!ativo) return;
      ativo = false;
      if (!moveu) return;
      trilho.classList.remove('arrastando');
      // volta ao encaixe do marco mais próximo
      trilho.scrollTo({ left: Math.round(trilho.scrollLeft / passo()) * passo(), behavior: calmo ? 'auto' : 'smooth' });
    });
  });

  // ---------- Discografia: tabela filtrável carregada de discografia.json ----------
  const disco = $('#disco');
  if (disco) {
    const corpo = $('tbody', disco.closest('section'));
    const busca = $('#disco-busca');
    const conta = $('#disco-conta');
    const mais = $('#disco-mais');
    const vazio = $('#disco-vazio');
    const POR_VEZ = 40;
    let dados = [], filtro = { etapa: 'todas', decada: 'todas' }, limite = POR_VEZ;

    const sem = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const decada = ano => typeof ano === 'number' ? Math.floor(ano / 10) * 10 + '' : 'sd';
    // a etapa vale só pela parte antes do parêntese: "nenhuma (Minduca / Magic Master)" não é masterização no El Rocha
    const etapas = e => {
      const t = sem(e).split(' (')[0];
      if (t.startsWith('sem ficha') || t.startsWith('nenhuma')) return ['outros'];
      const r = [];
      if (t.includes('gravacao')) r.push('gravacao');
      if (/(^|\+)mix/.test(t)) r.push('mix');
      if (t.includes('master')) r.push('master');
      return r;
    };
    const selos = e => {
      const t = sem(e);
      const base = t.split(' (')[0];
      const nota = e.includes('(') ? e.slice(e.indexOf('(')) : '';
      const partes = [];
      if (base.startsWith('sem ficha') || base.startsWith('nenhuma')) return '<span>' + esc(e.split(' (')[0]) + '</span>' + (nota ? '<small>' + esc(nota) + '</small>' : '');
      if (base.includes('gravacao')) partes.push('<span class="g">gravação</span>');
      if (/(^|\+)mix/.test(base)) partes.push('<span class="mx">mix</span>');
      if (base.includes('master')) partes.push('<span class="ms">master</span>');
      return partes.join('') + (nota ? '<small>' + esc(nota) + '</small>' : '');
    };

    // Ouvir: YouTube só quando o Discogs lista um vídeo do disco; Spotify abre a busca por artista + título
    const ouvir = d => {
      const nome = (/^various$/i.test(d.artista) ? '' : d.artista + ' ') + d.titulo;
      const yt = d.youtube ? '<a class="yt" href="' + esc(d.youtube) + '" target="_blank" rel="noopener" title="' + esc(d.youtube_titulo || 'Vídeo no YouTube') + '">YouTube</a>' : '';
      const sp = '<a class="sp" href="https://open.spotify.com/search/' + encodeURIComponent(nome) + '" target="_blank" rel="noopener" title="Buscar “' + esc(nome) + '” no Spotify">Spotify</a>';
      return yt + sp;
    };

    function lista() {
      const q = sem(busca.value.trim());
      return dados.filter(d =>
        (filtro.etapa === 'todas' || d._etapas.includes(filtro.etapa)) &&
        (filtro.decada === 'todas' || d._decada === filtro.decada) &&
        (!q || d._busca.includes(q)));
    }
    function desenhar() {
      const l = lista();
      corpo.innerHTML = l.slice(0, limite).map(d =>
        '<tr><td data-label="Ano">' + esc(d.ano) + '</td>' +
        '<td data-label="Artista">' + esc(d.artista) + '</td>' +
        '<td data-label="Título">' + esc(d.titulo) + '</td>' +
        '<td data-label="Etapa"><span class="etapas">' + selos(d.etapa) + '</span></td>' +
        '<td data-label="Quem">' + esc(d.quem) + '</td>' +
        '<td data-label="Fonte">' + (d.fonte ? '<a href="' + esc(d.fonte) + '" target="_blank" rel="noopener">Discogs</a>' : '—') + '</td>' +
        '<td data-label="Ouvir"><span class="ouvir">' + ouvir(d) + '</span></td></tr>').join('');
      conta.innerHTML = '<b>' + l.length + '</b> de ' + dados.length + ' discos';
      mais.hidden = l.length <= limite;
      mais.textContent = 'Mostrar mais ' + Math.min(POR_VEZ, l.length - limite);
      vazio.hidden = l.length > 0;
    }
    $$('.filters[data-campo]', disco.closest('section')).forEach(g => {
      $$('button', g).forEach(b => b.addEventListener('click', () => {
        $$('button', g).forEach(x => x.setAttribute('aria-pressed', x === b));
        filtro[g.dataset.campo] = b.dataset.f;
        limite = POR_VEZ;
        desenhar();
      }));
    });
    let t;
    busca.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { limite = POR_VEZ; desenhar(); }, 120); });
    mais.addEventListener('click', () => { limite += POR_VEZ; desenhar(); });

    fetch('discografia.json')
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(json => {
        dados = json.map(d => Object.assign(d, { _etapas: etapas(d.etapa), _decada: decada(d.ano), _busca: sem(d.artista + ' ' + d.titulo + ' ' + d.quem) }));
        desenhar();
      })
      .catch(() => {
        conta.textContent = 'Não foi possível carregar discografia.json (abra o site por um servidor, não direto do arquivo).';
      });
  }

  // ---------- Discos-marco: ao clicar na capa, painel com por que o disco importa e os botões de ouvir ----------
  const modal = $('#disco-modal');
  if (modal) {
    const corpo = $('.dm-corpo', modal);
    let origem = null;
    $$('.capas .capa-btn').forEach(b => b.addEventListener('click', () => {
      origem = b;
      corpo.replaceChildren($('template.disco-info', b.closest('li')).content.cloneNode(true));
      modal.showModal();
      modal.scrollTop = 0;
      // o painel fica acima de tudo; o cursor próprio do mockup entra nele para continuar visível (como no lightbox)
      $$('.cursor, .dot').forEach(c => modal.append(c));
    }));
    $('.dm-fechar', modal).addEventListener('click', () => modal.close());
    // clique fora do painel (no fundo escuro) fecha
    modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
    modal.addEventListener('close', () => {
      $$('.cursor, .dot', modal).forEach(c => document.body.append(c));
      if (origem) origem.focus({ preventScroll: true });
    });
  }

  // ---------- Discografia: quadro com as capas dos discos-marco passando (0,5 s cada) ----------
  $$('.capas-giro[data-capas]').forEach(box => {
    // uma fila de capas quadradas que enche a largura da faixa; a cada passo todas andam uma posição
    const lista = JSON.parse(box.dataset.capas);
    lista.forEach(c => { const i = new Image(); i.src = c.src; }); // pré-carrega
    let k = 0, timer = null, imgs = [];
    const montar = () => {
      const n = Math.min(lista.length, Math.ceil(box.clientWidth / Math.max(1, box.clientHeight)) + 1);
      imgs = Array.from({ length: n }, (_, i) => { const im = new Image(); im.alt = ''; im.src = lista[(k + i) % lista.length].src; return im; });
      box.replaceChildren(...imgs);
    };
    const passo = () => { k = (k + 1) % lista.length; imgs.forEach((im, i) => { im.src = lista[(k + i) % lista.length].src; }); };
    montar();
    let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(montar, 200); });
    // só gira enquanto a faixa está na tela
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting && !timer && !calmo) timer = setInterval(passo, 500);
      else if (!e.isIntersecting) { clearInterval(timer); timer = null; }
    })).observe(box);
  });

  // ---------- Galeria: abas por seção ----------
  $$('.gal-abas').forEach(abas => {
    const botoes = $$('button[role="tab"]', abas);
    const abrir = b => {
      botoes.forEach(x => {
        const on = x === b;
        x.setAttribute('aria-selected', on);
        x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      // as fotos da aba aberta aparecem já visíveis (o .reveal não dispara em elemento que estava oculto)
      $$('.reveal', document.getElementById(b.getAttribute('aria-controls'))).forEach(li => li.classList.add('in'));
    };
    botoes.forEach((b, i) => {
      b.addEventListener('click', () => abrir(b));
      b.addEventListener('keydown', e => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { const n = botoes[(i + d + botoes.length) % botoes.length]; n.focus(); abrir(n); }
      });
    });
  });

  // ---------- Pesquisa: índice lateral marca a seção que está na tela ----------
  const indice = $$('.book .post-aside a[href^="#"]');
  if (indice.length && 'IntersectionObserver' in window) {
    const secoes = indice.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    const marcar = id => indice.forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + id));
    const io = new IntersectionObserver(es => {
      const visiveis = es.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visiveis[0]) marcar(visiveis[0].target.id);
    }, { rootMargin: '-90px 0px -70% 0px' });
    secoes.forEach(s => io.observe(s));
  }
})();
