import { authMessage, t } from '../i18n.ts';
import { supabase, urlHash } from '../supabase.ts';
import { esc, nextPath, onUser, params, setTitle, shell } from '../ui.ts';

type Mode = keyof typeof t.modes;
const isMode = (m: string | null): m is Mode => m === 'signin' || m === 'signup' || m === 'reset';

export function login() {
  const main = shell();
  const asked = params.get('mode');
  let mode: Mode = isMode(asked) ? asked : 'signin';
  // A link from the confirmation email lands here: `#type=signup` on success, `#error_code=…` if stale.
  const linkError = urlHash.get('error_code');
  const confirmed = urlHash.get('type') === 'signup';

  onUser((u) => (u ? renderLoggedIn(u.email ?? '') : renderForm()));

  function renderLoggedIn(email: string) {
    setTitle(t.account);
    main.innerHTML = `
      <section class="auth-card">
        ${confirmed ? `<p class="note ok" role="status">${t.confirmedWelcome}</p>` : ''}
        <h1>${t.signedIn}</h1>
        <p>${t.signedInText(esc(email))}</p>
        <div class="stack">
          <a class="btn primary wide" href="${esc(nextPath())}">${nextPath() === '/' ? t.goToGames : t.continue}</a>
          <button type="button" class="btn ghost wide" id="out">${t.signOut}</button>
        </div>
      </section>`;
    main.querySelector('#out')!.addEventListener('click', () => supabase.auth.signOut());
  }

  function renderForm() {
    const m = t.modes[mode];
    setTitle(m.title);
    const notice = linkError ? note(authMessage({ code: linkError, message: urlHash.get('error_description') ?? '' }), 'err') : '';
    main.innerHTML = `
      <section class="auth-card">
        ${mode !== 'reset' ? `
        <div class="segmented" role="tablist">
          <button type="button" role="tab" data-mode="signin" aria-selected="${mode === 'signin'}">${t.modes.signin.button}</button>
          <button type="button" role="tab" data-mode="signup" aria-selected="${mode === 'signup'}">${t.modes.signup.button}</button>
        </div>` : ''}
        <h1>${m.title}</h1>
        <p class="muted">${m.lead}</p>
        <div id="notice">${notice}</div>
        <form id="form" novalidate>
          <label>${t.email}<input name="email" type="email" autocomplete="email" required></label>
          ${mode !== 'reset' ? `
          <label>${t.password}<input name="password" type="password" minlength="${mode === 'signup' ? 8 : 1}" required
            autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}"></label>` : ''}
          ${mode === 'signup' ? `<p class="hint">${t.minLength}</p>` : ''}
          <button class="btn primary wide" type="submit">${m.button}</button>
        </form>
        <p class="links">${mode === 'signin'
          ? `<a href="?mode=reset" data-mode="reset">${t.forgot}</a>`
          : mode === 'reset' ? `<a href="?mode=signin" data-mode="signin">${t.backToSignIn}</a>` : ''}</p>
      </section>`;

    main.querySelectorAll<HTMLElement>('[data-mode]').forEach((b) =>
      b.addEventListener('click', (e) => {
        e.preventDefault();
        mode = b.dataset.mode as Mode;
        params.set('mode', mode);
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

  function note(html: string, kind: 'ok' | 'err') {
    return `<p class="note ${kind}" role="${kind === 'err' ? 'alert' : 'status'}">${html}</p>`;
  }
  function show(html: string, kind: 'ok' | 'err') {
    main.querySelector('#notice')!.innerHTML = note(html, kind);
  }

  async function submit(email: string, password: string) {
    const safe = esc(email);
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) return location.assign(nextPath());
      if (error.code === 'email_not_confirmed') {
        show(`${esc(authMessage(error))} <button type="button" class="linkish" id="resend">${t.resend}</button>`, 'err');
        main.querySelector('#resend')!.addEventListener('click', async () => {
          const r = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${location.origin}/accedi.html` } });
          if (r.error) show(esc(authMessage(r.error)), 'err');
          else show(t.resent(safe), 'ok');
        });
        return;
      }
      return show(esc(authMessage(error)), 'err');
    }
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { emailRedirectTo: `${location.origin}/accedi.html` },
      });
      if (error) return show(esc(authMessage(error)), 'err');
      if (data.session) return location.assign(nextPath()); // email confirmation turned off
      return show(t.checkEmail(safe), 'ok');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/nuova-password.html` });
    if (error) return show(esc(authMessage(error)), 'err');
    show(t.resetSent(safe), 'ok');
  }
}
