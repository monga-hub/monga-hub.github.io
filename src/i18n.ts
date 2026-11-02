// UI language: English unless this browser picked Italian with the header switch.
export type Lang = 'en' | 'it';
export const LANGS: Lang[] = ['en', 'it'];
const KEY = 'mongames-lang';

function stored(): Lang {
  try {
    return localStorage.getItem(KEY) === 'it' ? 'it' : 'en';
  } catch {
    return 'en'; // storage blocked: default
  }
}

export const lang: Lang = typeof localStorage === 'undefined' ? 'en' : stored();

export function setLang(l: Lang) {
  try {
    localStorage.setItem(KEY, l);
  } catch {
    // storage blocked: the choice lasts for this page only
  }
  location.reload();
}

/** A catalogue value given in every language, e.g. `{ "en": "…", "it": "…" }`. */
export type Localized<T = string> = Record<Lang, T>;
export const tr = <T>(v: Localized<T>): T => v[lang];

const en = {
  skip: 'Skip to content',
  games: 'Games',
  gamesList: 'Games',
  footer: 'Mongames · games to play in your browser',
  langSwitch: 'Lingua: Italiano',
  signUp: 'Sign up',
  signIn: 'Sign in',
  account: 'Account',
  signedInAs: 'Signed in as',
  changePassword: 'Change password',
  signOut: 'Sign out',
  featured: 'Featured',
  play: 'Play',
  learnMore: 'Learn more',
  allGames: 'All games',
  news: "What's new",
  notFound: 'Game not found',
  backToGames: 'Back to games',
  screenshots: 'Screenshots',
  description: 'Description',
  info: 'Information',
  platforms: 'Platforms',
  genre: 'Genre',
  price: 'Price',
  free: 'Free',
  saves: 'Saves',
  savesInfo: 'On this device as a guest, in your account when signed in',
  close: 'Close',
  guestSaves: (signIn: string) => `Playing as a guest: progress stays on this device. ${signIn} to keep it in your account.`,
  accountSaves: 'Your progress is saved to your account.',
  savesCount: (n: number, last: string) => `Saves in your account: ${n} · latest ${last}`,
  // Sign in / sign up / reset
  modes: {
    signin: { title: 'Sign in to your account', button: 'Sign in', lead: 'With an account, your game saves follow you on every device.' },
    signup: { title: 'Create an account', button: 'Sign up', lead: "It's free. We'll email you to confirm your address." },
    reset: { title: 'Forgot password', button: 'Send me the link', lead: "Enter your email and we'll send you a link to choose a new password." },
  },
  email: 'Email',
  password: 'Password',
  minLength: 'At least 8 characters.',
  forgot: 'Forgot password?',
  backToSignIn: 'Back to sign in',
  confirmedWelcome: 'Email confirmed, welcome!',
  signedIn: "You're signed in",
  signedInText: (email: string) => `You're signed in as <b>${email}</b>. Your game saves now go to your account.`,
  goToGames: 'Go to games',
  continue: 'Continue',
  resend: 'Resend the email',
  resent: (email: string) => `Confirmation email sent again to <b>${email}</b>.`,
  checkEmail: (email: string) => `Almost done! We've sent an email to <b>${email}</b>: open the link to confirm your account, then sign in here. Can't find it? Check your spam folder.`,
  resetSent: (email: string) => `If <b>${email}</b> has an account, you'll shortly get a link to choose a new password.`,
  errors: {
    invalid_credentials: 'Wrong email or password.',
    email_not_confirmed: "You still need to confirm your email: open the link we sent you.",
    email_exists: 'An account with this email already exists. Try signing in.',
    weak_password: 'Password too weak: use at least 8 characters, mixing letters and numbers.',
    rate_limit: 'Too many attempts. Try again in a few minutes.',
    otp_expired: 'The link has expired or was already used. Request a new one.',
    email_address_invalid: 'Invalid email address.',
    same_password: 'The new password must be different from the old one.',
    mismatch: "The two passwords don't match.",
    generic: 'Something went wrong. Please try again.',
  },
  // New password page
  newPassword: 'New password',
  openFromEmail: 'Open this page from the link we emailed you.',
  linkExpired: 'The link has expired or was already used.',
  requestNewLink: 'Request a new link',
  chooseNewPassword: 'Choose a new password',
  forAccount: (email: string) => `For the account <b>${email}</b>.`,
  repeatPassword: 'Repeat the password',
  savePassword: 'Save password',
  passwordUpdated: 'Password updated.',
  done: 'Done!',
  useNewPassword: 'From now on, sign in with your new password.',
};

const it: typeof en = {
  skip: 'Vai al contenuto',
  games: 'Giochi',
  gamesList: 'I giochi',
  footer: 'Mongames · giochi da giocare nel browser',
  langSwitch: 'Language: English',
  signUp: 'Registrati',
  signIn: 'Accedi',
  account: 'Account',
  signedInAs: 'Connesso come',
  changePassword: 'Cambia password',
  signOut: 'Esci',
  featured: 'In evidenza',
  play: 'Gioca',
  learnMore: 'Scopri di più',
  allGames: 'Tutti i giochi',
  news: 'Novità',
  notFound: 'Gioco non trovato',
  backToGames: 'Torna ai giochi',
  screenshots: 'Immagini',
  description: 'Descrizione',
  info: 'Informazioni',
  platforms: 'Piattaforme',
  genre: 'Genere',
  price: 'Prezzo',
  free: 'Gratis',
  saves: 'Salvataggi',
  savesInfo: 'Sul dispositivo come ospite, nel tuo account se accedi',
  close: 'Chiudi',
  guestSaves: (signIn) => `Giochi come ospite: i progressi restano su questo dispositivo. ${signIn} per salvarli nel tuo account.`,
  accountSaves: 'I tuoi progressi si salvano nel tuo account.',
  savesCount: (n, last) => `Salvataggi nel tuo account: ${n} · ultimo ${last}`,
  modes: {
    signin: { title: 'Accedi al tuo account', button: 'Accedi', lead: 'Con un account i salvataggi dei giochi ti seguono su ogni dispositivo.' },
    signup: { title: 'Crea un account', button: 'Registrati', lead: "Gratis. Ti mandiamo una email per confermare l'indirizzo." },
    reset: { title: 'Password dimenticata', button: 'Inviami il link', lead: 'Scrivi la tua email: ti mandiamo un link per scegliere una nuova password.' },
  },
  email: 'Email',
  password: 'Password',
  minLength: 'Almeno 8 caratteri.',
  forgot: 'Password dimenticata?',
  backToSignIn: "Torna all'accesso",
  confirmedWelcome: 'Email confermata, benvenuto!',
  signedIn: 'Sei connesso',
  signedInText: (email) => `Hai effettuato l'accesso come <b>${email}</b>. I salvataggi dei giochi ora vanno nel tuo account.`,
  goToGames: 'Vai ai giochi',
  continue: 'Continua',
  resend: "Rimanda l'email",
  resent: (email) => `Email di conferma rimandata a <b>${email}</b>.`,
  checkEmail: (email) => `Quasi fatto! Ti abbiamo mandato una email a <b>${email}</b>: apri il link per confermare l'account, poi accedi qui. Se non la trovi, guarda nello spam.`,
  resetSent: (email) => `Se <b>${email}</b> ha un account, riceverai a breve un link per scegliere una nuova password.`,
  errors: {
    invalid_credentials: 'Email o password non corretti.',
    email_not_confirmed: "Devi ancora confermare l'email: apri il link che ti abbiamo mandato.",
    email_exists: 'Esiste già un account con questa email. Prova ad accedere.',
    weak_password: 'Password troppo debole: usa almeno 8 caratteri, mescolando lettere e numeri.',
    rate_limit: 'Troppi tentativi. Riprova tra qualche minuto.',
    otp_expired: 'Il link è scaduto o è già stato usato. Richiedine uno nuovo.',
    email_address_invalid: 'Indirizzo email non valido.',
    same_password: 'La nuova password deve essere diversa da quella vecchia.',
    mismatch: 'Le due password non coincidono.',
    generic: 'Qualcosa è andato storto. Riprova.',
  },
  newPassword: 'Nuova password',
  openFromEmail: 'Apri questa pagina dal link che ti abbiamo mandato via email.',
  linkExpired: 'Il link è scaduto o è già stato usato.',
  requestNewLink: 'Richiedi un nuovo link',
  chooseNewPassword: 'Scegli una nuova password',
  forAccount: (email) => `Per l'account <b>${email}</b>.`,
  repeatPassword: 'Ripeti la password',
  savePassword: 'Salva la password',
  passwordUpdated: 'Password aggiornata.',
  done: 'Fatto!',
  useNewPassword: 'Da ora accedi con la nuova password.',
};

export const STRINGS: Record<Lang, typeof en> = { en, it };
export const t = STRINGS[lang];

/** User-facing text for a Supabase auth error code (anything unknown falls back to Supabase's own message). */
export function authMessage(e: { code?: string; message?: string }, s = t): string {
  const k: Record<string, keyof typeof en.errors> = {
    invalid_credentials: 'invalid_credentials',
    email_not_confirmed: 'email_not_confirmed',
    user_already_exists: 'email_exists',
    email_exists: 'email_exists',
    weak_password: 'weak_password',
    over_email_send_rate_limit: 'rate_limit',
    over_request_rate_limit: 'rate_limit',
    otp_expired: 'otp_expired',
    email_address_invalid: 'email_address_invalid',
    same_password: 'same_password',
  };
  const key = e.code ? k[e.code] : undefined;
  return key ? s.errors[key] : e.message || s.errors.generic;
}
