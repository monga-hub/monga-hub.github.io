import { t, tr } from '../i18n.ts';
import { list } from '../saves.ts';
import { esc, fmtDate, games, onUser, params, setTitle, shell } from '../ui.ts';

export function game() {
  const g = games.find((x) => x.id === params.get('id'));
  const main = shell(g?.id);
  if (!g) {
    setTitle(t.notFound);
    main.innerHTML = `<section class="section empty"><h1>${t.notFound}</h1><p><a href="/">${t.backToGames}</a></p></section>`;
    return;
  }
  setTitle(g.title);
  const tags = tr(g.tags);
  main.innerHTML = `
    <section class="hero game-hero" style="--art:url('${g.hero}')">
      <div class="hero-body">
        <div class="hero-head">
          <img class="app-icon lg" src="${g.icon}" alt="" width="88" height="88">
          <div><h1>${esc(g.title)}</h1><p class="hero-sub">${esc(tr(g.subtitle))}</p></div>
        </div>
        <ul class="tags on-dark">${tags.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <div class="actions">
          <a class="btn play big" href="${g.playUrl}">${t.play}</a>
          <p class="save-status" id="save-status"></p>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>${t.screenshots}</h2>
      <div class="gallery">${g.screenshots.map((s, i) => `
        <button type="button" class="shot" data-i="${i}"><img src="${s.src}" alt="${esc(tr(s.alt))}" loading="lazy"></button>`).join('')}
      </div>
    </section>

    <div class="columns">
      <section class="section">
        <h2>${t.description}</h2>
        <div class="prose">${tr(g.long).split('\n\n').map((p) => `<p>${esc(p)}</p>`).join('')}</div>
      </section>
      <aside class="section info">
        <h2>${t.info}</h2>
        <dl>
          <dt>${t.platforms}</dt><dd>${tr(g.platforms).map(esc).join(', ')}</dd>
          <dt>${t.genre}</dt><dd>${tags.map(esc).join(', ')}</dd>
          <dt>${t.price}</dt><dd>${t.free}</dd>
          <dt>${t.saves}</dt><dd>${t.savesInfo}</dd>
        </dl>
      </aside>
    </div>

    <section class="section">
      <h2>${t.news}</h2>
      <ul class="news">${g.news.map((n) => `
        <li><div><div><p class="news-meta">${fmtDate(n.date)}</p><h3>${esc(tr(n.title))}</h3><p>${esc(tr(n.text))}</p></div></div></li>`).join('')}
      </ul>
    </section>

    <dialog class="lightbox" id="lightbox">
      <form method="dialog"><button class="close" aria-label="${t.close}">×</button></form>
      <img alt="">
    </dialog>`;

  const box = main.querySelector<HTMLDialogElement>('#lightbox')!;
  const big = box.querySelector('img')!;
  main.querySelectorAll<HTMLButtonElement>('.shot').forEach((b) =>
    b.addEventListener('click', () => {
      const s = g.screenshots[Number(b.dataset.i)];
      big.src = s.src;
      big.alt = tr(s.alt);
      box.showModal();
    }));
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });

  const status = main.querySelector('#save-status')!;
  onUser(async (u) => {
    if (!u) {
      const link = `<a href="/accedi.html?next=${encodeURIComponent(location.pathname + location.search)}">${t.signIn}</a>`;
      status.innerHTML = t.guestSaves(link);
      return;
    }
    status.textContent = t.accountSaves;
    try {
      const saves = await list(g.id);
      if (saves.length) status.textContent = t.savesCount(saves.length, fmtDate(saves[0].updatedAt));
    } catch {
      // Table missing or offline: keep the generic line.
    }
  });
}
