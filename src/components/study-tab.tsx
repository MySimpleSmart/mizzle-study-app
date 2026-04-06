"use client";

import { useMemo } from "react";
import type { Topic } from "@/lib/data";
import { sampleStudyContent } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Layers } from "lucide-react";

interface StudyTabProps {
  topics: Topic[];
  studyTopicIds: string[];
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

export function StudyTab({ topics, studyTopicIds }: StudyTabProps) {
  const selectedTopicData = topics.filter((t) =>
    studyTopicIds.includes(t.id)
  );

  if (studyTopicIds.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-foreground">
            Select topics to study
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Generate a section from Brief, or click a section in the sidebar to
            load its topics here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b bg-white px-6 py-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          Topics in this study
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
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
      <ScrollArea className="min-h-0 flex-1">
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
    </div>
  );
}
