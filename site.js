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
        '<td data-label="Fonte">' + (d.fonte ? '<a href="' + esc(d.fonte) + '" target="_blank" rel="noopener">Discogs</a>' : '—') + '</td></tr>').join('');
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
