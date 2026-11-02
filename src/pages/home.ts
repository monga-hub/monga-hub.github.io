import { t, tr } from '../i18n.ts';
import { esc, fmtDate, gameUrl, games, setTitle, shell } from '../ui.ts';

export function home() {
  const main = shell();
  setTitle();
  const f = games[0];
  const news = games
    .flatMap((g) => g.news.map((n) => ({ ...n, g })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  main.innerHTML = `
    <section class="hero" style="--art:url('${f.hero}')">
      <div class="hero-body">
        <p class="eyebrow">${t.featured}</p>
        <div class="hero-head">
          <img class="app-icon lg" src="${f.icon}" alt="" width="88" height="88">
          <div><h1>${esc(f.title)}</h1><p class="hero-sub">${esc(tr(f.subtitle))}</p></div>
        </div>
        <p class="hero-text">${esc(tr(f.short))}</p>
        <div class="actions">
          <a class="btn play" href="${f.playUrl}">${t.play}</a>
          <a class="btn glass" href="${gameUrl(f)}">${t.learnMore}</a>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>${t.allGames}</h2>
      <div class="cards">${games.map((g) => `
        <a class="card" href="${gameUrl(g)}">
          <img class="card-art" src="${g.screenshots[0].src}" alt="" loading="lazy">
          <div class="card-body">
            <img class="app-icon" src="${g.icon}" alt="" width="56" height="56">
            <div>
              <h3>${esc(g.title)}</h3>
              <p>${esc(tr(g.short))}</p>
              <ul class="tags">${tr(g.tags).slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
            </div>
          </div>
        </a>`).join('')}
      </div>
    </section>

    <section class="section">
      <h2>${t.news}</h2>
      <ul class="news">${news.map((n) => `
        <li><a href="${gameUrl(n.g)}">
          <img class="app-icon sm" src="${n.g.icon}" alt="" width="40" height="40">
          <div><p class="news-meta">${esc(n.g.title)} · ${fmtDate(n.date)}</p>
            <h3>${esc(tr(n.title))}</h3><p>${esc(tr(n.text))}</p></div></a></li>`).join('')}
      </ul>
    </section>`;
}
