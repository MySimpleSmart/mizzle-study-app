import type { Note } from "@/lib/data";
import { normalizeNote, sampleNotes } from "@/lib/data";

const STORAGE_KEY = "mizzle.studyNotes.v1";

function persist(notes: Note[]) {
  const canonical = notes.map((n) => normalizeNote(n));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(canonical));
}

/** Plain-text preview for cards (safe without DOM). */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function loadStudyNotes(): Note[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    const seed = sampleNotes.map((n) => normalizeNote({ ...n }));
    persist(seed);
    return seed;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      const seed = sampleNotes.map((n) => normalizeNote({ ...n }));
      persist(seed);
      return seed;
    }
    const migrated = (parsed as Note[]).map((n) => normalizeNote(n as Note));
    persist(migrated);
    return migrated;
  } catch {
    const seed = sampleNotes.map((n) => normalizeNote({ ...n }));
    persist(seed);
    return seed;
  }
}

export function saveStudyNotes(notes: Note[]) {
  if (typeof window === "undefined") return;
  persist(notes);
}

export function appendStudyNote(note: Note) {
  const notes = loadStudyNotes();
  saveStudyNotes([note, ...notes]);
}
