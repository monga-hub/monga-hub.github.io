// Shared session with /hub/saves.js; see README.md for the note contract.
import { supabase } from './supabase.ts';
import { createNotes } from './notes-core.ts';

export const { submit, list } = createNotes(supabase);
