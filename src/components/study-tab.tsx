"use client";

import { useMemo, useState } from "react";
import type { Section, Topic } from "@/lib/data";
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
import { BookOpen, Layers, Plus, Sparkles } from "lucide-react";

interface StudyTabProps {
  topics: Topic[];
  studyTopicIds: string[];
  sections: Section[];
  onAddStudyTopic: (topicId: string) => void;
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
  onAddStudyTopic,
}: StudyTabProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [enhanceTopicId, setEnhanceTopicId] = useState<string | null>(null);
  /** Per-topic, which enhance demos are shown under the study body */
  const [topicDemos, setTopicDemos] = useState<
    Record<string, EnhanceVisualMode[]>
  >({});
  const addableTopics = useAddableTopics(topics, studyTopicIds, sections);
  const selectedTopicData = useMemo(() => {
    const map = Object.fromEntries(topics.map((t) => [t.id, t]));
    return studyTopicIds
      .map((id) => map[id])
      .filter((t): t is Topic => Boolean(t));
  }, [topics, studyTopicIds]);

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
          selectedTopicData.find((t) => t.id === enhanceTopicId)?.name ?? ""
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
        <div className="space-y-8 p-6">
          {selectedTopicData.map((topic) => {
            const content = sampleStudyContent[topic.id];
            if (!content) return null;
            return (
              <article
                key={topic.id}
                className="rounded-xl border bg-white px-6 pt-4 pb-6"
              >
                <div className="mb-4 flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                  <h2 className="min-w-0 text-base font-semibold leading-snug text-foreground">
                    <span className="font-medium text-muted-foreground">
                      Topic:
                    </span>{" "}
                    {topic.name}
                  </h2>
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10 hover:text-primary"
                    title="Charts, images, graphs, or regenerate this topic"
                    onClick={() => setEnhanceTopicId(topic.id)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Enhance with Visuals</span>
                    <span className="sm:hidden">Enhance</span>
                  </button>
                </div>
                <StudyMarkdown content={content} />
                <TopicEnhanceDemos
                  topicName={topic.name}
                  modes={topicDemos[topic.id] ?? []}
                  onRemove={(mode) => {
                    setTopicDemos((prev) => {
                      const cur = prev[topic.id] ?? [];
                      const next = cur.filter((m) => m !== mode);
                      if (next.length === 0) {
                        const { [topic.id]: _, ...rest } = prev;
                        return rest;
                      }
                      return { ...prev, [topic.id]: next };
                    });
                  }}
                />
              </article>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
