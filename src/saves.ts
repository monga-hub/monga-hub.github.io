// Shared save client for games on https://monga-hub.github.io/, published as /hub/saves.js.
// Usage from a game: `const saves = await import('/hub/saves.js'); await saves.save('redentore', data);`
// See README.md, "Salvataggi nel cloud".
import { supabase } from './supabase.ts';
import { createSaves } from './saves-core.ts';

export const { user, load, save, list, remove, onUserChange } = createSaves(supabase);
