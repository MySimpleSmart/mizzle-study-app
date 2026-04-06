"use client";

import { useState } from "react";
import type { Section, Topic } from "@/lib/data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Archive,
  BookOpen,
  ChevronDown,
  Clock,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionsPanelProps {
  sections: Section[];
  topics: Topic[];
  onSelectTopicsForSection: (topicIds: string[]) => void;
  onGenerateSectionClick: () => void;
  generateDisabled: boolean;
  onArchiveSection: (sectionId: string) => void;
  onRestoreSection: (sectionId: string) => void;
  onRemoveSection: (sectionId: string) => void;
}

export function SectionsPanel({
  sections,
  topics,
  onSelectTopicsForSection,
  onGenerateSectionClick,
  generateDisabled,
  onArchiveSection,
  onRestoreSection,
  onRemoveSection,
}: SectionsPanelProps) {
  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t]));
  const activeSections = sections.filter((s) => !s.archived);
  const archivedSections = sections.filter((s) => s.archived);

  const [archivedOpen, setArchivedOpen] = useState(false);
  const [pendingArchive, setPendingArchive] = useState<Section | null>(null);
  const [pendingPermanentDelete, setPendingPermanentDelete] =
    useState<Section | null>(null);

  const confirmArchive = () => {
    if (pendingArchive) {
      onArchiveSection(pendingArchive.id);
      setPendingArchive(null);
    }
  };

  const confirmPermanentDelete = () => {
    if (pendingPermanentDelete) {
      onRemoveSection(pendingPermanentDelete.id);
      setPendingPermanentDelete(null);
    }
  };

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

      {activeSections.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No active sections
          </p>
          <p className="text-xs text-muted-foreground/60">
            Pick topics in Brief, then Generate Section
          </p>
        </div>
      ) : (
        activeSections.map((section) => {
          const names = section.topicIds
            .map((id) => topicMap[id]?.name)
            .filter(Boolean);
          return (
            <div
              key={section.id}
              className="group flex gap-2 rounded-lg border bg-white p-3 transition-colors hover:border-primary/30"
            >
              <button
                type="button"
                onClick={() => onSelectTopicsForSection(section.topicIds)}
                className="min-w-0 flex-1 cursor-default text-left transition-colors hover:cursor-pointer"
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
              </button>
              <div className="flex shrink-0 items-start gap-0.5">
                <button
                  type="button"
                  aria-label="Archive section"
                  title="Archive"
                  className="rounded-md p-1.5 text-muted-foreground opacity-70 transition-colors hover:bg-muted hover:text-foreground group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingArchive(section);
                  }}
                >
                  <Archive className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Delete section permanently"
                  title="Delete permanently"
                  className="rounded-md p-1.5 text-muted-foreground opacity-70 transition-colors hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingPermanentDelete(section);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })
      )}

      {archivedSections.length > 0 && (
        <div className="rounded-lg border border-dashed bg-muted/20">
          <button
            type="button"
            onClick={() => setArchivedOpen(!archivedOpen)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <Archive className="h-3.5 w-3.5" />
              Archived ({archivedSections.length})
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                archivedOpen && "-rotate-180"
              )}
            />
          </button>
          {archivedOpen && (
            <div className="space-y-2 border-t px-2 pb-2 pt-1">
              {archivedSections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center gap-2 rounded-md border bg-white/80 px-2 py-2 text-xs"
                >
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {section.title}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 gap-1 px-2"
                    onClick={() => onRestoreSection(section.id)}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </Button>
                  <button
                    type="button"
                    aria-label="Delete archived section permanently"
                    title="Delete permanently"
                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setPendingPermanentDelete(section)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog
        open={pendingArchive !== null}
        onOpenChange={(open) => !open && setPendingArchive(null)}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Archive this section?</DialogTitle>
            <DialogDescription>
              {pendingArchive && (
                <>
                  <span className="font-medium text-foreground">
                    {pendingArchive.title}
                  </span>{" "}
                  will be moved to the archive and hidden from the main list. You
                  can restore it from the archived section anytime.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingArchive(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="gap-1.5"
              onClick={confirmArchive}
            >
              <Archive className="h-4 w-4" />
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingPermanentDelete !== null}
        onOpenChange={(open) => !open && setPendingPermanentDelete(null)}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete this section permanently?</DialogTitle>
            <DialogDescription>
              {pendingPermanentDelete && (
                <>
                  <span className="font-medium text-foreground">
                    {pendingPermanentDelete.title}
                  </span>{" "}
                  will be removed forever. This cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingPermanentDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmPermanentDelete}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
