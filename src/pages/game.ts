import { list } from '../saves.ts';
import { esc, fmtDate, games, onUser, params, setTitle, shell } from '../ui.ts';

export function game() {
  const g = games.find((x) => x.id === params.get('id'));
  const main = shell(g?.id);
  if (!g) {
    setTitle('Gioco non trovato');
    main.innerHTML = `<section class="section empty"><h1>Gioco non trovato</h1><p><a href="/">Torna ai giochi</a></p></section>`;
    return;
  }
  setTitle(g.title);
  main.innerHTML = `
    <section class="hero game-hero" style="--art:url('${g.hero}')">
      <div class="hero-body">
        <div class="hero-head">
          <img class="app-icon lg" src="${g.icon}" alt="" width="88" height="88">
          <div><h1>${esc(g.title)}</h1><p class="hero-sub">${esc(g.subtitle)}</p></div>
        </div>
        <ul class="tags on-dark">${g.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <div class="actions">
          <a class="btn play big" href="${g.playUrl}">Gioca</a>
          <p class="save-status" id="save-status"></p>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Immagini</h2>
      <div class="gallery">${g.screenshots.map((s, i) => `
        <button type="button" class="shot" data-i="${i}"><img src="${s.src}" alt="${esc(s.alt)}" loading="lazy"></button>`).join('')}
      </div>
    </section>

    <div class="columns">
      <section class="section">
        <h2>Descrizione</h2>
        <div class="prose">${g.long.split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('')}</div>
      </section>
      <aside class="section info">
        <h2>Informazioni</h2>
        <dl>
          <dt>Piattaforme</dt><dd>${g.platforms.map(esc).join(', ')}</dd>
          <dt>Genere</dt><dd>${g.tags.map(esc).join(', ')}</dd>
          <dt>Prezzo</dt><dd>Gratis</dd>
          <dt>Salvataggi</dt><dd>Sul dispositivo come ospite, nel tuo account se accedi</dd>
        </dl>
      </aside>
    </div>

    <section class="section">
      <h2>Novità</h2>
      <ul class="news">${g.news.map((n) => `
        <li><div><div><p class="news-meta">${fmtDate(n.date)}</p><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></div></div></li>`).join('')}
      </ul>
    </section>

    <dialog class="lightbox" id="lightbox">
      <form method="dialog"><button class="close" aria-label="Chiudi">×</button></form>
      <img alt="">
    </dialog>`;

  const box = main.querySelector<HTMLDialogElement>('#lightbox')!;
  const big = box.querySelector('img')!;
  main.querySelectorAll<HTMLButtonElement>('.shot').forEach((b) =>
    b.addEventListener('click', () => {
      const s = g.screenshots[Number(b.dataset.i)];
      big.src = s.src;
      big.alt = s.alt;
      box.showModal();
    }));
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });

  const status = main.querySelector('#save-status')!;
  onUser(async (u) => {
    if (!u) {
      status.innerHTML = `Giochi come ospite: i progressi restano su questo dispositivo.
        <a href="/accedi.html?next=${encodeURIComponent(location.pathname + location.search)}">Accedi</a> per salvarli nel tuo account.`;
      return;
    }
    status.textContent = 'I tuoi progressi si salvano nel tuo account.';
    try {
      const saves = await list(g.id);
      if (saves.length) status.textContent = `Salvataggi nel tuo account: ${saves.length} · ultimo ${fmtDate(saves[0].updatedAt)}`;
    } catch {
      // Table missing or offline: keep the generic line.
    }
  });
}
