import { supabase, urlHash } from '../supabase.ts';
import { esc, onUser, setTitle, shell } from '../ui.ts';

// Landing page of the reset link (`#type=recovery`): the link logs the user in, then they pick a
// new password. A logged-in user can also come here from the account menu to change it.
export function reset() {
  const main = shell();
  setTitle('Nuova password');
  const linkError = urlHash.get('error_code');

  onUser((u) => {
    if (!u) {
      main.innerHTML = `
        <section class="auth-card">
          <h1>Nuova password</h1>
          ${linkError
            ? '<p class="note err" role="alert">Il link è scaduto o è già stato usato.</p>'
            : '<p>Apri questa pagina dal link che ti abbiamo mandato via email.</p>'}
          <a class="btn primary wide" href="/accedi.html?modo=recupero">Richiedi un nuovo link</a>
        </section>`;
      return;
    }
    main.innerHTML = `
      <section class="auth-card">
        <h1>Scegli una nuova password</h1>
        <p class="muted">Per l'account <b>${esc(u.email ?? '')}</b>.</p>
        <div id="notice"></div>
        <form id="form">
          <label>Nuova password<input name="p1" type="password" minlength="8" autocomplete="new-password" required></label>
          <label>Ripeti la password<input name="p2" type="password" minlength="8" autocomplete="new-password" required></label>
          <p class="hint">Almeno 8 caratteri.</p>
          <button class="btn primary wide" type="submit">Salva la password</button>
        </form>
      </section>`;
    const form = main.querySelector<HTMLFormElement>('#form')!;
    const notice = main.querySelector('#notice')!;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.p1.value !== form.p2.value) {
        notice.innerHTML = '<p class="note err" role="alert">Le due password non coincidono.</p>';
        return;
      }
      const btn = form.querySelector('button')!;
      btn.disabled = true;
      const { error } = await supabase.auth.updateUser({ password: form.p1.value });
      btn.disabled = false;
      if (error) {
        notice.innerHTML = `<p class="note err" role="alert">${esc(error.code === 'same_password'
          ? 'La nuova password deve essere diversa da quella vecchia.'
          : error.code === 'weak_password' ? 'Password troppo debole: usa almeno 8 caratteri, mescolando lettere e numeri.'
          : error.message)}</p>`;
        return;
      }
      main.innerHTML = `
        <section class="auth-card">
          <p class="note ok" role="status">Password aggiornata.</p>
          <h1>Fatto!</h1>
          <p>Da ora accedi con la nuova password.</p>
          <a class="btn primary wide" href="/">Vai ai giochi</a>
        </section>`;
    });
  });
}
