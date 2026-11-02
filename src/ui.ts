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
      <button type="button" class="lang install" id="install" aria-label="${t.install}" hidden>${ICON.download}<span class="hide-phone">${t.install}</span></button>
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
    <footer class="footer">${t.footer}</footer>
    <dialog class="sheet" id="install-help" aria-labelledby="install-title">
      <img src="/icon-192.png" alt="" width="64" height="64">
      <h2 id="install-title">${t.installTitle}</h2>
      <p class="muted">${t.installLead}</p>
      <ol>
        <li><span>${t.iosShare(ICON.share)}</span></li>
        <li><span>${t.iosAdd(ICON.add)}</span></li>
        <li><span>${t.iosOpen}</span></li>
      </ol>
      <form method="dialog"><button class="btn primary wide">${t.gotIt}</button></form>
    </dialog>`;
  document.getElementById('lang')!.addEventListener('click', () => setLang(other));
  installButton(document.getElementById('install') as HTMLButtonElement, document.getElementById('install-help') as HTMLDialogElement);
  const account = document.getElementById('account')!;
  onUser((u) => renderAccount(account, u));
  return document.getElementById('main')!;
}

const svg = (d: string) =>
  `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON = {
  download: svg('<path d="M12 4v11m-5-5 5 5 5-5M5 20h14"/>'),
  share: svg('<path d="M12 3v12m-4-8 4-4 4 4"/><path d="M8 11H6v10h12V11h-2"/>'),
  add: svg('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8m-4-4h8"/>'),
};

type InstallPrompt = Event & { prompt(): Promise<void> };

/** "Install app": the browser's own prompt where it offers one (Chrome, Edge, Android), the
 *  Add to Home Screen steps on iPhone/iPad (Safari cannot prompt). Hidden inside the installed app. */
function installButton(btn: HTMLButtonElement, help: HTMLDialogElement) {
  if (matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone) return;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let deferred: InstallPrompt | null = null;
  btn.hidden = !ios;
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // our button instead of the browser's mini-infobar
    deferred = e as InstallPrompt;
    btn.hidden = false;
  });
  addEventListener('appinstalled', () => { btn.hidden = true; });
  btn.addEventListener('click', async () => {
    if (!deferred) return help.showModal();
    await deferred.prompt();
    deferred = null; // single use; the browser fires beforeinstallprompt again if it is still installable
    btn.hidden = true;
  });
  help.addEventListener('click', (e) => { if (e.target === help) help.close(); });
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
