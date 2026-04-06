import type { QuizSettings } from "@/lib/data";

const STORAGE_KEY = "mizzle.savedQuizzes.v1";
const MAX_SAVED = 50;

export interface SavedQuizSnapshot {
  id: string;
  savedAt: string;
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

export function appendSavedQuiz(
  data: Omit<SavedQuizSnapshot, "id">
): SavedQuizSnapshot {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `quiz-${Date.now()}`;
  const entry: SavedQuizSnapshot = { ...data, id };
  const next = [entry, ...readAll()].slice(0, MAX_SAVED);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return entry;
}

export function removeSavedQuiz(id: string): void {
  if (typeof window === "undefined") return;
  const next = readAll().filter((q) => q.id !== id);
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
