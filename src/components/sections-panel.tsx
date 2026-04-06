"use client";

import { useState } from "react";
import type { Section } from "@/lib/data";
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
  CheckCircle2,
  ChevronDown,
  Clock,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionsPanelProps {
  sections: Section[];
  onOpenSectionInWorkspace: (topicIds: string[]) => void;
  onGenerateSectionClick: () => void;
  generateDisabled: boolean;
  onArchiveSection: (sectionId: string) => void;
  onRestoreSection: (sectionId: string) => void;
  onRemoveSection: (sectionId: string) => void;
}

export function SectionsPanel({
  sections,
  onOpenSectionInWorkspace,
  onGenerateSectionClick,
  generateDisabled,
  onArchiveSection,
  onRestoreSection,
  onRemoveSection,
}: SectionsPanelProps) {
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
          return (
            <div
              key={section.id}
              className="group flex flex-col rounded-lg border bg-white transition-colors hover:border-primary/30"
            >
              <div
                tabIndex={0}
                aria-label={`Open study section: ${section.title}`}
                className="flex cursor-pointer flex-col gap-3 px-4 pt-4 pb-3 text-left outline-none transition-colors hover:bg-muted/25 focus-visible:ring-2 focus-visible:ring-ring/50"
                onClick={() => onOpenSectionInWorkspace(section.topicIds)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenSectionInWorkspace(section.topicIds);
                  }
                }}
              >
                <div className="flex w-full min-w-0 items-start justify-between gap-3">
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {section.topicIds.length} topic
                    {section.topicIds.length !== 1 ? "s" : ""}
                  </span>
                  <div
                    className="flex shrink-0 gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      aria-label="Archive section"
                      title="Archive"
                      className="rounded-md p-1.5 text-muted-foreground opacity-70 transition-colors hover:bg-muted hover:text-foreground group-hover:opacity-100"
                      onClick={() => setPendingArchive(section)}
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete section permanently"
                      title="Delete permanently"
                      className="rounded-md p-1.5 text-muted-foreground opacity-70 transition-colors hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      onClick={() => setPendingPermanentDelete(section)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="w-full min-w-0 text-sm font-medium leading-snug text-foreground">
                  {section.title}
                </p>
                {section.excerpt.trim() !== "" && (
                  <p className="w-full min-w-0 text-xs leading-relaxed text-muted-foreground/80 line-clamp-2">
                    {section.excerpt}
                  </p>
                )}
              </div>
              <div className="flex w-full items-center justify-between gap-3 border-t border-border/50 px-4 pb-4 pt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  {section.generatedAt}
                </span>
                <span className="inline-flex items-center gap-1.5 tabular-nums text-foreground/75">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  {section.reviewEditTotal}
                </span>
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
          <DialogFooter className="gap-3">
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
          <DialogFooter className="gap-3">
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
