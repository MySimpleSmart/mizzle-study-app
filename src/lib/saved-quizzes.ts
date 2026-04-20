import type { QuizSettings } from "@/lib/data";

const STORAGE_KEY = "mizzle.savedQuizzes.v1";
const MAX_SAVED = 50;

export interface SavedQuizSnapshot {
  id: string;
  savedAt: string;
  archivedAt?: string;
  settings: QuizSettings;
  questionIds: string[];
  answers: Record<
    string,
    { selectedAnswer: string | string[]; revealed: boolean }
  >;
}

function readAll(): SavedQuizSnapshot[] {
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

export function getSavedQuizzes(): SavedQuizSnapshot[] {
  return readAll();
}

function newQuizId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `quiz-${Date.now()}`;
}

/**
 * Writes a quiz snapshot. If `id` is set, replaces any existing entry with that
 * id (same quiz re-saved). Otherwise creates a new id and prepends a new entry.
 */
export function upsertSavedQuiz(
  data: Omit<SavedQuizSnapshot, "id"> & { id?: string }
): SavedQuizSnapshot {
  const all = readAll();
  const id = data.id ?? newQuizId();
  const entry: SavedQuizSnapshot = {
    id,
    savedAt: data.savedAt,
    settings: data.settings,
    questionIds: data.questionIds,
    answers: data.answers,
  };
  const rest = data.id ? all.filter((q) => q.id !== data.id) : all;
  const next = [entry, ...rest].slice(0, MAX_SAVED);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return entry;
}

export function appendSavedQuiz(
  data: Omit<SavedQuizSnapshot, "id">
): SavedQuizSnapshot {
  return upsertSavedQuiz(data);
}

export function removeSavedQuiz(id: string): void {
  if (typeof window === "undefined") return;
  const next = readAll().filter((q) => q.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function archiveSavedQuiz(id: string): void {
  if (typeof window === "undefined") return;
  const now = new Date().toISOString();
  const next = readAll().map((q) =>
    q.id === id ? { ...q, archivedAt: q.archivedAt ?? now } : q
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function unarchiveSavedQuiz(id: string): void {
  if (typeof window === "undefined") return;
  const next = readAll().map((q) => {
    if (q.id !== id) return q;
    const { archivedAt: _archivedAt, ...rest } = q;
    return rest;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function savedQuizProgress(entry: SavedQuizSnapshot): {
  answered: number;
  total: number;
} {
  const total = entry.questionIds.length;
  let answered = 0;
  for (const qid of entry.questionIds) {
    if (entry.answers[qid]?.revealed) answered++;
  }
  return { answered, total };
}
