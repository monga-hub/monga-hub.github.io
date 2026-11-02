# Mongames

L'hub dei giochi su https://monga-hub.github.io/: un launcher con la lista dei giochi, una pagina per
ogni gioco (immagini, descrizione, novità, pulsante **Gioca**) e un account con email e password.
Chi accede ha i salvataggi nel proprio account, su ogni dispositivo; chi non accede gioca come ospite
con i salvataggi sul dispositivo.

Sito statico, Vite + TypeScript, nessun framework. Account e salvataggi su Supabase (progetto "Mongames").

Il sito è in inglese; il pulsante IT/EN in alto a destra passa all'italiano e la scelta resta salvata
in quel browser. Tutti i testi dell'interfaccia (inclusi i messaggi di errore di Supabase) sono in
`src/i18n.ts`, una sezione `en` e una `it` con le stesse chiavi.

| Pagina | File | Cosa fa |
| --- | --- | --- |
| `/` | `index.html`, `src/pages/home.ts` | gioco in evidenza, tutti i giochi, novità |
| `/gioco.html?id=<id>` | `gioco.html`, `src/pages/game.ts` | scheda del gioco con galleria e Gioca |
| `/accedi.html` | `accedi.html`, `src/pages/login.ts` | accedi, registrati (`?mode=signup`), password dimenticata (`?mode=reset`); `?next=/Percorso/` riporta lì dopo l'accesso |
| `/nuova-password.html` | `nuova-password.html`, `src/pages/reset.ts` | arrivo dal link "password dimenticata", e "Cambia password" dal menu account |
| `/hub/saves.js` | `src/saves.ts`, `src/saves-core.ts` | client dei salvataggi per i giochi (sotto) |

La cornice (barra in alto con l'account, lista dei giochi a sinistra, che su telefono diventa una
striscia) è in `src/ui.ts`; lo stile in `src/style.css`.

Il sito è un'app installabile (PWA) con tema scuro. `public/manifest.webmanifest` ha `scope: "/"`, quindi
anche i giochi sotto lo stesso dominio (`/Redentore/`) si aprono dentro l'app, senza barra del browser.
`public/sw.js` serve solo a renderla installabile: non mette niente in cache, quindi gli aggiornamenti
dei giochi arrivano subito. Il pulsante "Installa app" in alto usa il prompt del browser (Chrome, Edge,
Android) o, su iPhone/iPad, mostra i passaggi Condividi → Aggiungi alla schermata Home; dentro l'app
installata non compare.

## Sviluppo

```sh
npm install
npm run dev      # http://localhost:5173
npm run check    # build + test (client dei salvataggi con supabase finto, dati del catalogo)
```

Il deploy parte da solo a ogni push su `main` (`.github/workflows/deploy.yml`), una volta attivato
GitHub Pages con sorgente "GitHub Actions" nelle impostazioni del repo.

## Aggiungere un gioco

1. Il gioco va pubblicato sullo stesso dominio, per esempio dal repo `monga-hub/NomeGioco` con
   GitHub Pages: finisce su `https://monga-hub.github.io/NomeGioco/` e vede lo stesso login dell'hub.
2. Metti icona (quadrata, 256 px) e screenshot (16:9, ~1600 px, JPEG) in `public/games/<id>/`.
3. Aggiungi una voce a `src/games.json`:

```json
{
  "id": "nomegioco",
  "title": "Nome Gioco",
  "subtitle": { "en": "One line under the title", "it": "Una riga sotto il titolo" },
  "short": { "en": "One or two sentences for the card.", "it": "Una o due frasi per la scheda (max 160 caratteri)." },
  "long": { "en": "Long description.\n\nParagraphs are split by a blank line.", "it": "Descrizione lunga.\n\nI paragrafi si separano con una riga vuota." },
  "icon": "/games/nomegioco/icon.png",
  "hero": "/games/nomegioco/shot-1.jpg",
  "screenshots": [{ "src": "/games/nomegioco/shot-1.jpg", "alt": { "en": "What you see", "it": "Cosa si vede" } }],
  "tags": { "en": ["Puzzle"], "it": ["Puzzle"] },
  "platforms": { "en": ["Computer", "Phone"], "it": ["Computer", "Telefono"] },
  "playUrl": "/NomeGioco/",
  "news": [{ "date": "2026-11-02", "title": { "en": "Out now!", "it": "Uscito!" }, "text": { "en": "First playable version.", "it": "Prima versione giocabile." } }]
}
```

`id` è anche il `game_id` dei salvataggi: solo minuscole, cifre e trattini. Il primo gioco della lista
è quello in evidenza in home. Ogni testo va dato in inglese (`en`) e italiano (`it`); `npm run check`
controlla che ogni campo ci sia in entrambe le lingue e che le immagini esistano.

## Salvataggi nel cloud (per i giochi)

L'hub pubblica `https://monga-hub.github.io/hub/saves.js`, un modulo ES che un gioco sullo stesso
dominio importa a runtime: niente dipendenze da installare nel gioco. Usa la sessione dell'hub
(chi ha fatto l'accesso su monga-hub.github.io è connesso anche nel gioco).

```js
let cloud = null;
try {
  cloud = await import(/* @vite-ignore */ '/hub/saves.js'); // @vite-ignore: lo serve l'hub, non il bundle del gioco
} catch {
  // offline, in locale (npm run dev del gioco) o hub appena ripubblicato: salvataggi locali
}

const user = await cloud?.user();           // { id, email } oppure null se non connesso
const data = await cloud?.load('redentore'); // oggetto salvato, oppure null
await cloud?.save('redentore', { livello: 3, oro: 120 }); // true se salvato, false se non connesso
await cloud?.list('redentore');              // [{ slot, updatedAt }], il più recente per primo
await cloud?.remove('redentore', 'eroe-2');  // true se cancellato, false se non connesso
const stop = cloud?.onUserChange((u) => { /* accesso o uscita */ });
```

- Ogni funzione accetta uno `slot` facoltativo (default `"default"`) per più salvataggi per gioco:
  `load(gameId, slot)`, `save(gameId, data, slot)`, `remove(gameId, slot)`.
- `data` è qualsiasi valore JSON.
- Da non connesso non parte nessuna richiesta: `load` → `null`, `list` → `[]`, `save`/`remove` → `false`.
- Errori di rete o del database vengono lanciati: il gioco li prende e tiene il salvataggio locale.
- Per mandare il giocatore al login e farlo tornare al gioco:
  `location.href = '/accedi.html?next=' + encodeURIComponent(location.pathname)`.

Dietro c'è la tabella `saves` (`supabase/schema.sql`): una riga per (utente, gioco, slot), e la Row
Level Security fa sì che ognuno legga e scriva solo le proprie righe.

## Configurazione Supabase (una volta sola)

URL del progetto e chiave publishable sono in `src/supabase.ts`: la chiave publishable è fatta per
stare nel browser, perché i dati sono protetti dalla Row Level Security.

1. **SQL Editor** → New query → incolla tutto `supabase/schema.sql` → Run.
2. **Authentication → URL Configuration**
   - Site URL: `https://monga-hub.github.io`
   - Redirect URLs: `https://monga-hub.github.io/accedi.html`,
     `https://monga-hub.github.io/nuova-password.html` (più `http://localhost:5173/**` per provare in locale)
3. **Authentication → Sign In / Providers → Email**: lasciare attivi "Enable email signups" e
   "Confirm email" (l'hub mostra il messaggio "controlla la posta" e il pulsante per rimandare l'email).
