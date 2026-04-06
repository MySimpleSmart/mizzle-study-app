"use client";

import { useEffect, useState } from "react";
import type { AiBriefSnapshot, Topic } from "@/lib/data";
import { TopicChip } from "@/components/topic-chip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Clock,
  FileText,
  Layers,
  Lightbulb,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const REANALYSE_REASONS = [
  {
    id: "outdated",
    label: "The overview or insights feel outdated or inaccurate",
  },
  {
    id: "emphasis",
    label: "I want a different emphasis (e.g. more practical, less theory)",
  },
  {
    id: "scope",
    label: "My sources, notes, or study scope changed",
  },
  {
    id: "review",
    label: "I want a fresh angle for review or exam prep",
  },
  {
    id: "other",
    label: "Other — I'll add a short note",
  },
] as const;

export type ReanalyseContext = {
  reasonId: string;
  detail?: string;
};

interface BriefPanelProps {
  brief: AiBriefSnapshot;
  topics: Topic[];
  selectedTopics: string[];
  onToggleTopic: (topicId: string) => void;
  onReanalyse: (context: ReanalyseContext) => void;
  reanalysePending?: boolean;
  onGenerateSectionClick: () => void;
  generateDisabled: boolean;
}

export function BriefPanel({
  brief,
  topics,
  selectedTopics,
  onToggleTopic,
  onReanalyse,
  reanalysePending = false,
  onGenerateSectionClick,
  generateDisabled,
}: BriefPanelProps) {
  const [reanalyseDialogOpen, setReanalyseDialogOpen] = useState(false);
  const [reasonId, setReasonId] = useState<string>("");
  const [otherDetail, setOtherDetail] = useState("");

  useEffect(() => {
    if (!reanalyseDialogOpen) {
      setReasonId("");
      setOtherDetail("");
    }
  }, [reanalyseDialogOpen]);

  const canConfirm =
    reasonId !== "" &&
    (reasonId !== "other" || otherDetail.trim().length > 0);

  const handleConfirmReanalyse = () => {
    if (!canConfirm) return;
    onReanalyse({
      reasonId,
      ...(reasonId === "other" ? { detail: otherDetail.trim() } : {}),
    });
    setReanalyseDialogOpen(false);
  };

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {brief.sourceCount} sources
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {brief.topicCount} topics
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {brief.estimatedStudyTime}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full shrink-0 gap-1.5 text-xs"
            disabled={reanalysePending}
            onClick={() => setReanalyseDialogOpen(true)}
            title="Regenerate the AI brief (demo)"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                reanalysePending && "animate-spin"
              )}
              aria-hidden
            />
            Re-analyse
          </Button>
          <div
            className={cn(
              "space-y-2 transition-opacity",
              reanalysePending && "pointer-events-none opacity-50"
            )}
          >
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              AI Overview
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">
              {brief.overview}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "space-y-2 border-t border-border/50 pt-5 transition-opacity",
            reanalysePending && "pointer-events-none opacity-50"
          )}
        >
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5" />
            Key Insights
          </div>
          <ul className="space-y-1.5">
            {brief.keyInsights.map((insight, i) => (
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

        <div
          className={cn(
            "space-y-2 border-t border-border/50 pt-5 transition-opacity",
            reanalysePending && "opacity-50"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Layers className="h-3.5 w-3.5 shrink-0" />
              Topics
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full gap-1.5 text-xs"
            onClick={onGenerateSectionClick}
            disabled={generateDisabled}
            title={
              generateDisabled
                ? "Select at least one topic with study content, or avoid duplicating an existing section"
                : "Create a study section from selected topics"
            }
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Generate Section
          </Button>
        </div>
      </div>

      <Dialog open={reanalyseDialogOpen} onOpenChange={setReanalyseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Re-generate this brief?</DialogTitle>
            <DialogDescription>
              Why should this concept be generated again? Choose the closest
              match — it helps tune the next pass (demo only).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <RadioGroup
              value={reasonId}
              onValueChange={(v) => v && setReasonId(v)}
              className="gap-2.5"
            >
              {REANALYSE_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-sm transition-colors",
                    reasonId === r.id
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/70 hover:border-primary/30"
                  )}
                >
                  <RadioGroupItem value={r.id} className="mt-0.5 shrink-0" />
                  <span className="leading-snug text-foreground">{r.label}</span>
                </label>
              ))}
            </RadioGroup>
            {reasonId === "other" && (
              <Textarea
                placeholder="Briefly describe what you need…"
                value={otherDetail}
                onChange={(e) => setOtherDetail(e.target.value)}
                className="min-h-20 text-sm"
                rows={3}
              />
            )}
          </div>
          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReanalyseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canConfirm}
              onClick={handleConfirmReanalyse}
            >
              Re-generate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
