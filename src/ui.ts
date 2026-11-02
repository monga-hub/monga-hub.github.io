import type { User } from '@supabase/supabase-js';
import catalogue from './games.json';
import { supabase } from './supabase.ts';

export type Game = (typeof catalogue)[number];
export const games: Game[] = catalogue;

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
export const params = new URLSearchParams(location.search);
export const gameUrl = (g: Game) => `/gioco.html?id=${encodeURIComponent(g.id)}`;
export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

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
  const authPage = ['/accedi.html', '/nuova-password.html'].includes(location.pathname);
  const here = authPage ? nextPath() : location.pathname + location.search;
  document.body.innerHTML = `
    <a class="skip" href="#main">Vai al contenuto</a>
    <header class="topbar">
      <a class="brand" href="/"><span class="brand-mark" aria-hidden="true">M</span>Mongames</a>
      <nav class="topnav" aria-label="Sezioni"><a href="/" ${location.pathname === '/' ? 'aria-current="page"' : ''}>Giochi</a></nav>
      <div class="account" id="account" data-next="${esc(here)}"></div>
    </header>
    <div class="layout">
      <aside class="sidebar">
        <h2 class="sidebar-title">I giochi</h2>
        <ul class="game-list">${games.map((g) => `
          <li><a href="${gameUrl(g)}" ${g.id === activeId ? 'aria-current="page"' : ''}>
            <img src="${g.icon}" alt="" width="40" height="40"><span>${esc(g.title)}</span></a></li>`).join('')}
        </ul>
      </aside>
      <main id="main" tabindex="-1"></main>
    </div>
    <footer class="footer">Mongames · giochi da giocare nel browser</footer>`;
  const account = document.getElementById('account')!;
  onUser((u) => renderAccount(account, u));
  return document.getElementById('main')!;
}

function renderAccount(el: HTMLElement, u: User | null) {
  if (!u) {
    const next = encodeURIComponent(el.dataset.next ?? '/');
    el.innerHTML = `
      <a class="btn ghost hide-phone" href="/accedi.html?modo=registrati&next=${next}">Registrati</a>
      <a class="btn primary" href="/accedi.html?next=${next}">Accedi</a>`;
    return;
  }
  const email = u.email ?? '';
  el.innerHTML = `
    <details class="menu">
      <summary aria-label="Account"><span class="avatar" aria-hidden="true">${esc(email[0]?.toUpperCase() ?? '?')}</span>
        <span class="email hide-phone">${esc(email)}</span></summary>
      <div class="menu-pop">
        <p class="menu-who">Connesso come<br><b>${esc(email)}</b></p>
        <a href="/nuova-password.html">Cambia password</a>
        <button type="button" id="logout">Esci</button>
      </div>
    </details>`;
  el.querySelector('#logout')!.addEventListener('click', () => supabase.auth.signOut());
}

export function setTitle(t?: string) {
  document.title = t ? `${t} · Mongames` : 'Mongames';
}
