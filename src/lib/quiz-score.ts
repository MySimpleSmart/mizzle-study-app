import type { QuizQuestion } from "@/lib/data";

/** Same rules as `QuestionCard` grading for revealed answers. */
export function quizResponseIsCorrect(
  question: QuizQuestion,
  selectedAnswer: string | string[]
): boolean {
  if (question.type === "multiple-choice") {
    const sel = Array.isArray(selectedAnswer) ? selectedAnswer : [];
    const correctArr = Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : [question.correctAnswer];
    return (
      sel.length === correctArr.length &&
      sel.every((a) => correctArr.includes(a))
    );
  }
  if (question.type === "drag-fill") {
    return (
      typeof selectedAnswer === "string" &&
      typeof question.correctAnswer === "string" &&
      selectedAnswer === question.correctAnswer
    );
  }
  return selectedAnswer === question.correctAnswer;
}

export function scoreVisibleQuizRun(
  visibleQuestions: QuizQuestion[],
  answers: Record<
    string,
    { selectedAnswer: string | string[]; revealed: boolean }
  >
): { correct: number; incorrect: number } {
  let correct = 0;
  let incorrect = 0;
  for (const q of visibleQuestions) {
    const snap = answers[q.id];
    if (!snap?.revealed) continue;
    if (quizResponseIsCorrect(q, snap.selectedAnswer)) correct++;
    else incorrect++;
  }
  return { correct, incorrect };
}
