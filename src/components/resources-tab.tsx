"use client";

import { useMemo, useState } from "react";
import type { Source } from "@/lib/data";
import { sampleSources } from "@/lib/data";
import { SourceBadge } from "@/components/source-badge";
import { AddSourceDialog } from "@/components/add-source-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  FileStack,
  FolderOpen,
  Link2,
  NotebookPen,
  Trash2,
} from "lucide-react";

const statIconCls = "h-3.5 w-3.5 shrink-0 opacity-80";
const statSepCls =
  "inline-flex h-4 shrink-0 select-none items-center text-muted-foreground/45";

export function ResourcesTab() {
  const [sources, setSources] = useState(sampleSources);
  const [pendingRemove, setPendingRemove] = useState<Source | null>(null);
  const sourceStats = useMemo(() => {
    let linkSources = 0;
    let fileSources = 0;
    let noteSources = 0;

    for (const source of sources) {
      if (source.type === "youtube" || source.type === "website") {
        linkSources += 1;
        continue;
      }
      if (source.type === "notes") {
        noteSources += 1;
        continue;
      }
      fileSources += 1;
    }

    return {
      total: sources.length,
      linkSources,
      fileSources,
      noteSources,
    };
  }, [sources]);

  const resourcesScopeAriaLabel = `${sourceStats.total} total source${
    sourceStats.total === 1 ? "" : "s"
  }. ${sourceStats.linkSources} link source${
    sourceStats.linkSources === 1 ? "" : "s"
  }. ${sourceStats.fileSources} file source${
    sourceStats.fileSources === 1 ? "" : "s"
  }. ${sourceStats.noteSources} custom note${
    sourceStats.noteSources === 1 ? "" : "s"
  }.`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col border-b bg-background">
        <div className="flex min-h-11 content-center items-center px-6 py-2">
          <div
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-left text-[11px] leading-tight text-muted-foreground sm:text-xs"
            role="status"
            aria-label={resourcesScopeAriaLabel}
          >
            <span className="inline-flex items-center gap-1">
              <FileStack className={statIconCls} aria-hidden />
              <span>
                {sourceStats.total} total source
                {sourceStats.total === 1 ? "" : "s"}
              </span>
            </span>
            <span className={statSepCls} aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <Link2 className={statIconCls} aria-hidden />
              <span>
                {sourceStats.linkSources} link source
                {sourceStats.linkSources === 1 ? "" : "s"}
              </span>
            </span>
            <span className={statSepCls} aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <FileStack className={statIconCls} aria-hidden />
              <span>
                {sourceStats.fileSources} file source
                {sourceStats.fileSources === 1 ? "" : "s"}
              </span>
            </span>
            <span className={statSepCls} aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <NotebookPen className={statIconCls} aria-hidden />
              <span>
                {sourceStats.noteSources} custom note
                {sourceStats.noteSources === 1 ? "" : "s"}
              </span>
            </span>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold">Study Resources</h3>
            </div>
            <div className="w-32">
              <AddSourceDialog triggerVariant="default" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sources.map((source) => (
              <ResourceCard
                key={source.id}
                source={source}
                onRemove={() => setPendingRemove(source)}
              />
            ))}
          </div>
        </div>
      </ScrollArea>

      <Dialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove resource?</DialogTitle>
            <DialogDescription>
              This will remove{" "}
              <span className="font-medium text-foreground">
                {pendingRemove?.title ?? "this resource"}
              </span>{" "}
              from the current study resources list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingRemove(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!pendingRemove) return;
                setSources((prev) =>
                  prev.filter((item) => item.id !== pendingRemove.id)
                );
                setPendingRemove(null);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResourceCard({
  source,
  onRemove,
}: {
  source: Source;
  onRemove: () => void;
}) {
  return (
    <div className="group rounded-xl border bg-white p-4 transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-md">
      <div className="flex items-start">
        <SourceBadge type={source.type} />
      </div>

      <h4 className="mt-2.5 text-sm font-medium text-foreground line-clamp-2">
        {source.title}
      </h4>

      {source.description && (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {source.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground/60">
          {source.addedAt}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
          aria-label="Remove source"
          title="Remove source"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
