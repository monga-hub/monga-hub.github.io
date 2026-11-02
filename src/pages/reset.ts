import { authMessage, t } from '../i18n.ts';
import { supabase, urlHash } from '../supabase.ts';
import { esc, onUser, setTitle, shell } from '../ui.ts';

// Landing page of the reset link (`#type=recovery`): the link logs the user in, then they pick a
// new password. A logged-in user can also come here from the account menu to change it.
export function reset() {
  const main = shell();
  setTitle(t.newPassword);
  const linkError = urlHash.get('error_code');

  onUser((u) => {
    if (!u) {
      main.innerHTML = `
        <section class="auth-card">
          <h1>${t.newPassword}</h1>
          ${linkError
            ? `<p class="note err" role="alert">${t.linkExpired}</p>`
            : `<p>${t.openFromEmail}</p>`}
          <a class="btn primary wide" href="/accedi.html?mode=reset">${t.requestNewLink}</a>
        </section>`;
      return;
    }
    main.innerHTML = `
      <section class="auth-card">
        <h1>${t.chooseNewPassword}</h1>
        <p class="muted">${t.forAccount(esc(u.email ?? ''))}</p>
        <div id="notice"></div>
        <form id="form">
          <label>${t.newPassword}<input name="p1" type="password" minlength="8" autocomplete="new-password" required></label>
          <label>${t.repeatPassword}<input name="p2" type="password" minlength="8" autocomplete="new-password" required></label>
          <p class="hint">${t.minLength}</p>
          <button class="btn primary wide" type="submit">${t.savePassword}</button>
        </form>
      </section>`;
    const form = main.querySelector<HTMLFormElement>('#form')!;
    const notice = main.querySelector('#notice')!;
    const fail = (text: string) => { notice.innerHTML = `<p class="note err" role="alert">${esc(text)}</p>`; };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.p1.value !== form.p2.value) return fail(t.errors.mismatch);
      const btn = form.querySelector('button')!;
      btn.disabled = true;
      const { error } = await supabase.auth.updateUser({ password: form.p1.value });
      btn.disabled = false;
      if (error) return fail(authMessage(error));
      main.innerHTML = `
        <section class="auth-card">
          <p class="note ok" role="status">${t.passwordUpdated}</p>
          <h1>${t.done}</h1>
          <p>${t.useNewPassword}</p>
          <a class="btn primary wide" href="/">${t.goToGames}</a>
        </section>`;
    });
  });
}
