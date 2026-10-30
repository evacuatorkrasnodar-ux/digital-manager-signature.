/* SEYVEO Personal Memory Bridge.
 * Only the already-verified encrypted SecureVault is used.
 * No cloud calls, automatic learning or silent writes.
 */
import { saveNote, listNotes, type PersonalNote } from './notesRepository';

export type MemoryProposal = { kind: 'save-note'; text: string; requiresConfirmation: true };
export type MemoryReply = { message: string; notes?: PersonalNote[] };

export function proposeMemoryAction(input: string): MemoryProposal | null {
  if (typeof input !== 'string' || input.length > 4200) return null;
  const match = input.trim().match(/^(?:сэйви[,!\s]*)?(?:пожалуйста[,!\s]*)?(?:запомни|сохрани (?:заметку|в заметки)|запиши в (?:память|заметки))\s*[:,]?\s*(.+)$/isu);
  if (!match) return null;
  const text = match[1].trim();
  if (!text || text.length > 4000) return null;
  return Object.freeze({ kind: 'save-note', text, requiresConfirmation: true });
}

export async function confirmMemorySave(proposal: MemoryProposal): Promise<MemoryReply> {
  if (!proposal || proposal.kind !== 'save-note' || proposal.requiresConfirmation !== true)
    throw Error('memory-confirmation-required');
  await saveNote(proposal.text);
  return { message: 'Сохранила в защищённых заметках на этом телефоне.' };
}

export async function recallPersonalNotes(): Promise<MemoryReply> {
  const notes = await listNotes();
  return {
    message: notes.length ? 'Вот заметки, сохранённые на этом телефоне.' : 'Пока нет сохранённых заметок.',
    notes
  };
}
