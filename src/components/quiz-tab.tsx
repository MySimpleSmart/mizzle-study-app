"use client";

import { useState } from "react";
import type { Flashcard, QuizQuestion, QuizSettings, Topic } from "@/lib/data";
import { sampleFlashcards, sampleQuizQuestions } from "@/lib/data";
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
import {
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  RotateCcw,
  Settings2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type QuizMode = "quiz" | "flashcard";

interface QuizTabProps {
  topics: Topic[];
  selectedTopics: string[];
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
  return (
    <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
      <button
        onClick={() => onModeChange("quiz")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
          mode === "quiz"
            ? "bg-white text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <BrainCircuit className="h-4 w-4" />
        Quiz
      </button>
      <button
        onClick={() => onModeChange("flashcard")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
          mode === "flashcard"
            ? "bg-white text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Layers className="h-4 w-4" />
        Flashcard
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flashcard Settings
// ---------------------------------------------------------------------------

function FlashcardSettingsPanel({
  topics,
  selectedTopics,
  onGenerate,
}: {
  topics: Topic[];
  selectedTopics: string[];
  onGenerate: (cardCount: number, topicIds: string[]) => void;
}) {
  const [cardCount, setCardCount] = useState("8");
  const [chosenTopics, setChosenTopics] = useState<string[]>(selectedTopics);

  const toggleTopic = (id: string) => {
    setChosenTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-white p-6">
        <div className="text-center">
          <Layers className="mx-auto mb-2 h-10 w-10 text-primary/70" />
          <h3 className="text-lg font-semibold">Generate Flashcards</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose topics and number of cards to study
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Number of Cards</label>
            <Select value={cardCount} onValueChange={(v) => v && setCardCount(v)}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Topics</label>
            <div className="flex flex-wrap gap-1.5">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                    chosenTopics.includes(topic.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
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
              <p className="text-xs text-muted-foreground">
                Select at least one topic
              </p>
            )}
          </div>
        </div>

        <Button
          className="w-full"
          disabled={chosenTopics.length === 0}
          onClick={() => onGenerate(parseInt(cardCount), chosenTopics)}
        >
          <ChevronRight className="mr-1.5 h-4 w-4" />
          Generate Flashcards
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flashcard Viewer
// ---------------------------------------------------------------------------

function FlashcardViewer({
  cards,
  onBack,
}: {
  cards: Flashcard[];
  onBack: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[currentIndex];

  const goNext = () => {
    setFlipped(false);
    setCurrentIndex((prev) => Math.min(prev + 1, cards.length - 1));
  };

  const goPrev = () => {
    setFlipped(false);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const restart = () => {
    setFlipped(false);
    setCurrentIndex(0);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full max-w-lg items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {cards.length}
          </p>
          <div className="mt-1.5 flex gap-1">
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
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onBack}
        >
          <Settings2 className="h-3.5 w-3.5" />
          New Set
        </Button>
      </div>

      <button
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
            <p className="text-center text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
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
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={restart}
          className="gap-1"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={goNext}
          disabled={currentIndex === cards.length - 1}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flashcard View (settings → viewer)
// ---------------------------------------------------------------------------

function FlashcardView({
  topics,
  selectedTopics,
}: {
  topics: Topic[];
  selectedTopics: string[];
}) {
  const [generated, setGenerated] = useState(false);
  const [activeCards, setActiveCards] = useState<Flashcard[]>([]);

  const handleGenerate = (cardCount: number, topicIds: string[]) => {
    const filtered = sampleFlashcards.filter((c) =>
      topicIds.includes(c.topicId)
    );
    const cards = filtered.length > 0 ? filtered.slice(0, cardCount) : sampleFlashcards.slice(0, cardCount);
    setActiveCards(cards);
    setGenerated(true);
  };

  if (!generated) {
    return (
      <FlashcardSettingsPanel
        topics={topics}
        selectedTopics={selectedTopics}
        onGenerate={handleGenerate}
      />
    );
  }

  return (
    <FlashcardViewer
      cards={activeCards}
      onBack={() => setGenerated(false)}
    />
  );
}

// ---------------------------------------------------------------------------
// Quiz Settings
// ---------------------------------------------------------------------------

function QuizSettingsPanel({
  onStart,
}: {
  onStart: (settings: QuizSettings) => void;
}) {
  const [questionCount, setQuestionCount] = useState("5");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionType, setQuestionType] = useState("mixed");

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-white p-6">
        <div className="text-center">
          <BrainCircuit className="mx-auto mb-2 h-10 w-10 text-primary/70" />
          <h3 className="text-lg font-semibold">Generate Quiz</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your quiz settings and test your knowledge
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Number of Questions</label>
            <Select value={questionCount} onValueChange={(v) => v && setQuestionCount(v)}>
              <SelectTrigger>
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
            <label className="text-sm font-medium">Difficulty</label>
            <Select value={difficulty} onValueChange={(v) => v && setDifficulty(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Question Type</label>
            <Select value={questionType} onValueChange={(v) => v && setQuestionType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="single-choice">Single Choice</SelectItem>
                <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                <SelectItem value="fill-blank">Fill in the Blank</SelectItem>
                <SelectItem value="drag-fill">Drag and Fill</SelectItem>
                <SelectItem value="short-answer">Short Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={() =>
            onStart({
              questionCount: parseInt(questionCount),
              difficulty: difficulty as QuizSettings["difficulty"],
              questionType: questionType as QuizSettings["questionType"],
              selectedTopics: [],
            })
          }
        >
          <ChevronRight className="mr-1.5 h-4 w-4" />
          Start Quiz
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Question Card
// ---------------------------------------------------------------------------

function QuestionCard({
  question,
  index,
}: {
  question: QuizQuestion;
  index: number;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>("");
  const [showResult, setShowResult] = useState(false);

  const isCorrect =
    question.type === "multiple-choice"
      ? Array.isArray(selectedAnswer) &&
        Array.isArray(question.correctAnswer) &&
        selectedAnswer.length === question.correctAnswer.length &&
        selectedAnswer.every((a) => question.correctAnswer.includes(a))
      : selectedAnswer === question.correctAnswer;

  const typeLabels: Record<string, string> = {
    "single-choice": "Single Choice",
    "multiple-choice": "Multiple Choice",
    "fill-blank": "Fill in the Blank",
    "short-answer": "Short Answer",
  };

  return (
    <div className="rounded-xl border bg-white p-5">
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

      <p className="mb-4 text-sm font-medium">{question.question}</p>

      {question.type === "single-choice" && question.options && (
        <RadioGroup
          value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
          onValueChange={(val) => setSelectedAnswer(val)}
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
              <RadioGroupItem value={option} disabled={showResult} />
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
          disabled={showResult}
          className={cn(
            showResult &&
              (isCorrect
                ? "border-green-300 bg-green-50"
                : "border-red-300 bg-red-50")
          )}
        />
      )}

      {question.type === "short-answer" && (
        <textarea
          placeholder="Write your answer..."
          value={typeof selectedAnswer === "string" ? selectedAnswer : ""}
          onChange={(e) => setSelectedAnswer(e.target.value)}
          disabled={showResult}
          rows={3}
          className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      )}

      <div className="mt-4 flex items-center gap-2">
        {!showResult ? (
          <Button size="sm" onClick={() => setShowResult(true)}>
            Check Answer
          </Button>
        ) : (
          <div className="w-full rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Explanation
            </p>
            <p className="mt-0.5 text-sm text-foreground/80">
              {question.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quiz View (questions list)
// ---------------------------------------------------------------------------

function QuizView({
  onBack,
}: {
  onBack: () => void;
}) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Practice Quiz</h3>
            <p className="text-sm text-muted-foreground">
              {sampleQuizQuestions.length} questions · Medium difficulty
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onBack}
          >
            <Settings2 className="h-3.5 w-3.5" />
            New Quiz
          </Button>
        </div>

        {sampleQuizQuestions.map((q, i) => (
          <QuestionCard key={q.id} question={q} index={i} />
        ))}
      </div>
    </ScrollArea>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export function QuizTab({ topics, selectedTopics }: QuizTabProps) {
  const [mode, setMode] = useState<QuizMode>("quiz");
  const [quizStarted, setQuizStarted] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b px-6 py-3">
        <ModeSelector mode={mode} onModeChange={(m) => { setMode(m); setQuizStarted(false); }} />
        <p className="text-xs text-muted-foreground">
          {mode === "quiz"
            ? `${sampleQuizQuestions.length} questions available`
            : `${sampleFlashcards.length} flashcards`}
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        {mode === "flashcard" ? (
          <FlashcardView topics={topics} selectedTopics={selectedTopics} />
        ) : quizStarted ? (
          <QuizView onBack={() => setQuizStarted(false)} />
        ) : (
          <QuizSettingsPanel onStart={() => setQuizStarted(true)} />
        )}
      </div>
    </div>
  );
}
