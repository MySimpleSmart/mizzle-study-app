"use client";

import type { Section, Topic } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Plus } from "lucide-react";

interface SectionsPanelProps {
  sections: Section[];
  topics: Topic[];
  onSelectTopicsForSection: (topicIds: string[]) => void;
  onGenerateSectionClick: () => void;
  generateDisabled: boolean;
}

export function SectionsPanel({
  sections,
  topics,
  onSelectTopicsForSection,
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
          One combined section per generate. After you generate, Brief clears so
          you can select topics for the next section.
        </p>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No sections yet
          </p>
          <p className="text-xs text-muted-foreground/60">
            Pick topics in Brief, then Generate Section
          </p>
        </div>
      ) : (
        sections.map((section) => {
          const names = section.topicIds
            .map((id) => topicMap[id]?.name)
            .filter(Boolean);
          return (
            <div
              key={section.id}
              onClick={() => onSelectTopicsForSection(section.topicIds)}
              className="w-full cursor-default rounded-lg border bg-white p-3 text-left transition-colors hover:cursor-pointer hover:border-primary/30"
            >
              <div className="text-sm font-medium text-foreground">
                {section.title}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {section.generatedAt}
                </span>
                <span>{section.wordCount.toLocaleString()} words</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">
                  {section.topicIds.length} topic
                  {section.topicIds.length !== 1 ? "s" : ""}
                </span>
              </div>
              {names.length > 0 && (
                <p className="mt-1.5 text-xs text-muted-foreground/80 line-clamp-2">
                  {names.join(" · ")}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
