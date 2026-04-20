const STORAGE_KEY = "mizzle.savedFlashcards.v1";
const MAX_SAVED = 50;

export interface SavedFlashcardSnapshot {
  id: string;
  savedAt: string;
  archivedAt?: string;
  /** Topics included when the set was generated (for labels). */
  topicIds: string[];
  /** Flashcard ids in deck order. */
  flashcardIds: string[];
  currentIndex: number;
  /** Whether the current card is showing the back. */
  flipped: boolean;
}

function readAll(): SavedFlashcardSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getSavedFlashcards(): SavedFlashcardSnapshot[] {
  return readAll();
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `fc-${Date.now()}`;
}

export function upsertSavedFlashcard(
  data: Omit<SavedFlashcardSnapshot, "id"> & { id?: string }
): SavedFlashcardSnapshot {
  const all = readAll();
  const id = data.id ?? newId();
  const entry: SavedFlashcardSnapshot = {
    id,
    savedAt: data.savedAt,
    topicIds: data.topicIds,
    flashcardIds: data.flashcardIds,
    currentIndex: data.currentIndex,
    flipped: data.flipped,
  };
  const rest = data.id ? all.filter((q) => q.id !== data.id) : all;
  const next = [entry, ...rest].slice(0, MAX_SAVED);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return entry;
}

export function removeSavedFlashcard(id: string): void {
  if (typeof window === "undefined") return;
  const next = readAll().filter((q) => q.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function archiveSavedFlashcard(id: string): void {
  if (typeof window === "undefined") return;
  const now = new Date().toISOString();
  const next = readAll().map((q) =>
    q.id === id ? { ...q, archivedAt: q.archivedAt ?? now } : q
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function unarchiveSavedFlashcard(id: string): void {
  if (typeof window === "undefined") return;
  const next = readAll().map((q) => {
    if (q.id !== id) return q;
    const { archivedAt: _archivedAt, ...rest } = q;
    return rest;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function savedFlashcardDeckProgress(entry: SavedFlashcardSnapshot): {
  position: number;
  total: number;
} {
  const total = entry.flashcardIds.length;
  const position =
    total === 0 ? 0 : Math.min(entry.currentIndex + 1, total);
  return { position, total };
}
