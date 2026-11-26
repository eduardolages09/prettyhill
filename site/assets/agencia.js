/* site-fabrica — site de uma agência (agencia.py), versão parada: só o que funciona ao clique.
   Barra de reservas (casa, calendário próprio, pessoas → Booking dessa casa com a pesquisa feita), fita de fotos por divisão
   (separadores, setas, contador, arrastar), álbum de todas as fotos, filtro do catálogo por zona. O topo, a barra do telemóvel
   e o visor vêm do motor-parado.js. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- reservas ---------- */
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const legivel = (t) => { const [, m, d] = t.split('-').map(Number); return `${d} ${CURTO[m - 1]}`; };
  const forms = [];
  $$('.rb').forEach((f) => {
    const casas = JSON.parse(f.dataset.casas);
    const ir = $('.rb__ir', f), out = $('output', f), cal = $('.rb__cal', f), sel = $('select', f);
    const mais = $('[data-passo="1"]', f), menos = $('[data-passo="-1"]', f);
    const campos = { in: $('[data-campo="in"]', f), out: $('[data-campo="out"]', f) };
    const hoje = new Date(); hoje.setHours(12, 0, 0, 0);
    const minimo = iso(hoje);
    let casa = casas[+f.dataset.sel || 0], n = Math.min(2, casa.max), ent = '', sai = '', fase = '';
    let ano = hoje.getFullYear(), mes = hoje.getMonth();

    const liga = () => {
      out.textContent = n;
      mais.disabled = n >= casa.max; menos.disabled = n <= 1;
      const q = new URLSearchParams({ group_adults: n, group_children: 0, no_rooms: 1, selected_currency: 'EUR' });
      if (ent && sai) { q.set('checkin', ent); q.set('checkout', sai); }
      // a ligação pode levar o quarto/tipologia no fim (#RD…, o Booking abre já nesse quarto): a pesquisa vai antes do #
      const [base, ancora] = casa.url.split('#');
      ir.href = casa.url.includes('booking.com') ? `${base}${base.includes('?') ? '&' : '?'}${q}${ancora ? '#' + ancora : ''}` : casa.url;
      for (const [k, v] of [['in', ent], ['out', sai]]) {
        campos[k].classList.toggle('cheio', !!v);
        campos[k].classList.toggle('agora', fase === k);
        $('b', campos[k]).textContent = v ? legivel(v) : 'Escolher';
      }
    };
    const desenha = () => {
      const primeiro = new Date(ano, mes, 1, 12), dias = new Date(ano, mes + 1, 0).getDate();
      const vazios = (primeiro.getDay() + 6) % 7;
      const ant = ano > hoje.getFullYear() || mes > hoje.getMonth();
      let h = `<div class="rb__mes"><button type="button" data-mes="-1" aria-label="Mês anterior"${ant ? '' : ' disabled'}>‹</button><span aria-live="polite">${MESES[mes]} ${ano}</span><button type="button" data-mes="1" aria-label="Mês seguinte">›</button></div><div class="rb__dias">`;
      h += ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d) => `<span>${d}</span>`).join('') + '<i></i>'.repeat(vazios);
      for (let d = 1; d <= dias; d++) {
        const t = iso(new Date(ano, mes, d, 12));
        const fora = t < minimo || (fase === 'out' && ent && t <= ent);
        const cl = t === ent || t === sai ? 'ponta' : ent && sai && t > ent && t < sai ? 'entre' : '';
        h += `<button type="button" data-dia="${t}" class="${cl}"${fora ? ' disabled' : ''} aria-label="${d} de ${MESES[mes]}">${d}</button>`;
      }
      cal.innerHTML = `${h}</div>`;
    };
    const abre = (k) => {
      forms.forEach((o) => o !== fecha && o());
      fase = k;
      const t = (k === 'out' ? sai || ent : ent);
      if (t) { const [a, m] = t.split('-').map(Number); ano = a; mes = m - 1; }
      cal.hidden = false; desenha(); liga();
    };
    const fecha = () => { if (!fase) return; fase = ''; cal.hidden = true; liga(); };
    forms.push(fecha);
    campos.in.addEventListener('click', () => { if (fase === 'in') fecha(); else abre('in'); });
    campos.out.addEventListener('click', () => { if (fase === 'out') fecha(); else abre(ent ? 'out' : 'in'); });
    cal.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.mes) {
        mes += +b.dataset.mes;
        if (mes < 0) { mes = 11; ano--; } else if (mes > 11) { mes = 0; ano++; }
        return desenha();
      }
      const t = b.dataset.dia;
      if (fase === 'in') { ent = t; if (sai && sai <= ent) sai = ''; fase = 'out'; desenha(); liga(); } else { sai = t; fecha(); }
    });
    $$('[data-passo]', f).forEach((b) => b.addEventListener('click', () => { n = Math.max(1, Math.min(casa.max, n + +b.dataset.passo)); liga(); }));
    if (sel) sel.addEventListener('change', () => { casa = casas[+sel.value]; n = Math.min(n, casa.max); liga(); });
    ir.addEventListener('click', (e) => { if (!ent || !sai) { e.preventDefault(); abre(ent ? 'out' : 'in'); } });
    f.addEventListener('submit', (e) => e.preventDefault());
    document.addEventListener('click', (e) => { if (fase && !e.composedPath().includes(f)) fecha(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecha(); });
    liga();
  });

  /* «Reservar» do topo e da barra do telemóvel: leva à barra/cartão e abre já a chegada */
  $$('a[href="#reservar"]').forEach((a) => a.addEventListener('click', (e) => {
    const alvo = document.getElementById('reservar');
    if (!alvo) return;
    e.preventDefault();
    alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { const c = $('[data-campo="in"]', alvo); if (c && $('.rb__cal', alvo).hidden) c.click(); }, 450);
  }));

  /* ---------- fita: a ativa encostada à grelha, as vizinhas esbatidas ---------- */
  $$('[data-fita]').forEach((fita) => {
    const pista = $('.fita__pista', fita), fila = $('.fita__fila', fita), figs = $$('.fita__f', fita);
    const tabs = $$('.fita__tabs button', fita), conta = $('.fita__conta b', fita), barra = $('.fita__barra i', fita);
    const ant = $('[data-passo="-1"]', fita), seg = $('[data-passo="1"]', fita);
    const inicio = tabs.map((t) => +t.dataset.ir);
    let i = 0;
    const x = (k) => figs[k].offsetLeft - figs[0].offsetLeft;
    const vai = (k) => {
      i = Math.max(0, Math.min(figs.length - 1, k));
      fila.style.transform = `translate3d(${-x(i)}px, 0, 0)`;
      figs.forEach((f, j) => f.classList.toggle('ativa', j === i));
      conta.textContent = String(i + 1).padStart(2, '0');
      barra.style.setProperty('--p', `${((i + 1) / figs.length) * 100}%`);
      let t = 0; inicio.forEach((s, j) => { if (i >= s) t = j; });
      tabs.forEach((b, j) => b.setAttribute('aria-pressed', j === t ? 'true' : 'false'));
      ant.disabled = i === 0; seg.disabled = i === figs.length - 1;
    };
    // a primeira foto alinha com a grelha do texto
    const alinha = () => { const g = $('.largura', fita).getBoundingClientRect().left; fila.style.setProperty('--fita-x', `${g}px`); vai(i); };
    // Destaque (pedido de 15/11): a fita corre com o scroll da página; a secção fica presa o tempo que a fita leva a passar
    const rola = fita.closest('[data-rola]');
    if (rola) {
      let fimX = 0, alvo = 0, agora = 0, pedido = 0;
      const curso = () => rola.offsetHeight - innerHeight;
      const anda = () => {
        pedido = 0;
        agora += (alvo - agora) * 0.16;
        if (Math.abs(alvo - agora) < 0.3) agora = alvo;
        fila.style.transform = `translate3d(${-agora}px, 0, 0)`;
        let k = 0; figs.forEach((f, j) => { if (x(j) <= agora + f.offsetWidth * 0.5) k = j; });
        if (agora >= fimX - 2) k = figs.length - 1;
        if (k !== i) {
          i = k;
          conta.textContent = String(i + 1).padStart(2, '0');
          let t = 0; inicio.forEach((s, j) => { if (i >= s) t = j; });
          tabs.forEach((b, j) => b.setAttribute('aria-pressed', j === t ? 'true' : 'false'));
        }
        barra.style.setProperty('--p', `${fimX ? (agora / fimX) * 100 : 100}%`);
        ant.disabled = agora <= 1; seg.disabled = agora >= fimX - 1;
        if (agora !== alvo) pedido = requestAnimationFrame(anda);
      };
      const le = () => {
        const p = curso() > 0 ? Math.min(1, Math.max(0, -rola.getBoundingClientRect().top / curso())) : 0;
        alvo = p * fimX;
        if (!pedido) pedido = requestAnimationFrame(anda);
      };
      const mede = () => {
        const g = $('.largura', fita).getBoundingClientRect().left;
        fila.style.setProperty('--fita-x', `${g}px`);
        const u = fila.lastElementChild;
        fimX = Math.max(0, u.offsetLeft + u.offsetWidth - figs[0].offsetLeft - (pista.clientWidth - 2 * g));
        rola.style.height = `${innerHeight + fimX * 0.7}px`;
        le();
      };
      const irA = (k) => {
        k = Math.max(0, Math.min(figs.length - 1, k));
        const topo = rola.getBoundingClientRect().top + scrollY;
        scrollTo({ top: topo + (fimX ? Math.min(1, x(k) / fimX) : 0) * curso() + 1, behavior: 'smooth' });
      };
      tabs.forEach((b) => b.addEventListener('click', () => irA(+b.dataset.ir)));
      ant.addEventListener('click', () => irA(i - 1));
      seg.addEventListener('click', () => irA(i + 1));
      addEventListener('scroll', le, { passive: true });
      addEventListener('resize', mede);
      if (document.fonts) document.fonts.ready.then(mede);
      addEventListener('load', mede);
      figs.forEach((f) => { const im = $('img', f); if (im && !im.complete) im.addEventListener('load', mede, { once: true }); });
      mede();
      return;
    }
    tabs.forEach((b) => b.addEventListener('click', () => vai(+b.dataset.ir)));
    ant.addEventListener('click', () => vai(i - 1));
    seg.addEventListener('click', () => vai(i + 1));
    pista.setAttribute('tabindex', '0');
    pista.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') vai(i + 1); if (e.key === 'ArrowLeft') vai(i - 1); });
    // arrastar (rato e dedo); arrastar não abre o visor
    let x0 = null, y0 = 0, dx = 0, arrastou = false;
    pista.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; dx = 0; arrastou = false; });
    addEventListener('pointermove', (e) => {
      if (x0 === null) return;
      dx = e.clientX - x0;
      if (!arrastou && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - y0)) { arrastou = true; pista.classList.add('agarrada'); }
      if (arrastou) fila.style.transform = `translate3d(${-x(i) + dx}px, 0, 0)`;
    });
    const larga = () => {
      if (x0 === null) return;
      x0 = null; pista.classList.remove('agarrada');
      if (arrastou) vai(i + (dx < -50 ? 1 : dx > 50 ? -1 : 0));
    };
    addEventListener('pointerup', larga); addEventListener('pointercancel', larga);
    pista.addEventListener('click', (e) => { if (arrastou) { e.stopPropagation(); e.preventDefault(); arrastou = false; } }, true);
    addEventListener('resize', alinha);
    if (document.fonts) document.fonts.ready.then(alinha);
    addEventListener('load', alinha);
    alinha();
  });

  /* ---------- Premium: a casa em painel, como na Casa do Poço (pedido de 15/11) ----------
     Um passo de scroll por foto; a foto nova esvai-se por cima da anterior e a moldura toma o formato dela; o traço da divisão
     enche com as suas fotos; os traços levam o scroll a essa divisão. */
  $$('[data-painel]').forEach((pn) => {
    const mold = $('.wpn__moldura', pn), fotos = $$('.wpn__foto', pn), divs = $$('.wpn__div', pn);
    const tabs = $$('.wpn__linha button', pn), tracos = tabs.map((b) => $('.wpn__traco span', b));
    const N = fotos.length, ini = [];
    fotos.forEach((f, k) => { const d = +f.dataset.d; if (ini[d] === undefined) ini[d] = k; });
    ini.push(N);
    let atual = 0, div = 0;
    const pronta = (f) => { const im = $('img', f); return im.complete ? Promise.resolve() : im.decode().catch(() => {}); };
    const mostra = (k) => {
      if (k === atual) return;
      const nova = fotos[k];
      atual = k;
      mold.dataset.visor = nova.dataset.serie; mold.dataset.indice = nova.dataset.i;
      const d = +nova.dataset.d;
      if (d !== div) {
        div = d;
        divs.forEach((t, j) => t.classList.toggle('ativo', j === d));
        tabs.forEach((b, j) => b.setAttribute('aria-pressed', j === d ? 'true' : 'false'));
      }
      const leg = $('.wpn__leg', divs[d]);
      if (leg.textContent !== nova.dataset.leg) { leg.classList.add('troca'); setTimeout(() => { leg.textContent = nova.dataset.leg; leg.classList.remove('troca'); }, 220); }
      pronta(nova).then(() => {
        if (atual !== k) return;
        mold.style.setProperty('--ar', nova.dataset.ar); mold.style.setProperty('--wmax', nova.dataset.w);
        fotos.forEach((f) => { if (f !== nova && f.classList.contains('ativo')) { f.classList.remove('ativo'); f.classList.add('sai'); clearTimeout(f._t); f._t = setTimeout(() => f.classList.remove('sai'), 1300); } });
        clearTimeout(nova._t); nova.classList.remove('sai'); nova.classList.add('ativo');
      });
    };
    const curso = () => pn.offsetHeight - innerHeight;
    let pedido = 0;
    const pinta = () => {
      pedido = 0;
      const r = pn.getBoundingClientRect();
      if (r.top > innerHeight || r.bottom < 0) return;
      const P = Math.min(0.9999, Math.max(0, -r.top / curso())) * N;
      mostra(Math.floor(P));
      tracos.forEach((t, j) => t.style.setProperty('--b', Math.min(1, Math.max(0, (P - ini[j]) / (ini[j + 1] - ini[j]))).toFixed(3)));
    };
    addEventListener('scroll', () => { if (!pedido) pedido = requestAnimationFrame(pinta); }, { passive: true });
    addEventListener('resize', pinta);
    tabs.forEach((b, j) => b.addEventListener('click', () => scrollTo({ top: pn.getBoundingClientRect().top + scrollY + (ini[j] + 0.5) / N * curso(), behavior: 'smooth' })));
    mold.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mold.click(); } });
    pinta();
  });

  /* ---------- Premium: a galeria inteira na página (pedido de 15/11), com o índice preso que marca a divisão à vista ---------- */
  $$('[data-galt]').forEach((g) => {
    const ind = $('.w-galt__ind', g), box = $('.largura', ind);
    const links = $$('a', ind), divs = links.map((a) => g.querySelector(a.getAttribute('href')));
    links.forEach((a, j) => a.addEventListener('click', (e) => {
      e.preventDefault();
      const topo = parseFloat(getComputedStyle(ind).top) || 0;
      scrollTo({ top: divs[j].getBoundingClientRect().top + scrollY - topo - ind.offsetHeight - 12, behavior: 'smooth' });
    }));
    let pedido = 0, ja = -1;
    const marca = () => {
      pedido = 0;
      const lim = ind.getBoundingClientRect().bottom + 60;
      let j = 0;
      divs.forEach((d, i) => { if (d.getBoundingClientRect().top <= lim) j = i; });
      if (j === ja) return;
      ja = j;
      links.forEach((a, i) => a.classList.toggle('ativo', i === j));
      if (box.scrollWidth > box.clientWidth) {
        const pad = parseFloat(getComputedStyle(box).paddingLeft) || 0;
        box.scrollTo({ left: links[j].getBoundingClientRect().left - box.getBoundingClientRect().left + box.scrollLeft - pad, behavior: 'smooth' });
      }
    };
    addEventListener('scroll', () => { if (!pedido) pedido = requestAnimationFrame(marca); }, { passive: true });
    marca();
  });

  /* ---------- Premium: câmara em profundidade no hero (pedido de 15/11: «anima a foto do Premium para dar a distinção face ao Destaque») ----------
     A mesma do Premium da Maré Cheia (varias.js): a foto original e o seu mapa de profundidade num shader; a câmara anda devagar para o
     lado e para dentro e volta, em ciclo, e o que está perto (a mesa, as cadeiras) mexe mais do que a parede. Em repouso desenha a foto
     tal como está. Sem WebGL2 ou com movimento reduzido fica a foto com o movimento de drone do CSS. */
  const c3 = document.querySelector('.vp-3d');
  const h3 = c3 && c3.closest('.w-hero, .a-hero, .r-phero');   // .a-hero: composição «arco» (OPO.APT, ronda 3); .r-phero: «roteiro»
  const gl = c3 && !matchMedia('(prefers-reduced-motion: reduce)').matches && c3.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (gl) {
    h3.classList.add('p3d');
    const P = Object.assign({ ciclo: 26, lado: 0.022, dentro: 0.085, sobe: 0.006, pan_tm: 0.07 }, JSON.parse(c3.dataset.p || '{}'));
    const foco = (s) => s.split(/\s+/).map((v) => parseFloat(v) / 100);
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, `#version 300 es
in vec2 a; out vec2 v; void main() { v = vec2(a.x, -a.y) * .5 + .5; gl_Position = vec4(a, 0., 1.); }`));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;
uniform sampler2D foto, prof;
uniform vec2 k, o, desl;   // parte visível da foto (cover), canto dela, deslocação do que está perto (unidades da foto)
uniform float esc, aprox;  // zoom geral e aproximação do que está perto
in vec2 v; out vec4 cor;
vec2 em(vec2 p, vec2 c, float L) { return c + (p - c) / (1. + aprox * L) - desl * L; }
void main() {
  vec2 c = o + .5 * k;
  vec2 p = c + (o + v * k - c) / esc;
  float L = 1., ant = 1.;
  for (int i = 0; i <= 44; i++) {
    L = 1. - float(i) / 44.;
    if (textureLod(prof, em(p, c, L), 0.).r >= L) break;
    ant = L;
  }
  float a = L, b = ant;
  for (int j = 0; j < 6; j++) { float m = (a + b) * .5; if (textureLod(prof, em(p, c, m), 0.).r >= m) a = m; else b = m; }
  vec2 dx = dFdx(p), dy = dFdy(p);
  cor = textureGrad(foto, clamp(em(p, c, a), vec2(0.), vec2(1.)), dx, dy);
}`));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { h3.classList.remove('p3d'); console.warn('vp-3d:', gl.getProgramInfoLog(pr)); }
    else {
      gl.useProgram(pr);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const la = gl.getAttribLocation(pr, 'a');
      gl.enableVertexAttribArray(la);
      gl.vertexAttribPointer(la, 2, gl.FLOAT, false, 0, 0);
      const U = {};
      ['foto', 'prof', 'k', 'o', 'desl', 'esc', 'aprox'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
      const textura = (im, u, mip) => {
        gl.activeTexture(gl.TEXTURE0 + u);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        if (mip) gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      };
      const carrega = (src) => new Promise((ok, falha) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = falha; i.src = src; });
      const fontes = location.protocol === 'file:'
        ? new Promise((ok, falha) => { const s = document.createElement('script'); s.src = c3.dataset.js; s.onload = () => ok(window.P3D); s.onerror = falha; document.head.appendChild(s); })
        : Promise.resolve({ foto: c3.dataset.foto, prof: c3.dataset.prof });
      let fw = 1, fh = 1, larg = 0, alt = 0, dpr = Math.min(devicePixelRatio || 1, 2), decorrido = 0, ultimo = null, vivo = true, pedido = 0, lentos = 0;
      const mede = () => {
        const r = c3.getBoundingClientRect();
        larg = r.width; alt = r.height;
        c3.width = Math.round(larg * dpr); c3.height = Math.round(alt * dpr);
        gl.viewport(0, 0, c3.width, c3.height);
      };
      const desenha = (fase) => {
        const ao = alt > larg;
        const [fx, fy] = foco(ao ? P.foco_tm : P.foco);
        const ra = larg / alt, ri = fw / fh;
        const k = ra > ri ? [1, ri / ra] : [ra / ri, 1];
        const s = Math.sin(fase * 2 * Math.PI), e = (1 - Math.cos(fase * 2 * Math.PI)) / 2;   // lado e ida-e-volta, ambos 0 na fase 0
        const pan = ao ? P.pan_tm * s : 0;                                                     // ao alto, a câmara passeia também pelo meio da foto
        const ox = Math.min(Math.max((1 - k[0]) * fx + pan * (1 - k[0]), 0), 1 - k[0]), oy = (1 - k[1]) * fy;
        const lx = P.lado * s * k[0], ly = -P.sobe * e * k[1];
        gl.uniform1i(U.foto, 0); gl.uniform1i(U.prof, 1);
        gl.uniform2f(U.k, k[0], k[1]); gl.uniform2f(U.o, ox, oy); gl.uniform2f(U.desl, lx, ly);
        gl.uniform1f(U.aprox, P.dentro * e);
        gl.uniform1f(U.esc, 1 + (Math.abs(lx) / k[0] * 2.2 + Math.abs(ly) / k[1] * 2.2) + P.dentro * e * .18);   // nunca se vê a borda da foto
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      const passo = (agora) => {
        pedido = 0;
        if (!vivo) { ultimo = null; return; }
        const quieto = false;
        if (!quieto && ultimo !== null) decorrido += Math.min(agora - ultimo, 100);   // o relógio só anda com a câmara à vista e o drone pousado
        ultimo = agora;
        const fase = window.__fase3d != null ? window.__fase3d : (decorrido / 1000 / P.ciclo) % 1;
        const ini = performance.now();
        desenha(quieto ? 0 : fase);
        // máquina fraca: menos píxeis (nunca abaixo de 1)
        if (performance.now() - ini > 12 && ++lentos > 20 && dpr > 1) { dpr = Math.max(1, dpr - .5); lentos = 0; mede(); }
        pedido = requestAnimationFrame(passo);
      };
      fontes.then((f) => Promise.all([carrega(f.foto), carrega(f.prof)])).then(([im, pf]) => {
        fw = im.naturalWidth; fh = im.naturalHeight;
        textura(im, 0, true); textura(pf, 1, false);
        mede();
        desenha(0);
        c3.classList.add('pronto');
        addEventListener('resize', () => { mede(); desenha(0); });
        // pára quando o hero já ficou para trás (ou com o separador escondido)
        const ve = () => { vivo = !document.hidden && scrollY < innerHeight * 1.05; if (vivo && !pedido) pedido = requestAnimationFrame(passo); };
        addEventListener('scroll', ve, { passive: true });
        document.addEventListener('visibilitychange', ve);
        pedido = requestAnimationFrame(passo);
      }).catch(() => h3.classList.remove('p3d'));
    }
  }


  /* ---------- heros com movimento: a foto desce mais devagar do que a página ---------- */
  const heroF = $('.w-hero--premium .hero__foto, .w-hero--landing .hero__foto, .w-hero--destaque .hero__foto');
  if (heroF && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let pedidoH = 0;
    const desce = () => { pedidoH = 0; if (scrollY < innerHeight * 1.2) heroF.style.setProperty('--desce', `${(scrollY * 0.28).toFixed(1)}px`); };
    addEventListener('scroll', () => { if (!pedidoH) pedidoH = requestAnimationFrame(desce); }, { passive: true });
  }
  /* hero da marca (16/11): ao descer, o bloco fica para trás (desce mais devagar do que a página) e esvai-se */
  const marca = $('.w-hero--marca .w-marca');
  if (marca && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let pedidoM = 0;
    const sobe = () => {
      pedidoM = 0;
      const y = Math.min(scrollY, innerHeight * 1.2);
      marca.style.setProperty('--sobe', `${(y * 0.3).toFixed(1)}px`);
      marca.style.setProperty('--vis', Math.max(0, 1 - y / (innerHeight * 0.55)).toFixed(3));
    };
    addEventListener('scroll', () => { if (!pedidoM) pedidoM = requestAnimationFrame(sobe); }, { passive: true });
  }

  /* ---------- álbum: todas as fotos por divisão ---------- */
  $$('[data-album]').forEach((b) => b.addEventListener('click', () => {
    const alb = document.getElementById(`alb-${b.dataset.album}`);
    if (!alb) return;
    alb.hidden = false; document.body.classList.add('com-album');
    $('.alb__corpo', alb).scrollTop = 0; $('.alb__x', alb).focus();
  }));
  $$('.alb').forEach((alb) => {
    const fecha = () => { alb.hidden = true; document.body.classList.remove('com-album'); };
    $('.alb__x', alb).addEventListener('click', fecha);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !alb.hidden && $('#visor').hidden) fecha(); });
    $$('.alb__ind a', alb).forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      const d = alb.querySelector(a.getAttribute('href'));
      $('.alb__corpo', alb).scrollTo({ top: d.offsetTop - 8, behavior: 'smooth' });
    }));
  });

  /* ---------- catálogo: filtrar por zona (chips, zonas da secção «Onde ficar» e pinos do mapa) ---------- */
  const chips = $$('[data-zf]');
  const filtra = (z) => {
    chips.forEach((c) => c.setAttribute('aria-pressed', c.dataset.zf === z ? 'true' : 'false'));
    $$('#casas .wc').forEach((c) => { c.hidden = z !== 'todas' && c.dataset.zona !== z; });
    const resto = $('.wcat__resto');
    if (resto) resto.hidden = !$$('.wc', resto).some((c) => !c.hidden);
  };
  chips.forEach((c) => c.addEventListener('click', () => filtra(c.dataset.zf)));
  $$('[data-filtra]').forEach((a) => a.addEventListener('click', () => filtra(a.dataset.filtra)));
})();
