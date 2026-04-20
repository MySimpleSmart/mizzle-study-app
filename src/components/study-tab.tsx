"use client";

import { useEffect, useMemo, useState } from "react";
import type { Section, Topic } from "@/lib/data";
import type { SavedQuizSnapshot } from "@/lib/saved-quizzes";
import { SectionMiniQuiz } from "@/components/section-mini-quiz";
import { sampleStudyContent } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  EnhanceWithVisualsDialog,
  type EnhanceVisualMode,
} from "@/components/enhance-with-visuals-dialog";
import { StudyMarkdown } from "@/components/study-markdown";
import { TopicEnhanceDemos } from "@/components/topic-enhance-demos";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Bot,
  CornerDownRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  MessageCircle,
  Plus,
  SendHorizontal,
  Sparkles,
  User,
} from "lucide-react";

interface StudyTabProps {
  topics: Topic[];
  studyTopicIds: string[];
  sections: Section[];
  /** Current workspace section (sidebar selection); powers the section quiz block. */
  activeSection: Section | null;
  onAddStudyTopic: (topicId: string) => void;
  onSaveSectionQuiz: (
    data: Omit<SavedQuizSnapshot, "id"> & { id?: string }
  ) => void;
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

/** Topics with study content not yet in this study; prefer topics that appear in generated sections */
function useAddableTopics(
  topics: Topic[],
  studyTopicIds: string[],
  sections: Section[]
) {
  return useMemo(() => {
    const inSection = new Set(sections.flatMap((s) => s.topicIds));
    const withContent = topics.filter((t) => sampleStudyContent[t.id]);
    const notInStudy = withContent.filter((t) => !studyTopicIds.includes(t.id));
    const fromGenerated = notInStudy.filter((t) => inSection.has(t.id));
    return fromGenerated.length > 0 ? fromGenerated : notInStudy;
  }, [topics, studyTopicIds, sections]);
}

export function StudyTab({
  topics,
  studyTopicIds,
  sections,
  activeSection,
  onAddStudyTopic,
  onSaveSectionQuiz,
}: StudyTabProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [enhanceTopicId, setEnhanceTopicId] = useState<string | null>(null);
  /** Per-topic, which enhance demos are shown under the study body */
  const [topicDemos, setTopicDemos] = useState<
    Record<string, EnhanceVisualMode[]>
  >({});
  /** Per-topic follow-up chat history, persisted while user is in workspace */
  const [topicChats, setTopicChats] = useState<Record<string, ChatMessage[]>>({});
  const [draftQuestion, setDraftQuestion] = useState("");
  const addableTopics = useAddableTopics(topics, studyTopicIds, sections);
  const selectedTopicData = useMemo(() => {
    const map = Object.fromEntries(topics.map((t) => [t.id, t]));
    return studyTopicIds
      .map((id) => map[id])
      .filter((t): t is Topic => Boolean(t));
  }, [topics, studyTopicIds]);

  const topicsWithContent = useMemo(
    () =>
      selectedTopicData.filter((t) => Boolean(sampleStudyContent[t.id])),
    [selectedTopicData]
  );

  const [activeTopicIndex, setActiveTopicIndex] = useState(0);

  useEffect(() => {
    setActiveTopicIndex((i) => {
      if (topicsWithContent.length === 0) return 0;
      return Math.min(i, Math.max(0, topicsWithContent.length - 1));
    });
  }, [topicsWithContent.length, topicsWithContent]);

  if (studyTopicIds.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-foreground">
            Select topics to study
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Use Generate Section under Topics in Brief, or open a section in the
            sidebar to load its topics here.
          </p>
        </div>
      </div>
    );
  }

  if (topicsWithContent.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-foreground">
            No study notes for these topics yet
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Topics are listed, but there is no sample content for them in this
            demo. Try another section or add topics that include material.
          </p>
        </div>
      </div>
    );
  }

  const currentTopic = topicsWithContent[activeTopicIndex]!;
  const topicCount = topicsWithContent.length;
  const canGoPrev = activeTopicIndex > 0;
  const canGoNext = activeTopicIndex < topicCount - 1;
  const currentTopicMessages = topicChats[currentTopic.id] ?? [];
  const isTyping = draftQuestion.trim().length > 0;
  const followUpSuggestions = useMemo(
    () => [
      `What is the most common mistake in ${currentTopic.name}?`,
      `Can you explain ${currentTopic.name} in simpler terms?`,
      `Give me one real-world example for ${currentTopic.name}.`,
      `What should I memorize first for ${currentTopic.name}?`,
      `Quiz me with 3 quick checks on ${currentTopic.name}.`,
    ],
    [currentTopic.name]
  );
  const postChatSuggestions = useMemo(
    () => [
      `Compare ${currentTopic.name} with another related concept.`,
      `Give me one harder practice question on ${currentTopic.name}.`,
      `Summarize ${currentTopic.name} in 3 bullet points.`,
    ],
    [currentTopic.name]
  );

  const sendFollowUp = (prefilledQuestion?: string) => {
    const question = (prefilledQuestion ?? draftQuestion).trim();
    if (!question) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: question,
    };
    const assistantMsg: ChatMessage = {
      id: `a-${Date.now() + 1}`,
      role: "assistant",
      text: `Great follow-up. For "${currentTopic.name}", focus on this next: identify one concrete example from your source, explain why it works, and compare it with one nearby concept. If you want, ask me to quiz you on this now.`,
    };

    setTopicChats((prev) => ({
      ...prev,
      [currentTopic.id]: [...(prev[currentTopic.id] ?? []), userMsg, assistantMsg],
    }));
    setDraftQuestion("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b bg-white px-6 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Layers className="h-3.5 w-3.5 shrink-0" />
              Topics in this study
            </div>
            <div className="mt-2 flex flex-wrap gap-2 border-t border-border/50 pt-3">
              {selectedTopicData.map((topic) => (
                <Badge
                  key={topic.id}
                  variant="secondary"
                  className="font-normal text-foreground"
                >
                  {topic.name}
                </Badge>
              ))}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            disabled={addableTopics.length === 0}
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add topic
          </Button>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Add a topic</DialogTitle>
            <DialogDescription>
              Add study material that already exists for this course. Topics
              from your generated sections are listed first; you can also add
              other topics that have notes.
            </DialogDescription>
          </DialogHeader>
          {addableTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Every topic with material is already in this study.
            </p>
          ) : (
            <ScrollArea className="max-h-72 pr-2">
              <ul className="space-y-1 pb-1">
                {addableTopics.map((topic) => (
                  <li key={topic.id}>
                    <button
                      type="button"
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
                      onClick={() => {
                        onAddStudyTopic(topic.id);
                        setAddOpen(false);
                      }}
                    >
                      {topic.name}
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <EnhanceWithVisualsDialog
        open={enhanceTopicId !== null}
        onOpenChange={(open) => !open && setEnhanceTopicId(null)}
        contextTitle={
          topicsWithContent.find((t) => t.id === enhanceTopicId)?.name ??
          selectedTopicData.find((t) => t.id === enhanceTopicId)?.name ??
          ""
        }
        onSelectOption={(mode) => {
          const id = enhanceTopicId;
          if (!id) return;
          setTopicDemos((prev) => {
            const cur = prev[id] ?? [];
            if (cur.includes(mode)) return prev;
            return { ...prev, [id]: [...cur, mode] };
          });
        }}
      />

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-6">
          <article
            key={currentTopic.id}
            className="rounded-xl border bg-white px-6 pt-4 pb-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-border/60 pb-3">
              <h2 className="min-w-0 text-base font-semibold leading-snug text-foreground">
                <span className="font-medium text-muted-foreground">
                  Topic:
                </span>{" "}
                {currentTopic.name}
              </h2>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10 hover:text-primary"
                title="Charts, images, graphs, or regenerate this topic"
                onClick={() => setEnhanceTopicId(currentTopic.id)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Enhance with Visuals</span>
                <span className="sm:hidden">Enhance</span>
              </button>
            </div>
            <StudyMarkdown content={sampleStudyContent[currentTopic.id]!} />
            <TopicEnhanceDemos
              topicName={currentTopic.name}
              modes={topicDemos[currentTopic.id] ?? []}
              onRemove={(mode) => {
                setTopicDemos((prev) => {
                  const cur = prev[currentTopic.id] ?? [];
                  const next = cur.filter((m) => m !== mode);
                  if (next.length === 0) {
                    const { [currentTopic.id]: _, ...rest } = prev;
                    return rest;
                  }
                  return { ...prev, [currentTopic.id]: next };
                });
              }}
            />
          </article>

          {activeSection && (
            <div className="mt-6">
              <SectionMiniQuiz
                section={activeSection}
                onSaveSectionQuiz={onSaveSectionQuiz}
              />
            </div>
          )}

          <section className="mt-6 rounded-xl border bg-white">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <MessageCircle className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Follow-up chat for this topic
              </h3>
            </div>

            <div className="space-y-3 px-4 py-4">
              {currentTopicMessages.length === 0 && (
                <div
                  className={cn(
                    "space-y-3 overflow-hidden transition-all duration-200 ease-out",
                    isTyping
                      ? "max-h-0 -translate-y-1 opacity-0"
                      : "max-h-[420px] translate-y-0 opacity-100"
                  )}
                >
                  <p className="text-sm text-muted-foreground">
                    Ask a follow-up question about{" "}
                    <span className="font-medium text-foreground">
                      {currentTopic.name}
                    </span>
                    , or use one of these suggestions:
                  </p>
                  <ul className="rounded-lg border border-border/70">
                    {followUpSuggestions.map((suggestion, idx) => (
                      <li key={suggestion}>
                        <button
                          type="button"
                          onClick={() => sendFollowUp(suggestion)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/50",
                            idx !== followUpSuggestions.length - 1 &&
                              "border-b border-border/60"
                          )}
                        >
                          <span className="inline-flex items-start gap-2">
                            <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span>{suggestion}</span>
                          </span>
                          {idx === 0 && (
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              Suggested
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentTopicMessages.length > 0 && (
                <div className="space-y-2">
                  {currentTopicMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex items-start gap-2 rounded-lg border border-border/70 bg-background px-3 py-2"
                    >
                      {msg.role === "assistant" ? (
                        <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {msg.role === "assistant" ? "Tutor" : "You"}
                        </p>
                        <p className="text-sm text-foreground">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative">
                <textarea
                  value={draftQuestion}
                  onChange={(e) => setDraftQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" || e.shiftKey) return;
                    e.preventDefault();
                    sendFollowUp();
                  }}
                  placeholder={`Ask about ${currentTopic.name}...`}
                  rows={2}
                  className="min-h-[64px] w-full rounded-xl border border-input bg-background py-3 pr-14 pl-3 text-sm outline-none ring-offset-background transition-[border,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring/70 focus-visible:ring-1 focus-visible:ring-ring/25"
                />
                <Button
                  type="button"
                  size="icon-sm"
                  className="absolute right-2 bottom-2"
                  onClick={() => sendFollowUp()}
                  disabled={!draftQuestion.trim()}
                  aria-label="Send follow-up message"
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                </Button>
              </div>

              {currentTopicMessages.length > 0 && (
                <div
                  className={cn(
                    "overflow-hidden rounded-lg border border-border/70 transition-all duration-200 ease-out",
                    isTyping
                      ? "max-h-0 -translate-y-1 opacity-0"
                      : "max-h-64 translate-y-0 opacity-100"
                  )}
                >
                  {postChatSuggestions.map((suggestion, idx) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => sendFollowUp(suggestion)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground",
                        idx !== postChatSuggestions.length - 1 &&
                          "border-b border-border/60"
                      )}
                    >
                      <CornerDownRight className="h-3.5 w-3.5 shrink-0" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </ScrollArea>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/80 bg-white px-4 py-3 sm:px-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={!canGoPrev}
          onClick={() => setActiveTopicIndex((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous topic
        </Button>
        <p className="min-w-0 flex-1 text-center text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {currentTopic.name}
          </span>
          <span className="tabular-nums">
            {" "}
            · {activeTopicIndex + 1} of {topicCount}
          </span>
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          disabled={!canGoNext}
          onClick={() =>
            setActiveTopicIndex((i) => Math.min(topicCount - 1, i + 1))
          }
        >
          Next topic
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
