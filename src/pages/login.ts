import type { AuthError } from '@supabase/supabase-js';
import { supabase, urlHash } from '../supabase.ts';
import { esc, nextPath, onUser, params, setTitle, shell } from '../ui.ts';

type Mode = 'accedi' | 'registrati' | 'recupero';
const MODES: Record<Mode, { title: string; button: string }> = {
  accedi: { title: 'Accedi al tuo account', button: 'Accedi' },
  registrati: { title: 'Crea un account', button: 'Registrati' },
  recupero: { title: 'Password dimenticata', button: 'Inviami il link' },
};

/** Italian text for the Supabase auth errors a user can actually hit. */
function authMessage(e: Pick<AuthError, 'code' | 'message'>): string {
  switch (e.code) {
    case 'invalid_credentials': return 'Email o password non corretti.';
    case 'email_not_confirmed': return "Devi ancora confermare l'email: apri il link che ti abbiamo mandato.";
    case 'user_already_exists':
    case 'email_exists': return 'Esiste già un account con questa email. Prova ad accedere.';
    case 'weak_password': return 'Password troppo debole: usa almeno 8 caratteri, mescolando lettere e numeri.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit': return 'Troppi tentativi. Riprova tra qualche minuto.';
    case 'otp_expired': return 'Il link è scaduto o è già stato usato. Richiedine uno nuovo.';
    case 'email_address_invalid': return 'Indirizzo email non valido.';
    default: return e.message || 'Qualcosa è andato storto. Riprova.';
  }
}

export function login() {
  const main = shell();
  let mode: Mode = (params.get('modo') as Mode) in MODES ? (params.get('modo') as Mode) : 'accedi';
  // A link from the confirmation email lands here: `#type=signup` on success, `#error_code=…` if stale.
  const linkError = urlHash.get('error_code');
  const confirmed = urlHash.get('type') === 'signup';

  onUser((u) => (u ? renderLoggedIn(u.email ?? '') : renderForm()));

  function renderLoggedIn(email: string) {
    setTitle('Account');
    main.innerHTML = `
      <section class="auth-card">
        ${confirmed ? `<p class="note ok" role="status">Email confermata, benvenuto!</p>` : ''}
        <h1>Sei connesso</h1>
        <p>Hai effettuato l'accesso come <b>${esc(email)}</b>. I salvataggi dei giochi ora vanno nel tuo account.</p>
        <div class="stack">
          <a class="btn primary wide" href="${esc(nextPath())}">${nextPath() === '/' ? 'Vai ai giochi' : 'Continua'}</a>
          <button type="button" class="btn ghost wide" id="out">Esci</button>
        </div>
      </section>`;
    main.querySelector('#out')!.addEventListener('click', () => supabase.auth.signOut());
  }

  function renderForm(notice = '', kind: 'ok' | 'err' = 'ok') {
    const m = MODES[mode];
    setTitle(m.title);
    if (!notice && linkError) {
      notice = authMessage({ code: linkError, message: urlHash.get('error_description') ?? '' });
      kind = 'err';
    }
    main.innerHTML = `
      <section class="auth-card">
        ${mode !== 'recupero' ? `
        <div class="segmented" role="tablist">
          <button type="button" role="tab" data-mode="accedi" aria-selected="${mode === 'accedi'}">Accedi</button>
          <button type="button" role="tab" data-mode="registrati" aria-selected="${mode === 'registrati'}">Registrati</button>
        </div>` : ''}
        <h1>${m.title}</h1>
        <p class="muted">${{
          accedi: 'Con un account i salvataggi dei giochi ti seguono su ogni dispositivo.',
          registrati: 'Gratis. Ti mandiamo una email per confermare l\'indirizzo.',
          recupero: 'Scrivi la tua email: ti mandiamo un link per scegliere una nuova password.',
        }[mode]}</p>
        <div id="notice">${notice ? `<p class="note ${kind}" role="${kind === 'err' ? 'alert' : 'status'}">${notice}</p>` : ''}</div>
        <form id="form" novalidate>
          <label>Email<input name="email" type="email" autocomplete="email" required></label>
          ${mode !== 'recupero' ? `
          <label>Password<input name="password" type="password" minlength="${mode === 'registrati' ? 8 : 1}" required
            autocomplete="${mode === 'registrati' ? 'new-password' : 'current-password'}"></label>` : ''}
          ${mode === 'registrati' ? '<p class="hint">Almeno 8 caratteri.</p>' : ''}
          <button class="btn primary wide" type="submit">${m.button}</button>
        </form>
        <p class="links">${mode === 'accedi'
          ? '<a href="?modo=recupero" data-mode="recupero">Password dimenticata?</a>'
          : mode === 'recupero' ? '<a href="?modo=accedi" data-mode="accedi">Torna all\'accesso</a>' : ''}</p>
      </section>`;

    main.querySelectorAll<HTMLElement>('[data-mode]').forEach((b) =>
      b.addEventListener('click', (e) => {
        e.preventDefault();
        mode = b.dataset.mode as Mode;
        params.set('modo', mode);
        history.replaceState(null, '', `?${params}`);
        renderForm();
      }));

    const form = main.querySelector<HTMLFormElement>('#form')!;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const email = String(form.email.value).trim();
      const password = form.password ? String(form.password.value) : '';
      const btn = form.querySelector('button')!;
      btn.disabled = true;
      try {
        await submit(email, password);
      } finally {
        btn.disabled = false;
      }
    });
  }

  function show(text: string, kind: 'ok' | 'err', extra = '') {
    main.querySelector('#notice')!.innerHTML =
      `<p class="note ${kind}" role="${kind === 'err' ? 'alert' : 'status'}">${text}${extra}</p>`;
  }

  async function submit(email: string, password: string) {
    if (mode === 'accedi') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) return location.assign(nextPath());
      if (error.code === 'email_not_confirmed') {
        show(authMessage(error), 'err', ' <button type="button" class="linkish" id="resend">Rimanda l\'email</button>');
        main.querySelector('#resend')!.addEventListener('click', async () => {
          const r = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${location.origin}/accedi.html` } });
          show(r.error ? authMessage(r.error) : `Email di conferma rimandata a <b>${esc(email)}</b>.`, r.error ? 'err' : 'ok');
        });
        return;
      }
      return show(authMessage(error), 'err');
    }
    if (mode === 'registrati') {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { emailRedirectTo: `${location.origin}/accedi.html` },
      });
      if (error) return show(authMessage(error), 'err');
      if (data.session) return location.assign(nextPath()); // email confirmation turned off
      return show(`Quasi fatto! Ti abbiamo mandato una email a <b>${esc(email)}</b>: apri il link per confermare l'account, poi accedi qui.
        Se non la trovi, guarda nello spam.`, 'ok');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/nuova-password.html` });
    if (error) return show(authMessage(error), 'err');
    show(`Se <b>${esc(email)}</b> ha un account, riceverai a breve un link per scegliere una nuova password.`, 'ok');
  }
}
