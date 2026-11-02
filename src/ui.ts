import type { User } from '@supabase/supabase-js';
import catalogue from './games.json';
import { lang, setLang, t } from './i18n.ts';
import { supabase } from './supabase.ts';

export type Game = (typeof catalogue)[number];
export const games: Game[] = catalogue;

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
export const params = new URLSearchParams(location.search);
export const gameUrl = (g: Game) => `/gioco.html?id=${encodeURIComponent(g.id)}`;
export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** Same-origin path to go back to after login (`?next=/Redentore/`), never an outside URL. */
export function nextPath(): string {
  const n = params.get('next') ?? '/';
  return n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/\\') ? n : '/';
}

/** Calls back now and on every login / logout (not on token refreshes or profile updates). */
export function onUser(cb: (u: User | null) => void) {
  let last: string | null | undefined;
  supabase.auth.onAuthStateChange((_e, s) => {
    const u = s?.user ?? null;
    if ((u?.id ?? null) === last) return;
    last = u?.id ?? null;
    setTimeout(() => cb(u)); // outside the auth callback: supabase calls inside it would deadlock
  });
}

/** Launcher frame: top bar with the account, game list (sidebar on desktop, strip on phone). */
export function shell(activeId?: string): HTMLElement {
  document.documentElement.lang = lang;
  const authPage = ['/accedi.html', '/nuova-password.html'].includes(location.pathname);
  const here = authPage ? nextPath() : location.pathname + location.search;
  const other = lang === 'en' ? 'it' : 'en';
  document.body.innerHTML = `
    <a class="skip" href="#main">${t.skip}</a>
    <header class="topbar">
      <a class="brand" href="/"><span class="brand-mark" aria-hidden="true">M</span>Mongames</a>
      <nav class="topnav" aria-label="${t.games}"><a href="/" ${location.pathname === '/' ? 'aria-current="page"' : ''}>${t.games}</a></nav>
      <div class="account" id="account" data-next="${esc(here)}"></div>
      <button type="button" class="lang" id="lang" lang="${other}" aria-label="${t.langSwitch}" title="${t.langSwitch}">${other.toUpperCase()}</button>
    </header>
    <div class="layout">
      <aside class="sidebar">
        <h2 class="sidebar-title">${t.gamesList}</h2>
        <ul class="game-list">${games.map((g) => `
          <li><a href="${gameUrl(g)}" ${g.id === activeId ? 'aria-current="page"' : ''}>
            <img src="${g.icon}" alt="" width="40" height="40"><span>${esc(g.title)}</span></a></li>`).join('')}
        </ul>
      </aside>
      <main id="main" tabindex="-1"></main>
    </div>
    <footer class="footer">${t.footer}</footer>`;
  document.getElementById('lang')!.addEventListener('click', () => setLang(other));
  const account = document.getElementById('account')!;
  onUser((u) => renderAccount(account, u));
  return document.getElementById('main')!;
}

function renderAccount(el: HTMLElement, u: User | null) {
  if (!u) {
    const next = encodeURIComponent(el.dataset.next ?? '/');
    el.innerHTML = `
      <a class="btn ghost hide-phone" href="/accedi.html?mode=signup&next=${next}">${t.signUp}</a>
      <a class="btn primary" href="/accedi.html?next=${next}">${t.signIn}</a>`;
    return;
  }
  const email = u.email ?? '';
  el.innerHTML = `
    <details class="menu">
      <summary aria-label="${t.account}"><span class="avatar" aria-hidden="true">${esc(email[0]?.toUpperCase() ?? '?')}</span>
        <span class="email hide-phone">${esc(email)}</span></summary>
      <div class="menu-pop">
        <p class="menu-who">${t.signedInAs}<br><b>${esc(email)}</b></p>
        <a href="/nuova-password.html">${t.changePassword}</a>
        <button type="button" id="logout">${t.signOut}</button>
      </div>
    </details>`;
  el.querySelector('#logout')!.addEventListener('click', () => supabase.auth.signOut());
}

export function setTitle(title?: string) {
  document.title = title ? `${title} · Mongames` : 'Mongames';
}
