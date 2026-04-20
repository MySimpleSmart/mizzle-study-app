"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Section, Topic } from "@/lib/data";
import type { SavedQuizSnapshot } from "@/lib/saved-quizzes";
import { SectionMiniQuiz } from "@/components/section-mini-quiz";
import { sampleStudyContent } from "@/lib/data";
import { appendStudyNote } from "@/lib/notes-storage";
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
  Highlighter,
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

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function splitHighlightExcerpts(input: string): string[] {
  const compact = input.replace(/\s+/g, " ").trim();
  if (!compact) return [];
  const parts =
    compact.match(/[^.!?]+(?:[.!?]+|$)/g)?.map((p) => p.trim()) ?? [];
  const cleaned = parts.filter((p) => p.length >= 3);
  return cleaned.length > 0 ? cleaned : [compact];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clearExistingHighlights(container: HTMLElement) {
  const marks = container.querySelectorAll("mark[data-study-highlight='1']");
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    const textNode = document.createTextNode(mark.textContent ?? "");
    parent.replaceChild(textNode, mark);
    parent.normalize();
  });
}

function wrapTextSliceWithMark(textNode: Text, start: number, end: number) {
  if (start >= end) return;
  let target = textNode;
  if (start > 0) {
    target = target.splitText(start);
  }
  const length = end - start;
  if (length < (target.nodeValue ?? "").length) {
    target.splitText(length);
  }
  const mark = document.createElement("mark");
  mark.dataset.studyHighlight = "1";
  mark.className =
    "rounded-[2px] bg-yellow-200/80 px-[1px] text-inherit dark:bg-yellow-300/40";
  mark.textContent = target.nodeValue ?? "";
  target.parentNode?.replaceChild(mark, target);
}

function applyHighlightsToArticle(container: HTMLElement, excerpts: string[]) {
  clearExistingHighlights(container);
  if (excerpts.length === 0) return;

  for (const raw of excerpts) {
    const needle = raw.trim();
    if (!needle) continue;

    // Recompute text-node map each pass so offsets remain correct after mutations.
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const slices: Array<{ node: Text; start: number; end: number }> = [];
    let fullText = "";
    let node = walker.nextNode();
    while (node) {
      const textNode = node as Text;
      const value = textNode.nodeValue ?? "";
      if (value.length > 0) {
        const start = fullText.length;
        fullText += value;
        slices.push({ node: textNode, start, end: fullText.length });
      }
      node = walker.nextNode();
    }
    if (slices.length === 0 || fullText.length === 0) continue;

    const tokenPattern = needle
      .split(/\s+/)
      .map((token) => escapeRegExp(token))
      .join("\\s+");
    if (!tokenPattern) continue;
    const match = new RegExp(tokenPattern, "i").exec(fullText);
    if (!match || match.index === undefined) continue;

    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;

    for (let i = slices.length - 1; i >= 0; i -= 1) {
      const slice = slices[i]!;
      const overlapStart = Math.max(matchStart, slice.start);
      const overlapEnd = Math.min(matchEnd, slice.end);
      if (overlapStart >= overlapEnd) continue;
      wrapTextSliceWithMark(
        slice.node,
        overlapStart - slice.start,
        overlapEnd - slice.start
      );
    }
  }
}

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
  const [selectedExcerpt, setSelectedExcerpt] = useState("");
  const [selectionToolbarPos, setSelectionToolbarPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [topicHighlights, setTopicHighlights] = useState<Record<string, string[]>>(
    {}
  );
  const [selectionActionMessage, setSelectionActionMessage] = useState("");
  const studyArticleRef = useRef<HTMLElement | null>(null);
  const studyContentRef = useRef<HTMLDivElement | null>(null);
  const chatSectionRef = useRef<HTMLElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
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
  const currentTopicHighlights = topicHighlights[currentTopic.id] ?? [];
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

  const captureSelectedExcerpt = () => {
    if (typeof window === "undefined") return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setSelectedExcerpt("");
      setSelectionToolbarPos(null);
      return;
    }
    const text = selection.toString().replace(/\s+/g, " ").trim();
    const article = studyArticleRef.current;
    if (!article || text.length < 3) {
      setSelectedExcerpt("");
      setSelectionToolbarPos(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const withinArticle = article.contains(range.commonAncestorContainer);
    if (!withinArticle) {
      setSelectedExcerpt("");
      setSelectionToolbarPos(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      setSelectedExcerpt("");
      setSelectionToolbarPos(null);
      return;
    }
    setSelectedExcerpt(text);
    setSelectionToolbarPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const clearSelectionUi = () => {
    setSelectedExcerpt("");
    setSelectionToolbarPos(null);
    if (typeof window !== "undefined") window.getSelection()?.removeAllRanges();
  };

  const handleHighlightSelection = () => {
    const excerpt = selectedExcerpt.trim();
    if (!excerpt) return;
    const chunks = splitHighlightExcerpts(excerpt);
    setTopicHighlights((prev) => {
      const current = prev[currentTopic.id] ?? [];
      const next = [...current];
      for (const chunk of chunks) {
        if (!next.includes(chunk)) next.push(chunk);
      }
      if (next.length === current.length) return prev;
      return { ...prev, [currentTopic.id]: next };
    });
    setSelectionActionMessage("Highlighted.");
    clearSelectionUi();
  };

  const handleAskSelectionInChat = () => {
    const excerpt = selectedExcerpt.trim();
    if (!excerpt) return;
    sendFollowUp(
      `Can you clarify this excerpt from ${currentTopic.name}?\n\n"${excerpt}"`
    );
    setSelectionActionMessage("Sent to section chat.");
    clearSelectionUi();
    chatSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.setTimeout(() => {
      chatInputRef.current?.focus();
    }, 260);
  };

  const handleAddSelectionToNote = () => {
    const excerpt = selectedExcerpt.trim();
    if (!excerpt) return;
    appendStudyNote({
      id: `note-${Date.now()}`,
      content: `<p><strong>From ${escapeHtml(currentTopic.name)}:</strong></p><blockquote><p>${escapeHtml(excerpt)}</p></blockquote>`,
      createdAt: new Date().toISOString(),
      topicIds: [currentTopic.id],
    });
    setSelectionActionMessage("Added to notes.");
    clearSelectionUi();
  };

  useEffect(() => {
    if (!selectionActionMessage) return;
    const id = window.setTimeout(() => setSelectionActionMessage(""), 1800);
    return () => window.clearTimeout(id);
  }, [selectionActionMessage]);

  useEffect(() => {
    const content = studyContentRef.current;
    if (!content) return;
    applyHighlightsToArticle(content, currentTopicHighlights);
  }, [currentTopic.id, currentTopicHighlights]);

  useEffect(() => {
    const hideToolbar = () => {
      setSelectedExcerpt("");
      setSelectionToolbarPos(null);
    };
    window.addEventListener("scroll", hideToolbar, true);
    window.addEventListener("resize", hideToolbar);
    return () => {
      window.removeEventListener("scroll", hideToolbar, true);
      window.removeEventListener("resize", hideToolbar);
    };
  }, []);

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
            ref={studyArticleRef}
            onMouseUp={captureSelectedExcerpt}
            onKeyUp={captureSelectedExcerpt}
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
            <div ref={studyContentRef}>
              <StudyMarkdown content={sampleStudyContent[currentTopic.id]!} />
            </div>
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

            {selectionActionMessage && (
              <p className="mt-3 text-xs text-muted-foreground">
                {selectionActionMessage}
              </p>
            )}

            {currentTopicHighlights.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-amber-800">
                  <Highlighter className="h-3.5 w-3.5" />
                  Highlighted
                </div>
                <ul className="space-y-1.5">
                  {currentTopicHighlights.map((excerpt) => (
                    <li
                      key={excerpt}
                      className="px-0 py-0.5 text-sm text-foreground"
                    >
                      {excerpt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          {activeSection && (
            <div className="mt-6">
              <SectionMiniQuiz
                section={activeSection}
                onSaveSectionQuiz={onSaveSectionQuiz}
              />
            </div>
          )}

          <section ref={chatSectionRef} className="mt-6 rounded-xl border bg-white">
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
                    "space-y-3 transition-opacity duration-200 ease-out",
                    isTyping
                      ? "pointer-events-none opacity-0"
                      : "opacity-100"
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
                  ref={chatInputRef}
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
                    "rounded-lg border border-border/70 transition-opacity duration-200 ease-out",
                    isTyping
                      ? "pointer-events-none opacity-0"
                      : "opacity-100"
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

      {selectedExcerpt && selectionToolbarPos && (
        <div
          className="fixed z-30 -translate-x-1/2 -translate-y-full"
          style={{ left: selectionToolbarPos.x, top: selectionToolbarPos.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-1 rounded-xl border bg-white p-1.5 shadow-lg">
            <button
              type="button"
              onClick={handleHighlightSelection}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted"
            >
              <Highlighter className="h-3.5 w-3.5" />
              Highlight
            </button>
            <button
              type="button"
              onClick={handleAskSelectionInChat}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Ask
            </button>
            <button
              type="button"
              onClick={handleAddSelectionToNote}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" />
              Add note
            </button>
          </div>
        </div>
      )}

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
