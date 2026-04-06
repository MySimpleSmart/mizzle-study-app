"use client";

import { useMemo } from "react";
import type { Topic } from "@/lib/data";
import { sampleStudyContent } from "@/lib/data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen } from "lucide-react";

interface StudyTabProps {
  topics: Topic[];
  selectedTopics: string[];
}

function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => {
    let result = content;
    result = result.replace(
      /^### (.+)$/gm,
      '<h3 class="mt-5 mb-2 text-base font-semibold text-foreground">$1</h3>'
    );
    result = result.replace(
      /^## (.+)$/gm,
      '<h2 class="mt-6 mb-3 text-lg font-bold text-foreground">$1</h2>'
    );

    result = result.replace(
      /\| (.+) \|/g,
      (match) => `<div class="text-xs text-muted-foreground font-mono">${match}</div>`
    );

    result = result.replace(
      /\\\[(.+?)\\\]/g,
      '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">$1</code>'
    );
    result = result.replace(
      /\\\((.+?)\\\)/g,
      '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">$1</code>'
    );

    result = result.replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-foreground">$1</strong>'
    );

    result = result.replace(/^- (.+)$/gm, (_, text) => {
      return `<li class="flex items-start gap-2 text-sm text-foreground/80 py-0.5"><span class="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary/50"></span><span>${text}</span></li>`;
    });
    result = result.replace(
      /^(\d+)\. (.+)$/gm,
      '<li class="flex items-start gap-2 text-sm text-foreground/80 py-0.5"><span class="text-xs font-medium text-primary/70 mt-0.5 shrink-0">$1.</span><span>$2</span></li>'
    );

    result = result.replace(
      /^(?!<[hld])((?!<).+)$/gm,
      (match) => {
        if (match.trim() === "") return "";
        if (match.startsWith("<")) return match;
        return `<p class="text-sm leading-relaxed text-foreground/80 mb-2">${match}</p>`;
      }
    );

    return result;
  }, [content]);

  return (
    <div
      className="prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function StudyTab({ topics, selectedTopics }: StudyTabProps) {
  const selectedTopicData = topics.filter((t) =>
    selectedTopics.includes(t.id)
  );

  if (selectedTopics.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-foreground">
            Select topics to study
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Choose one or more topics from the sidebar to view AI-generated
            study materials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-8 p-6">
        {selectedTopicData.map((topic) => {
          const content = sampleStudyContent[topic.id];
          if (!content) return null;
          return (
            <article
              key={topic.id}
              className="rounded-xl border bg-white p-6"
            >
              <MarkdownContent content={content} />
            </article>
          );
        })}
      </div>
    </ScrollArea>
  );
}
