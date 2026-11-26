/* site-fabrica — agência, composição «roteiro»: a cortina do Destaque (cada foto sobe por cima da anterior com o scroll), a visita
   do Premium (o walkthrough: cada foto avança para o seu alvo e funde-se na seguinte, a linha das paragens acompanha, «Ver a visita»
   percorre-a sozinha) e, na landing, a lista acende o pino do mapa. Com movimento reduzido fica tudo parado e em fila. */
(() => {
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lim = (x) => Math.min(1, Math.max(0, x));
  const suave = (x) => x * x * (3 - 2 * x);
  const noScroll = (fn) => {
    let pede = false;
    const corre = () => { pede = false; fn(); };
    addEventListener('scroll', () => { if (!pede) { pede = true; requestAnimationFrame(corre); } }, { passive: true });
    addEventListener('resize', fn);
    fn();
  };

  // topo (23/11, «letras sobrepostas de vez em quando»): entre ~1000 e ~1250 px o menu chegava ao nome do centro; quando não cabe,
  // escondem-se as ligações do fim (continuam no scroll da página), nunca letras umas por cima das outras
  const nav = document.querySelector('.topo__nav'), marcaT = document.querySelector('.topo__marca');
  if (nav && marcaT) {
    const L = [...nav.querySelectorAll('a')];
    const cabe = () => {
      L.forEach((a) => { a.hidden = false; });
      if (!nav.offsetParent) return;
      for (let k = L.length - 1; k > 0 && nav.getBoundingClientRect().right > marcaT.getBoundingClientRect().left - 28; k--) L[k].hidden = true;
    };
    addEventListener('resize', cabe);
    if (document.fonts) document.fonts.ready.then(cabe);
    cabe();
  }

  // landing «cidade»: ao descer, a foto do hero fica para trás (desce mais devagar do que a página)
  const cf = document.querySelector('.r-chero__f img');
  if (cf && !calmo) noScroll(() => { if (scrollY < innerHeight * 1.2) cf.style.setProperty('--desce', `${(scrollY * 0.3).toFixed(1)}px`); });

  // Destaque: «Reservar esta tipologia» escolhe-a na barra, leva lá e abre o calendário (sem JS, abre o Booking nesse quarto)
  const barra = document.getElementById('reservar');
  const selT = barra && barra.querySelector('select');
  document.querySelectorAll('[data-tipo]').forEach((a) => a.addEventListener('click', (e) => {
    if (!selT) return;
    e.preventDefault();
    selT.value = a.dataset.tipo;
    selT.dispatchEvent(new Event('change'));
    barra.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { const c = barra.querySelector('[data-campo="in"]'); if (c && !c.classList.contains('cheio')) c.click(); }, 500);
  }));

  // Destaque: a cortina. 23/11: cada foto sobe na primeira metade do seu passo e fica parada na outra (era 70 % a subir);
  // o cabeçalho fica à largura da moldura
  const cort = document.querySelector('[data-cortina]');
  if (cort && !calmo) {
    cort.classList.add('vivo');
    const S = [...cort.querySelectorAll('.r-cort__s')];
    const mold = cort.querySelector('.r-cort__m');
    const largura = () => cort.style.setProperty('--cort-w', `${mold.getBoundingClientRect().width}px`);
    if (window.ResizeObserver) new ResizeObserver(largura).observe(mold); else addEventListener('resize', largura);
    largura();
    // 2.ª ronda (23/11): o progresso mede-se na pista presa (o cabeçalho ficou fora) e a foto segue o scroll amortecida: a roda do
    // rato no Windows salta ~100 px de cada vez e a foto dava saltos («o scroll está rápido»); o amortecimento acaba em ~0,25 s
    const pista = cort.querySelector('.r-cort__pista');
    let alvoT = 0, t = 0, anda = 0;
    const desenha = () => {
      S.forEach((s, i) => {
        const q = i === 0 ? 1 : suave(lim((t - (i - 1) - .15) / .6));
        const seg = i + 1 < S.length ? suave(lim((t - i - .15) / .6)) : 0;
        s.style.setProperty('--q', q.toFixed(4));
        s.style.setProperty('--q2', seg.toFixed(4));
        s.classList.toggle('tapada', seg > 0);
        s.style.visibility = q > 0 && seg < 1 ? '' : 'hidden';
      });
    };
    const passo = () => {
      const d = alvoT - t;
      t = Math.abs(d) < .002 ? alvoT : t + d * .2;
      desenha();
      anda = t !== alvoT ? requestAnimationFrame(passo) : 0;
    };
    let primeira = true;
    noScroll(() => {
      const r = pista.getBoundingClientRect();
      const curso = r.height - innerHeight;
      alvoT = curso > 0 ? lim(-r.top / curso) * (S.length - 1) : 0;
      // longe do palco (salto pelo menu, recarregar a meio) vai direto, sem animar
      if (primeira || r.top > innerHeight || r.bottom < 0) { primeira = false; t = alvoT; desenha(); return; }
      if (!anda) anda = requestAnimationFrame(passo);
    });
  }

  // Premium: a visita
  const vis = document.querySelector('[data-visita]');
  if (vis && !calmo) {
    vis.classList.add('vivo');
    const F = [...vis.querySelectorAll('.r-vis__f')];
    const P = [...vis.querySelectorAll('.r-vis__par li')];
    const m = vis.querySelector('.r-vis__m');
    const n = F.length;
    const AV = 0.12;    // quanto cada foto avança (escala) no seu passo (23/11: era .2, ampliava demais as fotos do Booking)
    const curso = () => vis.offsetHeight - innerHeight;
    const pinta = () => {
      const r = vis.getBoundingClientRect();
      const c = curso();
      const p = c > 0 ? lim(-r.top / c) : 0;
      const t = p * (n - 1);                       // 0 … n-1
      const i = Math.min(n - 1, Math.floor(t));
      const f = t - i;                             // dentro do passo i
      const funde = suave(lim((f - .64) / .36));   // a seguinte entra no fim do passo (23/11: mais tempo parada em cada foto)
      F.forEach((fig, k) => {
        let o = 0, s = 1, tt = 0;
        if (k === i) { o = 1; s = 1 + AV * f; tt = 1 - funde; }
        else if (k === i + 1) { o = funde; s = 1 + AV * .18 * funde; tt = funde; }   // já vem a avançar
        else if (k < i) { o = 0; s = 1 + AV; }
        if (i === n - 1 && k === n - 1) { o = 1; s = 1 + AV * .25 * f; tt = 1; }
        fig.style.setProperty('--o', o.toFixed(3));
        fig.style.setProperty('--s', s.toFixed(4));
        fig.style.setProperty('--t', tt.toFixed(3));
        fig.style.zIndex = k === i + 1 ? 2 : k === i ? 1 : 0;
      });
      const agora = f > .82 && i < n - 1 ? i + 1 : i;
      P.forEach((li, k) => { li.classList.toggle('agora', k === agora); li.classList.toggle('feita', k < agora); });
      m.style.setProperty('--p', p.toFixed(4));
    };
    noScroll(pinta);

    // ir a um passo, e «Ver a visita»: percorre-a sozinha, ~2,6 s por passo; pára ao mexer
    const yDe = (k) => vis.getBoundingClientRect().top + scrollY + curso() * (k / (n - 1));
    vis.querySelectorAll('[data-ir]').forEach((b) => b.addEventListener('click', () => scrollTo({ top: yDe(+b.dataset.ir) + 2, behavior: 'smooth' })));
    const play = vis.querySelector('[data-play]');
    const lbl = play.querySelector('.r-vis__lbl');
    let anda = 0;
    const para = () => {
      if (!anda) return;
      cancelAnimationFrame(anda); anda = 0;
      play.setAttribute('aria-pressed', 'false'); lbl.textContent = 'Ver a visita';
      document.documentElement.style.scrollBehavior = '';
    };
    play.addEventListener('click', () => {
      if (anda) return para();
      document.documentElement.style.scrollBehavior = 'auto';
      const y0 = yDe(0), y1 = yDe(n - 1) + 2;
      let ini = scrollY < y0 - 4 || scrollY > y1 - 4 ? y0 : scrollY;
      if (Math.abs(scrollY - ini) > 2) scrollTo(0, ini);
      const dur = (y1 - ini) / Math.max(1, y1 - y0) * n * 3200;
      const t0 = performance.now();
      play.setAttribute('aria-pressed', 'true'); lbl.textContent = 'Pausa';
      const passo = (agora) => {
        const k = lim((agora - t0) / dur);
        scrollTo(0, ini + (y1 - ini) * k);
        if (k < 1) anda = requestAnimationFrame(passo); else { anda = 1; para(); }
      };
      anda = requestAnimationFrame(passo);
    });
    ['wheel', 'touchstart', 'keydown'].forEach((ev) => addEventListener(ev, (e) => { if (anda && !(ev === 'keydown' && e.target === play)) para(); }, { passive: true }));
  }

  // landing: apontar um apartamento (na lista ou na planta) acende-o e desenha o caminho a pé até São Bento
  const planta = document.querySelector('.r-planta');
  if (planta) {
    const rotas = [...planta.querySelectorAll('.r-rota')];
    const pcs = [...planta.querySelectorAll('.r-pc')];
    const lis = [...document.querySelectorAll('.r-dist li[data-k]')];
    const acende = (k) => {
      planta.classList.toggle('ativo', !!k);
      rotas.forEach((r) => r.classList.toggle('on', r.dataset.k === k));
      pcs.forEach((p) => p.classList.toggle('on', !!k && p.dataset.k.split(' ').includes(k)));
      lis.forEach((l) => l.classList.toggle('on', !!k && l.dataset.k === k));
    };
    const liga = (el, k) => {
      el.addEventListener('mouseenter', () => acende(k));
      el.addEventListener('mouseleave', () => acende(null));
      const a = el.matches('a') ? el : el.querySelector('a');
      a.addEventListener('focus', () => acende(k));
      a.addEventListener('blur', () => acende(null));
    };
    lis.forEach((li) => liga(li, li.dataset.k));
    pcs.forEach((p) => liga(p, p.dataset.k.split(' ')[0]));
  }
})();
