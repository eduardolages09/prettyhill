/* site-fabrica — agência, composição «predios» (PrettyHill, 2026-11-25; ronda 2): fotos que se descobrem de uma cortina dourada, títulos letra a
   letra e palavras gigantes que se enchem de dourado com o scroll, as divisões do Destaque, as cortinas do Premium, os caminhos no mapa.
   Com movimento reduzido fica tudo parado e em fila. */
(() => {
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lim = (x) => Math.min(1, Math.max(0, x));
  const suave = (x) => x * x * (3 - 2 * x);

  // o mapa da landing: apontar (ou tocar) um lugar desenha o caminho a pé dos dois edifícios; sem tocar em nada, acende o primeiro
  const planta = document.querySelector('.p-planta');
  if (planta) {
    const cartoes = [...document.querySelectorAll('.p-lc')];
    const acende = (k) => {
      planta.classList.toggle('ativo', !!k);
      planta.querySelectorAll('[data-k]').forEach((e) => e.classList.toggle('on', e.dataset.k === k));
      cartoes.forEach((c) => c.classList.toggle('on', c.dataset.k === k));
    };
    cartoes.forEach((c) => ['mouseenter', 'focus', 'click'].forEach((ev) => c.addEventListener(ev, () => acende(c.dataset.k))));
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); setTimeout(() => acende(cartoes[0].dataset.k), 500); } }, { threshold: .4 }).observe(planta);
  }
  document.querySelectorAll('[data-traca] svg > *').forEach((e) => e.setAttribute('pathLength', '1'));
  if (calmo) return;
  document.documentElement.classList.add('p-js');

  // fotos: abrem quando entram, de novo sempre que voltam a entrar por baixo
  const abre = [...document.querySelectorAll('[data-abre], [data-traca], [data-sobe]')];
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) e.target.classList.add('a');
    else if (e.boundingClientRect.top > innerHeight) e.target.classList.remove('a');
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0 });
  abre.forEach((el) => io.observe(el));

  const tarefas = [];
  let pede = 0;
  const corre = () => { pede = 0; tarefas.forEach((f) => f()); };
  addEventListener('scroll', () => { if (!pede) pede = requestAnimationFrame(corre); }, { passive: true });
  addEventListener('resize', corre);

  // a palavra gigante anda devagar para o lado e enche-se de dourado
  const gigs = [...document.querySelectorAll('[data-gig]')];
  tarefas.push(() => gigs.forEach((g) => {
    const r = g.parentElement.getBoundingClientRect();
    if (r.bottom < -50 || r.top > innerHeight + 50) return;
    const c = (r.top + r.height / 2) / innerHeight;
    g.style.setProperty('--gx', `${((c - .5) * 5).toFixed(2)}vw`);
    g.style.setProperty('--gp', lim((.95 - c) / .6).toFixed(3));
  }));

  // a palavra da cidade: a foto passa por dentro das letras
  const cid = document.querySelector('[data-cidade] span');
  if (cid) tarefas.push(() => {
    const r = cid.getBoundingClientRect();
    if (r.bottom < -50 || r.top > innerHeight + 50) return;
    cid.style.setProperty('--cy', `${(8 + lim((innerHeight - r.top) / (innerHeight + r.height)) * 46).toFixed(1)}%`);
  });

  // títulos letra a letra: chegam em dourado e assentam na cor do texto, ligados ao scroll (e voltam atrás ao subir)
  const tits = [...document.querySelectorAll('[data-letras]')].map((h) => {
    const t = h.textContent;
    h.setAttribute('aria-label', t);
    h.textContent = '';
    const L = [];
    t.split(' ').forEach((p, i) => {
      if (i) h.append(' ');
      const w = document.createElement('span');
      w.className = 'p-pal'; w.setAttribute('aria-hidden', 'true');
      [...p].forEach((x) => { const s = document.createElement('span'); s.className = 'p-lt'; s.textContent = x; w.append(s); L.push(s); });
      h.append(w);
    });
    return { h, L, ult: -1 };
  });
  tarefas.push(() => {
    const M = tits.map((o) => o.h.getBoundingClientRect());
    tits.forEach((o, i) => {
      const r = M[i];
      if (r.bottom < -80 || r.top > innerHeight + 80) return;
      const p = Math.round(lim((innerHeight * .97 - r.top) / (innerHeight * .34)) * 200) / 200;
      if (p === o.ult) return;
      o.ult = p;
      const n = o.L.length;
      o.L.forEach((l, k) => l.style.setProperty('--q', suave(lim((p * (n + 9) - k) / 9)).toFixed(3)));
    });
  });

  // heros: a foto desce mais devagar do que a página
  const hf = document.querySelector('.p-hero__f img, .p-dh__f img');
  if (hf) tarefas.push(() => { if (scrollY < innerHeight * 1.2) hf.style.setProperty('--desce', `${(scrollY * (hf.closest('.p-dh') ? .14 : .28)).toFixed(1)}px`); });

  // progresso amortecido (a roda do rato salta ~100 px): acaba em ~0,25 s
  const preso = (pista, n, desenha) => {
    let alvo = 0, t = 0, anda = 0, primeira = true;
    const passo = () => {
      const d = alvo - t;
      t = Math.abs(d) < .0015 ? alvo : t + d * .2;
      desenha(t);
      anda = t !== alvo ? requestAnimationFrame(passo) : 0;
    };
    tarefas.push(() => {
      const r = pista.getBoundingClientRect();
      const curso = r.height - innerHeight;
      alvo = curso > 0 ? lim(-r.top / curso) * n : 0;
      if (primeira || r.top > innerHeight || r.bottom < 0) { primeira = false; t = alvo; desenha(t); return; }
      if (!anda && t !== alvo) anda = requestAnimationFrame(passo);
    });
  };

  // Destaque: a casa divisão a divisão. Cada foto sobe em três folhas desencontradas e fica parada ~40 % do passo; o índice acompanha
  const por = document.querySelector('[data-portas]');
  if (por) {
    por.classList.add('vivo');
    const pista = por.querySelector('.p-por__pista');
    const S = [...por.querySelectorAll('.p-por__s')];
    const FL = S.map((s) => [...s.querySelectorAll('.p-fl')]);
    const I = [...por.querySelectorAll('.p-por__i li')].map((li) => ({ li, de: +li.dataset.de, ate: +li.dataset.ate }));
    preso(pista, S.length - 1, (t) => {
      const agora = Math.round(t);
      S.forEach((s, i) => {
        FL[i].forEach((f, j) => {
          const q = i === 0 ? 1 : suave(lim((t - (i - 1) - .2 - j * .1) / .4));
          f.style.setProperty('--q', q.toFixed(4));
        });
        const ult = i === 0 ? 1 : t - (i - 1) > .2 ? 1 : 0;
        s.style.visibility = ult && t < i + 1 ? '' : 'hidden';
        s.classList.toggle('agora', agora === i);
      });
      I.forEach((o) => {
        o.li.classList.toggle('agora', agora >= o.de && agora <= o.ate);
        o.li.style.setProperty('--p', lim((t - o.de + .5) / (o.ate - o.de + 1)).toFixed(3));
      });
    });
    por.querySelectorAll('[data-vai]').forEach((b) => b.addEventListener('click', () => {
      const c = pista.offsetHeight - innerHeight;
      scrollTo({ top: pista.getBoundingClientRect().top + scrollY + c * (+b.dataset.vai / (S.length - 1)) + 1, behavior: 'smooth' });
    }));
  }

  // Premium: as cortinas. Cada foto abre-se ao meio entre 25 % e 80 % do seu passo; a de baixo assenta enquanto aparece
  const ct = document.querySelector('[data-cortinas]');
  if (ct) {
    ct.classList.add('vivo');
    const S = [...ct.querySelectorAll('.p-ct__s')], n = S.length;
    const t0 = ct.querySelector('.p-ct__t'), legs = [...ct.querySelectorAll('.p-ct__leg')], fio = ct.querySelector('.p-ct__fio i');
    preso(ct, n - 1, (t) => {
      const Q = S.map((_, i) => (i < n - 1 ? suave(lim((t - i - .22) / .56)) : 0));
      S.forEach((s, i) => {
        s.style.setProperty('--q', Q[i].toFixed(4));
        s.style.setProperty('--fio', Q[i] > 0 && Q[i] < 1 ? Math.min(1, Q[i] * 12).toFixed(2) : '0');
        s.style.setProperty('--z', (i === 0 ? 1.02 : 1.02 + (1 - Q[i - 1]) * .1).toFixed(4));
        s.style.visibility = Q[i] >= 1 || (i > 0 && Q[i - 1] <= 0) ? 'hidden' : '';
      });
      const o0 = 1 - lim((t - .06) / .2);
      t0.style.opacity = o0.toFixed(3);
      t0.style.visibility = o0 <= 0 ? 'hidden' : '';
      t0.style.pointerEvents = o0 < .6 ? 'none' : '';
      legs.forEach((l) => {
        const i = +l.dataset.i;
        const o = suave(lim((t - i + .3) / .22)) * (i === n - 1 ? 1 : 1 - suave(lim((t - i - .1) / .18)));
        l.style.opacity = o.toFixed(3);
        l.style.transform = `translateY(${((1 - suave(lim((t - i + .3) / .22))) * 24).toFixed(1)}px)`;
      });
      fio.style.setProperty('--p', (t / (n - 1)).toFixed(4));
    });
  }

  corre();
})();
