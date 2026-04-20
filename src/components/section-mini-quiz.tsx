"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { QuizQuestion, QuizSettings, Section } from "@/lib/data";
import { sampleQuizQuestions } from "@/lib/data";
import { pickQuestionsForQuizRun } from "@/lib/quiz-pick";
import { scoreVisibleQuizRun } from "@/lib/quiz-score";
import type { SavedQuizSnapshot } from "@/lib/saved-quizzes";
import { QuestionCard } from "@/components/quiz-tab";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  BrainCircuit,
  CheckCircle2,
  Layers,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_COUNT = 5;
const MIN_COUNT = 5;
const MAX_COUNT = 40;

interface SectionMiniQuizProps {
  section: Section;
  onSaveSectionQuiz: (
    data: Omit<SavedQuizSnapshot, "id"> & { id?: string }
  ) => void;
}

export function SectionMiniQuiz({
  section,
  onSaveSectionQuiz,
}: SectionMiniQuizProps) {
  const [questionCount, setQuestionCount] = useState(DEFAULT_COUNT);
  const [runSettings, setRunSettings] = useState<QuizSettings | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<
    Record<
      string,
      { selectedAnswer: string | string[]; revealed: boolean }
    >
  >({});
  const [sectionQuizRunKey, setSectionQuizRunKey] = useState(0);
  const [sectionQuizCompleteOpen, setSectionQuizCompleteOpen] =
    useState(false);
  /** Track completion edge to auto-open modal once per run completion. */
  const wasSectionQuizRunCompleteRef = useRef(false);

  useEffect(() => {
    setQuestionCount(DEFAULT_COUNT);
    setRunSettings(null);
    setQuestions(null);
    setAnswers({});
    setSectionQuizRunKey(0);
    setSectionQuizCompleteOpen(false);
    wasSectionQuizRunCompleteRef.current = false;
  }, [section.id]);

  const topicPoolSize = useMemo(() => {
    const topicSet = new Set(section.topicIds);
    return sampleQuizQuestions.filter(
      (q) => q.topicId && topicSet.has(q.topicId)
    ).length;
  }, [section.topicIds]);

  const handleAnswerSnapshot = useCallback(
    (
      questionId: string,
      payload: { selectedAnswer: string | string[]; revealed: boolean }
    ) => {
      setAnswers((prev) => ({ ...prev, [questionId]: payload }));
    },
    []
  );

  const generate = useCallback(() => {
    const topicSet = new Set(section.topicIds);
    const pool = sampleQuizQuestions.filter(
      (q) => q.topicId && topicSet.has(q.topicId)
    );
    if (pool.length === 0) {
      setQuestions([]);
      setRunSettings(null);
      setAnswers({});
      return;
    }
    const settings: QuizSettings = {
      questionCount,
      difficulty: "medium",
      questionFormats: ["mixed"],
      selectedTopics: section.topicIds,
    };
    const picked = pickQuestionsForQuizRun(pool, settings, questionCount);
    setRunSettings(settings);
    setQuestions(picked.questions);
    setAnswers({});
    setSectionQuizCompleteOpen(false);
    setSectionQuizRunKey((k) => k + 1);
  }, [section.topicIds, questionCount]);

  const restartSameQuestions = useCallback(() => {
    setAnswers({});
    setSectionQuizCompleteOpen(false);
    setSectionQuizRunKey((k) => k + 1);
    wasSectionQuizRunCompleteRef.current = false;
  }, []);

  const clampCount = (n: number) =>
    Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(n)));

  const removeQuestionFromRun = useCallback((questionId: string) => {
    setQuestions((prev) => {
      if (!prev) return prev;
      const next = prev.filter((q) => q.id !== questionId);
      if (next.length === 0) {
        setRunSettings(null);
        return null;
      }
      return next;
    });
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
    setSectionQuizCompleteOpen(false);
    wasSectionQuizRunCompleteRef.current = false;
  }, []);

  const save = () => {
    if (!questions || questions.length === 0 || !runSettings) return;
    onSaveSectionQuiz({
      savedAt: new Date().toISOString(),
      settings: runSettings,
      questionIds: questions.map((q) => q.id),
      answers,
    });
  };

  const closeQuizRun = useCallback(() => {
    setQuestions(null);
    setRunSettings(null);
    setAnswers({});
    setSectionQuizCompleteOpen(false);
    setSectionQuizRunKey((k) => k + 1);
    wasSectionQuizRunCompleteRef.current = false;
  }, []);

  const hasQuiz = questions !== null && questions.length > 0;
  const canSave = hasQuiz && runSettings != null;

  const setupForm = !hasQuiz && topicPoolSize > 0;

  const { answeredCount, progressPercent } = useMemo(() => {
    if (!questions?.length) {
      return { answeredCount: 0, progressPercent: 0 };
    }
    const total = questions.length;
    let n = 0;
    for (const q of questions) {
      if (answers[q.id]?.revealed) n += 1;
    }
    return {
      answeredCount: n,
      progressPercent: Math.round((n / total) * 100),
    };
  }, [questions, answers]);

  const sectionQuizScore = useMemo(() => {
    if (!questions?.length) return { correct: 0, incorrect: 0 };
    return scoreVisibleQuizRun(questions, answers);
  }, [questions, answers]);

  const sectionQuizPercent = useMemo(() => {
    if (!questions?.length) return 0;
    return Math.round((sectionQuizScore.correct / questions.length) * 100);
  }, [questions, sectionQuizScore.correct]);

  const sectionQuizRunComplete =
    hasQuiz && questions!.length > 0 && answeredCount === questions!.length;

  useEffect(() => {
    const prev = wasSectionQuizRunCompleteRef.current;
    wasSectionQuizRunCompleteRef.current = sectionQuizRunComplete;
    if (sectionQuizRunComplete && !prev) {
      setSectionQuizCompleteOpen(true);
    }
  }, [sectionQuizRunComplete]);

  const handleCompleteRegenerate = useCallback(() => {
    setSectionQuizCompleteOpen(false);
    generate();
  }, [generate]);

  const handleCompleteRestart = useCallback(() => {
    restartSameQuestions();
  }, [restartSameQuestions]);

  const handleCompleteClose = useCallback(() => {
    setSectionQuizCompleteOpen(false);
  }, []);

  return (
    <div className="rounded-xl border border-border/80 bg-white px-5 py-4 shadow-sm">
      <Dialog
        open={sectionQuizCompleteOpen}
        onOpenChange={(open) => {
          if (!open) setSectionQuizCompleteOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-left">
              <CheckCircle2
                className="h-5 w-5 shrink-0 text-green-600"
                aria-hidden
              />
              Quiz completed
            </DialogTitle>
            <DialogDescription className="text-left text-sm text-muted-foreground">
              All {questions?.length ?? 0} question
              {(questions?.length ?? 0) === 1 ? "" : "s"} checked in this run.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center justify-center rounded-lg border border-green-200/80 bg-green-50/60 px-2 py-2.5 text-center dark:border-green-900/50 dark:bg-green-950/30">
              <CheckCircle2
                className="mb-1 h-3.5 w-3.5 text-green-600"
                aria-hidden
              />
              <p className="text-[10px] font-medium uppercase tracking-wide text-green-800/80 dark:text-green-400/90">
                Correct
              </p>
              <p className="text-xl font-semibold tabular-nums text-green-900 dark:text-green-100">
                {sectionQuizScore.correct}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-red-200/80 bg-red-50/60 px-2 py-2.5 text-center dark:border-red-900/50 dark:bg-red-950/30">
              <XCircle
                className="mb-1 h-3.5 w-3.5 text-destructive"
                aria-hidden
              />
              <p className="text-[10px] font-medium uppercase tracking-wide text-destructive/90">
                Missed
              </p>
              <p className="text-xl font-semibold tabular-nums text-destructive">
                {sectionQuizScore.incorrect}
              </p>
            </div>
          </div>
          <div className="mt-4 flex min-w-0 w-full flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full min-w-0 max-w-full shrink whitespace-normal flex-col items-stretch justify-start gap-0.5 py-2.5 text-left"
              onClick={handleCompleteRestart}
            >
              <span className="block w-full min-w-0 break-words text-left text-sm font-medium text-foreground">
                Restart same questions
              </span>
              <span className="block w-full min-w-0 break-words text-left text-[11px] text-muted-foreground">
                Same set, answers cleared.
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full min-w-0 max-w-full shrink whitespace-normal flex-col items-stretch justify-start gap-0.5 py-2.5 text-left"
              onClick={handleCompleteRegenerate}
            >
              <span className="block w-full min-w-0 break-words text-left text-sm font-medium text-foreground">
                Re-generate (same rules)
              </span>
              <span className="block w-full min-w-0 break-words text-left text-[11px] text-muted-foreground">
                New draw; same settings and topics.
              </span>
            </Button>
          </div>
          <DialogFooter className="mt-3 border-t border-border/60 pt-3 sm:justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={handleCompleteClose}
            >
              Continue reviewing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-2 flex items-center gap-2">
        <BrainCircuit className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="text-xs font-semibold text-foreground">
          Section quiz
        </span>
        <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0 text-[10px] text-muted-foreground">
          <Layers className="h-3 w-3" aria-hidden />
          Mixed
        </span>
      </div>

      {setupForm && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1">
            <label
              htmlFor={`section-quiz-count-${section.id}`}
              className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              Questions (min {MIN_COUNT})
            </label>
            <Input
              id={`section-quiz-count-${section.id}`}
              type="number"
              min={MIN_COUNT}
              max={MAX_COUNT}
              value={questionCount}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (Number.isNaN(v)) return;
                setQuestionCount(clampCount(v));
              }}
              className="h-8 text-sm"
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 shrink-0 gap-1"
            onClick={() => setQuestionCount((c) => clampCount(c + 1))}
            title="Add one question"
          >
            <Plus className="h-3.5 w-3.5" />
            More
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 shrink-0 gap-1"
            onClick={generate}
            disabled={topicPoolSize === 0}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate
          </Button>
        </div>
      )}

      {hasQuiz && (
        <div className="space-y-2 border-b border-border/40 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {questions!.length}
              </span>{" "}
              questions · Mixed
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => generate()}
              >
                <RotateCcw className="h-3 w-3" />
                Regenerate
              </Button>
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground/90">Progress</span>
              <span className="tabular-nums">
                {answeredCount} / {questions!.length} answered
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-2 w-full gap-0 [&_[data-slot=progress-track]]:h-2"
              aria-label={`Quiz progress: ${answeredCount} of ${questions!.length} questions answered`}
            />
          </div>
        </div>
      )}

      {topicPoolSize === 0 ? (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          No quiz questions in the bank for this section&rsquo;s topics yet.
        </p>
      ) : questions === null ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Choose how many questions (default {DEFAULT_COUNT}, mixed types), then
          Generate.
        </p>
      ) : questions.length === 0 ? (
        <p className="mt-2 text-[11px] text-destructive">
          Could not build a quiz for these topics.
        </p>
      ) : (
        <>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Showing {questions.length} of {questionCount} requested
            {questions.length < questionCount
              ? " (not enough questions in the bank)."
              : "."}
          </p>
          <div className="mt-2 space-y-2">
            {questions.map((q, i) => (
              <QuestionCard
                key={`${sectionQuizRunKey}-${q.id}`}
                question={q}
                index={i}
                embedded
                embeddedActionsWhenWrong
                onAnswerSnapshot={handleAnswerSnapshot}
                onRemoveQuestion={() => removeQuestionFromRun(q.id)}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              onClick={closeQuizRun}
            >
              Close quiz
            </Button>
            <Button
              type="button"
              className="gap-1.5"
              disabled={!canSave}
              onClick={save}
            >
              <Save className="h-3.5 w-3.5" />
              Save to main Quiz
            </Button>
          </div>

          {sectionQuizRunComplete && (
            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Result: {sectionQuizScore.correct}/{questions!.length} correct
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Score {sectionQuizPercent}% · Missed {sectionQuizScore.incorrect}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setSectionQuizCompleteOpen(true)}
                >
                  <Sparkles className="h-3 w-3" />
                  Re-generate
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
