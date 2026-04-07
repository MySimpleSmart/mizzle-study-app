"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { createPortal } from "react-dom";
import type {
  Flashcard,
  QuestionType,
  QuizQuestion,
  QuizSettings,
  Topic,
} from "@/lib/data";
import { sampleFlashcards, sampleQuizQuestions } from "@/lib/data";
import {
  getSavedFlashcards,
  removeSavedFlashcard,
  savedFlashcardDeckProgress,
  upsertSavedFlashcard,
  type SavedFlashcardSnapshot,
} from "@/lib/saved-flashcards";
import {
  getSavedQuizzes,
  removeSavedQuiz,
  savedQuizProgress,
  upsertSavedQuiz,
  type SavedQuizSnapshot,
} from "@/lib/saved-quizzes";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Bookmark,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  CircleDot,
  Pencil,
  Sparkles,
  Layers,
  ListChecks,
  PenLine,
  Plus,
  RotateCcw,
  Save,
  SquareStack,
  TextCursorInput,
  Trash2,
  XCircle,
} from "lucide-react";
import { cn, excerptHeading } from "@/lib/utils";
import {
  pickQuestionsForQuizRun,
  questionMatchesDifficulty,
  shuffleArray,
} from "@/lib/quiz-pick";
import { scoreVisibleQuizRun } from "@/lib/quiz-score";

function WorkspacePanelTitle({
  sectionTitle,
  fallback,
}: {
  sectionTitle: string | null;
  fallback: string;
}) {
  const raw =
    sectionTitle != null && sectionTitle.trim() !== ""
      ? sectionTitle.trim()
      : fallback;
  /** Shorter line + explicit "..."; `title` shows full text on hover. */
  const display = excerptHeading(raw, 32);
  return (
    <h3
      className="min-w-0 max-w-[min(100%,18rem)] cursor-default text-base font-semibold sm:max-w-[20rem]"
      title={raw}
    >
      {display}
    </h3>
  );
}

const DRAG_FILL_GAP = "______";

function DragFillInteraction({
  question,
  selectedAnswer,
  onAnswerChange,
  showResult,
  isCorrect,
}: {
  question: QuizQuestion;
  selectedAnswer: string;
  onAnswerChange: (value: string) => void;
  showResult: boolean;
  isCorrect: boolean;
}) {
  const options = question.options ?? [];
  const bankOrder = useMemo(
    () => shuffleArray(options),
    [question.id, question.options?.join("|")]
  );

  const placed = selectedAnswer;
  const bankOptions = bankOrder.filter((o) => o !== placed);

  const parts = question.question.split(DRAG_FILL_GAP);
  const hasInlineGap = parts.length >= 2;

  const handleDragStart = (
    e: DragEvent,
    text: string,
    from: "bank" | "gap"
  ) => {
    e.dataTransfer.setData("text/plain", text);
    e.dataTransfer.setData("application/x-mizzle-dnd-from", from);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnGap = (e: DragEvent) => {
    e.preventDefault();
    if (showResult) return;
    const text = e.dataTransfer.getData("text/plain");
    if (!text) return;
    onAnswerChange(text);
  };

  const handleDropOnBank = (e: DragEvent) => {
    e.preventDefault();
    if (showResult) return;
    const from = e.dataTransfer.getData("application/x-mizzle-dnd-from");
    if (from === "gap") onAnswerChange("");
  };

  const gapBox = (
    <span
      role="group"
      aria-label="Drop zone"
      onDragOver={handleDragOver}
      onDrop={handleDropOnGap}
      className={cn(
        "mx-0.5 inline-flex min-h-9 min-w-[6.5rem] max-w-[min(100%,20rem)] items-center justify-center rounded-md border-2 border-dashed px-1.5 align-middle transition-colors",
        showResult
          ? isCorrect
            ? "border-green-400 bg-green-50"
            : "border-destructive/55 bg-red-50"
          : "border-primary/40 bg-muted/25 hover:border-primary/55",
        placed && "border-solid"
      )}
    >
      {placed ? (
        <span
          draggable={!showResult}
          onDragStart={(e) => handleDragStart(e, placed, "gap")}
          className={cn(
            "max-w-full truncate rounded px-2 py-1 text-sm font-medium",
            !showResult && "cursor-grab active:cursor-grabbing",
            showResult && isCorrect && "text-green-800",
            showResult && !isCorrect && "text-destructive"
          )}
        >
          {placed}
        </span>
      ) : (
        <span className="px-1 text-[11px] text-muted-foreground">Drop</span>
      )}
    </span>
  );

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This drag-fill question has no word bank.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium leading-relaxed">
        {hasInlineGap ? (
          <>
            {parts[0]}
            {gapBox}
            {parts.slice(1).join(DRAG_FILL_GAP)}
          </>
        ) : (
          <>
            <p>{question.question}</p>
            <div className="mt-3 flex justify-start">{gapBox}</div>
          </>
        )}
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDropOnBank}
        className="rounded-xl border border-border/70 bg-muted/15 p-3"
      >
        <p className="mb-2.5 text-[11px] text-muted-foreground">Word bank</p>
        <div className="flex flex-wrap gap-2">
          {bankOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              draggable={!showResult}
              onDragStart={(e) => handleDragStart(e, opt, "bank")}
              disabled={showResult}
              onClick={() => {
                if (!showResult) onAnswerChange(opt);
              }}
              className={cn(
                "touch-manipulation rounded-full border border-border bg-background px-3 py-1.5 text-left text-sm shadow-sm transition hover:border-primary/35 hover:bg-background",
                !showResult &&
                  "cursor-grab active:cursor-grabbing active:shadow-none"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

type QuizMode = "quiz" | "flashcard";

interface QuizTabProps {
  topics: Topic[];
  studyTopicIds: string[];
  /** Current workspace section title (drives Quiz / Flashcard headers). */
  sectionTitle: string | null;
  /** Increments when a quiz is saved from elsewhere (e.g. section mini quiz). */
  savedQuizRemoteRefreshToken?: number;
}

const formSelectTriggerClass =
  "h-9 w-full min-w-0 rounded-md border-border bg-background shadow-none";

/** Topics in workspace study order — quiz/flashcard only use these. */
function studyTopicsInOrder(topics: Topic[], studyTopicIds: string[]): Topic[] {
  const map = Object.fromEntries(topics.map((t) => [t.id, t]));
  return studyTopicIds.map((id) => map[id]).filter((t): t is Topic => Boolean(t));
}

function countQuizQuestionsForTopics(topicIds: string[]): number {
  if (topicIds.length === 0) return 0;
  return sampleQuizQuestions.filter(
    (q) => q.topicId && topicIds.includes(q.topicId)
  ).length;
}

function countQuizQuestionsForStudy(studyTopicIds: string[]): number {
  return countQuizQuestionsForTopics(studyTopicIds);
}

function countFlashcardsForStudy(studyTopicIds: string[]): number {
  if (studyTopicIds.length === 0) return 0;
  return sampleFlashcards.filter((c) => studyTopicIds.includes(c.topicId))
    .length;
}

// ---------------------------------------------------------------------------
// Mode Selector
// ---------------------------------------------------------------------------

function ModeSelector({
  mode,
  onModeChange,
}: {
  mode: QuizMode;
  onModeChange: (mode: QuizMode) => void;
}) {
  const tab = (active: boolean) =>
    cn(
      "inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-xs font-medium transition-colors",
      active
        ? "bg-white text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground"
    );

  return (
    <div
      className="inline-flex shrink-0 gap-0.5 rounded-md border bg-muted/40 p-0.5"
      role="tablist"
      aria-label="Quiz mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === "quiz"}
        onClick={() => onModeChange("quiz")}
        className={tab(mode === "quiz")}
      >
        <BrainCircuit className="h-3.5 w-3.5 shrink-0 opacity-90" />
        Quiz
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "flashcard"}
        onClick={() => onModeChange("flashcard")}
        className={tab(mode === "flashcard")}
      >
        <Layers className="h-3.5 w-3.5 shrink-0 opacity-90" />
        Flashcard
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flashcard Settings
// ---------------------------------------------------------------------------

function FlashcardSettingsPanel({
  studyTopics,
  onGenerate,
}: {
  /** Only topics in the current workspace study (same order as Study tab) */
  studyTopics: Topic[];
  onGenerate: (cardCount: number, topicIds: string[]) => void;
}) {
  const [cardCount, setCardCount] = useState("8");
  const [chosenTopics, setChosenTopics] = useState<string[]>(() =>
    studyTopics.map((t) => t.id)
  );

  useEffect(() => {
    setChosenTopics(studyTopics.map((t) => t.id));
  }, [studyTopics]);

  const toggleTopic = (id: string) => {
    setChosenTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const topicMap = Object.fromEntries(studyTopics.map((t) => [t.id, t.name]));
  const chosenNames = chosenTopics
    .map((id) => topicMap[id])
    .filter(Boolean) as string[];
  const topicSummary =
    chosenNames.length === 0
      ? "No topics selected"
      : chosenNames.length <= 3
        ? chosenNames.join(", ")
        : `${chosenNames.slice(0, 2).join(", ")} +${chosenNames.length - 2} more`;

  return (
    <div className="flex h-full min-h-0 items-center justify-center overflow-auto p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm">
          <div className="border-b border-border/60 bg-muted/25 px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
                aria-hidden
              >
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  Generate Flashcards
                </h3>
                <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                  Cards are drawn only from topics in your current study. Choose
                  how many to generate and which topics to include.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="w-full space-y-1.5">
              <label
                htmlFor="flashcard-count"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Number of cards
              </label>
              <Select
                value={cardCount}
                onValueChange={(v) => v && setCardCount(v)}
              >
                <SelectTrigger id="flashcard-count" className={formSelectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 cards</SelectItem>
                  <SelectItem value="8">8 cards</SelectItem>
                  <SelectItem value="10">10 cards</SelectItem>
                  <SelectItem value="15">15 cards</SelectItem>
                  <SelectItem value="20">20 cards</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-5 space-y-2">
              <span
                id="flashcard-topics-label"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Topics
              </span>
              <div
                role="group"
                aria-labelledby="flashcard-topics-label"
                className="rounded-lg border border-border/60 bg-muted/15 p-3 sm:p-4"
              >
                <div className="flex flex-wrap gap-1.5">
                  {studyTopics.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => toggleTopic(topic.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                        chosenTopics.includes(topic.id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          chosenTopics.includes(topic.id)
                            ? "bg-primary"
                            : "bg-muted-foreground/40"
                        )}
                      />
                      {topic.name}
                    </button>
                  ))}
                </div>
                {chosenTopics.length === 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Select at least one topic to continue.
                  </p>
                )}
              </div>
            </div>

            <p className="mt-4 rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2.5 text-center text-xs text-muted-foreground sm:text-left">
              <span className="font-medium text-foreground">{cardCount} cards</span>
              {" · "}
              {chosenTopics.length > 0 && (
                <span className="text-foreground/90">
                  {chosenTopics.length} topic
                  {chosenTopics.length === 1 ? "" : "s"}
                  {" — "}
                </span>
              )}
              {topicSummary}
            </p>

            <Button
              className="mt-5 w-full sm:mt-6"
              disabled={chosenTopics.length === 0}
              onClick={() => onGenerate(parseInt(cardCount), chosenTopics)}
            >
              Generate Flashcards
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flashcard Viewer
// ---------------------------------------------------------------------------

function FlashcardViewer({
  cards,
  resumeSnapshot,
  sectionTitle,
  generationRules,
  onBackToBrowse,
  onRegenerateSameRules,
  onFlashcardSaved,
}: {
  cards: Flashcard[];
  resumeSnapshot: SavedFlashcardSnapshot | null;
  sectionTitle: string | null;
  generationRules: { cardCount: number; topicIds: string[] } | null;
  onBackToBrowse: () => void;
  onRegenerateSameRules: () => void;
  onFlashcardSaved?: (snapshot: SavedFlashcardSnapshot) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(() =>
    resumeSnapshot && cards.length > 0
      ? Math.min(
          resumeSnapshot.currentIndex,
          Math.max(0, cards.length - 1)
        )
      : 0
  );
  const [flipped, setFlipped] = useState(() => resumeSnapshot?.flipped ?? false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  const lastSavedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (resumeSnapshot) {
      lastSavedKeyRef.current = `${resumeSnapshot.currentIndex}|${resumeSnapshot.flipped}`;
    } else {
      lastSavedKeyRef.current = null;
    }
  }, [resumeSnapshot?.id]);

  useEffect(() => {
    setCurrentIndex((i) =>
      cards.length === 0 ? 0 : Math.min(i, cards.length - 1)
    );
  }, [cards.length]);

  const stateKey = `${currentIndex}|${flipped}`;
  const hasUnsavedChanges =
    cards.length > 0 &&
    (lastSavedKeyRef.current === null
      ? stateKey !== "0|false"
      : stateKey !== lastSavedKeyRef.current);

  const requestBack = () => {
    if (hasUnsavedChanges) {
      setLeaveOpen(true);
    } else {
      onBackToBrowse();
    }
  };

  const confirmLeave = () => {
    setLeaveOpen(false);
    onBackToBrowse();
  };

  const confirmRestartSameCards = () => {
    setRestartConfirmOpen(false);
    setFlipped(false);
    setCurrentIndex(0);
  };

  const confirmRegenerateCards = () => {
    setRestartConfirmOpen(false);
    onRegenerateSameRules();
  };

  const handleSave = useCallback(() => {
    if (cards.length === 0) return;
    const topicIds = [...new Set(cards.map((c) => c.topicId))];
    const snapshot = upsertSavedFlashcard({
      ...(resumeSnapshot?.id ? { id: resumeSnapshot.id } : {}),
      savedAt: new Date().toISOString(),
      topicIds,
      flashcardIds: cards.map((c) => c.id),
      currentIndex,
      flipped,
    });
    lastSavedKeyRef.current = `${currentIndex}|${flipped}`;
    setSaveStatus("saved");
    onFlashcardSaved?.(snapshot);
    window.setTimeout(() => setSaveStatus("idle"), 2200);
  }, [cards, currentIndex, flipped, onFlashcardSaved, resumeSnapshot?.id]);

  if (cards.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium text-foreground">
          No flashcards for this selection
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          None of your selected topics have sample cards yet. Try other topics
          or generate again.
        </p>
        <Button variant="outline" size="sm" onClick={onBackToBrowse}>
          Back to saved flashcards
        </Button>
      </div>
    );
  }

  const card = cards[currentIndex];

  const goNext = () => {
    setFlipped(false);
    setCurrentIndex((prev) => Math.min(prev + 1, cards.length - 1));
  };

  const goPrev = () => {
    setFlipped(false);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <>
      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave without saving?</DialogTitle>
            <DialogDescription>
              You have unsaved progress on this deck (card position and flip
              state). Leave anyway, or save first with{" "}
              <span className="font-medium text-foreground">Save set</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLeaveOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={confirmLeave}>
              Leave anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={restartConfirmOpen}
        onOpenChange={setRestartConfirmOpen}
      >
        <DialogContent className="min-w-0 max-w-[calc(100%-2rem)] overflow-hidden sm:max-w-md">
          <DialogHeader className="min-w-0">
            <DialogTitle>Restart flashcards</DialogTitle>
            <DialogDescription className="text-left break-words">
              Same topic selection and deck size apply when you re-generate, or
              keep this deck and only reset your place.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex min-w-0 w-full flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full min-w-0 max-w-full shrink whitespace-normal flex-col items-stretch justify-start gap-1 py-3 text-left"
              onClick={confirmRestartSameCards}
            >
              <span className="block w-full min-w-0 break-words text-left font-medium text-foreground">
                Restart same cards
              </span>
              <span className="block w-full min-w-0 break-words text-left text-xs font-normal text-muted-foreground">
                Go to the first card, front side up. Your saved set is unchanged
                until you save again.
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full min-w-0 max-w-full shrink whitespace-normal flex-col items-stretch justify-start gap-1 py-3 text-left"
              disabled={!generationRules}
              onClick={confirmRegenerateCards}
            >
              <span className="block w-full min-w-0 break-words text-left font-medium text-foreground">
                Re-generate cards (same rules)
              </span>
              <span className="block w-full min-w-0 break-words text-left text-xs font-normal text-muted-foreground">
                New draw from the bank with the same number of cards and
                topics.
              </span>
            </Button>
          </div>
          <div className="mt-4 flex justify-end border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRestartConfirmOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ScrollArea className="h-full">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <WorkspacePanelTitle
                sectionTitle={sectionTitle}
                fallback="Flashcards"
              />
            </div>
            <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:ml-auto sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={requestBack}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={cards.length === 0}
                title="Return to the first card and flip to the front"
                onClick={() => setRestartConfirmOpen(true)}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Restart
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                onClick={handleSave}
              >
                <Save className="h-3.5 w-3.5" aria-hidden />
                {saveStatus === "saved" ? "Saved" : "Save set"}
              </Button>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6">
            <div className="flex w-full flex-col items-center gap-1.5">
              <p className="text-center text-sm text-muted-foreground">
                Card {currentIndex + 1} of {cards.length}
              </p>
              <div className="flex justify-center gap-1">
                {cards.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 rounded-full transition-colors",
                      i === currentIndex ? "w-6 bg-primary" : "w-2 bg-border"
                    )}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFlipped(!flipped)}
              className="group w-full max-w-lg"
              style={{ perspective: "1000px" }}
            >
              <div
                className={cn(
                  "relative min-h-[260px] w-full transition-transform duration-500",
                  flipped && "[transform:rotateY(180deg)]"
                )}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-white p-8 shadow-sm [backface-visibility:hidden]">
                  <p className="mb-4 text-center text-lg font-medium leading-relaxed">
                    {card.front}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    Tap to reveal answer
                  </span>
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <p className="text-center text-sm leading-relaxed whitespace-pre-line text-foreground/80">
                    {card.back}
                  </p>
                </div>
              </div>
            </button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={goPrev}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={goNext}
                disabled={currentIndex === cards.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </>
  );
}

// ---------------------------------------------------------------------------
// Quiz Settings
// ---------------------------------------------------------------------------

const difficultyLabel: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const questionTypeLabel: Record<string, string> = {
  mixed: "Mix all",
  "single-choice": "Single choice",
  "multiple-choice": "Multiple choice",
  "fill-blank": "Fill in the blank",
  "drag-fill": "Drag & fill",
  "short-answer": "Short answer",
};

const QUESTION_TYPE_TILES: {
  value: QuestionType;
  label: string;
  Icon: LucideIcon;
}[] = [
  { value: "single-choice", label: "Single choice", Icon: CircleDot },
  { value: "multiple-choice", label: "Multiple choice", Icon: ListChecks },
  { value: "fill-blank", label: "Fill in the blank", Icon: TextCursorInput },
  { value: "drag-fill", label: "Drag & fill", Icon: ArrowLeftRight },
  { value: "short-answer", label: "Short answer", Icon: PenLine },
  { value: "mixed", label: "Mix all", Icon: Layers },
];

/** Toggle one format; `mixed` clears other picks; concrete types are multi-select. */
function toggleQuestionFormat(
  current: QuestionType[],
  next: QuestionType
): QuestionType[] {
  if (next === "mixed") {
    return ["mixed"];
  }
  const withoutMixed = current.filter((t) => t !== "mixed");
  if (withoutMixed.includes(next)) {
    const removed = withoutMixed.filter((t) => t !== next);
    return removed.length === 0 ? ["mixed"] : removed;
  }
  return [...withoutMixed, next];
}

function formatSelectionSummary(formats: QuestionType[]): string {
  if (formats.includes("mixed") || formats.length === 0) {
    return "Mix all";
  }
  return formats.map((f) => questionTypeLabel[f] ?? f).join(", ");
}

function formatSavedQuizDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function topicNamesFromIds(ids: string[], topicList: Topic[]): string {
  const map = Object.fromEntries(topicList.map((t) => [t.id, t.name]));
  return ids.map((id) => map[id] ?? id).join(", ");
}

function resolveFlashcardsFromSnapshot(
  entry: SavedFlashcardSnapshot
): Flashcard[] {
  const map = Object.fromEntries(sampleFlashcards.map((c) => [c.id, c]));
  return entry.flashcardIds
    .map((id) => map[id])
    .filter((c): c is Flashcard => c != null);
}

function SavedQuizCardsList({
  allTopics,
  refreshKey,
  onContinue,
}: {
  allTopics: Topic[];
  refreshKey: number;
  onContinue: (entry: SavedQuizSnapshot) => void;
}) {
  const [items, setItems] = useState<SavedQuizSnapshot[]>([]);
  const [pendingRemove, setPendingRemove] =
    useState<SavedQuizSnapshot | null>(null);

  const removeConfirmDescription = useMemo(() => {
    if (!pendingRemove) return "";
    const t = topicNamesFromIds(
      pendingRemove.settings.selectedTopics,
      allTopics
    );
    return t
      ? `This will permanently delete the saved session for ${t}. You cannot undo this action.`
      : "This will permanently delete this saved quiz. You cannot undo this action.";
  }, [pendingRemove, allTopics]);

  useEffect(() => {
    setItems(getSavedQuizzes());
  }, [refreshKey]);

  const handleRemove = (id: string) => {
    removeSavedQuiz(id);
    setItems(getSavedQuizzes());
  };

  const confirmRemoveSavedQuiz = () => {
    if (!pendingRemove) return;
    handleRemove(pendingRemove.id);
    setPendingRemove(null);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          No saved quizzes yet. Start a new quiz, then use{" "}
          <span className="font-medium text-foreground">Save quiz</span> during
          practice to store it here.
        </p>
      </div>
    );
  }

  return (
    <>
      <Dialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove saved quiz?</DialogTitle>
            <DialogDescription>{removeConfirmDescription}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingRemove(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmRemoveSavedQuiz}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((entry) => {
        const { answered, total } = savedQuizProgress(entry);
        const names = topicNamesFromIds(
          entry.settings.selectedTopics,
          allTopics
        );
        const progressPercent =
          total > 0 ? Math.round((answered / total) * 100) : 0;

        return (
          <div
            key={entry.id}
            className="flex flex-col rounded-xl border border-border/80 bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-medium leading-snug text-foreground">
              {names}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {entry.settings.questionCount} requested ·{" "}
              {difficultyLabel[entry.settings.difficulty]} ·{" "}
              {formatSelectionSummary(entry.settings.questionFormats)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {entry.questionIds.length} questions in session
            </p>
            <div
              className="mt-3"
              title={`${answered} of ${total} checked`}
            >
              <Progress
                value={progressPercent}
                className="w-full gap-0 [&_[data-slot=progress-track]]:h-2"
              />
            </div>
            <div className="mt-4 flex flex-nowrap items-center gap-2 border-t border-border/50 pt-3">
              <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-muted-foreground">
                {formatSavedQuizDate(entry.savedAt)}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  aria-label="Remove saved quiz"
                  onClick={() => setPendingRemove(entry)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onContinue(entry)}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
}

function QuizBrowseView({
  allTopics,
  savedListVersion,
  onNewQuiz,
  onContinue,
}: {
  allTopics: Topic[];
  savedListVersion: number;
  onNewQuiz: () => void;
  onContinue: (entry: SavedQuizSnapshot) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="w-full flex-1 px-6 py-6">
        <div className="mb-6 flex w-full items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Bookmark
              className="h-5 w-5 shrink-0 text-primary"
              aria-hidden
            />
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Saved quizzes
            </h3>
          </div>
          <Button
            type="button"
            className="shrink-0 gap-1.5"
            onClick={onNewQuiz}
          >
            <Plus className="h-4 w-4" aria-hidden />
            New quiz
          </Button>
        </div>
        <SavedQuizCardsList
          allTopics={allTopics}
          refreshKey={savedListVersion}
          onContinue={onContinue}
        />
      </div>
    </div>
  );
}

function SavedFlashcardCardsList({
  allTopics,
  refreshKey,
  onContinue,
}: {
  allTopics: Topic[];
  refreshKey: number;
  onContinue: (entry: SavedFlashcardSnapshot) => void;
}) {
  const [items, setItems] = useState<SavedFlashcardSnapshot[]>([]);
  const [pendingRemove, setPendingRemove] =
    useState<SavedFlashcardSnapshot | null>(null);

  const removeConfirmDescription = useMemo(() => {
    if (!pendingRemove) return "";
    const t = topicNamesFromIds(pendingRemove.topicIds, allTopics);
    return t
      ? `This will permanently delete the saved set for ${t}. You cannot undo this action.`
      : "This will permanently delete this saved flashcard set. You cannot undo this action.";
  }, [pendingRemove, allTopics]);

  useEffect(() => {
    setItems(getSavedFlashcards());
  }, [refreshKey]);

  const handleRemove = (id: string) => {
    removeSavedFlashcard(id);
    setItems(getSavedFlashcards());
  };

  const confirmRemove = () => {
    if (!pendingRemove) return;
    handleRemove(pendingRemove.id);
    setPendingRemove(null);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          No saved flashcard sets yet. Generate a deck, then use{" "}
          <span className="font-medium text-foreground">Save set</span> during
          review to store it here.
        </p>
      </div>
    );
  }

  return (
    <>
      <Dialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove saved flashcards?</DialogTitle>
            <DialogDescription>{removeConfirmDescription}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingRemove(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmRemove}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((entry) => {
          const { position, total } = savedFlashcardDeckProgress(entry);
          const names = topicNamesFromIds(entry.topicIds, allTopics);
          const progressPercent =
            total > 0 ? Math.round((position / total) * 100) : 0;

          return (
            <div
              key={entry.id}
              className="flex flex-col rounded-xl border border-border/80 bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-medium leading-snug text-foreground">
                {names || "Flashcard set"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {entry.flashcardIds.length} card
                {entry.flashcardIds.length !== 1 ? "s" : ""} in deck
              </p>
              <div
                className="mt-3"
                title={`Card ${position} of ${total}`}
              >
                <Progress
                  value={progressPercent}
                  className="w-full gap-0 [&_[data-slot=progress-track]]:h-2"
                />
              </div>
              <div className="mt-4 flex flex-nowrap items-center gap-2 border-t border-border/50 pt-3">
                <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-muted-foreground">
                  {formatSavedQuizDate(entry.savedAt)}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    aria-label="Remove saved flashcard set"
                    onClick={() => setPendingRemove(entry)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onContinue(entry)}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function FlashcardBrowseView({
  allTopics,
  savedListVersion,
  onNewSet,
  onContinue,
}: {
  allTopics: Topic[];
  savedListVersion: number;
  onNewSet: () => void;
  onContinue: (entry: SavedFlashcardSnapshot) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="w-full flex-1 px-6 py-6">
        <div className="mb-6 flex w-full items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Bookmark
              className="h-5 w-5 shrink-0 text-primary"
              aria-hidden
            />
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Saved flashcards
            </h3>
          </div>
          <Button
            type="button"
            className="shrink-0 gap-1.5"
            onClick={onNewSet}
          >
            <Plus className="h-4 w-4" aria-hidden />
            New set
          </Button>
        </div>
        <SavedFlashcardCardsList
          allTopics={allTopics}
          refreshKey={savedListVersion}
          onContinue={onContinue}
        />
      </div>
    </div>
  );
}

function QuestionTypeGrid({
  value,
  onChange,
}: {
  value: QuestionType[];
  onChange: (next: QuestionType[]) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Question types
      </legend>
      <p className="mb-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">
        Choose one or more formats. &ldquo;Mix all&rdquo; includes every type;
        otherwise combine specific formats.
      </p>
      <div
        role="group"
        aria-label="Question types (multiple selection)"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {QUESTION_TYPE_TILES.map(({ value: v, label, Icon }) => {
          const mixedMode = value.includes("mixed");
          const selected = mixedMode ? v === "mixed" : value.includes(v);
          return (
            <button
              key={v}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => onChange(toggleQuestionFormat(value, v))}
              className={cn(
                "flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-md border px-2 py-2.5 text-center text-xs font-medium transition-colors sm:min-h-[4.75rem] sm:text-[13px]",
                selected
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon
                className="h-5 w-5 shrink-0 opacity-90"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="leading-snug">{label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function QuizSettingsPanel({
  onStart,
  studyTopics,
  studyTopicIds,
  onBackToSavedList,
}: {
  onStart: (settings: QuizSettings) => void;
  studyTopics: Topic[];
  studyTopicIds: string[];
  onBackToSavedList: () => void;
}) {
  const [questionCount, setQuestionCount] = useState("5");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionFormats, setQuestionFormats] = useState<QuestionType[]>([
    "mixed",
  ]);
  const [scopeMode, setScopeMode] = useState<"all" | "custom">("all");
  const [customTopicIds, setCustomTopicIds] = useState<string[]>([]);

  const studyKey = studyTopicIds.join("|");
  useEffect(() => {
    setCustomTopicIds((prev) => {
      const next = prev.filter((id) => studyTopicIds.includes(id));
      if (next.length > 0) return next;
      return [...studyTopicIds];
    });
  }, [studyKey, studyTopicIds]);

  const effectiveTopicIds =
    scopeMode === "all" ? studyTopicIds : customTopicIds;
  const questionsAvailableInScope = countQuizQuestionsForTopics(
    effectiveTopicIds
  );
  const scopeSummaryNames = studyTopics
    .filter((t) => effectiveTopicIds.includes(t.id))
    .map((t) => t.name)
    .join(", ");

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="flex shrink-0 flex-col items-center px-4 pt-6 sm:px-6">
        <div className="w-full max-w-2xl">
        <div className="mb-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1 text-muted-foreground hover:text-foreground"
            onClick={onBackToSavedList}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Saved quizzes
          </Button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm">
          <div className="border-b border-border/60 bg-muted/25 px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
                aria-hidden
              >
                <BrainCircuit className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  Start quiz
                </h3>
                <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                  Pick which topics in your study scope to include, then set
                  length, difficulty, and question formats.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="quiz-question-count"
                  className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  Number of questions
                </label>
                <Select
                  value={questionCount}
                  onValueChange={(v) => v && setQuestionCount(v)}
                >
                  <SelectTrigger id="quiz-question-count" className={formSelectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 questions</SelectItem>
                    <SelectItem value="10">10 questions</SelectItem>
                    <SelectItem value="15">15 questions</SelectItem>
                    <SelectItem value="20">20 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="quiz-difficulty"
                  className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  Difficulty
                </label>
                <Select
                  value={difficulty}
                  onValueChange={(v) => v && setDifficulty(v)}
                >
                  <SelectTrigger id="quiz-difficulty" className={formSelectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-5">
              <QuestionTypeGrid
                value={questionFormats}
                onChange={setQuestionFormats}
              />
            </div>

            <fieldset className="mt-5 space-y-3">
              <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Study scope
              </legend>
              <RadioGroup
                value={scopeMode}
                onValueChange={(v) => {
                  if (v !== "all" && v !== "custom") return;
                  setScopeMode(v);
                  if (v === "custom") {
                    setCustomTopicIds((prev) => {
                      const next = prev.filter((id) =>
                        studyTopicIds.includes(id)
                      );
                      return next.length > 0 ? next : [...studyTopicIds];
                    });
                  }
                }}
                className="grid grid-cols-2 gap-3"
              >
                <label
                  className={cn(
                    "flex min-h-full min-w-0 cursor-pointer gap-2 rounded-lg border p-3 text-sm transition-colors sm:gap-3",
                    scopeMode === "all"
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/70 hover:border-primary/30"
                  )}
                >
                  <RadioGroupItem value="all" className="mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="font-medium text-foreground">
                      All topics in study
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      Use every topic in your current study list (
                      {studyTopics.length} topic
                      {studyTopics.length === 1 ? "" : "s"})
                    </span>
                  </span>
                </label>
                <label
                  className={cn(
                    "flex min-h-full min-w-0 cursor-pointer gap-2 rounded-lg border p-3 text-sm transition-colors sm:gap-3",
                    scopeMode === "custom"
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/70 hover:border-primary/30"
                  )}
                >
                  <RadioGroupItem value="custom" className="mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="font-medium text-foreground">
                      Choose topics
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      Select one topic or any combination
                    </span>
                  </span>
                </label>
              </RadioGroup>

              {scopeMode === "custom" && studyTopics.length > 0 && (
                <div className="space-y-2 rounded-lg border border-border/70 bg-muted/10 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Included topics
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                        onClick={() =>
                          setCustomTopicIds([...studyTopicIds])
                        }
                      >
                        Select all
                      </button>
                      {studyTopicIds.length > 1 && (
                        <button
                          type="button"
                          className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                          onClick={() => {
                            const first = studyTopicIds[0];
                            if (first) setCustomTopicIds([first]);
                          }}
                        >
                          One only
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {studyTopics.map((t) => {
                      const checked = customTopicIds.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className="flex cursor-pointer items-start gap-2.5 rounded-md border border-transparent px-1 py-0.5 text-sm hover:bg-muted/40"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const on = v === true;
                              if (on) {
                                setCustomTopicIds((prev) =>
                                  prev.includes(t.id)
                                    ? prev
                                    : [...prev, t.id]
                                );
                              } else {
                                setCustomTopicIds((prev) => {
                                  if (prev.length <= 1) return prev;
                                  return prev.filter((id) => id !== t.id);
                                });
                              }
                            }}
                            className="mt-0.5"
                          />
                          <span>{t.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </fieldset>

            <div className="mt-4 space-y-2">
              <p className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">
                <span className="font-medium text-foreground">In scope:</span>{" "}
                {scopeSummaryNames || "—"}
                {" · "}
                <span className="tabular-nums">
                  {questionsAvailableInScope} matching question
                  {questionsAvailableInScope === 1 ? "" : "s"} in bank
                </span>
              </p>
              <p className="rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2.5 text-center text-xs text-muted-foreground sm:text-left">
                <span className="font-medium text-foreground">
                  {questionCount} questions
                </span>
                {" · "}
                {difficultyLabel[difficulty] ?? difficulty}
                {" · "}
                {formatSelectionSummary(questionFormats)}
              </p>
            </div>

            <Button
              className="mt-5 w-full sm:mt-6"
              size="default"
              disabled={
                studyTopicIds.length === 0 ||
                (scopeMode === "custom" && customTopicIds.length === 0)
              }
              onClick={() =>
                onStart({
                  questionCount: parseInt(questionCount),
                  difficulty: difficulty as QuizSettings["difficulty"],
                  questionFormats,
                  selectedTopics: effectiveTopicIds,
                })
              }
            >
              Start Quiz
            </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Question Card
// ---------------------------------------------------------------------------

/** Correct / incorrect answer control colors (override default primary). */
const quizCorrectControlClass =
  "border-green-500 data-checked:border-green-600 data-checked:bg-green-600 dark:data-checked:bg-green-600 [&_[data-slot=radio-group-indicator]_span]:bg-white";
const quizWrongControlClass =
  "border-red-500 data-checked:border-red-600 data-checked:bg-red-600 dark:data-checked:bg-red-600 [&_[data-slot=radio-group-indicator]_span]:bg-white";
const quizCorrectCheckboxClass =
  "border-green-500 data-checked:border-green-600 data-checked:bg-green-600 data-checked:text-white dark:data-checked:bg-green-600";
const quizWrongCheckboxClass =
  "border-red-500 data-checked:border-red-600 data-checked:bg-red-600 data-checked:text-white dark:data-checked:bg-red-600";

export function QuestionCard({
  question,
  index,
  onFirstReveal,
  onAnswerSnapshot,
  resumeAnswer,
  onRemoveQuestion,
  embedded,
  embeddedActionsWhenWrong,
}: {
  question: QuizQuestion;
  index: number;
  onFirstReveal?: () => void;
  onAnswerSnapshot?: (
    questionId: string,
    payload: { selectedAnswer: string | string[]; revealed: boolean }
  ) => void;
  resumeAnswer?: {
    selectedAnswer: string | string[];
    revealed: boolean;
  } | null;
  onRemoveQuestion?: () => void;
  /** Compact layout for sidebar / section mini quiz (no remove / AI toolbar). */
  embedded?: boolean;
  /**
   * With `embedded`, hide Ask AI / Edit / Remove unless the answer is wrong.
   * Main quiz (non-embedded) always shows the bar after reveal.
   */
  embeddedActionsWhenWrong?: boolean;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>(
    () => resumeAnswer?.selectedAnswer ?? ""
  );
  const [showResult, setShowResult] = useState(
    () => resumeAnswer?.revealed ?? false
  );
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removePanelPos, setRemovePanelPos] = useState({ top: 0, right: 0 });
  const removeTriggerRef = useRef<HTMLButtonElement>(null);
  const questionCardRef = useRef<HTMLDivElement>(null);

  const firstRevealSentRef = useRef(!!resumeAnswer?.revealed);

  const openRemoveConfirm = useCallback(() => {
    const trigger = removeTriggerRef.current;
    const card = questionCardRef.current;
    if (trigger && card) {
      const r = trigger.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      const w = 220;
      const vw = window.innerWidth;
      // Above trash (-translate-y-full). Horizontally: align popover's right edge to the
      // question card's right edge so it sits on the right side of the card (not viewport-left).
      const alignToCardRight = vw - c.right;
      const maxRightBeforeLeftOverflow = vw - w - 8;
      setRemovePanelPos({
        top: r.top - 6,
        right: Math.max(0, Math.min(alignToCardRight, maxRightBeforeLeftOverflow)),
      });
    }
    setRemoveConfirmOpen(true);
  }, []);

  useEffect(() => {
    if (!removeConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRemoveConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [removeConfirmOpen]);

  useEffect(() => {
    onAnswerSnapshot?.(question.id, {
      selectedAnswer,
      revealed: showResult,
    });
  }, [question.id, selectedAnswer, showResult, onAnswerSnapshot]);

  useEffect(() => {
    if (!showResult || firstRevealSentRef.current) return;
    firstRevealSentRef.current = true;
    onFirstReveal?.();
  }, [showResult, onFirstReveal]);

  useEffect(() => {
    if (question.type !== "multiple-choice" || showResult) return;
    const correct = Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : [question.correctAnswer];
    const sel = Array.isArray(selectedAnswer) ? selectedAnswer : [];
    if (correct.length > 0 && sel.length === correct.length) {
      setShowResult(true);
    }
  }, [
    question.type,
    question.correctAnswer,
    selectedAnswer,
    showResult,
  ]);

  useEffect(() => {
    if (question.type !== "drag-fill" || showResult) return;
    const v = typeof selectedAnswer === "string" ? selectedAnswer.trim() : "";
    if (v) setShowResult(true);
  }, [question.type, selectedAnswer, showResult]);

  const isCorrect =
    question.type === "multiple-choice"
      ? Array.isArray(selectedAnswer) &&
        Array.isArray(question.correctAnswer) &&
        selectedAnswer.length === question.correctAnswer.length &&
        selectedAnswer.every((a) => question.correctAnswer.includes(a))
      : question.type === "drag-fill"
        ? typeof selectedAnswer === "string" &&
          typeof question.correctAnswer === "string" &&
          selectedAnswer === question.correctAnswer
        : selectedAnswer === question.correctAnswer;

  const typeLabels: Record<string, string> = {
    "single-choice": "Single Choice",
    "multiple-choice": "Multiple Choice",
    "fill-blank": "Fill in the Blank",
    "drag-fill": "Drag & Fill",
    "short-answer": "Short Answer",
  };

  const showPostResultToolbar =
    showResult &&
    (!embedded || Boolean(embeddedActionsWhenWrong && !isCorrect));

  return (
    <div
      ref={questionCardRef}
      className={cn(
        "rounded-xl border bg-white",
        embedded ? "rounded-lg p-3" : "p-5"
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {index + 1}
        </span>
        <span className="text-xs text-muted-foreground">
          {typeLabels[question.type] ?? question.type}
        </span>
        {showResult && (
          <span className="ml-auto">
            {isCorrect ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
          </span>
        )}
      </div>

      {question.type !== "drag-fill" && (
        <p className={cn("text-sm font-medium", embedded ? "mb-2" : "mb-4")}>
          {question.question}
        </p>
      )}

      {question.type === "single-choice" && question.options && (
        <RadioGroup
          value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
          onValueChange={(val) => {
            setSelectedAnswer(val);
            setShowResult(true);
          }}
          className="space-y-2"
        >
          {question.options.map((option) => (
            <label
              key={option}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border p-3 text-sm transition-colors",
                showResult && option === question.correctAnswer
                  ? "border-green-300 bg-green-50"
                  : showResult &&
                      option === selectedAnswer &&
                      option !== question.correctAnswer
                    ? "border-red-300 bg-red-50"
                    : "hover:border-primary/30"
              )}
            >
              <RadioGroupItem
                value={option}
                disabled={showResult}
                className={cn(
                  showResult &&
                    option === question.correctAnswer &&
                    quizCorrectControlClass,
                  showResult &&
                    option === selectedAnswer &&
                    option !== question.correctAnswer &&
                    quizWrongControlClass
                )}
              />
              {option}
            </label>
          ))}
        </RadioGroup>
      )}

      {question.type === "multiple-choice" && question.options && (
        <div className="space-y-2">
          {question.options.map((option) => {
            const checked = Array.isArray(selectedAnswer)
              ? selectedAnswer.includes(option)
              : false;
            const correctArr = Array.isArray(question.correctAnswer)
              ? question.correctAnswer
              : [question.correctAnswer];
            return (
              <label
                key={option}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border p-3 text-sm transition-colors",
                  showResult && correctArr.includes(option)
                    ? "border-green-300 bg-green-50"
                    : showResult && checked && !correctArr.includes(option)
                      ? "border-red-300 bg-red-50"
                      : "hover:border-primary/30"
                )}
              >
                <Checkbox
                  checked={checked}
                  disabled={showResult}
                  className={cn(
                    showResult &&
                      correctArr.includes(option) &&
                      quizCorrectCheckboxClass,
                    showResult &&
                      checked &&
                      !correctArr.includes(option) &&
                      quizWrongCheckboxClass
                  )}
                  onCheckedChange={(isChecked) => {
                    const current = Array.isArray(selectedAnswer)
                      ? selectedAnswer
                      : [];
                    setSelectedAnswer(
                      isChecked
                        ? [...current, option]
                        : current.filter((a) => a !== option)
                    );
                  }}
                />
                {option}
              </label>
            );
          })}
        </div>
      )}

      {question.type === "fill-blank" && (
        <Input
          placeholder="Type your answer..."
          value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
          onChange={(e) => setSelectedAnswer(e.target.value)}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && !showResult) setShowResult(true);
          }}
          disabled={showResult}
          className={cn(
            showResult &&
              (isCorrect
                ? "border-green-300 bg-green-50"
                : "border-red-300 bg-red-50")
          )}
        />
      )}

      {question.type === "drag-fill" && (
        <DragFillInteraction
          question={question}
          selectedAnswer={
            typeof selectedAnswer === "string" ? selectedAnswer : ""
          }
          onAnswerChange={(v) => setSelectedAnswer(v)}
          showResult={showResult}
          isCorrect={isCorrect}
        />
      )}

      {question.type === "short-answer" && (
        <textarea
          placeholder="Write your answer..."
          value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
          onChange={(e) => setSelectedAnswer(e.target.value)}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && !showResult) setShowResult(true);
          }}
          disabled={showResult}
          rows={3}
          className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      )}

      {showResult && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Explanation
            </p>
            <p className="mt-0.5 text-sm text-foreground/80">
              {question.explanation}
            </p>
          </div>
          {showPostResultToolbar && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                title="Ask AI"
                aria-label="Ask AI"
                onClick={() => {}}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                title="Edit question"
                aria-label="Edit question"
                onClick={() => {}}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                ref={removeTriggerRef}
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                title="Remove question"
                aria-label="Remove question"
                aria-expanded={removeConfirmOpen}
                aria-haspopup="dialog"
                onClick={openRemoveConfirm}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {removeConfirmOpen && showPostResultToolbar &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100] bg-transparent"
              aria-hidden
              onClick={() => setRemoveConfirmOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`remove-question-${question.id}`}
              className="fixed z-[101] w-[220px] -translate-y-full rounded-lg border border-border bg-popover p-3 text-left shadow-lg"
              style={{
                top: removePanelPos.top,
                right: removePanelPos.right,
                left: "auto",
              }}
            >
              <p
                id={`remove-question-${question.id}`}
                className="text-xs font-medium text-foreground"
              >
                Remove this question?
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                It disappears from this run only.
              </p>
              <div className="mt-3 flex justify-end gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setRemoveConfirmOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    onRemoveQuestion?.();
                    setRemoveConfirmOpen(false);
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quiz View (questions list)
// ---------------------------------------------------------------------------

function QuizView({
  settings,
  sectionTitle,
  onBack,
  onRestartQuizSameQuestions,
  onRegenerateQuizSameRules,
  onActiveQuestionIds,
  onProgressScopeChange,
  onQuestionRevealed,
  onQuizSaved,
  onRunScoreChange,
  resumeSnapshot,
}: {
  settings: QuizSettings;
  sectionTitle: string | null;
  onBack: () => void;
  onRestartQuizSameQuestions: () => void;
  onRegenerateQuizSameRules: () => void;
  onActiveQuestionIds?: (ids: string[]) => void;
  onProgressScopeChange?: (payload: {
    questionIdsKey: string;
    totalQuestions: number;
  }) => void;
  onQuestionRevealed?: (questionId: string) => void;
  onQuizSaved?: (snapshot: SavedQuizSnapshot) => void;
  onRunScoreChange?: (score: { correct: number; incorrect: number }) => void;
  resumeSnapshot?: SavedQuizSnapshot | null;
}) {
  const quizBuild = useMemo(() => {
    if (resumeSnapshot) {
      const questions = resumeSnapshot.questionIds
        .map((id) => sampleQuizQuestions.find((q) => q.id === id))
        .filter((q): q is QuizQuestion => Boolean(q));
      const n = questions.length;
      return {
        questions,
        requested: n,
        shown: n,
        exactMatchCount: n,
        relaxedPoolSize: n,
        usedRelaxation: false,
        topicCount: n,
        difficultyCount: n,
        emptyReason:
          n === 0 ? ("resume-invalid" as const) : null,
      };
    }

    const topicSet = new Set(settings.selectedTopics);
    const difficulty = settings.difficulty;

    const topicPool = sampleQuizQuestions.filter(
      (q) => q.topicId && topicSet.has(q.topicId)
    );
    const difficultyPool = topicPool.filter((q) =>
      questionMatchesDifficulty(q, difficulty)
    );

    const requested = settings.questionCount;

    if (topicPool.length === 0) {
      return {
        questions: [],
        requested,
        shown: 0,
        exactMatchCount: 0,
        relaxedPoolSize: 0,
        usedRelaxation: false,
        topicCount: 0,
        difficultyCount: 0,
        emptyReason: "no-topics" as const,
      };
    }

    const picked = pickQuestionsForQuizRun(topicPool, settings, requested);

    return {
      questions: picked.questions,
      requested,
      shown: picked.questions.length,
      exactMatchCount: picked.strictMatchCount,
      relaxedPoolSize: picked.relaxedPoolSize,
      usedRelaxation: picked.usedRelaxation,
      topicCount: topicPool.length,
      difficultyCount: difficultyPool.length,
      emptyReason: null,
    };
  }, [settings, resumeSnapshot]);

  const {
    questions,
    requested,
    shown,
    exactMatchCount,
    relaxedPoolSize,
    usedRelaxation,
    emptyReason,
  } = quizBuild;

  const [removedQuestionIds, setRemovedQuestionIds] = useState<Set<string>>(
    () => new Set()
  );

  const builtQuestionIdsKey = questions.map((q) => q.id).join("|");

  useEffect(() => {
    setRemovedQuestionIds(new Set());
  }, [builtQuestionIdsKey]);

  useEffect(() => {
    if (questions.length === 0) return;
    onActiveQuestionIds?.(questions.map((q) => q.id));
  }, [builtQuestionIdsKey, onActiveQuestionIds, questions]);

  const visibleQuestions = useMemo(
    () => questions.filter((q) => !removedQuestionIds.has(q.id)),
    [questions, removedQuestionIds]
  );

  const answersSnapshotRef = useRef<
    Record<
      string,
      { selectedAnswer: string | string[]; revealed: boolean }
    >
  >({});

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [leaveQuizConfirmOpen, setLeaveQuizConfirmOpen] = useState(false);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);

  const questionIdsKey = visibleQuestions.map((q) => q.id).join("|");

  const pushRunScoreToParent = useCallback(() => {
    if (!onRunScoreChange) return;
    onRunScoreChange(
      scoreVisibleQuizRun(visibleQuestions, answersSnapshotRef.current)
    );
  }, [visibleQuestions, onRunScoreChange]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    setHasUnsavedChanges(false);
  }, [questionIdsKey]);

  useEffect(() => {
    if (resumeSnapshot) {
      answersSnapshotRef.current = { ...resumeSnapshot.answers };
    } else {
      answersSnapshotRef.current = {};
    }
  }, [resumeSnapshot?.id, questionIdsKey, resumeSnapshot]);

  useEffect(() => {
    pushRunScoreToParent();
  }, [questionIdsKey, resumeSnapshot?.id, pushRunScoreToParent]);

  useEffect(() => {
    if (!resumeSnapshot?.id || !onQuestionRevealed) return;
    for (const qid of resumeSnapshot.questionIds) {
      if (resumeSnapshot.answers[qid]?.revealed) {
        onQuestionRevealed(qid);
      }
    }
  }, [resumeSnapshot, onQuestionRevealed]);

  const handleAnswerSnapshot = useCallback(
    (
      questionId: string,
      payload: { selectedAnswer: string | string[]; revealed: boolean }
    ) => {
      answersSnapshotRef.current[questionId] = payload;
      if (resumeSnapshot) {
        const orig = resumeSnapshot.answers[questionId];
        if (
          orig &&
          orig.selectedAnswer === payload.selectedAnswer &&
          orig.revealed === payload.revealed
        ) {
          return;
        }
      }
      const hasContent =
        payload.revealed ||
        (typeof payload.selectedAnswer === "string" &&
          payload.selectedAnswer.trim() !== "") ||
        (Array.isArray(payload.selectedAnswer) &&
          payload.selectedAnswer.length > 0);
      if (hasContent) setHasUnsavedChanges(true);
      pushRunScoreToParent();
    },
    [resumeSnapshot, pushRunScoreToParent]
  );

  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  useEffect(() => {
    onProgressScopeChange?.({
      questionIdsKey,
      totalQuestions: visibleQuestions.length,
    });
  }, [questionIdsKey, visibleQuestions.length, onProgressScopeChange]);

  const handleSaveQuiz = useCallback(() => {
    if (visibleQuestions.length === 0) return;
    const answers: Record<
      string,
      { selectedAnswer: string | string[]; revealed: boolean }
    > = {};
    for (const q of visibleQuestions) {
      const snap = answersSnapshotRef.current[q.id];
      if (snap) {
        answers[q.id] = {
          selectedAnswer: snap.selectedAnswer,
          revealed: snap.revealed,
        };
      }
    }
    const snapshot = upsertSavedQuiz({
      ...(resumeSnapshot?.id ? { id: resumeSnapshot.id } : {}),
      savedAt: new Date().toISOString(),
      settings,
      questionIds: visibleQuestions.map((q) => q.id),
      answers,
    });
    setHasUnsavedChanges(false);
    setSaveStatus("saved");
    onQuizSaved?.(snapshot);
    window.setTimeout(() => setSaveStatus("idle"), 2200);
  }, [visibleQuestions, settings, onQuizSaved, resumeSnapshot?.id]);

  const requestLeaveQuiz = useCallback(() => {
    if (hasUnsavedChanges) {
      setLeaveQuizConfirmOpen(true);
    } else {
      onBack();
    }
  }, [hasUnsavedChanges, onBack]);

  const confirmLeaveQuiz = useCallback(() => {
    setLeaveQuizConfirmOpen(false);
    onBack();
  }, [onBack]);

  const closeRestartDialog = useCallback(() => {
    setRestartConfirmOpen(false);
  }, []);

  const chooseRestartSameQuestions = useCallback(() => {
    setRestartConfirmOpen(false);
    onRestartQuizSameQuestions();
  }, [onRestartQuizSameQuestions]);

  const chooseRegenerateQuestions = useCallback(() => {
    setRestartConfirmOpen(false);
    onRegenerateQuizSameRules();
  }, [onRegenerateQuizSameRules]);

  if (questions.length === 0 && emptyReason) {
    const body =
      emptyReason === "resume-invalid"
        ? "This saved quiz no longer matches the question bank. Remove it and start a new quiz."
        : emptyReason === "no-topics"
          ? "There are no quiz items for your current study topics. Add topics in Study or try again later."
          : emptyReason === "no-difficulty"
            ? `No demo questions are tagged "${difficultyLabel[settings.difficulty] ?? settings.difficulty}" for these topics. Try another difficulty in settings.`
            : "No demo questions match the selected question types for these topics. Turn on Mix all or pick types that exist in the bank (see sample data per topic).";

    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium text-foreground">
          {emptyReason === "resume-invalid"
            ? "Could not open saved quiz"
            : emptyReason === "no-topics"
              ? "No questions for this study yet"
              : emptyReason === "no-difficulty"
                ? "No questions at this difficulty"
                : "No questions for these filters"}
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">{body}</p>
        <Button variant="outline" size="sm" onClick={onBack}>
          {emptyReason === "resume-invalid"
            ? "Back to saved quizzes"
            : "Back to settings"}
        </Button>
      </div>
    );
  }

  const fewerThanRequested = requested > shown && shown > 0;

  return (
    <>
      <Dialog
        open={leaveQuizConfirmOpen}
        onOpenChange={setLeaveQuizConfirmOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave without saving?</DialogTitle>
            <DialogDescription>
              You have unsaved changes on this quiz. If you leave now, your
              answers and progress on this run will be lost unless you save
              first.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLeaveQuizConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={confirmLeaveQuiz}>
              Leave anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={restartConfirmOpen} onOpenChange={setRestartConfirmOpen}>
        <DialogContent className="min-w-0 max-w-[calc(100%-2rem)] overflow-hidden sm:max-w-md">
          <DialogHeader className="min-w-0">
            <DialogTitle>Restart quiz</DialogTitle>
            <DialogDescription className="text-left break-words">
              Choose how to continue. Question types, number of questions,
              difficulty, and study scope (topics) stay the same unless you
              pick a new draw from the bank.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex min-w-0 w-full flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full min-w-0 max-w-full shrink whitespace-normal flex-col items-stretch justify-start gap-1 py-3 text-left"
              onClick={chooseRestartSameQuestions}
            >
              <span className="block w-full min-w-0 break-words text-left font-medium text-foreground">
                Restart same questions
              </span>
              <span className="block w-full min-w-0 break-words text-left text-xs font-normal text-muted-foreground">
                Clear answers and keep this exact set of questions. Your saved
                quiz file is unchanged until you save again.
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full min-w-0 max-w-full shrink whitespace-normal flex-col items-stretch justify-start gap-1 py-3 text-left"
              onClick={chooseRegenerateQuestions}
            >
              <span className="block w-full min-w-0 break-words text-left font-medium text-foreground">
                Re-generate questions (same rules)
              </span>
              <span className="block w-full min-w-0 break-words text-left text-xs font-normal text-muted-foreground">
                New mix from the question bank using the same types, count,
                difficulty, and topics.
              </span>
            </Button>
          </div>
          <div className="mt-4 flex justify-end border-t border-border/60 pt-4">
            <Button type="button" variant="ghost" onClick={closeRestartDialog}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ScrollArea className="h-full">
      <div className="space-y-4 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <WorkspacePanelTitle
              sectionTitle={sectionTitle}
              fallback="Practice Quiz"
            />
            <p className="text-sm text-muted-foreground">
              {shown} of {requested} question{requested === 1 ? "" : "s"} in this
              run · {exactMatchCount} exact filter match
              {exactMatchCount === 1 ? "" : "es"} in bank ·{" "}
              {difficultyLabel[settings.difficulty] ?? settings.difficulty} ·{" "}
              {formatSelectionSummary(settings.questionFormats ?? ["mixed"])}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={requestLeaveQuiz}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Back
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={questions.length === 0}
              title="Clear answers and start this run over"
              onClick={() => setRestartConfirmOpen(true)}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Restart
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5"
              disabled={visibleQuestions.length === 0}
              onClick={handleSaveQuiz}
            >
              <Save className="h-3.5 w-3.5" />
              {saveStatus === "saved" ? "Saved" : "Save quiz"}
            </Button>
          </div>
        </div>

        {fewerThanRequested && (
          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs leading-snug text-muted-foreground">
            Demo bank: only{" "}
            <span className="font-medium text-foreground">{relaxedPoolSize}</span>{" "}
            question{relaxedPoolSize === 1 ? "" : "s"} exist for your selected
            topics (after widening filters), so this run has {shown} of{" "}
            {requested} requested.
          </p>
        )}

        {usedRelaxation && shown === requested && shown > 0 && (
          <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs leading-snug text-muted-foreground">
            <span className="font-medium text-foreground">Full quiz.</span> Some
            items use a broader question type or difficulty so this run reaches
            your requested length.
          </p>
        )}

        {questions.length > 0 && visibleQuestions.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            All questions were removed from this run.
          </p>
        )}

        {visibleQuestions.map((q, i) => (
          <QuestionCard
            key={`${resumeSnapshot?.id ?? "run"}-${q.id}`}
            question={q}
            index={i}
            onFirstReveal={() => onQuestionRevealed?.(q.id)}
            onAnswerSnapshot={handleAnswerSnapshot}
            resumeAnswer={resumeSnapshot?.answers[q.id] ?? null}
            onRemoveQuestion={() =>
              setRemovedQuestionIds((prev) => new Set([...prev, q.id]))
            }
          />
        ))}
      </div>
    </ScrollArea>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

function StudyScopeEmpty() {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-sm font-medium text-foreground">No topics in this study</p>
      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
        Open a section from the sidebar or add topics in the Study tab. Quiz and
        flashcards use only what you are studying now.
      </p>
    </div>
  );
}

export function QuizTab({
  topics,
  studyTopicIds,
  sectionTitle,
  savedQuizRemoteRefreshToken,
}: QuizTabProps) {
  const [mode, setMode] = useState<QuizMode>("quiz");
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizSession, setQuizSession] = useState<QuizSettings | null>(null);
  const [savedListVersion, setSavedListVersion] = useState(0);
  const lastRemoteQuizBump = useRef(0);
  const [savedFlashcardListVersion, setSavedFlashcardListVersion] =
    useState(0);
  /** When false, show saved-quiz cards + New quiz; when true, show Start quiz form. */
  const [showQuizStartForm, setShowQuizStartForm] = useState(false);
  const [resumeSnapshot, setResumeSnapshot] = useState<SavedQuizSnapshot | null>(
    null
  );
  const [quizRunKey, setQuizRunKey] = useState(0);
  const quizAnsweredIdsRef = useRef<Set<string>>(new Set());
  const quizLastQuestionIdsKeyRef = useRef<string | null>(null);
  const [quizProgressAnswered, setQuizProgressAnswered] = useState(0);
  const [quizProgressTotal, setQuizProgressTotal] = useState(0);
  const [quizCompleteModalOpen, setQuizCompleteModalOpen] = useState(false);
  const quizCompleteModalRunRef = useRef<number | null>(null);
  const [quizRunScore, setQuizRunScore] = useState({
    correct: 0,
    incorrect: 0,
  });

  const bumpSavedList = useCallback(() => {
    setSavedListVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    const b = savedQuizRemoteRefreshToken ?? 0;
    if (b > lastRemoteQuizBump.current) {
      lastRemoteQuizBump.current = b;
      setSavedListVersion((v) => v + 1);
    }
  }, [savedQuizRemoteRefreshToken]);

  const bumpSavedFlashcards = useCallback(() => {
    setSavedFlashcardListVersion((v) => v + 1);
  }, []);

  const [flashcardStarted, setFlashcardStarted] = useState(false);
  const [showFlashcardSettingsForm, setShowFlashcardSettingsForm] =
    useState(false);
  const [flashcardResume, setFlashcardResume] =
    useState<SavedFlashcardSnapshot | null>(null);
  const [flashcardRunKey, setFlashcardRunKey] = useState(0);
  const [activeFlashcards, setActiveFlashcards] = useState<Flashcard[]>([]);
  /** Last flashcard generation params (card count + topics) for “re-generate same rules”. */
  const [flashcardGeneration, setFlashcardGeneration] = useState<{
    cardCount: number;
    topicIds: string[];
  } | null>(null);
  /** Current quiz question ids for this run (fresh or saved) — used for “restart same questions”. */
  const quizRunQuestionIdsRef = useRef<string[] | null>(null);

  const handleContinueSavedQuiz = useCallback((entry: SavedQuizSnapshot) => {
    setResumeSnapshot(entry);
    setQuizSession(entry.settings);
    setQuizStarted(true);
    setShowQuizStartForm(false);
    setQuizRunKey((k) => k + 1);
  }, []);

  const handleQuizActiveQuestionIds = useCallback((ids: string[]) => {
    quizRunQuestionIdsRef.current = ids;
  }, []);

  /** Clear answers and keep the same question set (pinned list when not from a saved file). */
  const handleRestartQuizSameQuestions = useCallback(() => {
    quizAnsweredIdsRef.current = new Set();
    setQuizProgressAnswered(0);
    if (resumeSnapshot) {
      setResumeSnapshot({ ...resumeSnapshot, answers: {} });
    } else if (
      quizSession &&
      quizRunQuestionIdsRef.current &&
      quizRunQuestionIdsRef.current.length > 0
    ) {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `quiz-run-${Date.now()}`;
      setResumeSnapshot({
        id,
        savedAt: new Date().toISOString(),
        settings: quizSession,
        questionIds: quizRunQuestionIdsRef.current,
        answers: {},
      });
    } else {
      setResumeSnapshot(null);
    }
    setQuizRunKey((k) => k + 1);
  }, [quizSession, resumeSnapshot]);

  /** New random draw with identical settings / study scope (clears saved-in-progress shape). */
  const handleRegenerateQuizSameRules = useCallback(() => {
    quizAnsweredIdsRef.current = new Set();
    setQuizProgressAnswered(0);
    quizRunQuestionIdsRef.current = null;
    setResumeSnapshot(null);
    setQuizRunKey((k) => k + 1);
  }, []);

  const handleRegenerateFlashcardsSameRules = useCallback(() => {
    if (!flashcardGeneration) return;
    const filtered = sampleFlashcards.filter((c) =>
      flashcardGeneration.topicIds.includes(c.topicId)
    );
    setActiveFlashcards(filtered.slice(0, flashcardGeneration.cardCount));
    setFlashcardResume(null);
    setFlashcardRunKey((k) => k + 1);
  }, [flashcardGeneration]);

  const handleQuizProgressScopeChange = useCallback(
    (payload: { questionIdsKey: string; totalQuestions: number }) => {
      setQuizProgressTotal(payload.totalQuestions);
      if (quizLastQuestionIdsKeyRef.current !== payload.questionIdsKey) {
        quizLastQuestionIdsKeyRef.current = payload.questionIdsKey;
        quizAnsweredIdsRef.current = new Set();
        setQuizProgressAnswered(0);
      }
    },
    []
  );

  const handleQuizQuestionRevealed = useCallback((id: string) => {
    if (quizAnsweredIdsRef.current.has(id)) return;
    quizAnsweredIdsRef.current.add(id);
    setQuizProgressAnswered((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!quizSession) {
      quizLastQuestionIdsKeyRef.current = null;
      quizAnsweredIdsRef.current = new Set();
      setQuizProgressAnswered(0);
      setQuizProgressTotal(0);
      setQuizCompleteModalOpen(false);
    }
  }, [quizSession]);

  useEffect(() => {
    quizCompleteModalRunRef.current = null;
    setQuizRunScore({ correct: 0, incorrect: 0 });
  }, [quizRunKey]);

  useEffect(() => {
    if (!quizStarted || !quizSession) return;
    if (quizProgressTotal <= 0) return;
    if (quizProgressAnswered !== quizProgressTotal) return;
    if (quizCompleteModalRunRef.current === quizRunKey) return;
    quizCompleteModalRunRef.current = quizRunKey;
    setQuizCompleteModalOpen(true);
  }, [
    quizStarted,
    quizSession,
    quizProgressAnswered,
    quizProgressTotal,
    quizRunKey,
  ]);

  const handleQuizCompleteRestartSame = useCallback(() => {
    setQuizCompleteModalOpen(false);
    handleRestartQuizSameQuestions();
  }, [handleRestartQuizSameQuestions]);

  const handleQuizCompleteRegenerate = useCallback(() => {
    setQuizCompleteModalOpen(false);
    handleRegenerateQuizSameRules();
  }, [handleRegenerateQuizSameRules]);

  const handleQuizCompleteBackToBrowse = useCallback(() => {
    setQuizCompleteModalOpen(false);
    setResumeSnapshot(null);
    setQuizStarted(false);
    setQuizSession(null);
    setShowQuizStartForm(false);
  }, []);

  const studyTopics = useMemo(
    () => studyTopicsInOrder(topics, studyTopicIds),
    [topics, studyTopicIds]
  );

  const quizAvailable = useMemo(
    () => countQuizQuestionsForStudy(studyTopicIds),
    [studyTopicIds]
  );
  const flashcardAvailable = useMemo(
    () => countFlashcardsForStudy(studyTopicIds),
    [studyTopicIds]
  );

  const savedQuizStats = useMemo(() => {
    const list = getSavedQuizzes();
    const sessions = list.length;
    const cards = list.reduce((sum, q) => sum + q.questionIds.length, 0);
    return { sessions, cards };
  }, [savedListVersion]);

  const savedFlashcardStats = useMemo(() => {
    const list = getSavedFlashcards();
    const sessions = list.length;
    const cards = list.reduce((sum, q) => sum + q.flashcardIds.length, 0);
    return { sessions, cards };
  }, [savedFlashcardListVersion]);

  const hasStudyScope = studyTopics.length > 0;

  const quizProgressPercent =
    quizProgressTotal > 0
      ? Math.round((quizProgressAnswered / quizProgressTotal) * 100)
      : 0;

  const quizRunComplete =
    quizProgressTotal > 0 &&
    quizProgressAnswered === quizProgressTotal;

  const { sessions: savedQuizSessionCount, cards: savedQuizCardCount } =
    savedQuizStats;
  const { sessions: savedFcSessionCount, cards: savedFcCardCount } =
    savedFlashcardStats;

  const scopeAriaLabel = (() => {
    const studyPart =
      mode === "quiz"
        ? hasStudyScope
          ? `${quizAvailable} question${quizAvailable === 1 ? "" : "s"} for current study`
          : "No study topics"
        : hasStudyScope
          ? `${flashcardAvailable} flashcard${flashcardAvailable === 1 ? "" : "s"} for current study`
          : "No study topics";
    if (mode === "quiz") {
      return `${studyPart}, ${savedQuizSessionCount} saved quiz${savedQuizSessionCount === 1 ? "" : "zes"}, ${savedQuizCardCount} quiz question${savedQuizCardCount === 1 ? "" : "s"}`;
    }
    return `${studyPart}, ${savedFcSessionCount} saved flashcard set${savedFcSessionCount === 1 ? "" : "s"}, ${savedFcCardCount} flashcard${savedFcCardCount === 1 ? "" : "s"}`;
  })();

  const iconCls = "h-3.5 w-3.5 shrink-0 opacity-80";
  const sepCls = "select-none text-muted-foreground/45";

  return (
    <div className="flex h-full flex-col">
      <Dialog
        open={quizCompleteModalOpen}
        onOpenChange={(open) => {
          if (!open) setQuizCompleteModalOpen(false);
        }}
      >
        <DialogContent
          className="min-w-0 max-w-[calc(100%-2rem)] overflow-hidden sm:max-w-md"
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-left">
              <CheckCircle2
                className="h-5 w-5 shrink-0 text-green-600"
                aria-hidden
              />
              Quiz completed
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              All {quizProgressTotal} question
              {quizProgressTotal === 1 ? "" : "s"} checked in this run.
            </DialogDescription>
          </DialogHeader>
          {quizSession && (
            <div className="mt-3 space-y-2" role="group" aria-label="Run summary">
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
                    {quizRunScore.correct}
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
                    {quizRunScore.incorrect}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center justify-center rounded-lg border border-border/70 bg-muted/20 px-2 py-2 text-center">
                  <BrainCircuit
                    className="mb-0.5 h-3 w-3 text-primary"
                    aria-hidden
                  />
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Level
                  </p>
                  <p className="text-[11px] font-semibold leading-tight text-foreground">
                    {difficultyLabel[quizSession.difficulty] ??
                      quizSession.difficulty}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border border-border/70 bg-muted/20 px-2 py-2 text-center">
                  <Layers className="mb-0.5 h-3 w-3 text-primary" aria-hidden />
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Types
                  </p>
                  <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">
                    {formatSelectionSummary(
                      quizSession.questionFormats ?? ["mixed"]
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border border-border/70 bg-muted/20 px-2 py-2 text-center">
                  <BookOpen
                    className="mb-0.5 h-3 w-3 text-primary"
                    aria-hidden
                  />
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Topics
                  </p>
                  <p className="text-[11px] font-semibold tabular-nums text-foreground">
                    {quizSession.selectedTopics.length}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 flex min-w-0 w-full flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full min-w-0 max-w-full shrink whitespace-normal flex-col items-stretch justify-start gap-0.5 py-2.5 text-left"
              onClick={handleQuizCompleteRestartSame}
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
              onClick={handleQuizCompleteRegenerate}
            >
              <span className="block w-full min-w-0 break-words text-left text-sm font-medium text-foreground">
                Re-generate (same rules)
              </span>
              <span className="block w-full min-w-0 break-words text-left text-[11px] text-muted-foreground">
                New draw; same settings and topics.
              </span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-auto w-full min-w-0 max-w-full shrink whitespace-normal flex-col items-stretch justify-start gap-0.5 py-2.5 text-left"
              onClick={handleQuizCompleteBackToBrowse}
            >
              <span className="block w-full min-w-0 break-words text-left text-sm font-medium text-foreground">
                Back to quizzes
              </span>
              <span className="block w-full min-w-0 break-words text-left text-[11px] text-muted-foreground">
                Saved list and new quiz.
              </span>
            </Button>
          </div>
          <DialogFooter className="mt-3 border-t border-border/60 pt-3 sm:justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setQuizCompleteModalOpen(false)}
            >
              Continue reviewing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex shrink-0 flex-col border-b bg-background">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-6 py-2">
          <div
            className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-left text-[11px] leading-snug text-muted-foreground sm:text-xs"
            role="status"
            aria-label={scopeAriaLabel}
          >
            {mode === "quiz" ? (
              hasStudyScope ? (
                <span className="inline-flex items-center gap-1">
                  <ListChecks className={iconCls} aria-hidden />
                  <span>
                    {quizAvailable} question
                    {quizAvailable === 1 ? "" : "s"} for current study
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <BookOpen className={iconCls} aria-hidden />
                  <span>No study topics</span>
                </span>
              )
            ) : hasStudyScope ? (
              <span className="inline-flex items-center gap-1">
                <Layers className={iconCls} aria-hidden />
                <span>
                  {flashcardAvailable} flashcard
                  {flashcardAvailable === 1 ? "" : "s"} for current study
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <BookOpen className={iconCls} aria-hidden />
                <span>No study topics</span>
              </span>
            )}
            <span className={sepCls} aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <Bookmark className={iconCls} aria-hidden />
              <span>
                {mode === "quiz"
                  ? `${savedQuizSessionCount} saved quiz${savedQuizSessionCount === 1 ? "" : "zes"}`
                  : `${savedFcSessionCount} saved set${savedFcSessionCount === 1 ? "" : "s"}`}
              </span>
            </span>
            <span className={sepCls} aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <SquareStack className={iconCls} aria-hidden />
              <span>
                {mode === "quiz"
                  ? `${savedQuizCardCount} card${savedQuizCardCount === 1 ? "" : "s"}`
                  : `${savedFcCardCount} flashcard${savedFcCardCount === 1 ? "" : "s"}`}
              </span>
            </span>
          </div>
          <ModeSelector
            mode={mode}
            onModeChange={(m) => {
              setMode(m);
              setQuizStarted(false);
              setQuizSession(null);
              setShowQuizStartForm(false);
              setResumeSnapshot(null);
              setFlashcardStarted(false);
              setShowFlashcardSettingsForm(false);
              setFlashcardResume(null);
              setActiveFlashcards([]);
            }}
          />
        </div>
        {mode === "quiz" &&
          quizStarted &&
          quizSession &&
          quizProgressTotal > 0 && (
            <div className="sticky top-0 z-20 border-t border-border/60 bg-background/95 px-6 py-2.5 shadow-[0_1px_0_0_hsl(var(--border)/0.4)] backdrop-blur-sm supports-[backdrop-filter]:bg-background/90">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Progress</span>
                <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                  {quizRunComplete && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs font-medium text-primary"
                      onClick={() => setQuizCompleteModalOpen(true)}
                    >
                      Next steps
                    </Button>
                  )}
                  <span className="tabular-nums">
                    {quizProgressAnswered} of {quizProgressTotal} checked
                  </span>
                </div>
              </div>
              <Progress
                value={quizProgressPercent}
                className="mt-2 w-full gap-0"
              />
            </div>
          )}
      </div>

      <div className="flex-1 overflow-hidden">
        {!hasStudyScope ? (
          <StudyScopeEmpty />
        ) : mode === "flashcard" ? (
          !flashcardStarted ? (
            !showFlashcardSettingsForm ? (
              <FlashcardBrowseView
                allTopics={topics}
                savedListVersion={savedFlashcardListVersion}
                onNewSet={() => setShowFlashcardSettingsForm(true)}
                onContinue={(entry) => {
                  const resolved = resolveFlashcardsFromSnapshot(entry);
                  if (resolved.length === 0) {
                    removeSavedFlashcard(entry.id);
                    bumpSavedFlashcards();
                    return;
                  }
                  setFlashcardGeneration({
                    cardCount: entry.flashcardIds.length,
                    topicIds: entry.topicIds,
                  });
                  setActiveFlashcards(resolved);
                  setFlashcardResume(entry);
                  setFlashcardStarted(true);
                  setFlashcardRunKey((k) => k + 1);
                }}
              />
            ) : (
              <FlashcardSettingsPanel
                studyTopics={studyTopics}
                onGenerate={(count, topicIds) => {
                  const filtered = sampleFlashcards.filter((c) =>
                    topicIds.includes(c.topicId)
                  );
                  const nextCards = filtered.slice(0, count);
                  setFlashcardGeneration({ cardCount: count, topicIds });
                  setActiveFlashcards(nextCards);
                  setFlashcardResume(null);
                  setFlashcardStarted(true);
                  setShowFlashcardSettingsForm(false);
                  setFlashcardRunKey((k) => k + 1);
                }}
              />
            )
          ) : (
            <FlashcardViewer
              key={flashcardRunKey}
              cards={activeFlashcards}
              resumeSnapshot={flashcardResume}
              sectionTitle={sectionTitle}
              generationRules={flashcardGeneration}
              onBackToBrowse={() => {
                setFlashcardStarted(false);
                setFlashcardResume(null);
                setActiveFlashcards([]);
                setFlashcardGeneration(null);
                setShowFlashcardSettingsForm(false);
              }}
              onRegenerateSameRules={handleRegenerateFlashcardsSameRules}
              onFlashcardSaved={(snapshot) => {
                setFlashcardResume(snapshot);
                setFlashcardGeneration({
                  cardCount: snapshot.flashcardIds.length,
                  topicIds: snapshot.topicIds,
                });
                bumpSavedFlashcards();
              }}
            />
          )
        ) : quizStarted && quizSession ? (
          <QuizView
            key={quizRunKey}
            settings={quizSession}
            sectionTitle={sectionTitle}
            resumeSnapshot={resumeSnapshot}
            onBack={() => {
              setResumeSnapshot(null);
              setQuizStarted(false);
              setQuizSession(null);
              setShowQuizStartForm(false);
            }}
            onRestartQuizSameQuestions={handleRestartQuizSameQuestions}
            onRegenerateQuizSameRules={handleRegenerateQuizSameRules}
            onActiveQuestionIds={handleQuizActiveQuestionIds}
            onProgressScopeChange={handleQuizProgressScopeChange}
            onQuestionRevealed={handleQuizQuestionRevealed}
            onQuizSaved={(snapshot) => {
              setResumeSnapshot(snapshot);
              bumpSavedList();
            }}
            onRunScoreChange={setQuizRunScore}
          />
        ) : !showQuizStartForm ? (
          <QuizBrowseView
            allTopics={topics}
            savedListVersion={savedListVersion}
            onNewQuiz={() => setShowQuizStartForm(true)}
            onContinue={handleContinueSavedQuiz}
          />
        ) : (
          <QuizSettingsPanel
            studyTopics={studyTopics}
            studyTopicIds={studyTopicIds}
            onBackToSavedList={() => setShowQuizStartForm(false)}
            onStart={(s) => {
              quizRunQuestionIdsRef.current = null;
              setResumeSnapshot(null);
              setQuizSession(s);
              setQuizStarted(true);
              setShowQuizStartForm(false);
              setQuizRunKey((k) => k + 1);
            }}
          />
        )}
      </div>
    </div>
  );
}
