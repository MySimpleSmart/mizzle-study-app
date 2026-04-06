"use client";

import { aiBrief, type Topic } from "@/lib/data";
import { TopicChip } from "@/components/topic-chip";
import { BookOpen, Clock, FileText, Lightbulb, Sparkles } from "lucide-react";

interface BriefPanelProps {
  topics: Topic[];
  selectedTopics: string[];
  onToggleTopic: (topicId: string) => void;
}

export function BriefPanel({
  topics,
  selectedTopics,
  onToggleTopic,
}: BriefPanelProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          AI Overview
        </div>
        <p className="text-sm leading-relaxed text-foreground/80">
          {aiBrief.overview}
        </p>
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {aiBrief.sourceCount} sources
        </span>
        <span className="inline-flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          {aiBrief.topicCount} topics
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {aiBrief.estimatedStudyTime}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5" />
          Key Insights
        </div>
        <ul className="space-y-1.5">
          {aiBrief.keyInsights.map((insight, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-foreground/70"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
              {insight}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Topics
          </span>
          <span className="text-xs text-muted-foreground">
            {selectedTopics.length} selected
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {topics.map((topic) => (
            <TopicChip
              key={topic.id}
              name={topic.name}
              selected={selectedTopics.includes(topic.id)}
              onToggle={() => onToggleTopic(topic.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
