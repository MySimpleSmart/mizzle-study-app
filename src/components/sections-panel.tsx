"use client";

import type { Section, Topic } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Plus } from "lucide-react";

interface SectionsPanelProps {
  sections: Section[];
  topics: Topic[];
  onSelectTopic: (topicId: string) => void;
  onGenerateSectionClick: () => void;
  generateDisabled: boolean;
}

export function SectionsPanel({
  sections,
  topics,
  onSelectTopic,
  onGenerateSectionClick,
  generateDisabled,
}: SectionsPanelProps) {
  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={onGenerateSectionClick}
          disabled={generateDisabled}
        >
          <Plus className="h-3.5 w-3.5" />
          Generate Section
        </Button>
        <p className="text-xs leading-snug text-muted-foreground">
          Select topic(s) in Brief, then generate study sections. You can add
          more sections anytime for topics that don&apos;t have one yet.
        </p>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No sections yet
          </p>
          <p className="text-xs text-muted-foreground/60">
            Pick topics above and click Generate Section
          </p>
        </div>
      ) : (
        sections.map((section) => {
          const topic = topicMap[section.topicId];
          return (
            <div
              key={section.id}
              onClick={() => onSelectTopic(section.topicId)}
              className="w-full cursor-default rounded-lg border bg-white p-3 text-left transition-colors hover:cursor-pointer hover:border-primary/30"
            >
              <div className="text-sm font-medium text-foreground">
                {section.title}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {section.generatedAt}
                </span>
                <span>{section.wordCount} words</span>
              </div>
              {topic && (
                <p className="mt-1.5 text-xs text-muted-foreground/70 line-clamp-1">
                  {topic.description}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
