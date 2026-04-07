import type { QuestionType, QuizQuestion, QuizSettings } from "@/lib/data";

export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function questionMatchesFormats(
  questionType: QuizQuestion["type"],
  formats: QuestionType[] | undefined
): boolean {
  const f = formats ?? ["mixed"];
  if (f.includes("mixed") || f.length === 0) return true;
  const concrete = f.filter(
    (t): t is Exclude<QuestionType, "mixed"> => t !== "mixed"
  );
  return concrete.includes(questionType);
}

export function questionMatchesDifficulty(
  q: QuizQuestion,
  difficulty: QuizSettings["difficulty"]
): boolean {
  return (q.difficulty ?? "medium") === difficulty;
}

/**
 * Picks up to `requested` questions from the topic pool. If strict
 * (difficulty + format) matches are fewer than requested, progressively
 * relaxes filters so the run can still reach the requested count when the bank
 * allows — then shuffles so the set is not always the same slice order.
 */
export function pickQuestionsForQuizRun(
  topicPool: QuizQuestion[],
  settings: QuizSettings,
  requested: number
): {
  questions: QuizQuestion[];
  strictMatchCount: number;
  relaxedPoolSize: number;
  usedRelaxation: boolean;
} {
  const formats = settings.questionFormats ?? ["mixed"];
  const difficulty = settings.difficulty;

  const strict = topicPool.filter(
    (q) =>
      questionMatchesDifficulty(q, difficulty) &&
      questionMatchesFormats(q.type, formats)
  );
  const byDifficulty = topicPool.filter((q) =>
    questionMatchesDifficulty(q, difficulty)
  );
  const byFormat = topicPool.filter((q) =>
    questionMatchesFormats(q.type, formats)
  );

  let source: QuizQuestion[];
  let usedRelaxation: boolean;

  if (strict.length >= requested) {
    source = strict;
    usedRelaxation = false;
  } else if (byDifficulty.length >= requested) {
    source = byDifficulty;
    usedRelaxation = true;
  } else if (byFormat.length >= requested) {
    source = byFormat;
    usedRelaxation = true;
  } else {
    source = topicPool;
    usedRelaxation =
      topicPool.length > strict.length || strict.length < requested;
  }

  const shuffled = shuffleArray(source);
  const questions = shuffled.slice(0, Math.min(requested, shuffled.length));

  return {
    questions,
    strictMatchCount: strict.length,
    relaxedPoolSize: source.length,
    usedRelaxation,
  };
}
